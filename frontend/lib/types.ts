export type UserRole = "CITIZEN" | "WORKER" | "AUTHORITY" | "MUNICIPAL_ADMIN";
export type SubmissionStatus = "APPROVED" | "PENDING_RETRY" | "FAILED";
export type BinColor = "GREEN" | "BLUE" | "RED" | "BLACK";

export interface SessionUser { token: string; email: string; name: string; role: UserRole; userId?: number; }
export interface Profile { name: string; email: string; role: UserRole; municipality?: string | null; ward?: string | null; wardId?: number | null; householdId?: number | null; houseNumber?: string | null; }
export interface BinResult { binType: BinColor; passed: boolean; aiConfidence: number; contaminationDetail?: string | null; }
export interface Submission { submissionId: number; status: SubmissionStatus; overallScore: number; failureReason?: string | null; attemptNumber: number; qrToken?: string | null; qrCodeBase64?: string | null; qrExpiresAt?: string | null; submittedAt: string; binResults: BinResult[]; }
export interface Complaint { id: number; title: string; description: string; status: string; wardId?: number; location?: string; imagePath?: string; createdAt?: string; upvotes: number; }
export interface WorkerScanDetails {
  scanResult: string;
  message: string;
  tokenId: string;
  submissionId?: number;
  residentName?: string;
  houseNumber: string;
  ward?: string;
  overallScore?: number;
  submittedAt?: string;
  expiresAt?: string;
  binResults: BinResult[];
}
export interface WorkerPickupAction { status: string; message: string; houseNumber: string; completedAt: string; }
