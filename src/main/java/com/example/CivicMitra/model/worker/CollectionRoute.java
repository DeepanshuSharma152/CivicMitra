package com.example.CivicMitra.model.worker;

import com.example.CivicMitra.model.core.Municipality;
import com.example.CivicMitra.model.core.Ward;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Represents a named collection route assigned to a ward.
 *
 * A route is a logically ordered set of household stops (see RouteStop).
 * Workers are assigned one route per shift.
 *
 * Phase 1: entities only — no service wiring yet.
 */
@Entity
@Table(name = "collection_routes")
@Getter
@Setter
@NoArgsConstructor
public class CollectionRoute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Human-readable name, e.g. "Route CHA-W17-AM" */
    @Column(nullable = false)
    private String name;

    /** The ward this route serves. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id", nullable = false)
    private Ward ward;

    /** Municipality this route belongs to — redundant with ward but useful for direct queries. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "municipality_id", nullable = false)
    private Municipality municipality;

    /** Expected shift window start time, e.g. 06:00. */
    private LocalTime shiftStart;

    /** Expected shift window end time, e.g. 10:00. */
    private LocalTime shiftEnd;

    /** Whether this route is currently active. Inactive routes are not assigned to workers. */
    @Column(nullable = false)
    private boolean isActive = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
