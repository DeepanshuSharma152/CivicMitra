package com.example.CivicMitra.Repository;

import com.example.CivicMitra.model.segregation.Household;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
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

    /**
     * Find household claimed by a specific user ID.
     * Used to check if a user already registered a household.
     */
    Optional<Household> findFirstByClaimedByUser_Id(Long userId);

    /**
     * Duplicate detection — fuzzy match on normalized house number + ward + GPS radius.
     * Uses inline haversine distance formula in metres.
     * Returns up to 5 candidates for the duplicate-check flow.
     *
     * @param wardId       the ward being registered into
     * @param normalized   uppercase, stripped house number (e.g. "12A")
     * @param lat          GPS latitude from the frontend
     * @param lng          GPS longitude from the frontend
     * @param radiusMetres match threshold (use 50.0)
     */
    @Query(value = """
        SELECT * FROM households h
        WHERE h.ward_id = :wardId
          AND UPPER(REPLACE(REPLACE(REPLACE(h.house_number, ' ', ''), '-', ''), '/', ''))
              LIKE CONCAT('%', UPPER(REPLACE(REPLACE(REPLACE(:normalized, ' ', ''), '-', ''), '/', '')), '%')
          AND h.lat IS NOT NULL
          AND h.lng IS NOT NULL
          AND (6371000 * acos(GREATEST(-1, LEAST(1,
                cos(radians(:lat)) * cos(radians(h.lat)) *
                cos(radians(h.lng) - radians(:lng)) +
                sin(radians(:lat)) * sin(radians(h.lat))
              )))) < :radiusMetres
        LIMIT 5
    """, nativeQuery = true)
    List<Household> findDuplicateCandidates(
            @Param("wardId") Long wardId,
            @Param("normalized") String normalized,
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radiusMetres") double radiusMetres);

    /**
     * All households in a given ward.
     * Used by DataSeeder to load Sector 17 households for RouteStop seeding.
     */
    List<Household> findByWard_WardId(Long wardId);
}
