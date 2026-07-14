package com.example.CivicMitra.DTO;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Data
public class ComplaintResponseDTO {
    private Long id;
    private String title;
    private String description;
    private String status;
    private Long userId;
    private String citizenEmail;
    private String location;          // from ward.sectorName
    private String municipalityName;  // from ward.municipality.name
    private String imagePath;
    private String category;          // joined from @ElementCollection
    private String resourcePotential; // from facility.resourceType
    private String facilityName;      // from facility.facilityName
    private int upvotes;
    private int trustScore;           // from metadata.trustScore
    private double aiConfidence;      // from metadata.aiConfidence
    private LocalDateTime createdAt;
}
