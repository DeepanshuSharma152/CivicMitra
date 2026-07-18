package com.example.CivicMitra.Controller;

import com.example.CivicMitra.DTO.StreakResponseDTO;
import com.example.CivicMitra.Service.HouseholdService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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

    public HouseholdController(HouseholdService householdService) {
        this.householdService = householdService;
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
}
