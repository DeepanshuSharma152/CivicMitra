package com.example.CivicMitra.DTO;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class WorkerStopDTO {
    private String tokenId;
    private Long submissionId;
    private String residentName;
    private String houseNumber;
    private String ward;
    private double overallScore;
    private LocalDateTime expiresAt;
}
