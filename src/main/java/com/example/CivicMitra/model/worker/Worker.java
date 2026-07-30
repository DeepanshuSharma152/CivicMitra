package com.example.CivicMitra.model.worker;

import com.example.CivicMitra.Enums.WorkerRole;
import com.example.CivicMitra.model.core.Municipality;
import com.example.CivicMitra.model.core.Ward;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A sanitation worker — completely separate from the citizen-facing User entity.
 *
 * Authentication: PIN-based (4-digit, bcrypt hashed into pinHash).
 * Identity: workerCode in "W-CHA-042" format is the primary login credential,
 *           used in new API endpoints instead of numeric IDs.
 *
 * Phase 1: entity + seeding only.
 *          WorkerAuthController is NOT implemented yet.
 *          The route/ward fields are set at seeding time.
 */
@Entity
@Table(name = "workers")
@Getter
@Setter
@NoArgsConstructor
public class Worker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Human-readable, scannable worker code.
     * Format: W-{MUNICIPALITY_SLUG}-{ZERO_PADDED_NUMBER}, e.g. W-CHA-042.
     * Used as the login username and in new API endpoints.
     */
    @Column(unique = true, nullable = false, length = 20)
    private String workerCode;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 15)
    private String phone;

    /**
     * BCrypt hash of the 4-digit PIN.
     * PIN auth controller will be implemented in Phase 2.
     */
    @Column(nullable = false, length = 100)
    private String pinHash;

    /** Municipality this worker belongs to. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "municipality_id", nullable = false)
    private Municipality municipality;

    /** Primary ward assignment — may be null for floating supervisors. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id")
    private Ward ward;

    /** Assigned collection route — may be null for supervisors or newly onboarded workers. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id")
    private CollectionRoute route;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WorkerRole role = WorkerRole.COLLECTOR;

    /**
     * Rolling reliability score (0.00–1.00).
     * Updated by the supervisor review process when rejections are overturned.
     * Default 1.00 = fully reliable on join.
     */
    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal reliabilityScore = BigDecimal.ONE;

    @Column(nullable = false)
    private boolean isActive = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
