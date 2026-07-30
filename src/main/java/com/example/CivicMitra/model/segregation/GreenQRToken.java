package com.example.CivicMitra.model.segregation;

import com.example.CivicMitra.model.core.User;
import com.example.CivicMitra.model.worker.Worker;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "green_qr_tokens")
@Getter
@Setter
@NoArgsConstructor
public class GreenQRToken {

    @Id
    private String token = UUID.randomUUID().toString();

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    private SegregationSubmission submission;

    // Who can consume it — the truck worker for this household's ward
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    private Household household;

    private LocalDateTime issuedAt = LocalDateTime.now();
    private LocalDateTime expiresAt;   // set to 2 PM collection cutoff
    private boolean isConsumed = false;

    /** Legacy FK — kept for backward compatibility with existing data. Points to users.id. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consumed_by_worker_id")
    private User consumedByWorker;

    /**
     * New FK pointing to the dedicated Worker entity (Phase 1+).
     * New endpoints use workerCode (W-CHA-042) which resolves to this entity.
     * Null for tokens consumed before the Worker entity migration.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consumed_by_worker_entity_id")
    private Worker consumedByWorkerEntity;

    private LocalDateTime consumedAt;

    // GPS of worker at scan time — anti-fraud
    private Double workerScanLat;
    private Double workerScanLng;

    private boolean rejected = false;
    private LocalDateTime rejectedAt;
    private String rejectionReason;
    private String rejectionSubReason;

    @Column(columnDefinition = "TEXT")
    private String rejectionRemarks;

    @Column(columnDefinition = "TEXT")
    private String rejectionProofPaths;
}
