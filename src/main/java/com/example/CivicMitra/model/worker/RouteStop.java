package com.example.CivicMitra.model.worker;

import com.example.CivicMitra.Enums.RouteStopStatus;
import com.example.CivicMitra.model.segregation.Household;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Represents a single household stop on a collection route.
 *
 * RouteStops are ordered by stopSequence to form the ordered list
 * a worker sees on their Route List screen (Screen 2 in the worker UX).
 *
 * Phase 1: entity only — no service wiring yet.
 */
@Entity
@Table(
    name = "route_stops",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_route_household",
        columnNames = {"route_id", "household_id"}
    )
)
@Getter
@Setter
@NoArgsConstructor
public class RouteStop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The route this stop belongs to. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id", nullable = false)
    private CollectionRoute route;

    /** The household to be visited at this stop. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    private Household household;

    /** 1-based ordering within the route. Worker sees stops in this order. */
    @Column(nullable = false)
    private int stopSequence;

    /** Start of the expected visit time window, e.g. 07:00. */
    private LocalTime expectedWindowStart;

    /** End of the expected visit time window, e.g. 09:00. */
    private LocalTime expectedWindowEnd;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RouteStopStatus status = RouteStopStatus.PENDING;

    /** Timestamp when status transitioned to COMPLETED, MISSED, or SKIPPED. */
    private LocalDateTime completedAt;
}
