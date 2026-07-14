package com.example.CivicMitra.Ai.response;

public record WasteAnalysis(
        String category,      // Wet, Dry, Hazardous, or Fake
        String department,// Medical & Health (MOH) or Engineering
        String facilityKey,
        String resourcePotential, // e.g., Composting, Refuse Derived Fuel (RDF), Recycling
        double confidence,// AI's certainty (0.0 to 1.0)
        String locationConsistency,
        boolean isSuspicious,
        String aiDescription,  // A brief technical description for the Engineer


        // - for segregation verification
        String detectedBinType,        // "GREEN", "BLUE", "RED", "BLACK"
        boolean isCorrectBinType,      // did waste match the bin color?
        boolean hasCrossContamination, // e.g. plastic in green bin
        String contaminationDetail  ,   // "Plastic bottle detected in wet waste bin"
        boolean isEmpty,
        boolean isProperlyWrapped
) {}
