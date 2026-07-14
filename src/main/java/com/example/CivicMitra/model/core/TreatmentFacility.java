package com.example.CivicMitra.model.core;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "treatment_facilities")
@Getter
@Setter
public class TreatmentFacility {
    @Id
    private String facilityKey; // e.g., "DADUMAJRA_CBG"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "municipality_id", nullable = false)
    private Municipality municipality;

    private String facilityName;
    private String resourceType; // e.g., "Wet Waste"
    private String department;   // e.g., "MOH"
    private int capacityTpd;
    private boolean isOperational;
    
}
