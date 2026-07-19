package com.example.CivicMitra.DTO;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class WorkerHistoryDTO {
    private String tokenId;
    private String houseNumber;
    private String outcome;
    private String rejectionReason;
    private LocalDateTime completedAt;
}
