package com.example.CivicMitra.model.segregation;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Tracks a household's waste segregation compliance over time.
 *
 * Lifecycle: Created LAZILY on the first successful QR scan
 * (not at household seeding, not at user registration).
 *
 * After 30 consecutive green days, fineImmunityUntil is set to
 * grant a 30-day window where the household cannot be fined.
 */
@Entity
@Table(name = "compliance_streaks")
@Getter
@Setter
@NoArgsConstructor
public class ComplianceStreak {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Owning side — one streak per household
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false, unique = true)
    private Household household;

    // How many consecutive days the household has submitted an approved bin photo
    // and had it verified by the worker
    @Column(nullable = false)
    private int currentStreak = 0;

    // All-time best streak — never decremented
    @Column(nullable = false)
    private int longestStreak = 0;

    // Cumulative count of days with verified, approved segregation
    @Column(nullable = false)
    private int totalGreenDays = 0;

    // Date of the last verified green day — used to detect gaps / streak breaks
    private LocalDate lastGreenDate;

    // Number of times this household triggered the fraud-detection system
    @Column(nullable = false)
    private int fraudFlagCount = 0;

    // After a 30-day streak, this is set 30 days into the future.
    // While active, the household is immune to segregation fines.
    private LocalDate fineImmunityUntil;

    @Column(nullable = false)
    private LocalDateTime lastUpdatedAt = LocalDateTime.now();
}
