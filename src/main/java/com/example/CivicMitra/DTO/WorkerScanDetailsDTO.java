package com.example.CivicMitra.DTO;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class WorkerScanDetailsDTO {
    private String scanResult;
    private String message;
    private String tokenId;
    private Long submissionId;
    private String residentName;
    private String houseNumber;
    private String ward;
    private double overallScore;
    private LocalDateTime submittedAt;
    private LocalDateTime expiresAt;
    private List<BinResultDTO> binResults = new ArrayList<>();

    // ── GPS Proximity fields (soft — informational only, never blocks pickup) ──
    /**
     * One of:
     *   WITHIN_RANGE       — return visit, worker within 100m of locked GPS
     *   OUT_OF_RANGE       — return visit, worker >100m (flagged for review)
     *   FIRST_VISIT_MATCHED   — first visit, worker GPS matches citizen registration GPS (≤50m) → locked
     *   FIRST_VISIT_MISMATCH  — first visit, worker GPS differs from citizen GPS (>50m) → not locked, flagged
     *   FIRST_VISIT_NO_REG    — first visit, no citizen GPS → worker GPS saved as lock
     *   NO_GPS             — worker phone provided no coordinates
     */
    private String gpsStatus;

    /** Straight-line distance in metres between worker and household GPS. Null if GPS unavailable. */
    private Double distanceMetres;

    /** Whether the household's GPS lock has been set (by any previous worker visit). */
    private boolean gpsLocked;

    public boolean isValid() {
        return "VALID".equals(scanResult);
    }
}
