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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    private Household household;

    // Each submission contains multiple bin analyses
    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL)
    private List<BinAnalysis> binAnalyses = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private SubmissionStatus status; // APPROVED, FAILED, PENDING_RETRY

    private int attemptNumber;       // 1, 2, or 3 — max 3/day
    private Double lat;
    private Double lng;
    private double overallScore;     // weighted average of bin confidences

    @Column(columnDefinition = "TEXT")
    private String failureReason;    // shown to citizen if FAILED

    @CreationTimestamp
    private LocalDateTime submittedAt;

    @OneToOne(mappedBy = "submission", cascade = CascadeType.ALL)
    private GreenQRToken qrToken;
}

