package com.example.CivicMitra.DTO;

/**
 * Request body for worker PIN login.
 * POST /api/v1/worker/auth/login
 */
public class WorkerLoginRequestDTO {

    /** The worker's scannable code, e.g. "W-CHA-001". */
    private String workerCode;

    /** The 4-digit PIN as a plain string — validated server-side against bcrypt hash. */
    private String pin;

    public String getWorkerCode() { return workerCode; }
    public void setWorkerCode(String workerCode) { this.workerCode = workerCode; }

    public String getPin() { return pin; }
    public void setPin(String pin) { this.pin = pin; }
}
