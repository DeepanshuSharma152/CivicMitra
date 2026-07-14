package com.example.CivicMitra.model.segregation;

import com.example.CivicMitra.model.core.User;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consumed_by_worker_id")
    private User consumedByWorker;     // which worker scanned it

    private LocalDateTime consumedAt;

    // GPS of worker at scan time — anti-fraud
    private Double workerScanLat;
    private Double workerScanLng;
}
