package com.example.CivicMitra.Repository;

import com.example.CivicMitra.Enums.RouteStopStatus;
import com.example.CivicMitra.model.worker.CollectionRoute;
import com.example.CivicMitra.model.worker.RouteStop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RouteStopRepository extends JpaRepository<RouteStop, Long> {

    /**
     * All stops for a route in order — this is the worker's Route List (Screen 2).
     */
    List<RouteStop> findByRouteOrderByStopSequenceAsc(CollectionRoute route);

    /**
     * Stops in a route filtered by status — e.g. get only PENDING stops at shift start.
     */
    List<RouteStop> findByRouteAndStatusOrderByStopSequenceAsc(
            CollectionRoute route,
            RouteStopStatus status
    );

    /**
     * Check if a household is already a stop on a given route.
     * Guards against duplicate stop seeding.
     */
    boolean existsByRoute_IdAndHousehold_HouseholdId(Long routeId, Long householdId);

    /** Count stops by status for a route — used in shift completion summary. */
    long countByRouteAndStatus(CollectionRoute route, RouteStopStatus status);
}
