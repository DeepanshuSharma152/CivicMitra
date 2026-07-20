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

    // Explicit column names to match the DB schema (columns were created with is_ prefix)
    @Column(name = "is_correct_bin_type", nullable = false)
    private boolean correctBinType;

    @Column(name = "has_cross_contamination", nullable = false)
    private boolean hasCrossContamination;

    @Column(columnDefinition = "TEXT")
    private String contaminationDetail;

    @Column(name = "is_suspicious", nullable = false)
    private boolean suspicious;

    @Column(name = "is_empty", nullable = false)
    private boolean empty;

    // did this bin pass?
    @Column(nullable = false)
    private boolean passed;

    // Only relevant for RED bin
    @Column(name = "is_properly_wrapped", nullable = false)
    private boolean properlyWrapped;
}
