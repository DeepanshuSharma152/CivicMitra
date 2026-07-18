package com.example.CivicMitra.Service;

import com.example.CivicMitra.DTO.StreakResponseDTO;
import com.example.CivicMitra.Repository.ComplianceStreakRepository;
import com.example.CivicMitra.Repository.HouseholdRepository;
import com.example.CivicMitra.model.segregation.ComplianceStreak;
import com.example.CivicMitra.model.segregation.Household;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HouseholdService {

    private final HouseholdRepository householdRepository;
    private final ComplianceStreakRepository streakRepository;

    public HouseholdService(HouseholdRepository householdRepository,
                            ComplianceStreakRepository streakRepository) {
        this.householdRepository = householdRepository;
        this.streakRepository = streakRepository;
    }

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
}
