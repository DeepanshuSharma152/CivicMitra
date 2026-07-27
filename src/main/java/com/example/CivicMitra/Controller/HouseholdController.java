package com.example.CivicMitra.Controller;

import com.example.CivicMitra.Repository.HouseholdRepository;
import com.example.CivicMitra.Repository.UserRepository;
import com.example.CivicMitra.Repository.WardRepository;
import com.example.CivicMitra.Service.HouseholdService;
import com.example.CivicMitra.DTO.HouseholdRegisterRequest;
import com.example.CivicMitra.DTO.StreakResponseDTO;
import com.example.CivicMitra.model.core.User;
import com.example.CivicMitra.model.core.Ward;
import com.example.CivicMitra.model.segregation.Household;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST controller for household-level queries.
 *
 * Follows layered architecture: controller only receives the request,
 * delegates to HouseholdService, and returns the DTO.
 * No entity access, no null checks, no business logic here.
 */
@RestController
@RequestMapping("/api/v1/households")
public class HouseholdController {

    private final HouseholdService householdService;
    private final HouseholdRepository householdRepository;
    private final UserRepository userRepository;
    private final WardRepository wardRepository;

    public HouseholdController(HouseholdService householdService,
                               HouseholdRepository householdRepository,
                               UserRepository userRepository,
                               WardRepository wardRepository) {
        this.householdService = householdService;
        this.householdRepository = householdRepository;
        this.userRepository = userRepository;
        this.wardRepository = wardRepository;
    }

    /**
     * GET /api/v1/households/{id}/streak
     *
     * Returns the compliance streak for the given household.
     * If no streak record exists yet, returns zero-value fields.
     */
    @GetMapping("/{id}/streak")
    public ResponseEntity<?> getStreak(@PathVariable Long id) {
        try {
            StreakResponseDTO dto = householdService.getStreakForHousehold(id);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/v1/households/register
     *
     * Provisional self-registration with 3 guardrails:
     * 1. GPS captured by frontend — lat/lng @NotNull in request
     * 2. Duplicate detection — fuzzy match on ward + house no + 50m radius
     * 3. PROVISIONAL status → verification queue entry with 14-day SLA
     *
     * Requires DPDP consent to be given first (checked in service).
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerHousehold(
            @Valid @RequestBody HouseholdRegisterRequest req,
            Principal principal) {
        try {
            Map<String, Object> result = householdService.registerHousehold(principal.getName(), req);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/v1/households/mine
     *
     * Returns the calling user's household (if any).
     * Frontend uses this to decide whether to show the household-setup wizard.
     */
    @GetMapping("/mine")
    public ResponseEntity<?> getMyHousehold(Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElse(null);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        Household h = householdRepository.findFirstByClaimedByUser_Id(user.getId())
                .orElse(null);

        if (h == null) {
            return ResponseEntity.ok(Map.of("hasHousehold", false));
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("hasHousehold", true);
        resp.put("householdId", h.getHouseholdId());
        resp.put("householdCode", h.getHouseholdCode());
        resp.put("houseNumber", h.getHouseNumber());
        resp.put("verificationStatus", h.getVerificationStatus());
        resp.put("gpsLocked", h.isGpsLocked());
        resp.put("ward", h.getWard() != null ? h.getWard().getSectorName() : null);
        resp.put("wardId", h.getWard() != null ? h.getWard().getWardId() : null);
        resp.put("mobile", h.getRegisteredMobile());
        resp.put("blockCode", h.getBlockCode());
        resp.put("lat", h.getLat());
        resp.put("lng", h.getLng());
        return ResponseEntity.ok(resp);
    }

    /**
     * GET /api/v1/households/wards?municipalityId={id}
     *
     * Returns wards for a given municipality, used to populate the
     * household-setup ward dropdown on the frontend.
     */
    @GetMapping("/wards")
    public ResponseEntity<?> getWards(@RequestParam Long municipalityId) {
        List<Ward> wards = wardRepository.findByMunicipality_MunicipalityId(municipalityId);
        List<Map<String, Object>> result = wards.stream().map(w -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("wardId", w.getWardId());
            m.put("wardNumber", w.getWardNumber());
            m.put("sectorName", w.getSectorName());
            m.put("zone", w.getZone());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
