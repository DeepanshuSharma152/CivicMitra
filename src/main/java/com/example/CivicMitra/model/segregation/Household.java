package com.example.CivicMitra.model.segregation;

import com.example.CivicMitra.model.core.User;
import com.example.CivicMitra.model.core.Ward;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "households")
@Getter
@Setter
public class Household {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long householdId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id", nullable = false)
    private Ward ward;

    @Column(nullable = false)
    private String houseNumber;       // "1234-B"

    private Double lat;               // Home base for GPS validation
    private Double lng;

    private boolean hasApp = false;   // For Scenario B (Manual checks)

    // Link to the resident (The User who pays the bills/files segregation)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_resident_id")
    private User primaryResident;
}