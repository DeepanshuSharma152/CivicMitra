package com.example.CivicMitra.model.segregation;


import com.example.CivicMitra.Ai.response.WasteAnalysis;
import com.example.CivicMitra.Ai.service.WasteAiService;
import com.example.CivicMitra.DTO.BinResultDTO;
import com.example.CivicMitra.DTO.QRScanResponseDTO;
import com.example.CivicMitra.DTO.SegregationResponseDTO;
import com.example.CivicMitra.DTO.WorkerPickupActionDTO;
import com.example.CivicMitra.DTO.WorkerScanDetailsDTO;
import com.example.CivicMitra.Enums.BinType;
import com.example.CivicMitra.Enums.SubmissionStatus;
import com.example.CivicMitra.Repository.GreenQRTokenRepository;
import com.example.CivicMitra.Repository.HouseholdRepository;
import com.example.CivicMitra.Repository.SegregationRepository;
import com.example.CivicMitra.Repository.UserRepository;
import com.example.CivicMitra.Service.TrustService;

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
    private final UserRepository userRepository;

    public SegregationService(SegregationRepository segregationRepository,
                              HouseholdRepository householdRepository,
                              GreenQRTokenRepository qrTokenRepository,
                              WasteAiService wasteAiService,
                              SegregationScoringEngine scoringEngine,
                              TrustService trustService,
                              UserRepository userRepository) {
        this.segregationRepository = segregationRepository;
        this.householdRepository = householdRepository;
        this.qrTokenRepository = qrTokenRepository;
        this.wasteAiService = wasteAiService;
        this.scoringEngine = scoringEngine;
        this.trustService = trustService;
        this.userRepository = userRepository;
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

        // ── Guard 2: max 3 attempts per day ──────────────────
        LocalDate today = LocalDate.now();
        long attemptsToday = segregationRepository
                .countByHouseholdAndSubmittedAtBetween(
                        household,
                        today.atStartOfDay(),
                        today.atTime(23, 59, 59));

        if (attemptsToday >= 3) {
            throw new RuntimeException(
                    "Maximum 3 attempts per day reached. " +
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

        List<BinAnalysis> binAnalyses = new ArrayList<>();

        for (int i = 0; i < binImages.size(); i++) {
            MultipartFile file = binImages.get(i);
            BinType expectedType;

            // Parse bin type safely — bad input shouldn't crash server
            try {
                expectedType = BinType.valueOf(binTypes.get(i).toUpperCase().trim());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException(
                        "Invalid bin type: '" + binTypes.get(i) +
                                "'. Must be GREEN, BLUE, RED, or BLACK.");
            }

            // Save image to disk
            String fileName = System.currentTimeMillis() + "_"
                    + expectedType.name() + "_"
                    + file.getOriginalFilename();
            Files.copy(file.getInputStream(),
                    Paths.get(uploadDir + fileName),
                    StandardCopyOption.REPLACE_EXISTING);

            // AI analysis — each bin photo analyzed independently
            WasteAnalysis ai = wasteAiService.analyzeWasteImage(
                    file.getBytes());

            // Build BinAnalysis entity from AI response
            BinAnalysis binAnalysis = new BinAnalysis();
            binAnalysis.setExpectedBinType(expectedType);
            binAnalysis.setDetectedBinType(parseBinType(ai.detectedBinType()));
            binAnalysis.setImagePath(fileName);
            binAnalysis.setAiConfidence(ai.confidence());
            binAnalysis.setCorrectBinType(ai.isCorrectBinType());
            binAnalysis.setHasCrossContamination(ai.hasCrossContamination());
            binAnalysis.setContaminationDetail(ai.contaminationDetail());
            binAnalysis.setSuspicious(ai.isSuspicious());
            binAnalysis.setEmpty(ai.isEmpty());
            binAnalysis.setProperlyWrapped(ai.isProperlyWrapped());
            // submission link set after submission entity is built
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
            // 3rd failed attempt = FAILED (violation worthy)
            // 1st or 2nd = PENDING_RETRY (citizen can try again)
            SubmissionStatus failStatus = (attemptsToday >= 2)
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

    @Transactional(readOnly = true)
    public WorkerScanDetailsDTO scanQR(String tokenId, Double workerLat, Double workerLng) {
        GreenQRToken token = qrTokenRepository.findById(tokenId)
                .orElseThrow(() -> new RuntimeException("QR token not found"));
        WorkerScanDetailsDTO dto = new WorkerScanDetailsDTO();
        dto.setTokenId(token.getToken());
        dto.setHouseNumber(token.getHousehold().getHouseNumber());

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
        dto.setResidentName(token.getHousehold().getPrimaryResident() == null
                ? "Resident" : token.getHousehold().getPrimaryResident().getFullName());
        dto.setWard(token.getHousehold().getWard() == null ? "Assigned ward"
                : "Ward " + token.getHousehold().getWard().getWardNumber());
        dto.setOverallScore(submission.getOverallScore());
        dto.setSubmittedAt(submission.getSubmittedAt());
        dto.setExpiresAt(token.getExpiresAt());
        dto.setBinResults(submission.getBinAnalyses().stream().map(bin -> {
            BinResultDTO result = new BinResultDTO();
            result.setBinType(bin.getExpectedBinType().name());
            result.setPassed(bin.isPassed());
            result.setAiConfidence(bin.getAiConfidence());
            result.setContaminationDetail(bin.getContaminationDetail());
            return result;
        }).collect(Collectors.toList()));
        return dto;
    }

    @Transactional
    public WorkerPickupActionDTO confirmPickup(String tokenId, Long workerId, Double workerLat, Double workerLng) {
        GreenQRToken token = qrTokenRepository.findById(tokenId)
                .orElseThrow(() -> new RuntimeException("QR token not found"));
        String validation = validationFailure(token, workerLat, workerLng);
        if (validation != null) return action(validation, validationMessage(validation, token, workerLat, workerLng), token);

        token.setConsumed(true);
        token.setConsumedAt(LocalDateTime.now());
        token.setConsumedByWorker(userRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker account not found")));
        token.setWorkerScanLat(workerLat);
        token.setWorkerScanLng(workerLng);
        qrTokenRepository.save(token);
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

    private String validationFailure(GreenQRToken token, Double workerLat, Double workerLng) {
        if (token.isConsumed()) return token.isRejected() ? "ALREADY_REJECTED" : "ALREADY_USED";
        if (LocalDateTime.now().isAfter(token.getExpiresAt())) return "EXPIRED";
        Household household = token.getHousehold();
        if (workerLat != null && workerLng != null && household.getLat() != null && household.getLng() != null) {
            double distance = trustService.haversine(workerLat, workerLng, household.getLat(), household.getLng());
            if (distance > 0.05) return "GPS_MISMATCH";
        }
        return null;
    }

    private String validationMessage(String status, GreenQRToken token, Double workerLat, Double workerLng) {
        return switch (status) {
            case "ALREADY_REJECTED" -> "This submission has already been rejected and sent for review.";
            case "ALREADY_USED" -> "This QR has already been used for collection.";
            case "EXPIRED" -> "This QR expired at " + token.getExpiresAt() + ".";
            case "GPS_MISMATCH" -> "You need to be within 50 metres of the household to validate this pickup.";
            default -> "This QR cannot be verified right now.";
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
}
