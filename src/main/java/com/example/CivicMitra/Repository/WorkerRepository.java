package com.example.CivicMitra.Repository;

import com.example.CivicMitra.model.worker.Worker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkerRepository extends JpaRepository<Worker, Long> {

    /**
     * Primary lookup for worker login — used by WorkerAuthController (Phase 2).
     * workerCode is the W-CHA-042 style identifier entered by the worker.
     */
    Optional<Worker> findByWorkerCodeAndIsActiveTrue(String workerCode);

    /** Lookup by phone for OTP-based recovery flows. */
    Optional<Worker> findByPhoneAndIsActiveTrue(String phone);

    /** Check worker code uniqueness before seeding. */
    boolean existsByWorkerCode(String workerCode);

    /** All active workers assigned to a specific ward. */
    List<Worker> findByWard_WardIdAndIsActiveTrue(Long wardId);

    /** All active workers assigned to a specific route. */
    List<Worker> findByRoute_IdAndIsActiveTrue(Long routeId);
}
