package com.example.CivicMitra.Repository;

import com.example.CivicMitra.model.segregation.Household;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HouseholdRepository extends JpaRepository<Household,Long> {
    Optional<Household> findFirstByPrimaryResident_Id(Long userId);
}
