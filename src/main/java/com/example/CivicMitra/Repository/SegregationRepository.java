package com.example.CivicMitra.Repository;

import com.example.CivicMitra.model.segregation.Household;
import com.example.CivicMitra.model.segregation.SegregationSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface SegregationRepository extends JpaRepository<SegregationSubmission,Long> {

    long countByHouseholdAndSubmittedAtBetween(
            Household household,
            LocalDateTime start,
            LocalDateTime end);

    List<SegregationSubmission> findByHousehold_HouseholdIdOrderBySubmittedAtDesc(
            Long householdId);

}
