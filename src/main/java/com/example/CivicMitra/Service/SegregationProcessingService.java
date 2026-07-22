package com.example.CivicMitra.Service;

import com.example.CivicMitra.Ai.response.WasteAnalysis;
import com.example.CivicMitra.Ai.service.WasteAiService;
import com.example.CivicMitra.Enums.BinType;
import com.example.CivicMitra.Enums.SubmissionStatus;
import com.example.CivicMitra.Repository.GreenQRTokenRepository;
import com.example.CivicMitra.Repository.HouseholdRepository;
import com.example.CivicMitra.Repository.SegregationRepository;
import com.example.CivicMitra.model.segregation.*;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

/**
 * Runs asynchronously (separate thread pool) after the controller
 * returns 202 ACCEPTED to the citizen.
 *
 * Responsibilities:
 *  1. Call Ollama once for all 4 bin images
 *  2. Build BinAnalysis entities from AI results
 *  3. Run SegregationScoringEngine
 *  4. Persist results + generate QR if APPROVED
 *  5. On any failure, record PROCESSING_FAILED + error message
 */
@Service
public class SegregationProcessingService {

    private static final Logger log = LoggerFactory.getLogger(SegregationProcessingService.class);

    private final WasteAiService wasteAiService;
    private final SegregationRepository submissionRepository;
    private final HouseholdRepository householdRepository;
    private final GreenQRTokenRepository qrTokenRepository;
    private final SegregationScoringEngine scoringEngine;

    public SegregationProcessingService(WasteAiService wasteAiService,
                                        SegregationRepository submissionRepository,
                                        HouseholdRepository householdRepository,
                                        GreenQRTokenRepository qrTokenRepository,
                                        SegregationScoringEngine scoringEngine) {
        this.wasteAiService = wasteAiService;
        this.submissionRepository = submissionRepository;
        this.householdRepository = householdRepository;
        this.qrTokenRepository = qrTokenRepository;
        this.scoringEngine = scoringEngine;
    }

    @Async("wasteTaskExecutor")
    @Transactional
    public void processSubmission(Long submissionId,
                                  Long householdId,
                                  int attemptNumber,
                                  List<WasteAiService.ImagePayload> images) {
        SegregationSubmission submission = null;
        try {
            // ── Step 1: Reload submission (we are on a different thread now) ──
            submission = submissionRepository.findById(submissionId)
                    .orElseThrow(() -> new RuntimeException("Submission not found: " + submissionId));

            Household household = householdRepository.findById(householdId)
                    .orElseThrow(() -> new RuntimeException("Household not found: " + householdId));

            // Link household now that we have it
            submission.setHousehold(household);

            // ── Step 2: Single Ollama call for all images ─────────────────────
            log.info("Starting Ollama analysis for submission {} ({} images)", submissionId, images.size());
            List<WasteAnalysis> aiResults = wasteAiService.analyzeAllBins(images);

            // ── Step 3: Build BinAnalysis entities ───────────────────────────
            List<BinAnalysis> binAnalyses = new ArrayList<>();
            for (int i = 0; i < images.size(); i++) {
                WasteAiService.ImagePayload payload = images.get(i);
                WasteAnalysis ai = (i < aiResults.size()) ? aiResults.get(i) : buildFallback(payload.getBinType());

                BinType expectedType = parseBinType(payload.getBinType());

                BinAnalysis bin = new BinAnalysis();
                bin.setSubmission(submission);
                bin.setExpectedBinType(expectedType);
                bin.setDetectedBinType(parseBinType(ai.getDetectedBinType()));
                bin.setAiConfidence(ai.getConfidence());
                bin.setCorrectBinType(ai.isCorrectBinType());
                bin.setHasCrossContamination(ai.isHasCrossContamination());
                bin.setContaminationDetail(ai.getContaminationDetail());
                bin.setSuspicious(ai.isSuspicious());
                bin.setEmpty(ai.isEmpty());
                bin.setProperlyWrapped(ai.isProperlyWrapped());
                binAnalyses.add(bin);
            }

            // ── Step 4: Score ─────────────────────────────────────────────────
            SegregationScoringEngine.ScoringResult result = scoringEngine.evaluate(binAnalyses);

            // ── Step 5: Update submission ─────────────────────────────────────
            submission.getBinAnalyses().addAll(binAnalyses);
            submission.setOverallScore(result.overallScore());
            submission.setFailureReason(result.failureReason());
            submission.setAttemptNumber(attemptNumber);

            if (result.passed()) {
                submission.setStatus(SubmissionStatus.APPROVED);

                // Generate and persist Green QR Token
                GreenQRToken qr = generateQRToken(submission, household);
                submission.setQrToken(qr);

                log.info("Submission {} APPROVED — QR token issued", submissionId);
            } else {
                // 5th failed attempt → permanent FAILED (violation logged)
                // 1st to 4th → PENDING_RETRY (citizen may resubmit)
                SubmissionStatus failStatus = (attemptNumber >= 5)
                        ? SubmissionStatus.FAILED
                        : SubmissionStatus.PENDING_RETRY;
                submission.setStatus(failStatus);

                log.info("Submission {} {} — reason: {}", submissionId, failStatus, result.failureReason());
            }

            submissionRepository.save(submission);

        } catch (Exception e) {
            log.error("Processing failed for submission {}: {}", submissionId, e.getMessage(), e);
            try {
                // Reload in case the earlier load itself failed
                if (submission == null) {
                    submission = submissionRepository.findById(submissionId).orElse(null);
                }
                if (submission != null) {
                    submission.setStatus(SubmissionStatus.PROCESSING_FAILED);
                    submission.setErrorMessage(e.getMessage());
                    submissionRepository.save(submission);
                }
            } catch (Exception saveEx) {
                log.error("Could not persist PROCESSING_FAILED status for submission {}: {}", submissionId, saveEx.getMessage());
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Safe parse of AI-returned bin type string to BinType enum.
     * Returns null for UNKNOWN or unrecognised values — the scoring engine
     * handles null detectedBinType gracefully.
     */
    private BinType parseBinType(String raw) {
        if (raw == null) return null;
        try {
            return BinType.valueOf(raw.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * Creates a safe fallback WasteAnalysis when Ollama returns fewer
     * items than submitted images (model error / truncation).
     */
    private WasteAnalysis buildFallback(String binType) {
        WasteAnalysis fallback = new WasteAnalysis();
        fallback.setBinType(binType);
        fallback.setDetectedBinType("UNKNOWN");
        fallback.setCorrectBinType(false);
        fallback.setConfidence(0.0);
        fallback.setAiDescription("Model did not return analysis for this image — treated as failed.");
        return fallback;
    }

    /**
     * Generates a GreenQRToken valid until 2 PM today.
     * If submitted after 2 PM, the token is valid until 9 AM tomorrow
     * (covers the next morning's collection window).
     */
    private GreenQRToken generateQRToken(SegregationSubmission submission, Household household) {
        GreenQRToken token = new GreenQRToken();
        token.setToken(UUID.randomUUID().toString());
        token.setSubmission(submission);
        token.setHousehold(household);
        token.setIssuedAt(LocalDateTime.now());

        LocalDateTime twoPmToday = LocalDate.now().atTime(14, 0);
        LocalDateTime expiry = LocalDateTime.now().isAfter(twoPmToday)
                ? LocalDate.now().plusDays(1).atTime(9, 0)
                : twoPmToday;
        token.setExpiresAt(expiry);

        return token;
    }

    /**
     * Generates a Base64-encoded PNG of a QR code for the given token text.
     * Returns null on failure — callers must handle the null case gracefully.
     */
    private String generateQRCodeBase64(String tokenText) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(tokenText, BarcodeFormat.QR_CODE, 250, 250);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            return Base64.getEncoder().encodeToString(out.toByteArray());
        } catch (Exception e) {
            log.warn("QR image generation failed for token {}: {}", tokenText, e.getMessage());
            return null;
        }
    }
}
