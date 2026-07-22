package com.example.CivicMitra.Controller;

import com.example.CivicMitra.Repository.UserRepository;
import com.example.CivicMitra.Service.OtpService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * OTP controller for phone number verification during registration.
 *
 * TESTING MODE: OTP is returned in the response body (otpForTesting field)
 * so it can be displayed on-screen without an SMS gateway.
 * Remove otpForTesting before production.
 */
@RestController
@RequestMapping("/api/v1/otp")
public class OtpController {

    private final OtpService otpService;
    private final UserRepository userRepository;

    public OtpController(OtpService otpService, UserRepository userRepository) {
        this.otpService = otpService;
        this.userRepository = userRepository;
    }

    /**
     * POST /api/v1/otp/send?phone={phone}
     *
     * Generates a 6-digit OTP for the given phone number.
     * Returns the OTP in the response for on-screen display (testing mode).
     *
     * Rate limit: cannot resend if a live OTP already exists.
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendOtp(@RequestParam String phone) {
        // Basic format check
        if (phone == null || !phone.matches("^[6-9][0-9]{9}$")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid phone number. Must be 10-digit Indian mobile."));
        }

        // Prevent rapid resend
        if (otpService.hasLiveOtp(phone)) {
            return ResponseEntity.ok(Map.of(
                "message", "An OTP was already sent to this number. Please wait and try again.",
                "status", "ALREADY_SENT"
            ));
        }

        String otp = otpService.generateOtp(phone);

        // ⚠️ TESTING MODE: return OTP in response. Remove in production.
        return ResponseEntity.ok(Map.of(
            "status", "SENT",
            "phone", phone,
            "message", "OTP generated. In production this would be sent via SMS.",
            "otpForTesting", otp,          // visible on-screen — remove in production
            "expiresInMinutes", 10
        ));
    }

    /**
     * POST /api/v1/otp/verify?phone={phone}&otp={otp}
     *
     * Verifies the OTP. Returns 200 on success, 400 on failure.
     * One-time use — the OTP is consumed on first correct verification.
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtp(@RequestParam String phone,
                                       @RequestParam String otp) {
        boolean valid = otpService.verifyOtp(phone, otp);
        if (!valid) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid or expired OTP. Please request a new one."));
        }
        return ResponseEntity.ok(Map.of(
            "status", "VERIFIED",
            "phone", phone,
            "message", "Phone number verified successfully."
        ));
    }
}
