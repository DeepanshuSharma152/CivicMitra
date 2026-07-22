package com.example.CivicMitra.Enums;

public enum SubmissionStatus {
    /**
     * Submission received, Ollama is running AI analysis in the background.
     * The citizen can poll /api/v1/segregation/status/{id} to check progress.
     */
    PROCESSING,

    /**
     * AI analysis passed all bin checks. A Green QR Token has been issued.
     */
    APPROVED,

    /**
     * One or more bins failed — citizen can retry (up to 5 attempts/day).
     */
    PENDING_RETRY,

    /**
     * All 5 daily attempts were exhausted and the final attempt still failed.
     * A violation is logged.
     */
    FAILED,

    /**
     * The sanitation worker scanned the QR but explicitly rejected the pickup
     * (e.g., actual bin did not match the photo). Proof images attached.
     */
    PICKUP_REJECTED,

    /**
     * Ollama threw an unrecoverable exception during processing.
     * The error message is stored in SegregationSubmission.failureReason.
     */
    PROCESSING_FAILED
}
