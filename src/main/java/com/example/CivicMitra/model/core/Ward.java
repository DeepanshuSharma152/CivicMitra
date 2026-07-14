package com.example.CivicMitra.model.core;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "wards")
@Getter
@Setter
public class Ward {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long wardId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "municipality_id", nullable = false)
    private Municipality municipality;

    private int wardNumber;
    private String sectorName; // e.g., "Sector 17"
    private String zone;        // e.g., "Zone A"
    private String officerInCharge;

}
