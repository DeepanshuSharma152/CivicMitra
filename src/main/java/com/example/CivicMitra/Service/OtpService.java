package com.example.CivicMitra.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory OTP service for Phase 1 / testing.
 *
 * ⚠️  TESTING MODE: The OTP is returned in the API response so it can be
 *     seen on-screen without an SMS gateway. Remove the `otpForTesting`
 *     field from the response before going to production.
 *
 * OTP lifetime: 10 minutes.
 * OTP length:   6 digits.
 */
@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final int OTP_LENGTH = 6;
    private static final int OTP_TTL_MINUTES = 10;

    private final SecureRandom random = new SecureRandom();

    /** phone → OtpRecord */
    private final Map<String, OtpRecord> store = new ConcurrentHashMap<>();

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Generate a new OTP for the given phone number, store it, and return it.
     * In production, you'd call an SMS gateway here instead of returning it.
     *
     * @param phone 10-digit Indian mobile number
     * @return the generated OTP (shown on-screen in testing mode)
     */
    public String generateOtp(String phone) {
        String otp = String.format("%0" + OTP_LENGTH + "d",
                random.nextInt((int) Math.pow(10, OTP_LENGTH)));
        store.put(phone, new OtpRecord(otp, LocalDateTime.now().plusMinutes(OTP_TTL_MINUTES)));
        log.info("[TESTING] OTP for {}: {}", phone, otp);   // visible in server logs too
        return otp;
    }

    /**
     * Verify the OTP for the given phone number.
     *
     * @param phone phone number
     * @param otp   OTP entered by the user
     * @return true if valid and not expired
     */
    public boolean verifyOtp(String phone, String otp) {
        OtpRecord record = store.get(phone);
        if (record == null) return false;
        if (LocalDateTime.now().isAfter(record.expiresAt())) {
            store.remove(phone);
            return false;
        }
        if (!record.otp().equals(otp)) return false;
        store.remove(phone);   // consume — one-time use
        return true;
    }

    /** Check if a phone already has a live, unexpired OTP */
    public boolean hasLiveOtp(String phone) {
        OtpRecord record = store.get(phone);
        return record != null && LocalDateTime.now().isBefore(record.expiresAt());
    }

    // ── Internal record ───────────────────────────────────────────────────────
    private record OtpRecord(String otp, LocalDateTime expiresAt) {}
}
