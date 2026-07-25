package com.example.CivicMitra.Controller;

import com.example.CivicMitra.DTO.OtpResponseDTO;
import com.example.CivicMitra.Service.OtpService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Industry-Grade OTP Controller.
 * Handles OTP dispatch and verification for mobile numbers or email identifiers.
 */
@RestController
@RequestMapping("/api/v1/otp")
public class OtpController {

    private final OtpService otpService;

    public OtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    /**
     * POST /api/v1/otp/send?identifier={phone_or_email}
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendOtp(@RequestParam(required = false) String phone,
                                    @RequestParam(required = false) String identifier) {
        String key = (identifier != null && !identifier.isBlank()) ? identifier : phone;
        if (key == null || key.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Target phone number or identifier is required."));
        }

        if (otpService.hasLiveOtp(key)) {
            OtpResponseDTO response = otpService.generateOtpResponse(key);
            return ResponseEntity.ok(response);
        }

        OtpResponseDTO response = otpService.generateOtpResponse(key);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/otp/verify?identifier={phone_or_email}&otp={otp}
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtp(@RequestParam(required = false) String phone,
                                       @RequestParam(required = false) String identifier,
                                       @RequestParam String otp) {
        String key = (identifier != null && !identifier.isBlank()) ? identifier : phone;
        if (key == null || key.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Target phone number or identifier is required."));
        }

        boolean valid = otpService.verifyOtp(key, otp);
        if (!valid) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid or expired OTP code. Please request a new one."));
        }

        return ResponseEntity.ok(Map.of(
            "status", "VERIFIED",
            "identifier", key,
            "message", "OTP verified successfully."
        ));
    }
}
