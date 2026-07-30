package com.example.CivicMitra.model.worker;

import com.example.CivicMitra.Enums.QrStatus;
import com.example.CivicMitra.Enums.ReviewStatus;
import com.example.CivicMitra.Enums.WorkerDecision;
import com.example.CivicMitra.model.core.Municipality;
import com.example.CivicMitra.model.segregation.Household;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Full audit log of every worker collection attempt at a household stop.
 *
 * One row is created per scan attempt regardless of outcome (ACCEPTED, REJECTED, etc.).
 * This is the primary table for:
 *   - compliance streak advancement
 *   - daily collection analytics
 *   - citizen dispute resolution (via reviewStatus)
 *   - GPS proximity fraud detection
 *
 * The qrToken column is a soft reference (plain String) to green_qr_tokens.token —
 * intentionally not a hard FK so that manual-code fallback entries without a DB token
 * can still be recorded.
 *
 * truckId is left as a bare Long — Truck entity is Phase 3 scope.
 */
@Entity
@Table(
    name = "collection_logs",
    indexes = {
        @Index(name = "idx_log_worker_date",    columnList = "worker_id, collected_at"),
        @Index(name = "idx_log_household_date", columnList = "household_id, collected_at"),
        @Index(name = "idx_log_gps_status",     columnList = "gps_status")   // authority dashboard filter
    }
)
@Getter
@Setter
@NoArgsConstructor
public class CollectionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Ownership ────────────────────────────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "municipality_id", nullable = false)
    private Municipality municipality;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    private Household household;

    /** Optional — null if the worker was not on a scheduled route (spot check). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id")
    private CollectionRoute route;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private Worker worker;

    /**
     * Bare Long — Phase 3 will replace this with a Truck entity FK.
     * Nullable: not all collections are truck-based.
     */
    @Column(name = "truck_id")
    private Long truckId;

    // ── QR Token snapshot ────────────────────────────────────────────────────

    /**
     * Soft reference to green_qr_tokens.token (UUID string).
     * Not a hard FK — supports manual-code fallback entries.
     */
    @Column(length = 255)
    private String qrToken;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private QrStatus qrStatus;

    private LocalDateTime tokenExpiresAt;

    /** When the QR token was consumed (may differ from collectedAt by a few seconds). */
    private LocalDateTime consumedAt;

    // ── Worker decision ──────────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private WorkerDecision workerDecision;

    /**
     * Short reason code for non-ACCEPTED outcomes.
     * Examples: "NO_BINS_OUT", "CONTAMINATED", "GATE_LOCKED", "NO_APP"
     * Null for ACCEPTED.
     */
    @Column(length = 50)
    private String reasonCode;

    /** Free-text detail the worker adds when selecting a rejection reason. */
    @Column(length = 255)
    private String rejectionDetail;

    /** URL/path of the evidence photo uploaded by the worker on rejection. */
    @Column(length = 500)
    private String evidencePhotoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReviewStatus reviewStatus = ReviewStatus.NONE;

    // ── GPS verification ─────────────────────────────────────────────────────

    /** Worker's GPS latitude at scan time — required for anti-fraud checks. */
    @Column(nullable = false)
    private double workerGpsLat;

    /** Worker's GPS longitude at scan time — required for anti-fraud checks. */
    @Column(nullable = false)
    private double workerGpsLng;

    /**
     * GPS proximity decision recorded at pickup time.
     *
     * Possible values (matches WorkerScanDetailsDTO.gpsStatus):
     *   WITHIN_RANGE         — return visit, worker ≤100m of locked GPS          ✅
     *   OUT_OF_RANGE         — return visit, worker >100m (flagged for review)    ⚠️
     *   FIRST_VISIT_MATCHED  — first visit, worker GPS matched citizen GPS (≤50m) ✅
     *   FIRST_VISIT_MISMATCH — first visit, worker GPS differed from citizen GPS  ⚠️
     *   FIRST_VISIT_NO_REG   — first visit, no citizen GPS — worker GPS saved     ℹ️
     *   NO_GPS               — worker phone had no GPS signal                     ℹ️
     *
     * Authority dashboards can filter: WHERE gps_status = 'OUT_OF_RANGE'
     */
    @Column(name = "gps_status", length = 30)
    private String gpsStatus;

    /**
     * Straight-line distance in metres between worker GPS and household GPS lock
     * at the moment of pickup. Null if GPS was unavailable or first-visit with no
     * prior registered coordinates.
     */
    @Column(name = "distance_metres")
    private Double distanceMetres;

    // ── Timestamps ───────────────────────────────────────────────────────────

    /** Server-side timestamp of collection — authoritative. */
    @Column(nullable = false)
    private LocalDateTime collectedAt;

    /** Device-reported timestamp — may differ if device clock is skewed. */
    private LocalDateTime deviceTimestamp;

    // ── Score snapshots ──────────────────────────────────────────────────────

    /**
     * Snapshot of SegregationSubmission.overallScore at collection time.
     * Preserved for analytics even if the submission record changes later.
     */
    @Column(precision = 3, scale = 2)
    private BigDecimal aiScoreSnapshot;

    /**
     * Snapshot of ComplianceStreak-derived trust score at collection time.
     * Range: 0.00–100.00.
     */
    @Column(precision = 5, scale = 2)
    private BigDecimal trustScoreSnapshot;

    // ── Audit timestamps ─────────────────────────────────────────────────────

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
