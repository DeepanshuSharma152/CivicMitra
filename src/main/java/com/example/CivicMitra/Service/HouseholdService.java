package com.example.CivicMitra.Service;

import com.example.CivicMitra.DTO.HouseholdRegisterRequest;
import com.example.CivicMitra.DTO.StreakResponseDTO;
import com.example.CivicMitra.Repository.*;
import com.example.CivicMitra.model.core.User;
import com.example.CivicMitra.model.core.Ward;
import com.example.CivicMitra.model.segregation.ComplianceStreak;
import com.example.CivicMitra.model.segregation.Household;
import com.example.CivicMitra.model.segregation.VerificationQueue;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class HouseholdService {

    private final HouseholdRepository householdRepository;
    private final ComplianceStreakRepository streakRepository;
    private final VerificationQueueRepository queueRepository;
    private final UserRepository userRepository;
    private final WardRepository wardRepository;
    private final MunicipalityRepository municipalityRepository;

    public HouseholdService(HouseholdRepository householdRepository,
                            ComplianceStreakRepository streakRepository,
                            VerificationQueueRepository queueRepository,
                            UserRepository userRepository,
                            WardRepository wardRepository,
                            MunicipalityRepository municipalityRepository) {
        this.householdRepository = householdRepository;
        this.streakRepository = streakRepository;
        this.queueRepository = queueRepository;
        this.userRepository = userRepository;
        this.wardRepository = wardRepository;
        this.municipalityRepository = municipalityRepository;
    }

    // ── Streak ────────────────────────────────────────────────────────────────

    /**
     * Fetches the compliance streak for a household.
     *
     * If the household has never had a verified QR scan, a zero-value
     * StreakResponseDTO is returned — the controller always gets a valid DTO.
     *
     * @param householdId the household primary key
     * @return StreakResponseDTO populated from the ComplianceStreak entity
     * @throws RuntimeException if the household does not exist
     */
    @Transactional(readOnly = true)
    public StreakResponseDTO getStreakForHousehold(Long householdId) {

        // Throws if household not found — controller does not handle this logic
        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new RuntimeException(
                        "Household not found with ID: " + householdId));

        // Fetch streak, or use a zero-value object if no scans have occurred yet
        ComplianceStreak streak = streakRepository
                .findByHousehold(household)
                .orElseGet(ComplianceStreak::new);  // default constructor → all zeroes, nulls

        return new StreakResponseDTO(
                household.getHouseholdId(),
                household.getHouseNumber(),
                streak.getCurrentStreak(),
                streak.getLongestStreak(),
                streak.getTotalGreenDays(),
                streak.getLastGreenDate(),
                streak.getFraudFlagCount(),
                streak.getFineImmunityUntil()
        );
    }

    // ── Provisional Registration ──────────────────────────────────────────────

    /**
     * Registers a self-reported household through the 3-guardrail flow.
     *
     * Guardrail 1: GPS comes from the frontend — lat/lng validated @NotNull in DTO.
     * Guardrail 2: Duplicate detection — fuzzy match on ward + house no + 50m radius.
     * Guardrail 3: PROVISIONAL status + verification queue entry with 14-day SLA.
     *
     * @param userEmail the authenticated user's email
     * @param req       validated request from the frontend (GPS included)
     * @return result map with status, householdCode, or potentialMatches
     */
    @Transactional
    public Map<String, Object> registerHousehold(String userEmail, HouseholdRegisterRequest req) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ── Guard: DPDP consent must be given first ───────────────────────────
        if (!user.isDpdpConsentGiven()) {
            throw new IllegalStateException("DPDP consent must be recorded before household registration.");
        }

        // ── Guard: user cannot have two households ────────────────────────────
        if (householdRepository.findFirstByClaimedByUser_Id(user.getId()).isPresent()) {
            throw new IllegalStateException("You have already registered a household.");
        }

        // ── Guardrail 2: Duplicate detection ─────────────────────────────────
        String normalized = normalizeHouseNumber(req.getHouseNumber());
        List<Household> duplicates = householdRepository.findDuplicateCandidates(
                req.getWardId(), normalized, req.getLat(), req.getLng(), 50.0);

        if (!duplicates.isEmpty()) {
            List<Map<String, Object>> matches = duplicates.stream().map(h -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("householdId", h.getHouseholdId());
                m.put("householdCode", h.getHouseholdCode());
                m.put("houseNumber", h.getHouseNumber());
                m.put("verificationStatus", h.getVerificationStatus());
                return m;
            }).toList();
            return Map.of(
                "status", "DUPLICATE_CHECK",
                "message", "A similar household was found at this location. Is this your home?",
                "potentialMatches", matches
            );
        }

        // ── Fetch ward ────────────────────────────────────────────────────────
        Ward ward = wardRepository.findById(req.getWardId())
                .orElseThrow(() -> new RuntimeException("Ward not found: " + req.getWardId()));

        // ── Guardrail 3: Create PROVISIONAL household ─────────────────────────
        String code = generateHouseholdCode(ward);

        Household h = new Household();
        h.setHouseholdCode(code);
        h.setWard(ward);
        h.setHouseNumber(normalized);
        h.setBlockCode(req.getBlockCode());
        h.setRegisteredMobile(req.getMobile());
        h.setLat(req.getLat());          // auto-captured GPS, never typed
        h.setLng(req.getLng());
        h.setClaimedByUser(user);
        h.setPrimaryResident(user);
        h.setVerificationStatus(Household.VerificationStatus.PROVISIONAL);
        h.setHasApp(true);
        householdRepository.save(h);

        // ── Queue entry — 14-day SLA ──────────────────────────────────────────
        VerificationQueue queue = new VerificationQueue();
        queue.setHouseholdId(h.getHouseholdId());
        queue.setStatus(VerificationQueue.Status.PENDING);
        queue.setDueDate(LocalDateTime.now().plusDays(14));
        queueRepository.save(queue);

        return Map.of(
            "status", "PROVISIONAL",
            "householdCode", code,
            "householdId", h.getHouseholdId(),
            "message", "Household registered. A ward officer will verify within 14 days.",
            "verificationStatus", "PROVISIONAL"
        );
    }

    // ── GPS Lock (called on first waste submission) ───────────────────────────

    /**
     * Compares registration GPS vs first-submission GPS.
     * Δ < 100m → locks coordinates.
     * Δ >= 100m → returns false (caller should flag for officer review).
     *
     * @return true if lock succeeded, false if distance too large
     */
    @Transactional
    public boolean attemptGpsLock(Household household, double submissionLat, double submissionLng) {
        if (household.isGpsLocked()) return true;  // already locked, skip
        double distMetres = haversineMetres(
                household.getLat(), household.getLng(), submissionLat, submissionLng);
        if (distMetres < 100.0) {
            household.setGpsLocked(true);
            household.setGpsLockLat(submissionLat);
            household.setGpsLockLng(submissionLng);
            householdRepository.save(household);
            return true;
        }
        return false;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Strips spaces, dashes, slashes and uppercases. "12-A" -> "12A" */
    private String normalizeHouseNumber(String raw) {
        return raw.toUpperCase().replaceAll("[\\s\\-/]", "");
    }

    /**
     * Generates: CVM-{MUN3}-W{wardId}-{RANDOM6}
     * Municipality code = first 3 chars of slug in upper case (e.g. "chandigarh" -> "CHA")
     */
    private String generateHouseholdCode(Ward ward) {
        String slug = ward.getMunicipality().getSlug();
        String munCode = slug.toUpperCase().substring(0, Math.min(3, slug.length()));
        String rand = UUID.randomUUID().toString()
                .replaceAll("-", "")
                .substring(0, 6)
                .toUpperCase();
        return String.format("CVM-%s-W%d-%s", munCode, ward.getWardId(), rand);
    }

    /** Haversine distance between two GPS points, in metres */
    private double haversineMetres(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6_371_000.0; // Earth radius in metres
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
