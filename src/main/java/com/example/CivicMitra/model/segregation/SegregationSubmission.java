package com.example.CivicMitra.model.segregation;

import com.example.CivicMitra.Enums.SubmissionStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "segregation_submissions")
@Getter @Setter
@NoArgsConstructor
public class SegregationSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Household relationship ──────────────────────────────────────────────
    // Nullable to support the async controller path that saves the entity
    // *before* looking up the Household (it only has householdId at that point).
    // SegregationService's synchronous path still sets the full relation.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id")
    private Household household;

    // ── Per-bin analysis results ────────────────────────────────────────────
    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL)
    private List<BinAnalysis> binAnalyses = new ArrayList<>();

    // ── Status ─────────────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubmissionStatus status = SubmissionStatus.PROCESSING; // default on creation

    // ── Scoring ────────────────────────────────────────────────────────────
    private int attemptNumber;       // 1 to 5 — max 5/day
    private Double lat;
    private Double lng;
    private double overallScore;     // weighted average of bin confidences

    // ── Human-readable failure / error detail ──────────────────────────────
    // failureReason: shown to the citizen when status = FAILED / PENDING_RETRY
    // errorMessage : stored when status = PROCESSING_FAILED (Ollama exception)
    @Column(columnDefinition = "TEXT")
    private String failureReason;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    // ── Timestamps ─────────────────────────────────────────────────────────
    @CreationTimestamp
    private LocalDateTime submittedAt;

    // ── QR Token (generated only on APPROVED) ──────────────────────────────
    @OneToOne(mappedBy = "submission", cascade = CascadeType.ALL)
    private GreenQRToken qrToken;
}
