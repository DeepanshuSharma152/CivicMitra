package com.example.CivicMitra.Repository;

import com.example.CivicMitra.model.core.Municipality;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MunicipalityRepository extends JpaRepository<Municipality, Long> {
    Optional<Municipality> findByMunicipalityId(Long municipalityId);
}

