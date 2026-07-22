import { readSession } from "./session";
import type { BinColor, Complaint, DPDPStatus, HouseholdRegistrationResult, MyHousehold, OtpSendResult, Profile, SessionUser, Submission, UserRole, WardOption, WorkerPickupAction, WorkerScanDetails } from "./types";

export type BinType = BinColor;
export type SegregationResponse = Submission;
export type QRScanResponse = WorkerScanDetails;
export type LoginResponse = SessionUser;

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function request<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
  const session = authenticated ? readSession() : null;
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { ...(session ? { Authorization: `Bearer ${session.token}` } : {}), ...(init.headers || {}) } });
  const text = await response.text();
  let body: unknown = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { message: text }; }
  if (!response.ok) {
    let message = typeof body === "object" && body ? (body as { error?: string; message?: string }).error || (body as { message?: string }).message : "Request failed";
    if (typeof body === "object" && body && (body as any).fields) {
      const fields = (body as any).fields;
      const fieldErrors = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join(", ");
      if (fieldErrors) message = `${message} (${fieldErrors})`;
    }
    throw new Error(message || "Request failed");
  }
  return body as T;
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  login: (email: string, password: string) => request<{ token: string; email: string; name: string; role: UserRole; userId: number }>("/api/v1/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }, false),
  register: (body: Record<string, unknown>) => request("/api/v1/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, false),

  // ── OTP (unauthenticated — used during registration flow) ─────────────────
  sendOtp: (phone: string) => request<OtpSendResult>(`/api/v1/otp/send?phone=${encodeURIComponent(phone)}`, { method: "POST" }, false),
  verifyOtp: (phone: string, otp: string) => request<{ status: string; message: string }>(`/api/v1/otp/verify?phone=${encodeURIComponent(phone)}&otp=${encodeURIComponent(otp)}`, { method: "POST" }, false),

  // ── DPDP Consent ─────────────────────────────────────────────────────────
  getDpdpStatus: () => request<DPDPStatus>("/api/v1/consent/dpdp/status"),
  recordDpdpConsent: () => request<{ status: string }>("/api/v1/consent/dpdp", { method: "POST" }),

  // ── Household ─────────────────────────────────────────────────────────────
  getMyHousehold: () => request<MyHousehold>("/api/v1/households/mine"),
  registerHousehold: (body: { houseNumber: string; wardId: number; blockCode?: string; mobile: string; lat: number; lng: number; numResidents?: number }) =>
    request<HouseholdRegistrationResult>("/api/v1/households/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  getWards: (municipalityId: number) => request<WardOption[]>(`/api/v1/households/wards?municipalityId=${municipalityId}`),

  // ── Dashboard ─────────────────────────────────────────────────────────────
  profile: () => request<Profile>("/api/v1/dashboard/profile"),
  saveHousehold: (body: { houseNumber: string; lat?: number; lng?: number }) => request<Profile>("/api/v1/dashboard/household", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),

  // ── Segregation ───────────────────────────────────────────────────────────
  history: (householdId: number) => request<Submission[]>(`/api/v1/segregation/history/${householdId}`),
  submitBins: (body: FormData) => request<any>("/api/v1/segregation/submit", { method: "POST", body }),
  getStatus: (submissionId: number) => request<any>(`/api/v1/segregation/status/${submissionId}`),

  // ── Complaints ────────────────────────────────────────────────────────────
  complaints: () => request<Complaint[]>("/api/v1/complaints/my-complaints"),
  createComplaint: (body: FormData) => request<Complaint>("/api/v1/complaints", { method: "POST", body }),
  allComplaints: () => request<Complaint[]>("/api/v1/complaints"),
  updateComplaintStatus: (id: number, status: string) => request<Complaint>(`/api/v1/complaints/${id}/status?status=${encodeURIComponent(status)}`, { method: "PATCH" }),

  // ── Worker QR ────────────────────────────────────────────────────────────
  verifyQr: (tokenId: string, workerId: number, workerLat: number, workerLng: number) => request<WorkerScanDetails | any>(`/api/v1/segregation/verify-qr?tokenId=${encodeURIComponent(tokenId)}&workerId=${workerId}&workerLat=${workerLat}&workerLng=${workerLng}`, { method: "POST" }),
  scanQr: (tokenId: string, workerLat: number, workerLng: number) => request<WorkerScanDetails>(`/api/v1/segregation/scan-qr?tokenId=${encodeURIComponent(tokenId)}&workerLat=${workerLat}&workerLng=${workerLng}`, { method: "POST" }),
  confirmPickup: (tokenId: string, workerId: number, workerLat: number, workerLng: number) => request<WorkerPickupAction>(`/api/v1/segregation/confirm-pickup?tokenId=${encodeURIComponent(tokenId)}&workerId=${workerId}&workerLat=${workerLat}&workerLng=${workerLng}`, { method: "POST" }),
  rejectPickup: (body: FormData) => request<WorkerPickupAction>("/api/v1/segregation/reject-pickup", { method: "POST", body })
};

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

export const login = (url: string, email: string, pass: string) => api.login(email, pass);
export const register = (url: string, fullNameOrBody: any, email?: string, password?: string, role?: any) => {
  if (typeof fullNameOrBody === "object" && fullNameOrBody !== null) {
    return api.register(fullNameOrBody);
  }
  return api.register({ name: fullNameOrBody, email, password, role: role || "CITIZEN" });
};
export const submitSegregation = (url: string, token: string, body: FormData | any) => {
  if (body instanceof FormData) {
    return api.submitBins(body);
  }
  const formData = new FormData();
  if (body?.householdId) formData.append("householdId", String(body.householdId));
  if (body?.lat) formData.append("lat", String(body.lat));
  if (body?.lng) formData.append("lng", String(body.lng));
  if (Array.isArray(body?.bins)) {
    body.bins.forEach((b: any) => {
      if (b?.file) {
        formData.append("binImages", b.file);
        formData.append("binTypes", b.type || "GREEN");
      }
    });
  }
  return api.submitBins(formData);
};
export const getSegregationHistory = (url: string, token: string, householdId: number) => api.history(householdId);
export const verifyQr = (url: string, token: string, tokenIdOrPayload: any, workerId?: number, workerLat?: number, workerLng?: number) => {
  if (typeof tokenIdOrPayload === "object" && tokenIdOrPayload !== null) {
    return api.verifyQr(tokenIdOrPayload.tokenId, tokenIdOrPayload.workerId, tokenIdOrPayload.workerLat, tokenIdOrPayload.workerLng);
  }
  return api.verifyQr(tokenIdOrPayload, workerId!, workerLat!, workerLng!);
};


