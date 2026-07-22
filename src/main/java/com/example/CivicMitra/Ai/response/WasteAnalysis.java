package com.example.CivicMitra.Ai.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * AI response for a single bin image analysis.
 *
 * Changed from Java record → mutable class so that:
 *  - Jackson can deserialize using setters (required for treeToValue)
 *  - WasteAiService can override binType after deserialization
 *  - SegregationProcessingService can read fields via getters
 */
@Getter
@Setter
@NoArgsConstructor
public class WasteAnalysis {

    // Waste stream routing
    private String category;           // Wet, Dry, Hazardous, C&D
    private String department;         // MOH or Engineering
    private String facilityKey;        // DADUMAJRA_CBG, DADUMAJRA_RDF, etc.
    private String resourcePotential;  // Biogas + Organic Manure, Recyclable, etc.

    // AI certainty (0.0 – 1.0)
    private double confidence;
    private String locationConsistency; // HIGH | MEDIUM | LOW

    @JsonProperty("isSuspicious")
    private boolean suspicious;

    private String aiDescription;

    // ── Segregation compliance ─────────────────────────
    // Expected bin (set by our code, not the model)
    private String binType;            // GREEN | BLUE | RED | BLACK

    // What the AI actually detected from the image
    private String detectedBinType;    // GREEN | BLUE | RED | BLACK | UNKNOWN

    @JsonProperty("isCorrectBinType")
    private boolean correctBinType;

    private boolean hasCrossContamination;
    private String contaminationDetail;

    @JsonProperty("isEmpty")
    private boolean empty;

    @JsonProperty("isProperlyWrapped")
    private boolean properlyWrapped;
}
