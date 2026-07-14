package com.example.CivicMitra.Repository;

import com.example.CivicMitra.model.core.TreatmentFacility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacilityRepository extends JpaRepository<TreatmentFacility, String> {

    // Find all facilities managed by a specific department (MOH vs Engineering)
    List<TreatmentFacility> findByDepartment(String department);

    // Find only operational plants to ensure we aren't routing waste to a closed site
    List<TreatmentFacility> findByIsOperationalTrue();

    // Find facilities by the type of waste they handle
    List<TreatmentFacility> findByResourceType(String resourceType);
}
