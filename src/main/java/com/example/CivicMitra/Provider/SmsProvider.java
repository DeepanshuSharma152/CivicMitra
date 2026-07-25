package com.example.CivicMitra.Provider;

/**
 * Industry-grade SMS & OTP Gateway Provider Abstraction Interface.
 * Allows seamless switching between Development/Testing, Twilio, MSG91, or AWS SNS.
 */
public interface SmsProvider {

    /**
     * Send OTP code to specified recipient target (phone number or email identifier).
     *
     * @param target  Destination identifier (e.g. +919876543210 or user@example.com)
     * @param otpCode 6-digit OTP string
     * @return true if successfully dispatched
     */
    boolean sendOtp(String target, String otpCode);

    /**
     * Provider identification key (e.g., "DEVELOPMENT_TESTING", "TWILIO")
     */
    String getProviderName();
}
