export type UserRole = "CITIZEN" | "WORKER" | "AUTHORITY" | "MUNICIPAL_ADMIN";
export type SubmissionStatus = "APPROVED" | "PENDING_RETRY" | "FAILED";
export type BinColor = "GREEN" | "BLUE" | "RED" | "BLACK";
export type VerificationStatus = "PROVISIONAL" | "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";

export interface SessionUser { token: string; email: string; name: string; role: UserRole; userId?: number; }
export interface Profile { name: string; email: string; role: UserRole; municipality?: string | null; ward?: string | null; wardId?: number | null; householdId?: number | null; houseNumber?: string | null; phoneNumber?: string | null; }
export interface BinResult { binType: BinColor; passed: boolean; aiConfidence: number; contaminationDetail?: string | null; }
export interface Submission { submissionId: number; status: SubmissionStatus; overallScore: number; failureReason?: string | null; attemptNumber: number; qrToken?: string | null; qrCodeBase64?: string | null; qrExpiresAt?: string | null; submittedAt: string; binResults: BinResult[]; }
export interface Complaint { id: number; title: string; description: string; status: string; wardId?: number; location?: string; imagePath?: string; createdAt?: string; upvotes: number; }
export interface WorkerScanDetails {
  scanResult: string;
  message: string;
  tokenId: string;
  collected?: boolean;
  submissionId?: number;
  residentName?: string;
  houseNumber: string;
  ward?: string;
  overallScore?: number;
  submittedAt?: string;
  expiresAt?: string;
  binResults?: BinResult[];
}
export interface WorkerPickupAction { status: string; message: string; houseNumber: string; completedAt: string; }

// ── Registration & Household types ──
export interface WardOption { wardId: number; wardNumber: number; sectorName: string; zone: string; }

export interface HouseholdMatch {
  householdId: number;
  householdCode: string;
  houseNumber: string;
  verificationStatus: VerificationStatus;
}

export interface HouseholdRegistrationResult {
  status: "PROVISIONAL" | "DUPLICATE_CHECK";
  householdCode?: string;
  householdId?: number;
  message?: string;
  verificationStatus?: VerificationStatus;
  potentialMatches?: HouseholdMatch[];
}

export interface MyHousehold {
  hasHousehold: boolean;
  householdId?: number;
  householdCode?: string;
  houseNumber?: string;
  verificationStatus?: VerificationStatus;
  gpsLocked?: boolean;
  ward?: string;
}

export interface DPDPStatus {
  consentGiven: boolean;
  consentAt?: string;
  consentVersion?: string;
}

export interface OtpSendResult {
  status: "SENT" | "ALREADY_SENT";
  phone: string;
  message: string;
  otpForTesting?: string;  // shown on-screen in testing mode
  expiresInMinutes?: number;
}

