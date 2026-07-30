package com.example.CivicMitra.Repository;

import com.example.CivicMitra.model.worker.CollectionRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CollectionRouteRepository extends JpaRepository<CollectionRoute, Long> {

    /** All active routes for a given ward — used to assign workers at shift start. */
    List<CollectionRoute> findByWard_WardIdAndIsActiveTrue(Long wardId);

    /** All active routes in a municipality — used for supervisor overview. */
    List<CollectionRoute> findByMunicipality_MunicipalityIdAndIsActiveTrue(Long municipalityId);

    /** Check if a named route already exists — used by DataSeeder for idempotency. */
    boolean existsByName(String name);
}
