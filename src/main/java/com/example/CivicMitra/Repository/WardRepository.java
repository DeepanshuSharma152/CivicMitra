package com.example.CivicMitra.Repository;

import com.example.CivicMitra.model.core.Ward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WardRepository extends JpaRepository<Ward, Long> {

    // Used in createComplaintWithFile to link the DTO location string to the Entity
    Optional<Ward> findBySectorName(String sectorName);

    // Useful for your Research Paper: "Get all complaints in Zone A"
    List<Ward> findByZone(String zone);

    // Check if we even cover this sector yet
    boolean existsBySectorName(String sectorName);

    // All wards for a given municipality — used for the household-setup ward dropdown
    List<Ward> findByMunicipality_MunicipalityId(Long municipalityId);
}
