import { readSession } from "./session";
import type { Complaint, Profile, Submission, UserRole, WorkerPickupAction, WorkerScanDetails } from "./types";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function request<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
  const session = authenticated ? readSession() : null;
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { ...(session ? { Authorization: `Bearer ${session.token}` } : {}), ...(init.headers || {}) } });
  const text = await response.text();
  let body: unknown = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { message: text }; }
  if (!response.ok) { const message = typeof body === "object" && body ? (body as { error?: string; message?: string }).error || (body as { message?: string }).message : "Request failed"; throw new Error(message || "Request failed"); }
  return body as T;
}

export const api = {
  login: (email: string, password: string) => request<{ token: string; email: string; name: string; role: UserRole; userId: number }>("/api/v1/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }, false),
  register: (body: Record<string, unknown>) => request("/api/v1/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, false),
  profile: () => request<Profile>("/api/v1/dashboard/profile"),
  saveHousehold: (body: { houseNumber: string; lat?: number; lng?: number }) => request<Profile>("/api/v1/dashboard/household", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  history: (householdId: number) => request<Submission[]>(`/api/v1/segregation/history/${householdId}`),
  submitBins: (body: FormData) => request<Submission>("/api/v1/segregation/submit", { method: "POST", body }),
  complaints: () => request<Complaint[]>("/api/v1/complaints/my-complaints"),
  createComplaint: (body: FormData) => request<Complaint>("/api/v1/complaints", { method: "POST", body }),
  allComplaints: () => request<Complaint[]>("/api/v1/complaints"),
  updateComplaintStatus: (id: number, status: string) => request<Complaint>(`/api/v1/complaints/${id}/status?status=${encodeURIComponent(status)}`, { method: "PATCH" }),
  verifyQr: (tokenId: string, workerId: number, workerLat: number, workerLng: number) => request<{ scanResult: string; houseNumber: string; collected: boolean; message: string }>(`/api/v1/segregation/verify-qr?tokenId=${encodeURIComponent(tokenId)}&workerId=${workerId}&workerLat=${workerLat}&workerLng=${workerLng}`, { method: "POST" }),
  scanQr: (tokenId: string, workerLat: number, workerLng: number) => request<WorkerScanDetails>(`/api/v1/segregation/scan-qr?tokenId=${encodeURIComponent(tokenId)}&workerLat=${workerLat}&workerLng=${workerLng}`, { method: "POST" }),
  confirmPickup: (tokenId: string, workerId: number, workerLat: number, workerLng: number) => request<WorkerPickupAction>(`/api/v1/segregation/confirm-pickup?tokenId=${encodeURIComponent(tokenId)}&workerId=${workerId}&workerLat=${workerLat}&workerLng=${workerLng}`, { method: "POST" }),
  rejectPickup: (body: FormData) => request<WorkerPickupAction>("/api/v1/segregation/reject-pickup", { method: "POST", body })
};
