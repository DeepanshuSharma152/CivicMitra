export type BinType = "GREEN" | "BLUE" | "RED" | "BLACK";

export type LoginResponse = { token: string; email: string; role: string; name: string; message: string };
export type BinResult = { binType: BinType; passed: boolean; aiConfidence: number; contaminationDetail?: string };
export type SegregationResponse = { submissionId: number; status: string; overallScore: number; failureReason?: string; attemptNumber: number; qrToken?: string; qrCodeBase64?: string; qrExpiresAt?: string; submittedAt?: string; binResults?: BinResult[] };
export type QRScanResponse = { scanResult: string; houseNumber: string; collected: boolean; message: string };

export class ApiError extends Error {}

async function request<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") ?? "";
  const data: unknown = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof data === "object" && data && "error" in data ? String(data.error) : typeof data === "string" ? data : `Request failed (${response.status})`;
    throw new ApiError(message);
  }
  return data as T;
}

export function login(baseUrl: string, email: string, password: string) {
  return request<LoginResponse>(`${baseUrl}/api/v1/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
}

export function register(baseUrl: string, fullName: string, email: string, password: string, role: string) {
  return request<any>(`${baseUrl}/api/v1/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName, email, password, role }) });
}

export function submitSegregation(baseUrl: string, token: string, input: { householdId: number; lat: number; lng: number; bins: Array<{ type: BinType; file: File }> }) {
  const form = new FormData();
  input.bins.forEach((bin) => { form.append("binImages", bin.file); form.append("binTypes", bin.type); });
  form.append("householdId", String(input.householdId));
  form.append("lat", String(input.lat));
  form.append("lng", String(input.lng));
  return request<SegregationResponse>(`${baseUrl}/api/v1/segregation/submit`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
}

export function verifyQr(baseUrl: string, token: string, input: { tokenId: string; workerId: number; workerLat: number; workerLng: number }) {
  const params = new URLSearchParams({ tokenId: input.tokenId, workerId: String(input.workerId), workerLat: String(input.workerLat), workerLng: String(input.workerLng) });
  return request<QRScanResponse>(`${baseUrl}/api/v1/segregation/verify-qr?${params}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
}

export function getSegregationHistory(baseUrl: string, token: string, householdId: number) {
  return request<SegregationResponse[]>(`${baseUrl}/api/v1/segregation/history/${householdId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}
