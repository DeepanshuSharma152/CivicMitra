package com.example.CivicMitra.Service;


import com.example.CivicMitra.Ai.response.WasteAnalysis;
import com.example.CivicMitra.Ai.service.WasteAiService;
import com.example.CivicMitra.DTO.BinResultDTO;
import com.example.CivicMitra.DTO.QRScanResponseDTO;
import com.example.CivicMitra.DTO.SegregationResponseDTO;
import com.example.CivicMitra.DTO.WorkerPickupActionDTO;
import com.example.CivicMitra.DTO.WorkerScanDetailsDTO;
import com.example.CivicMitra.Enums.BinType;
import com.example.CivicMitra.Enums.SubmissionStatus;
import com.example.CivicMitra.Repository.CollectionLogRepository;
import com.example.CivicMitra.Repository.ComplianceStreakRepository;
import com.example.CivicMitra.Repository.GreenQRTokenRepository;
import com.example.CivicMitra.Repository.HouseholdRepository;
import com.example.CivicMitra.Repository.SegregationRepository;
import com.example.CivicMitra.Repository.UserRepository;
import com.example.CivicMitra.Service.TrustService;
import com.example.CivicMitra.Service.SegregationProcessingService;

import com.example.CivicMitra.Enums.WorkerDecision;
import com.example.CivicMitra.model.segregation.*;
import com.example.CivicMitra.model.worker.CollectionLog;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import jakarta.persistence.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SegregationService {

    private final SegregationRepository segregationRepository;
    private final HouseholdRepository householdRepository;
    private final GreenQRTokenRepository qrTokenRepository;
    private final WasteAiService wasteAiService;
    private final SegregationScoringEngine scoringEngine;
    private final TrustService trustService;
    private final ComplianceStreakRepository streakRepository;
    private final UserRepository userRepository;
    private final SegregationProcessingService processingService;
    private final CollectionLogRepository collectionLogRepository;

    public SegregationService(SegregationRepository segregationRepository,
                              HouseholdRepository householdRepository,
                              GreenQRTokenRepository qrTokenRepository,
                              WasteAiService wasteAiService,
                              SegregationScoringEngine scoringEngine,
                              TrustService trustService,
                              ComplianceStreakRepository streakRepository,
                              UserRepository userRepository,
                              SegregationProcessingService processingService,
                              CollectionLogRepository collectionLogRepository) {
        this.segregationRepository = segregationRepository;
        this.householdRepository = householdRepository;
        this.qrTokenRepository = qrTokenRepository;
        this.wasteAiService = wasteAiService;
        this.scoringEngine = scoringEngine;
        this.trustService = trustService;
        this.streakRepository = streakRepository;
        this.userRepository = userRepository;
        this.processingService = processingService;
        this.collectionLogRepository = collectionLogRepository;
    }

    // ─────────────────────────────────────────────────────
    // CITIZEN: Async batch submission (all bins at once)
    // ─────────────────────────────────────────────────────

    /**
     * Creates a PROCESSING submission immediately, reads image bytes eagerly,
     * fires async AI via {@link SegregationProcessingService}, and returns a
     * response map the controller can wrap in a 202 ACCEPTED.
     *
     * @throws IllegalArgumentException if household not found or bin lists mismatch
     * @throws IllegalStateException    if daily attempt limit is reached
     */
    @Transactional
    public Map<String, Object> submitSegregationAsync(
            List<MultipartFile> binImages,
            List<String> binTypes,
            Long householdId,
            double lat,
            double lng) throws Exception {

        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new IllegalArgumentException("Household not found: " + householdId));

        LocalDate today = LocalDate.now();
        long attemptsToday = segregationRepository.countByHouseholdAndSubmittedAtBetween(
                household,
                today.atStartOfDay(),
                today.atTime(23, 59, 59));

        if (attemptsToday >= 5) {
            throw new IllegalStateException("Maximum 5 attempts per day reached.");
        }

        if (binImages.size() != binTypes.size()) {
            throw new IllegalArgumentException(
                    "Number of images (" + binImages.size() +
                    ") does not match number of bin types (" + binTypes.size() + ").");
        }

        SegregationSubmission submission = new SegregationSubmission();
        submission.setHousehold(household);
        submission.setLat(lat);
        submission.setLng(lng);
        submission.setAttemptNumber((int) attemptsToday + 1);
        submission.setStatus(SubmissionStatus.PROCESSING);
        submission = segregationRepository.save(submission);

        final Long submissionId = submission.getId();

        // Read bytes eagerly — MultipartFile is request-scoped
        List<WasteAiService.ImagePayload> images = new ArrayList<>();
        for (int i = 0; i < binImages.size(); i++) {
            images.add(new WasteAiService.ImagePayload(
                    binImages.get(i).getBytes(), binTypes.get(i)));
        }

        processingService.processSubmission(
                submissionId, householdId, (int) attemptsToday + 1, images);

        return Map.of(
                "submissionId", submissionId,
                "status",       "PROCESSING",
                "message",      "Waste analysis started. Poll /api/v1/segregation/status/" + submissionId
        );
    }

    // ─────────────────────────────────────────────────────────
    // CITIZEN: Submit bin photos for daily segregation check
    // ─────────────────────────────────────────────────────────
    @Transactional
    public SegregationResponseDTO submitSegregation(
            List<MultipartFile> binImages,
            List<String> binTypes,
            Long householdId,
            Double lat,
            Double lng) throws IOException {

        // ── Guard 1: household exists ─────────────────────────
        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new RuntimeException("Household not found"));

        // ── Guard 2: max 5 attempts per day ──────────────────
        LocalDate today = LocalDate.now();
        long attemptsToday = segregationRepository
                .countByHouseholdAndSubmittedAtBetween(
                        household,
                        today.atStartOfDay(),
                        today.atTime(23, 59, 59));

        if (attemptsToday >= 5) {
            throw new RuntimeException(
                    "Maximum 5 attempts per day reached. " +
                            "A violation has been logged.");
        }

        // ── Guard 3: citizen GPS within 200m of home ─────────
        if (lat != null && lng != null
                && household.getLat() != null
                && household.getLng() != null) {
            double distance = trustService.haversine(
                    lat, lng, household.getLat(), household.getLng());
            if (distance > 0.2) {
                throw new RuntimeException(
                        "Location mismatch. Please submit " +
                                "from your registered household address.");
            }
        }

        // ── Guard 4: parallel lists must match ───────────────
        // If citizen sends 2 images but 3 bin type labels, data is corrupt
        if (binImages.size() != binTypes.size()) {
            throw new RuntimeException(
                    "Number of images (" + binImages.size() +
                            ") does not match number of bin types (" +
                            binTypes.size() + ").");
        }

        // ── Per-bin loop: save image + run AI ─────────────────
        String uploadDir = "uploads/segregation/";
        Files.createDirectories(Paths.get(uploadDir));

        // ── Parse and validate all bin types upfront ────────────────────────
        List<BinType> expectedTypes = new ArrayList<>();
        for (String rawType : binTypes) {
            try {
                expectedTypes.add(BinType.valueOf(rawType.toUpperCase().trim()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException(
                        "Invalid bin type: '" + rawType +
                                "'. Must be GREEN, BLUE, RED, or BLACK.");
            }
        }

        // ── Save images to disk and build payloads for batch AI call ─────────
        List<WasteAiService.ImagePayload> payloads = new ArrayList<>();
        List<String> imageFileNames = new ArrayList<>();
        for (int i = 0; i < binImages.size(); i++) {
            MultipartFile file = binImages.get(i);
            BinType expectedType = expectedTypes.get(i);
            String fileName = System.currentTimeMillis() + "_"
                    + expectedType.name() + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(),
                    Paths.get(uploadDir + fileName),
                    StandardCopyOption.REPLACE_EXISTING);
            imageFileNames.add(fileName);
            payloads.add(new WasteAiService.ImagePayload(
                    Files.readAllBytes(Paths.get(uploadDir + fileName)),
                    expectedType.name()));
        }

        // ── Single Ollama call for all 4 images ──────────────────────────────
        List<WasteAnalysis> aiResults = wasteAiService.analyzeAllBins(payloads);

        // ── Build BinAnalysis entities from AI results ───────────────────────
        List<BinAnalysis> binAnalyses = new ArrayList<>();
        for (int i = 0; i < binImages.size(); i++) {
            WasteAnalysis ai = (i < aiResults.size()) ? aiResults.get(i) : null;
            BinType expectedType = expectedTypes.get(i);

            BinAnalysis binAnalysis = new BinAnalysis();
            binAnalysis.setExpectedBinType(expectedType);
            binAnalysis.setImagePath(imageFileNames.get(i));

            if (ai != null) {
                binAnalysis.setDetectedBinType(parseBinType(ai.getDetectedBinType()));
                binAnalysis.setAiConfidence(ai.getConfidence());
                binAnalysis.setCorrectBinType(ai.isCorrectBinType());
                binAnalysis.setHasCrossContamination(ai.isHasCrossContamination());
                binAnalysis.setContaminationDetail(ai.getContaminationDetail());
                binAnalysis.setSuspicious(ai.isSuspicious());
                binAnalysis.setEmpty(ai.isEmpty());
                binAnalysis.setProperlyWrapped(ai.isProperlyWrapped());
            } else {
                // Model returned fewer results than images — treat as failed
                binAnalysis.setDetectedBinType(null);
                binAnalysis.setAiConfidence(0.0);
                binAnalysis.setCorrectBinType(false);
                binAnalysis.setAiConfidence(0.0);
            }
            binAnalyses.add(binAnalysis);
        }

        // ── Score all bins together ───────────────────────────
        SegregationScoringEngine.ScoringResult result =
                scoringEngine.evaluate(binAnalyses);

        // ── Build submission entity ───────────────────────────
        SegregationSubmission submission = new SegregationSubmission();
        submission.setHousehold(household);
        submission.setLat(lat);
        submission.setLng(lng);
        submission.setAttemptNumber((int) attemptsToday + 1);
        submission.setOverallScore(result.overallScore());
        submission.setFailureReason(result.failureReason());

        // Link each BinAnalysis back to this submission
        for (BinAnalysis bin : binAnalyses) {
            bin.setSubmission(submission);
        }
        submission.getBinAnalyses().addAll(binAnalyses);

        // ── Determine status and generate QR if passed ───────
        if (result.passed()) {
            submission.setStatus(SubmissionStatus.APPROVED);
            GreenQRToken qr = generateQRToken(submission, household);
            submission.setQrToken(qr);
        } else {
            // 5th failed attempt = FAILED (violation worthy)
            // 1st to 4th = PENDING_RETRY (citizen can try again)
            SubmissionStatus failStatus = (attemptsToday >= 4)
                    ? SubmissionStatus.FAILED
                    : SubmissionStatus.PENDING_RETRY;
            submission.setStatus(failStatus);
        }

        // ── Single save — CascadeType.ALL handles children ────
        // This saves: submission + all BinAnalysis + GreenQRToken
        // in ONE transaction. If anything fails, all rolls back.
        segregationRepository.save(submission);

        return mapToResponse(submission);
    }

    // ─────────────────────────────────────────────────────────
    // WORKER: Scan QR at household door
    // ─────────────────────────────────────────────────────────
    @Transactional
    public QRScanResponseDTO verifyAndConsumeQR(
            String tokenId,
            Long workerId,
            Double workerLat,
            Double workerLng) {

        WorkerPickupActionDTO action = confirmPickup(tokenId, workerId, workerLat, workerLng);
        return new QRScanResponseDTO(
                action.getStatus(), action.getHouseNumber(), "PICKUP_COMPLETED".equals(action.getStatus()), action.getMessage());
    }

    /**
     * Preview scan — returns full household details for worker to inspect.
     * Also runs the GPS proximity check (soft: informational only, never blocks pickup).
     * May write to Household (GPS lock) so annotated @Transactional (not readOnly).
     */
    @Transactional
    public WorkerScanDetailsDTO scanQR(String tokenId, Double workerLat, Double workerLng) {
        GreenQRToken token = qrTokenRepository.findById(tokenId)
                .orElseThrow(() -> new RuntimeException("QR token not found"));

        WorkerScanDetailsDTO dto = new WorkerScanDetailsDTO();
        dto.setTokenId(token.getToken());
        Household household = token.getHousehold();
        dto.setHouseNumber(household.getHouseNumber());

        // Validate token state (consumed / expired only — GPS never blocks)
        String validation = validationFailure(token, workerLat, workerLng);
        if (validation != null) {
            dto.setScanResult(validation);
            dto.setMessage(validationMessage(validation, token, workerLat, workerLng));
            return dto;
        }

        SegregationSubmission submission = token.getSubmission();
        dto.setScanResult("VALID");
        dto.setMessage("QR is valid and ready for doorstep verification.");
        dto.setSubmissionId(submission.getId());
        dto.setResidentName(household.getPrimaryResident() == null
                ? "Resident" : household.getPrimaryResident().getFullName());
        dto.setWard(household.getWard() == null ? "Assigned ward"
                : "Ward " + household.getWard().getWardNumber());
        dto.setOverallScore(submission.getOverallScore());
        dto.setSubmittedAt(submission.getSubmittedAt());
        dto.setExpiresAt(token.getExpiresAt());
        dto.setBinResults(submission.getBinAnalyses().stream().map(bin -> {
            BinResultDTO result = new BinResultDTO();
            result.setBinType(bin.getExpectedBinType().name());
            result.setPassed(bin.isPassed());
            result.setAiConfidence(bin.getAiConfidence());
            result.setContaminationDetail(bin.getContaminationDetail());
            result.setImagePath(bin.getImagePath());
            return result;
        }).collect(Collectors.toList()));

        // ── GPS Proximity Check (soft — informational only) ──────────────────
        if (workerLat != null && workerLng != null && workerLat != 0.0 && workerLng != 0.0) {
            applyGpsProximity(dto, household, workerLat, workerLng);
        } else {
            dto.setGpsStatus("NO_GPS");
            dto.setGpsLocked(household.isGpsLocked());
        }

        return dto;
    }

    @Transactional
    public WorkerPickupActionDTO confirmPickup(String tokenId, Long workerId, Double workerLat, Double workerLng) {
        return confirmPickup(tokenId, workerId, workerLat, workerLng, null, null);
    }

    /**
     * Confirms pickup, writes an audit {@link CollectionLog} row, and advances
     * the compliance streak.
     *
     * @param gpsStatus      the proximity decision from the preceding scanQR step
     *                       (WITHIN_RANGE / OUT_OF_RANGE / FIRST_VISIT_* / NO_GPS).
     *                       Persisted in CollectionLog for authority dashboard queries.
     * @param distanceMetres straight-line distance in metres at scan time; null if GPS was absent.
     */
    @Transactional
    public WorkerPickupActionDTO confirmPickup(
            String tokenId, Long workerId,
            Double workerLat, Double workerLng,
            String gpsStatus, Double distanceMetres) {

        GreenQRToken token = qrTokenRepository.findById(tokenId)
                .orElseThrow(() -> new RuntimeException("QR token not found"));
        String validation = validationFailure(token, workerLat, workerLng);
        if (validation != null) return action(validation, validationMessage(validation, token, workerLat, workerLng), token);

        // ── Mark QR token consumed ──────────────────────────────────────
        token.setConsumed(true);
        token.setConsumedAt(LocalDateTime.now());
        token.setConsumedByWorker(userRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker account not found")));
        token.setWorkerScanLat(workerLat != null ? workerLat : 0.0);
        token.setWorkerScanLng(workerLng != null ? workerLng : 0.0);
        qrTokenRepository.save(token);

        // ── Write full audit CollectionLog row ───────────────────────
        CollectionLog log = new CollectionLog();
        log.setHousehold(token.getHousehold());
        log.setMunicipality(token.getHousehold().getWard() != null
                ? token.getHousehold().getWard().getMunicipality() : null);
        log.setWorkerGpsLat(workerLat != null ? workerLat : 0.0);
        log.setWorkerGpsLng(workerLng != null ? workerLng : 0.0);
        log.setGpsStatus(gpsStatus);
        log.setDistanceMetres(distanceMetres);
        log.setQrToken(tokenId);
        log.setWorkerDecision(WorkerDecision.ACCEPTED);
        log.setCollectedAt(LocalDateTime.now());
        if (token.getSubmission() != null && token.getSubmission().getOverallScore() > 0) {
            log.setAiScoreSnapshot(java.math.BigDecimal.valueOf(token.getSubmission().getOverallScore()));
        }
        collectionLogRepository.save(log);

        // ── Advance compliance streak ───────────────────────────────
        updateStreak(token.getHousehold());

        return action("PICKUP_COMPLETED", "Pickup recorded and the household has been marked compliant.", token);
    }

    @Transactional
    public WorkerPickupActionDTO rejectPickup(
            String tokenId, Long workerId, Double workerLat, Double workerLng,
            String reason, String subReason, String remarks, List<MultipartFile> proofImages) throws IOException {
        if (reason == null || reason.isBlank()) throw new RuntimeException("A rejection reason is required.");
        if (proofImages == null || proofImages.isEmpty()) throw new RuntimeException("At least one proof photo is required.");
        GreenQRToken token = qrTokenRepository.findById(tokenId)
                .orElseThrow(() -> new RuntimeException("QR token not found"));
        String validation = validationFailure(token, workerLat, workerLng);
        if (validation != null) return action(validation, validationMessage(validation, token, workerLat, workerLng), token);

        List<String> savedPaths = new ArrayList<>();
        String uploadDir = "uploads/pickup-rejections/";
        Files.createDirectories(Paths.get(uploadDir));
        for (MultipartFile image : proofImages) {
            if (image.isEmpty()) continue;
            String safeName = image.getOriginalFilename() == null ? "proof" : image.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_");
            String fileName = UUID.randomUUID() + "_" + safeName;
            Files.copy(image.getInputStream(), Paths.get(uploadDir + fileName), StandardCopyOption.REPLACE_EXISTING);
            savedPaths.add("pickup-rejections/" + fileName);
        }
        if (savedPaths.isEmpty()) throw new RuntimeException("At least one valid proof photo is required.");

        token.setConsumed(true);
        token.setRejected(true);
        token.setRejectedAt(LocalDateTime.now());
        token.setConsumedByWorker(userRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker account not found")));
        token.setWorkerScanLat(workerLat);
        token.setWorkerScanLng(workerLng);
        token.setRejectionReason(reason.trim());
        token.setRejectionSubReason(subReason == null ? null : subReason.trim());
        token.setRejectionRemarks(remarks == null ? null : remarks.trim());
        token.setRejectionProofPaths(String.join(",", savedPaths));
        token.getSubmission().setStatus(SubmissionStatus.PICKUP_REJECTED);
        token.getSubmission().setFailureReason(reason.trim());
        qrTokenRepository.save(token);
        return action("PICKUP_REJECTED", "Submission rejected with evidence and sent for authority review.", token);
    }

    /**
     * GPS Proximity Check (soft — informational, never blocks pickup).
     *
     * Decision matrix:
     *  1. gpsLocked == true  → compare workerGPS vs gpsLockLat/Lng (worker-verified reference)
     *       ≤ 100m → WITHIN_RANGE
     *       > 100m → OUT_OF_RANGE (flagged, but pickup proceeds)
     *
     *  2. gpsLocked == false + household.lat/lng present (citizen registered GPS)
     *       ≤ 50m  → FIRST_VISIT_MATCHED  → lock GPS now (worker confirms citizen location)
     *       > 50m  → FIRST_VISIT_MISMATCH → do NOT lock, flag for admin review
     *
     *  3. gpsLocked == false + no registration GPS at all
     *       → FIRST_VISIT_NO_REG → worker GPS becomes the GPS lock
     */
    private void applyGpsProximity(WorkerScanDetailsDTO dto, Household household,
                                    double workerLat, double workerLng) {
        if (household.isGpsLocked()) {
            // ── Return visit: compare against locked GPS ─────────────────────
            double distM = trustService.haversine(
                    workerLat, workerLng,
                    household.getGpsLockLat(), household.getGpsLockLng()) * 1000;
            dto.setDistanceMetres(distM);
            dto.setGpsLocked(true);
            dto.setGpsStatus(distM <= 100 ? "WITHIN_RANGE" : "OUT_OF_RANGE");

        } else if (household.getLat() != null && household.getLng() != null) {
            // ── First visit: citizen had set GPS at registration ──────────────
            double distM = trustService.haversine(
                    workerLat, workerLng,
                    household.getLat(), household.getLng()) * 1000;
            dto.setDistanceMetres(distM);
            if (distM <= 50) {
                // Match — lock GPS using worker's coordinates
                household.setGpsLockLat(workerLat);
                household.setGpsLockLng(workerLng);
                household.setGpsLocked(true);
                householdRepository.save(household);
                dto.setGpsStatus("FIRST_VISIT_MATCHED");
            } else {
                // Mismatch — do not lock, flag for admin
                dto.setGpsStatus("FIRST_VISIT_MISMATCH");
            }
            dto.setGpsLocked(household.isGpsLocked());

        } else {
            // ── First visit: no registration GPS → worker becomes the reference ─
            household.setGpsLockLat(workerLat);
            household.setGpsLockLng(workerLng);
            household.setGpsLocked(true);
            householdRepository.save(household);
            dto.setGpsStatus("FIRST_VISIT_NO_REG");
            dto.setGpsLocked(true);
        }
    }

    private String validationFailure(GreenQRToken token, Double workerLat, Double workerLng) {
        if (token.isConsumed()) return token.isRejected() ? "ALREADY_REJECTED" : "ALREADY_USED";
        if (LocalDateTime.now().isAfter(token.getExpiresAt())) return "EXPIRED";
        // GPS is now soft (informational only) — proximity never blocks pickup.
        return null;
    }

    private String validationMessage(String status, GreenQRToken token, Double workerLat, Double workerLng) {
        return switch (status) {
            case "ALREADY_REJECTED" -> "This submission has already been rejected and sent for review.";
            case "ALREADY_USED"     -> "This QR has already been used for collection.";
            case "EXPIRED"          -> "This QR expired at " + token.getExpiresAt() + ".";
            default                 -> "This QR cannot be verified right now.";
        };
    }

    private WorkerPickupActionDTO action(String status, String message, GreenQRToken token) {
        WorkerPickupActionDTO dto = new WorkerPickupActionDTO();
        dto.setStatus(status);
        dto.setMessage(message);
        dto.setHouseNumber(token.getHousehold().getHouseNumber());
        dto.setCompletedAt(LocalDateTime.now());
        return dto;
    }

    // ─────────────────────────────────────────────────────────
    // QUERY: Get QR for a specific submission (for GET /qr/{id})
    // ─────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public SegregationResponseDTO getQRForSubmission(Long submissionId) {
        SegregationSubmission submission = segregationRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException(
                        "Submission not found with ID: " + submissionId));
        return mapToResponse(submission);
    }

    // ─────────────────────────────────────────────────────────
    // QUERY: Get submission history for a household
    // ─────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<SegregationResponseDTO> getHistoryForHousehold(
            Long householdId) {
        return segregationRepository
                .findByHousehold_HouseholdIdOrderBySubmittedAtDesc(householdId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────
    // PRIVATE: QR token generation
    // ─────────────────────────────────────────────────────────
    private GreenQRToken generateQRToken(
            SegregationSubmission submission,
            Household household) {

        GreenQRToken token = new GreenQRToken();
        token.setToken(UUID.randomUUID().toString());
        token.setSubmission(submission);
        token.setHousehold(household);
        token.setIssuedAt(LocalDateTime.now());

        // Expires at 2 PM today (end of collection window)
        // If submitted after 2 PM, extend to 9 AM tomorrow
        LocalDateTime twopmToday = LocalDate.now().atTime(14, 0);
        LocalDateTime expiry = LocalDateTime.now().isAfter(twopmToday)
                ? LocalDate.now().plusDays(1).atTime(9, 0)
                : twopmToday;
        token.setExpiresAt(expiry);

        return token;
    }

    // ─────────────────────────────────────────────────────────
    // PRIVATE: Generate Base64 QR image from token UUID
    // ─────────────────────────────────────────────────────────
    private String generateQRCodeBase64(String tokenText) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(
                    tokenText, BarcodeFormat.QR_CODE, 250, 250);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            return Base64.getEncoder()
                    .encodeToString(out.toByteArray());
        } catch (Exception e) {
            // QR image failure should not fail the whole response
            // Token UUID is still returned — frontend can regenerate
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────
    // PRIVATE: Entity → DTO mapping
    // ─────────────────────────────────────────────────────────
    private SegregationResponseDTO mapToResponse(
            SegregationSubmission submission) {
        SegregationResponseDTO dto = new SegregationResponseDTO();
        dto.setSubmissionId(submission.getId());
        dto.setStatus(submission.getStatus().name());
        dto.setOverallScore(submission.getOverallScore());
        dto.setFailureReason(submission.getFailureReason());
        dto.setAttemptNumber(submission.getAttemptNumber());
        dto.setSubmittedAt(submission.getSubmittedAt());

        if (submission.getQrToken() != null) {
            dto.setQrToken(submission.getQrToken().getToken());
            dto.setQrExpiresAt(submission.getQrToken().getExpiresAt());
            dto.setQrCodeBase64(
                    generateQRCodeBase64(submission.getQrToken().getToken()));
        }

        // Include per-bin results so citizen sees which bin failed
        if (submission.getBinAnalyses() != null) {
            List<BinResultDTO> binResults = submission.getBinAnalyses()
                    .stream()
                    .map(bin -> {
                        BinResultDTO b = new BinResultDTO();
                        b.setBinType(bin.getExpectedBinType().name());
                        b.setPassed(bin.isPassed());
                        b.setAiConfidence(bin.getAiConfidence());
                        b.setContaminationDetail(bin.getContaminationDetail());
                        return b;
                    })
                    .collect(Collectors.toList());
            dto.setBinResults(binResults);
        }

        return dto;
    }

    // ─────────────────────────────────────────────────────────
    // PRIVATE: Parse AI string to BinType enum safely
    // ─────────────────────────────────────────────────────────
    private BinType parseBinType(String raw) {
        if (raw == null) return null;
        try {
            return BinType.valueOf(raw.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            return null; // UNKNOWN from AI → null → skips mismatch check
        }
    }

    // ─────────────────────────────────────────────────────────
    // PRIVATE: Update or lazily create ComplianceStreak
    // Called only after a QR token is successfully consumed.
    // ─────────────────────────────────────────────────────────
    private void updateStreak(Household household) {
        ComplianceStreak streak = streakRepository
                .findByHousehold(household)
                .orElseGet(() -> {
                    // First-ever verified submission for this household
                    ComplianceStreak newStreak = new ComplianceStreak();
                    newStreak.setHousehold(household);
                    return newStreak;
                });

        LocalDate today = LocalDate.now();
        LocalDate last = streak.getLastGreenDate();

        // If last green day was yesterday → extend streak; otherwise reset to 1
        if (last != null && last.equals(today.minusDays(1))) {
            streak.setCurrentStreak(streak.getCurrentStreak() + 1);
        } else if (last != null && last.equals(today)) {
            // Already updated today (duplicate scan guard — do not double-count)
            return;
        } else {
            // Streak broken — reset
            streak.setCurrentStreak(1);
        }

        // Update all-time longest streak
        if (streak.getCurrentStreak() > streak.getLongestStreak()) {
            streak.setLongestStreak(streak.getCurrentStreak());
        }

        streak.setTotalGreenDays(streak.getTotalGreenDays() + 1);
        streak.setLastGreenDate(today);
        streak.setLastUpdatedAt(LocalDateTime.now());

        // Fine immunity reward: 30 consecutive green days → 30-day immunity window
        if (streak.getCurrentStreak() >= 30) {
            streak.setFineImmunityUntil(today.plusDays(30));
        }

        streakRepository.save(streak);
    }
}
