package com.example.CivicMitra.Provider;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

/**
 * Development & Testing SMS Provider implementation.
 * Logs OTP code to server output and allows API response rendering for testing mode.
 */
@Service
@Primary
public class DevelopmentSmsProvider implements SmsProvider {

    private static final Logger log = LoggerFactory.getLogger(DevelopmentSmsProvider.class);

    @Override
    public boolean sendOtp(String target, String otpCode) {
        log.info("=================================================");
        log.info("[OTP BACKEND SERVICE] Dispatching OTP for target: {}", target);
        log.info("[OTP BACKEND SERVICE] OTP CODE: {}", otpCode);
        log.info("=================================================");
        return true;
    }

    @Override
    public String getProviderName() {
        return "DEVELOPMENT_TESTING";
    }
}
