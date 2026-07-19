package com.example.CivicMitra.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HouseholdSetupRequestDTO {
    @NotBlank
    private String houseNumber;

    private Double lat;
    private Double lng;
}
