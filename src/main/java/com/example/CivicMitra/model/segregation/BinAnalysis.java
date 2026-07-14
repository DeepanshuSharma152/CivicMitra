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
    private boolean isCorrectBinType;
    private boolean hasCrossContamination;

    @Column(columnDefinition = "TEXT")
    private String contaminationDetail;

    private boolean isSuspicious;
    private boolean isEmpty;
    private boolean passed;// did this bin pass?
    boolean isProperlyWrapped ; // only relevant for RED bin

}
