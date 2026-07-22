package com.example.CivicMitra.model.segregation;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Tracks the ward officer verification queue for every self-registered household.
 * Every PROVISIONAL household gets one PENDING row here with a 14-day SLA.
 */
@Entity
@Table(name = "verification_queue")
@Getter
@Setter
public class VerificationQueue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The household awaiting verification */
    @Column(nullable = false)
    private Long householdId;

    /** Ward officer assigned to verify — null until dispatcher assigns */
    private Long assignedOfficerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** 14 days from createdAt — set by HouseholdService at creation */
    private LocalDateTime dueDate;

    /** Set when officer marks the visit as done */
    private LocalDateTime completedAt;

    /** Free-text notes from the officer (reasons for rejection, etc.) */
    @Column(columnDefinition = "TEXT")
    private String officerNotes;

    public enum Status {
        PENDING,
        IN_PROGRESS,
        VERIFIED,
        REJECTED
    }
}
