package com.example.CivicMitra.Controller;

import com.example.CivicMitra.DTO.WorkerLoginRequestDTO;
import com.example.CivicMitra.DTO.WorkerLoginResponseDTO;
import com.example.CivicMitra.JWTAuth.JwtService;
import com.example.CivicMitra.Repository.WorkerRepository;
import com.example.CivicMitra.model.worker.Worker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Worker PIN authentication endpoint.
 *
 * POST /api/v1/worker/auth/login
 *   Body : { "workerCode": "W-CHA-001", "pin": "1234" }
 *   200  : { "token": "...", "workerCode": "...", "role": "COLLECTOR", ... }
 *   401  : { "error": "Invalid worker code or PIN." }
 *
 * Deliberately does NOT use Spring Security's AuthenticationManager:
 *   - Workers have no email address (DaoAuthenticationProvider is email-keyed).
 *   - PIN verification is a direct BCrypt match — identical security level.
 *   - AuthenticationManager would require a second UserDetailsService wired into
 *     ApplicationConfig, which would break the existing citizen auth flow.
 *
 * JWT structure produced:
 *   sub          = workerCode  (e.g. "W-CHA-001")
 *   role         = "WORKER_ENTITY"
 *   workerId     = Long
 *   municipalityId = Long
 *   exp          = now + 24 h  (same TTL as citizen tokens)
 *
 * The "W-" subject prefix is the signal JwtAuthenticationFilter uses to
 * route subsequent requests to WorkerUserDetailsService.
 */
@RestController
@RequestMapping("/api/v1/worker/auth")
public class WorkerAuthController {

    private static final Logger log = LoggerFactory.getLogger(WorkerAuthController.class);

    private final WorkerRepository workerRepository;
    private final PasswordEncoder  passwordEncoder;
    private final JwtService       jwtService;

    public WorkerAuthController(WorkerRepository workerRepository,
                                PasswordEncoder passwordEncoder,
                                JwtService jwtService) {
        this.workerRepository = workerRepository;
        this.passwordEncoder  = passwordEncoder;
        this.jwtService       = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody WorkerLoginRequestDTO request) {

        // ── 1. Basic input validation ─────────────────────────────────────────
        if (request.getWorkerCode() == null || request.getWorkerCode().isBlank()
                || request.getPin() == null || request.getPin().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "workerCode and pin are required."));
        }

        final String workerCode = request.getWorkerCode().trim().toUpperCase();

        // ── 2. Look up the worker ─────────────────────────────────────────────
        Worker worker = workerRepository.findByWorkerCodeAndIsActiveTrue(workerCode)
                .orElse(null);

        if (worker == null) {
            log.warn("Worker login failed — unknown code: {}", workerCode);
            // Same message for both not-found and wrong-PIN (timing-safe response)
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Invalid worker code or PIN."));
        }

        // ── 3. Verify PIN (BCrypt match) ──────────────────────────────────────
        if (!passwordEncoder.matches(request.getPin(), worker.getPinHash())) {
            log.warn("Worker login failed — wrong PIN for code: {}", workerCode);
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Invalid worker code or PIN."));
        }

        // ── 4. Generate JWT ───────────────────────────────────────────────────
        Long municipalityId = (worker.getMunicipality() != null)
                ? worker.getMunicipality().getMunicipalityId()
                : null;

        String token = jwtService.generateWorkerToken(
                worker.getWorkerCode(),
                worker.getId(),
                municipalityId
        );

        log.info("Worker login success: {} [{}]", workerCode, worker.getRole());

        // ── 5. Build response ─────────────────────────────────────────────────
        WorkerLoginResponseDTO response = new WorkerLoginResponseDTO();
        response.setToken(token);
        response.setWorkerCode(worker.getWorkerCode());
        response.setName(worker.getName());
        response.setRole(worker.getRole().name());
        response.setWorkerId(worker.getId());
        response.setMunicipalityId(municipalityId);
        response.setWardId(worker.getWard() != null ? worker.getWard().getWardId() : null);
        response.setRouteId(worker.getRoute() != null ? worker.getRoute().getId() : null);
        response.setMessage("Login successful");

        return ResponseEntity.ok(response);
    }
}
