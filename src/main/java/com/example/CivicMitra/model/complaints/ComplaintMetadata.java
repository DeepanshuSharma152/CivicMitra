package com.example.CivicMitra.model.complaints;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "complaint_metadata")
@Getter @Setter
public class ComplaintMetadata {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id")
    private Complaint complaint;

    private Double deviceLat;
    private Double deviceLng;
    private Double reportedLat;
    private Double reportedLng;

    private int trustScore;
    private double aiConfidence;
    private String locationConsistency;
    private boolean isAiSuspicious;

    @Column(columnDefinition = "TEXT")
    private String aiDescription;
}

