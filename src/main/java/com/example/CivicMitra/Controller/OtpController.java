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
     * POST /api/v1/otp/send
     * Accepts identifier via JSON body (primary) or query param (fallback).
     * Body JSON: { "identifier": "9988775544" }
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendOtp(
            @RequestBody(required = false) Map<String, String> body,
            @RequestParam(required = false) String identifier,
            @RequestParam(required = false) String phone) {

        // Prefer JSON body → query param identifier → query param phone
        String key = null;
        if (body != null) {
            key = body.get("identifier");
            if (key == null || key.isBlank()) key = body.get("phone");
        }
        if (key == null || key.isBlank()) key = identifier;
        if (key == null || key.isBlank()) key = phone;

        if (key == null || key.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Target phone number or identifier is required."));
        }

        OtpResponseDTO response = otpService.generateOtpResponse(key);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/otp/verify
     * Accepts identifier+otp via JSON body (primary) or query params (fallback).
     * Body JSON: { "identifier": "9988775544", "otp": "123456" }
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtp(
            @RequestBody(required = false) Map<String, String> body,
            @RequestParam(required = false) String identifier,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String otp) {

        // Prefer JSON body → query params
        String key = null;
        String otpCode = otp;
        if (body != null) {
            key = body.get("identifier");
            if (key == null || key.isBlank()) key = body.get("phone");
            if (body.get("otp") != null) otpCode = body.get("otp");
        }
        if (key == null || key.isBlank()) key = identifier;
        if (key == null || key.isBlank()) key = phone;

        if (key == null || key.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Target phone number or identifier is required."));
        }
        if (otpCode == null || otpCode.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "OTP code is required."));
        }

        boolean valid = otpService.verifyOtp(key, otpCode);
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
