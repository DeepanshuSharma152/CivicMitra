package com.example.CivicMitra.model.segregation;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.example.CivicMitra.Enums.BinType;

// Each bin photo within a submission is its own record
@Entity
@Table(name = "bin_analyses")
@Getter
@Setter
@NoArgsConstructor
public class BinAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    private SegregationSubmission submission;

    @Enumerated(EnumType.STRING)
    private BinType expectedBinType;  // what the citizen said they're uploading

    @Enumerated(EnumType.STRING)
    private BinType detectedBinType;  // what AI actually saw

    private String imagePath;
    private double aiConfidence;

    // Renamed from "isCorrectBinType" → Lombok will generate isCorrectBinType() getter
    private boolean correctBinType;

    // Renamed from "hasCrossContamination" → no change needed (no "is" prefix)
    private boolean hasCrossContamination;

    @Column(columnDefinition = "TEXT")
    private String contaminationDetail;

    // Renamed from "isSuspicious" → Lombok will generate isSuspicious() getter
    private boolean suspicious;

    // Renamed from "isEmpty" → Lombok will generate isEmpty() getter
    @Column(name = "is_empty")
    private boolean empty;

    // did this bin pass?
    private boolean passed;

    // Renamed from "isProperlyWrapped" → Lombok will generate isProperlyWrapped() getter
    // Only relevant for RED bin
    private boolean properlyWrapped;
}
