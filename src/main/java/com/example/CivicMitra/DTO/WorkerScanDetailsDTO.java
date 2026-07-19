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

    public boolean isValid() {
        return "VALID".equals(scanResult);
    }
}
