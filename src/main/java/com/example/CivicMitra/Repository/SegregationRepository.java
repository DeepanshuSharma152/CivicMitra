package com.example.CivicMitra.Repository;

import com.example.CivicMitra.model.segregation.Household;
import com.example.CivicMitra.model.segregation.SegregationSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SegregationRepository extends JpaRepository<SegregationSubmission,Long> {

    long countByHouseholdAndSubmittedAtBetween(
            Household household,
            LocalDateTime start,
            LocalDateTime end);

    List<SegregationSubmission> findByHousehold_HouseholdIdOrderBySubmittedAtDesc(
            Long householdId);

    Optional<SegregationSubmission> findTop1ByHousehold_HouseholdIdAndSubmittedAtAfterOrderBySubmittedAtDesc(
            Long householdId,
            LocalDateTime afterWindow);
}

