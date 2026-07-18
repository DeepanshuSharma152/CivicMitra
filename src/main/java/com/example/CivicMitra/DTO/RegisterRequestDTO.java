package com.example.CivicMitra.DTO;

import com.example.CivicMitra.Enums.UserRole;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequestDTO {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Please enter a valid email address (e.g. user@example.com)")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[6-9][0-9]{9}$", message = "Phone number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9")
    private String phoneNumber;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters long")
    private String password;

    @NotNull(message = "Role is required (e.g. CITIZEN, WORKER, MUNICIPAL_ADMIN)")
    private UserRole role;

    @NotNull(message = "municipalityId is required for all roles")
    private Long municipalityId;

    private Long householdId;          // nullable — CITIZEN only
    private Long wardId;               // nullable — WORKER only
    private String designation;        // nullable — AUTHORITY only
    private String facilityKey;        // nullable — MUNICIPALITY_PARTNER only
}

