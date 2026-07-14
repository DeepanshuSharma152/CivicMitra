package com.example.CivicMitra.model.complaints;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "complaint_audit_log")
@Getter
@Setter
public class ComplaintAuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long logId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id")
    private Complaint complaint;

    private int trustScore;

    @Column(columnDefinition = "TEXT")
    private String scoreBreakdown; // JSON string explaining the math

    @CreationTimestamp
    private LocalDateTime scoredAt;
}
