package com.example.CivicMitra.DTO;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class SegregationResponseDTO {
    private Long submissionId;
    private String status;          // APPROVED / PENDING_RETRY / FAILED
    private double overallScore;
    private String failureReason;   // null if APPROVED
    private int attemptNumber;      // 1, 2, or 3
    private String qrToken;         // UUID string — null if not APPROVED
    private String qrCodeBase64;    // PNG image — null if not APPROVED
    private LocalDateTime qrExpiresAt;
    private LocalDateTime submittedAt;
    private List<BinResultDTO> binResults; // per-bin breakdown
}
