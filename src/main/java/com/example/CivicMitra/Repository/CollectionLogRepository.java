package com.example.CivicMitra.Repository;

import com.example.CivicMitra.model.worker.CollectionLog;
import com.example.CivicMitra.model.worker.Worker;
import com.example.CivicMitra.model.segregation.Household;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CollectionLogRepository extends JpaRepository<CollectionLog, Long> {

    /**
     * All log entries for a worker within a date range.
     * Primary query for the worker's daily collection summary.
     */
    List<CollectionLog> findByWorkerAndCollectedAtBetweenOrderByCollectedAtDesc(
            Worker worker,
            LocalDateTime from,
            LocalDateTime to
    );

    /**
     * All log entries for a household ordered by most recent first.
     * Used for citizen history and compliance streak calculation.
     */
    List<CollectionLog> findByHouseholdOrderByCollectedAtDesc(Household household);

    /**
     * Check if a QR token has already been logged as consumed.
     * Guards against duplicate submissions for the same token.
     */
    boolean existsByQrToken(String qrToken);

    /**
     * Find the log entry created for a specific QR token — used in review/dispute flows.
     */
    Optional<CollectionLog> findByQrToken(String qrToken);

    /**
     * Count how many collections a worker completed in a date window.
     * Used for reliability score calculation.
     */
    long countByWorkerAndCollectedAtBetween(Worker worker, LocalDateTime from, LocalDateTime to);

    /**
     * All logs with a specific GPS status within a date range.
     * Primary query for authority dashboards:
     *   e.g. "show me all OUT_OF_RANGE collections this week"
     */
    List<CollectionLog> findByGpsStatusAndCollectedAtBetweenOrderByCollectedAtDesc(
            String gpsStatus,
            LocalDateTime from,
            LocalDateTime to
    );
}
