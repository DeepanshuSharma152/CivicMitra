package com.example.CivicMitra.DTO;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class WorkerPickupActionDTO {
    private String status;
    private String message;
    private String houseNumber;
    private LocalDateTime completedAt;
}
