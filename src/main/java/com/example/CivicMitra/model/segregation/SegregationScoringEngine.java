package com.example.CivicMitra.model.segregation;

import com.example.CivicMitra.Enums.BinType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;


//isEmpty → isSuspicious → binMismatch → crossContamination → threshold
@Component
public class SegregationScoringEngine {

    private static final Set<BinType> MANDATORY_BINS =
            Set.of(BinType.GREEN, BinType.BLUE);

    private static final Map<BinType, Double> THRESHOLDS = Map.of(
            BinType.GREEN, 0.82,
            BinType.BLUE,  0.82,
            BinType.RED,   0.75,
            BinType.BLACK, 0.75
    );

    public record ScoringResult(
            boolean passed,
            double overallScore,
            String failureReason
    ) {}

    public ScoringResult evaluate(List<BinAnalysis> binAnalyses) {

        // ── Guard: no bins submitted ──────────────────────────
        if (binAnalyses == null || binAnalyses.isEmpty()) {
            return new ScoringResult(false, 0.0,
                    "No bin photos submitted.");
        }

        // ── Build lookup map (BinType → BinAnalysis) ──────────
        // Loophole 3 defence: if citizen submits two GREEN photos,
        // keep first — duplicate itself is suspicious but we don't
        // fail here, we catch it in the mismatch check below.
        Map<BinType, BinAnalysis> analysisMap = binAnalyses.stream()
                .collect(Collectors.toMap(
                        BinAnalysis::getExpectedBinType,
                        b -> b,
                        (first, duplicate) -> first));

        // ── Per-bin checks (order matters — fail fast) ────────
        for (BinAnalysis bin : binAnalyses) {

            String binName = bin.getExpectedBinType().name();

            // FIX loophole 5 — Empty bin trick
            // Check BEFORE confidence — an empty bin scores 99% confidence
            // as "clearly a green bin" but has no waste to evaluate
            if (bin.isEmpty()) {
                return new ScoringResult(false, 0.0,
                        binName + " bin appears empty. " +
                                "Please photograph your bin with waste inside.");
            }

            // FIX loophole 1 partial — suspicious catches stock photos
            if (bin.isSuspicious()) {
                return new ScoringResult(false, 0.0,
                        binName + " bin photo flagged as suspicious. " +
                                "Ensure you photograph a real bin in good lighting.");
            }

            // FIX loophole 3 — Bin swapping / mislabelling
            // detectedBinType is what AI saw; expectedBinType is what
            // the citizen claimed. If they don't match, reject.
            if (bin.getDetectedBinType() != null &&
                    bin.getDetectedBinType() != bin.getExpectedBinType()) {
                return new ScoringResult(false, 0.0,
                        "Bin mismatch: you labelled this as " +
                                binName + " but AI detected a " +
                                bin.getDetectedBinType().name() + " bin. " +
                                "Please photograph the correct bin.");
            }

            // FIX loophole 2 partial — cross contamination
            if (bin.isHasCrossContamination()) {
                return new ScoringResult(false, 0.0,
                        "Cross-contamination in " + binName + " bin: " +
                                bin.getContaminationDetail());
            }


            if (bin.getExpectedBinType() == BinType.RED
                    && !bin.isProperlyWrapped()) {
                return new ScoringResult(false, 0.0,
                        "Sanitary waste must be wrapped or pouched before " +
                                "placing in the red bag. Loose items are a hygiene " +
                                "violation under SWM Rules 2026.");
            }

            // FIX loophole 4 — threshold applies to ALL submitted bins,
            // not just mandatory ones. If you submit a red bin photo,
            // it must meet its threshold. You cannot submit a blurry
            // optional bin and get a pass.
            double threshold = THRESHOLDS.getOrDefault(
                    bin.getExpectedBinType(), 0.82);
            if (bin.getAiConfidence() < threshold) {
                return new ScoringResult(false, bin.getAiConfidence(),
                        binName + " bin photo is unclear (" +
                                String.format("%.0f%%", bin.getAiConfidence() * 100) +
                                " confidence). Please retake in better lighting.");
            }

            // All checks passed for this bin — mark it
            bin.setPassed(true);
        }

        // ── Mandatory bin presence check ──────────────────────
        // Done AFTER per-bin loop because per-bin failures are more
        // informative than "GREEN bin missing"
        for (BinType mandatory : MANDATORY_BINS) {
            if (!analysisMap.containsKey(mandatory)) {
                return new ScoringResult(false, 0.0,
                        mandatory.name() +
                                " bin photo is required but not submitted.");
            }
        }

        // ── All bins passed — calculate weighted score ────────
        // Mandatory bins carry more weight than optional ones
        double score = calculateWeightedScore(binAnalyses);

        return new ScoringResult(true, score, null);
    }

    // ── Weighted scoring ────────────────────────────────────
    // Mandatory bins (GREEN, BLUE) count double weight
    // Optional bins (RED, BLACK) count single weight
    // This means a perfect GREEN+BLUE with a mediocre RED
    // still scores well overall
    private double calculateWeightedScore(List<BinAnalysis> binAnalyses) {
        double totalWeight = 0;
        double weightedSum = 0;

        for (BinAnalysis bin : binAnalyses) {
            double weight = MANDATORY_BINS.contains(bin.getExpectedBinType())
                    ? 2.0   // mandatory bins count double
                    : 1.0;  // optional bins count single
            weightedSum += bin.getAiConfidence() * weight;
            totalWeight  += weight;
        }

        return totalWeight > 0 ? weightedSum / totalWeight : 0.0;
    }
}