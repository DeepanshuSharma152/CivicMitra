package com.example.CivicMitra.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpResponseDTO {
    private String status;
    private String identifier;
    private String message;
    private String otpForTesting; // Rendered on frontend for testing mode
    private int expiresInMinutes;
    private String providerName;
}
