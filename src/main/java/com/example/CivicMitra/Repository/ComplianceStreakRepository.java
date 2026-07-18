package com.example.CivicMitra.Repository;

import com.example.CivicMitra.model.segregation.ComplianceStreak;
import com.example.CivicMitra.model.segregation.Household;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ComplianceStreakRepository extends JpaRepository<ComplianceStreak, Long> {

    // Fetch streak by household entity
    Optional<ComplianceStreak> findByHousehold(Household household);

    // Fetch streak by household ID (convenience method for controller)
    Optional<ComplianceStreak> findByHousehold_HouseholdId(Long householdId);
}
