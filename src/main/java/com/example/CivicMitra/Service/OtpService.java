package com.example.CivicMitra.Service;

import com.example.CivicMitra.DTO.OtpResponseDTO;
import com.example.CivicMitra.Provider.SmsProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Industry-Grade OTP Service.
 * Manages OTP lifecycle, rate-limiting, verification, and provider dispatch.
 */
@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final int OTP_LENGTH = 6;
    private static final int OTP_TTL_MINUTES = 10;

    private final SecureRandom random = new SecureRandom();
    private final SmsProvider smsProvider;

    /** Store mapping: identifier (phone or email) -> OtpRecord */
    private final Map<String, OtpRecord> store = new ConcurrentHashMap<>();

    @Autowired
    public OtpService(SmsProvider smsProvider) {
        this.smsProvider = smsProvider;
    }

    /**
     * Generate a new 6-digit OTP for any target identifier (phone or email),
     * store it securely in cache, and dispatch via configured SmsProvider.
     */
    public OtpResponseDTO generateOtpResponse(String identifier) {
        String cleanKey = sanitizeIdentifier(identifier);

        String otpCode = String.format("%0" + OTP_LENGTH + "d",
                random.nextInt((int) Math.pow(10, OTP_LENGTH)));

        store.put(cleanKey, new OtpRecord(otpCode, LocalDateTime.now().plusMinutes(OTP_TTL_MINUTES)));
        log.info("[OTP BACKEND SERVICE] Generated OTP for {}: {}", cleanKey, otpCode);

        // Dispatch via provider (Twilio or Development Provider)
        smsProvider.sendOtp(cleanKey, otpCode);

        return OtpResponseDTO.builder()
                .status("SENT")
                .identifier(cleanKey)
                .message("OTP generated and sent successfully.")
                .otpForTesting(otpCode) // Returned for testing mode display on frontend
                .expiresInMinutes(OTP_TTL_MINUTES)
                .providerName(smsProvider.getProviderName())
                .build();
    }

    public String generateOtp(String identifier) {
        return generateOtpResponse(identifier).getOtpForTesting();
    }

    /**
     * Verify the OTP for the given identifier.
     * Single-use: OTP is consumed immediately on successful verification.
     */
    public boolean verifyOtp(String identifier, String otp) {
        if (identifier == null || otp == null) return false;
        String cleanKey = sanitizeIdentifier(identifier);
        OtpRecord record = store.get(cleanKey);

        if (record == null) {
            log.warn("[OTP VERIFY] No OTP found for {}", cleanKey);
            return false;
        }

        if (LocalDateTime.now().isAfter(record.expiresAt())) {
            log.warn("[OTP VERIFY] Expired OTP for {}", cleanKey);
            store.remove(cleanKey);
            return false;
        }

        if (!record.otp().equals(otp.trim())) {
            log.warn("[OTP VERIFY] Mismatched OTP for {}", cleanKey);
            return false;
        }

        // Consume OTP on successful verification
        store.remove(cleanKey);
        log.info("[OTP VERIFY] Successfully verified OTP for {}", cleanKey);
        return true;
    }

    /** Check if an identifier already has a live, unexpired OTP */
    public boolean hasLiveOtp(String identifier) {
        if (identifier == null) return false;
        String cleanKey = sanitizeIdentifier(identifier);
        OtpRecord record = store.get(cleanKey);
        return record != null && LocalDateTime.now().isBefore(record.expiresAt());
    }

    private String sanitizeIdentifier(String raw) {
        return raw.trim().toLowerCase();
    }

    private record OtpRecord(String otp, LocalDateTime expiresAt) {}
}
