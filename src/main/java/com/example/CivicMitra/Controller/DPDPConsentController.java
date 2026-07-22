package com.example.CivicMitra.Controller;

import com.example.CivicMitra.Repository.UserRepository;
import com.example.CivicMitra.model.core.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * DPDP Consent controller.
 *
 * Records explicit user consent under the Digital Personal Data Protection Act 2023.
 * Must be called before any photo capture or household registration.
 */
@RestController
@RequestMapping("/api/v1/consent")
public class DPDPConsentController {

    private final UserRepository userRepository;

    public DPDPConsentController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * POST /api/v1/consent/dpdp
     *
     * Records that the authenticated user has read and accepted the
     * DPDP consent screen (version 1.0).
     *
     * Idempotent — safe to call again if already consented.
     */
    @PostMapping("/dpdp")
    public ResponseEntity<?> recordConsent(Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setDpdpConsentGiven(true);
        user.setDpdpConsentAt(LocalDateTime.now());
        user.setDpdpConsentVersion("1.0");
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
            "status", "CONSENT_RECORDED",
            "version", "1.0",
            "message", "Your data consent has been recorded. You may now register your household."
        ));
    }

    /**
     * GET /api/v1/consent/dpdp/status
     *
     * Returns whether the calling user has given DPDP consent.
     * Frontend uses this to decide whether to show the consent modal.
     */
    @GetMapping("/dpdp/status")
    public ResponseEntity<?> checkConsent(Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(Map.of(
            "consentGiven", user.isDpdpConsentGiven(),
            "consentAt", user.getDpdpConsentAt() != null ? user.getDpdpConsentAt().toString() : null,
            "consentVersion", user.getDpdpConsentVersion()
        ));
    }
}
