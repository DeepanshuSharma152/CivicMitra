package com.example.CivicMitra.DTO;


import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class BinResultDTO {
    private String binType;          // "GREEN", "BLUE" etc
    private boolean passed;
    private double aiConfidence;
    private String contaminationDetail;
}
