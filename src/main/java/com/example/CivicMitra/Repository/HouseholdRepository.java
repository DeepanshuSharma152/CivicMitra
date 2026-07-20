package com.example.CivicMitra.Repository;

import com.example.CivicMitra.model.segregation.Household;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HouseholdRepository extends JpaRepository<Household, Long> {

    /**
     * Efficient existence check for the DataSeeder.
     * Translates to: SELECT COUNT(*) > 0 FROM households
     *                WHERE house_number = ? AND ward_id = ?
     *
     * Replaces the dangerous findAll().stream().anyMatch() pattern
     * that loads the entire households table into memory.
     */
    boolean existsByHouseNumberAndWard_WardId(String houseNumber, Long wardId);

    /**
     * Find the household linked to a specific resident user.
     * Used by Rahul's verification flow to look up a household by user ID.
     */
    Optional<Household> findFirstByPrimaryResident_Id(Long userId);
}
