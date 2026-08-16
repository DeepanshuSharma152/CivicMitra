package com.example.CivicMitra.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

/**
 * Request body for POST /api/v1/households/register
 *
 * GPS coordinates are NOT captured at registration time.
 * lat/lng are intentionally omitted — the first worker scan (Case 3 in
 * SegregationService.applyGpsProximity) establishes the ground-truth location.
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

    /**
     * Optional — not captured at registration.
     * Set to null on save; populated at first worker QR scan via GPS lock.
     */
    private Double lat;

    /**
     * Optional — not captured at registration.
     * Set to null on save; populated at first worker QR scan via GPS lock.
     */
    private Double lng;

    private int numResidents = 1;
}
