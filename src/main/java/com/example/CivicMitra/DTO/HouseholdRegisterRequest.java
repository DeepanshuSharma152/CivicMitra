package com.example.CivicMitra.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

/**
 * Request body for POST /api/v1/households/register
 *
 * GPS coordinates MUST come from the device — no manual entry allowed.
 * lat/lng are @NotNull, validated server-side.
 */
@Getter
@Setter
public class HouseholdRegisterRequest {

    @NotBlank(message = "House number is required")
    private String houseNumber;

    @NotNull(message = "Ward is required")
    private Long wardId;

    /** Optional — sector/block label e.g. 'Sector 17-B' */
    private String blockCode;

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[6-9][0-9]{9}$",
             message = "Must be a valid 10-digit Indian mobile number")
    private String mobile;

    /** Captured automatically by navigator.geolocation — NEVER typed */
    @NotNull(message = "GPS latitude is required. Location access must be enabled.")
    private Double lat;

    /** Captured automatically by navigator.geolocation — NEVER typed */
    @NotNull(message = "GPS longitude is required. Location access must be enabled.")
    private Double lng;

    private int numResidents = 1;
}
