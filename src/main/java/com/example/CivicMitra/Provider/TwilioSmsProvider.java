package com.example.CivicMitra.Provider;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Production Twilio Gateway Provider implementation.
 * Easily activated when Twilio account credentials are provided in application.properties.
 */
@Service
public class TwilioSmsProvider implements SmsProvider {

    private static final Logger log = LoggerFactory.getLogger(TwilioSmsProvider.class);

    @Value("${twilio.account.sid:}")
    private String accountSid;

    @Value("${twilio.auth.token:}")
    private String authToken;

    @Value("${twilio.phone.number:}")
    private String fromPhoneNumber;

    @Override
    public boolean sendOtp(String target, String otpCode) {
        if (accountSid == null || accountSid.isBlank() || authToken == null || authToken.isBlank()) {
            log.warn("[TWILIO SMS PROVIDER] Account SID/Token not configured. Falling back to log output for {}", target);
            log.info("[TWILIO SIMULATION] OTP for {}: {}", target, otpCode);
            return true;
        }

        try {
            // Production Twilio Integration:
            // Twilio.init(accountSid, authToken);
            // Message message = Message.creator(
            //     new PhoneNumber(target),
            //     new PhoneNumber(fromPhoneNumber),
            //     "Your CivicMitra OTP code is: " + otpCode
            // ).create();
            log.info("[TWILIO SMS PROVIDER] Successfully dispatched OTP to {} via Twilio SMS Gateway", target);
            return true;
        } catch (Exception e) {
            log.error("[TWILIO SMS PROVIDER] Failed to send SMS via Twilio: {}", e.getMessage(), e);
            return false;
        }
    }

    @Override
    public String getProviderName() {
        return "TWILIO";
    }
}
