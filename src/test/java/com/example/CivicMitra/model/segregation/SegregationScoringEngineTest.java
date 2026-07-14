package com.example.CivicMitra.model.segregation;

import com.example.CivicMitra.Enums.BinType;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class SegregationScoringEngineTest {

    private final SegregationScoringEngine engine = new SegregationScoringEngine();

    @Test
    void rejectsSubmissionWhenAMandatoryBinIsMissing() {
        SegregationScoringEngine.ScoringResult result = engine.evaluate(List.of(
                validBin(BinType.GREEN, 0.90)
        ));

        assertFalse(result.passed());
        assertEquals(0.0, result.overallScore());
        assertEquals("BLUE bin photo is required but not submitted.", result.failureReason());
    }

    @Test
    void gracefullyHandlesNullOrEmptySubmissions() {
        SegregationScoringEngine.ScoringResult emptyResult = engine.evaluate(List.of());
        SegregationScoringEngine.ScoringResult nullResult = engine.evaluate(null);

        assertFalse(emptyResult.passed());
        assertEquals("No bin photos submitted.", emptyResult.failureReason());
        assertFalse(nullResult.passed());
        assertEquals("No bin photos submitted.", nullResult.failureReason());
    }

    @Test
    void rejectsEmptyAndSuspiciousBinPhotos() {
        BinAnalysis emptyGreen = validBin(BinType.GREEN, 0.99);
        emptyGreen.setEmpty(true);

        SegregationScoringEngine.ScoringResult emptyResult = engine.evaluate(List.of(
                emptyGreen, validBin(BinType.BLUE, 0.90)
        ));

        assertFalse(emptyResult.passed());
        assertTrue(emptyResult.failureReason().contains("GREEN bin appears empty"));

        BinAnalysis suspiciousGreen = validBin(BinType.GREEN, 0.99);
        suspiciousGreen.setSuspicious(true);

        SegregationScoringEngine.ScoringResult suspiciousResult = engine.evaluate(List.of(
                suspiciousGreen, validBin(BinType.BLUE, 0.90)
        ));

        assertFalse(suspiciousResult.passed());
        assertTrue(suspiciousResult.failureReason().contains("GREEN bin photo flagged as suspicious"));
    }

    @Test
    void rejectsWhenDetectedBinDoesNotMatchTheClaimedBin() {
        BinAnalysis greenClaimWithBlueDetection = validBin(BinType.GREEN, 0.90);
        greenClaimWithBlueDetection.setDetectedBinType(BinType.BLUE);

        SegregationScoringEngine.ScoringResult result = engine.evaluate(List.of(
                greenClaimWithBlueDetection, validBin(BinType.BLUE, 0.90)
        ));

        assertFalse(result.passed());
        assertTrue(result.failureReason().contains("Bin mismatch"));
    }

    @Test
    void rejectsCrossContaminationAndUnwrappedSanitaryWaste() {
        BinAnalysis contaminatedGreen = validBin(BinType.GREEN, 0.90);
        contaminatedGreen.setHasCrossContamination(true);
        contaminatedGreen.setContaminationDetail("Plastic found with wet waste");

        SegregationScoringEngine.ScoringResult contaminationResult = engine.evaluate(List.of(
                contaminatedGreen, validBin(BinType.BLUE, 0.90)
        ));

        assertFalse(contaminationResult.passed());
        assertTrue(contaminationResult.failureReason().contains("Cross-contamination"));

        BinAnalysis unwrappedRed = validBin(BinType.RED, 0.90);
        unwrappedRed.setProperlyWrapped(false);

        SegregationScoringEngine.ScoringResult sanitaryResult = engine.evaluate(List.of(
                validBin(BinType.GREEN, 0.90), validBin(BinType.BLUE, 0.90), unwrappedRed
        ));

        assertFalse(sanitaryResult.passed());
        assertTrue(sanitaryResult.failureReason().contains("must be wrapped"));
    }

    @Test
    void enforcesConfidenceThresholdsForMandatoryAndOptionalBins() {
        SegregationScoringEngine.ScoringResult greenResult = engine.evaluate(List.of(
                validBin(BinType.GREEN, 0.81), validBin(BinType.BLUE, 0.90)
        ));

        assertFalse(greenResult.passed());
        assertEquals(0.81, greenResult.overallScore());

        SegregationScoringEngine.ScoringResult redResult = engine.evaluate(List.of(
                validBin(BinType.GREEN, 0.90), validBin(BinType.BLUE, 0.90), validBin(BinType.RED, 0.74)
        ));

        assertFalse(redResult.passed());
        assertEquals(0.74, redResult.overallScore());
    }

    @Test
    void passesWhenConfidenceIsExactlyAtConfiguredThresholds() {
        SegregationScoringEngine.ScoringResult mandatoryBinResult = engine.evaluate(List.of(
                validBin(BinType.GREEN, 0.82), validBin(BinType.BLUE, 0.82)
        ));

        assertTrue(mandatoryBinResult.passed());
        assertEquals(0.82, mandatoryBinResult.overallScore(), 0.000_001);

        SegregationScoringEngine.ScoringResult optionalBinResult = engine.evaluate(List.of(
                validBin(BinType.GREEN, 0.82), validBin(BinType.BLUE, 0.82),
                validBin(BinType.RED, 0.75), validBin(BinType.BLACK, 0.75)
        ));

        assertTrue(optionalBinResult.passed());
    }

    @Test
    void rejectsDuplicateMandatoryBinsWhenTheOtherMandatoryBinIsMissing() {
        SegregationScoringEngine.ScoringResult result = engine.evaluate(List.of(
                validBin(BinType.GREEN, 0.95), validBin(BinType.GREEN, 0.90)
        ));

        assertFalse(result.passed());
        assertTrue(result.failureReason().contains("BLUE bin"));
    }

    @Test
    void passesValidBinsAndGivesMandatoryBinsDoubleWeight() {
        BinAnalysis green = validBin(BinType.GREEN, 0.90);
        BinAnalysis blue = validBin(BinType.BLUE, 0.84);
        BinAnalysis red = validBin(BinType.RED, 0.76);
        BinAnalysis black = validBin(BinType.BLACK, 0.80);

        SegregationScoringEngine.ScoringResult result = engine.evaluate(List.of(green, blue, red, black));

        assertTrue(result.passed());
        assertEquals(0.84, result.overallScore(), 0.000_001);
        assertNull(result.failureReason());
        assertTrue(green.isPassed());
        assertTrue(blue.isPassed());
        assertTrue(red.isPassed());
        assertTrue(black.isPassed());
    }

    private BinAnalysis validBin(BinType type, double confidence) {
        BinAnalysis bin = new BinAnalysis();
        bin.setExpectedBinType(type);
        bin.setDetectedBinType(type);
        bin.setAiConfidence(confidence);
        bin.setProperlyWrapped(true);
        return bin;
    }
}
