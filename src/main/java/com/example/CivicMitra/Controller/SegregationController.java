package com.example.CivicMitra.Controller;

import com.example.CivicMitra.DTO.QRScanResponseDTO;
import com.example.CivicMitra.DTO.SegregationResponseDTO;
import com.example.CivicMitra.DTO.WorkerPickupActionDTO;
import com.example.CivicMitra.DTO.WorkerScanDetailsDTO;
import com.example.CivicMitra.Enums.SubmissionStatus;
import com.example.CivicMitra.Repository.HouseholdRepository;
import com.example.CivicMitra.Repository.SegregationRepository;
import com.example.CivicMitra.Service.SegregationProcessingService;
import com.example.CivicMitra.Service.SegregationService;
import com.example.CivicMitra.Ai.service.WasteAiService;
import com.example.CivicMitra.model.segregation.SegregationSubmission;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * REST controller for the segregation flow.
 *
 * NEW async submit flow:
 *  POST /api/v1/segregation/submit       → returns 202 immediately with submissionId
 *  GET  /api/v1/segregation/status/{id}  → citizen polls until status != PROCESSING
 *
 * Existing synchronous endpoints (QR verify, worker scan/pickup) are unchanged.
 */
@RestController
@RequestMapping("/api/v1/segregation")
public class SegregationController {

    private final SegregationService segregationService;
    private final SegregationProcessingService processingService;
    private final SegregationRepository submissionRepository;
    private final HouseholdRepository householdRepository;

    public SegregationController(SegregationService segregationService,
                                 SegregationProcessingService processingService,
                                 SegregationRepository submissionRepository,
                                 HouseholdRepository householdRepository) {
        this.segregationService = segregationService;
        this.processingService = processingService;
        this.submissionRepository = submissionRepository;
        this.householdRepository = householdRepository;
    }

    // ─────────────────────────────────────────────────────────────────────
    // CITIZEN: Async submission — returns 202 immediately
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Accepts 4 bin images, persists a PROCESSING submission, fires async AI,
     * and returns 202 ACCEPTED with the submissionId so the frontend can poll.
     */
    @PostMapping(value = "/submit", consumes = "multipart/form-data")
    public ResponseEntity<?> submitSegregation(
            @RequestParam("binImages") List<MultipartFile> binImages,
            @RequestParam("binTypes")  List<String> binTypes,
            @RequestParam("householdId") Long householdId,
            @RequestParam("lat") double lat,
            @RequestParam("lng") double lng
    ) {
        try {
            // ── Validate household exists before persisting ────────────────
            householdRepository.findById(householdId)
                    .orElseThrow(() -> new RuntimeException("Household not found: " + householdId));

            // ── Count today's attempts for this household ──────────────────
            LocalDate today = LocalDate.now();
            long attemptsToday = submissionRepository.countByHouseholdAndSubmittedAtBetween(
                    householdRepository.findById(householdId).get(),
                    today.atStartOfDay(),
                    today.atTime(23, 59, 59));

            if (attemptsToday >= 5) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Maximum 5 attempts per day reached."
                ));
            }

            // ── Validate image/binType lists match ─────────────────────────
            if (binImages.size() != binTypes.size()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Number of images (" + binImages.size() +
                                 ") does not match number of bin types (" + binTypes.size() + ")."
                ));
            }

            // ── Persist submission immediately with PROCESSING status ───────
            SegregationSubmission submission = new SegregationSubmission();
            submission.setHousehold(householdRepository.findById(householdId).get());
            submission.setLat(lat);
            submission.setLng(lng);
            submission.setAttemptNumber((int) attemptsToday + 1);
            submission.setStatus(SubmissionStatus.PROCESSING);
            submission = submissionRepository.save(submission);

            final Long submissionId = submission.getId();

            // ── Build image payloads (read bytes eagerly — MultipartFile is
            //    request-scoped and won't survive the async thread handoff) ──
            List<WasteAiService.ImagePayload> images = new ArrayList<>();
            for (int i = 0; i < binImages.size(); i++) {
                images.add(new WasteAiService.ImagePayload(
                        binImages.get(i).getBytes(),
                        binTypes.get(i)
                ));
            }

            // ── Fire async AI processing (non-blocking) ────────────────────
            processingService.processSubmission(
                    submissionId,
                    householdId,
                    (int) attemptsToday + 1,
                    images
            );

            // ── Return 202 immediately ──────────────────────────────────────
            return ResponseEntity.accepted().body(Map.of(
                    "submissionId", submissionId,
                    "status",       "PROCESSING",
                    "message",      "Waste analysis started. Poll /api/v1/segregation/status/" + submissionId
            ));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error submitting: " + e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // CITIZEN: Poll for submission result
    // ─────────────────────────────────────────────────────────────────────

    @GetMapping("/status/{submissionId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getSubmissionStatus(@PathVariable Long submissionId) {
        SegregationSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found: " + submissionId));

        return switch (submission.getStatus()) {

            case APPROVED -> ResponseEntity.ok(segregationService.getQRForSubmission(submissionId));

            case PENDING_RETRY -> ResponseEntity.ok(Map.of(
                    "status",       "PENDING_RETRY",
                    "submissionId", submissionId,
                    "failureReason", submission.getFailureReason() != null
                                        ? submission.getFailureReason()
                                        : "One or more bins failed verification.",
                    "message", "Some bins failed. Please correct and resubmit."
            ));

            case FAILED -> ResponseEntity.ok(Map.of(
                    "status",       "FAILED",
                    "submissionId", submissionId,
                    "failureReason", submission.getFailureReason() != null
                                        ? submission.getFailureReason()
                                        : "All 5 daily attempts failed.",
                    "message", "All attempts exhausted. A violation has been logged."
            ));

            case PROCESSING_FAILED -> ResponseEntity.ok(Map.of(
                    "status",   "PROCESSING_FAILED",
                    "submissionId", submissionId,
                    "message",  submission.getErrorMessage() != null
                                    ? submission.getErrorMessage()
                                    : "AI analysis failed. Please retry later."
            ));

            // PROCESSING or any other transient state
            default -> ResponseEntity.ok(Map.of(
                    "status",       "PROCESSING",
                    "submissionId", submissionId,
                    "message",      "AI analysis in progress. Check back in a few seconds."
            ));
        };
    }

    // ─────────────────────────────────────────────────────────────────────
    // CITIZEN: Get full QR details for a specific submission
    // ─────────────────────────────────────────────────────────────────────

    @GetMapping("/qr/{submissionId}")
    public ResponseEntity<?> getQRForSubmission(@PathVariable Long submissionId) {
        try {
            SegregationResponseDTO response = segregationService.getQRForSubmission(submissionId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", "Submission not found: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error fetching QR: " + e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // CITIZEN: Submission history for a household
    // ─────────────────────────────────────────────────────────────────────

    @GetMapping("/history/{householdId}")
    public ResponseEntity<List<SegregationResponseDTO>> getSegregationHistory(
            @PathVariable Long householdId) {
        try {
            List<SegregationResponseDTO> history = segregationService.getHistoryForHousehold(householdId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // WORKER: Verify & consume QR (legacy combined endpoint)
    // ─────────────────────────────────────────────────────────────────────

    @PostMapping("/verify-qr")
    public ResponseEntity<QRScanResponseDTO> verifyQR(
            @RequestParam("tokenId")    String tokenId,
            @RequestParam("workerId")   Long workerId,
            @RequestParam("workerLat")  double workerLat,
            @RequestParam("workerLng")  double workerLng
    ) {
        try {
            QRScanResponseDTO response = segregationService.verifyAndConsumeQR(
                    tokenId, workerId, workerLat, workerLng);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // WORKER: Scan QR (preview before confirm/reject)
    // ─────────────────────────────────────────────────────────────────────

    @PostMapping("/scan-qr")
    public ResponseEntity<WorkerScanDetailsDTO> scanQR(
            @RequestParam("tokenId")    String tokenId,
            @RequestParam("workerLat")  double workerLat,
            @RequestParam("workerLng")  double workerLng
    ) {
        return ResponseEntity.ok(segregationService.scanQR(tokenId, workerLat, workerLng));
    }

    // ─────────────────────────────────────────────────────────────────────
    // WORKER: Confirm pickup
    // ─────────────────────────────────────────────────────────────────────

    @PostMapping("/confirm-pickup")
    public ResponseEntity<WorkerPickupActionDTO> confirmPickup(
            @RequestParam("tokenId")   String tokenId,
            @RequestParam("workerId")  Long workerId,
            @RequestParam("workerLat") double workerLat,
            @RequestParam("workerLng") double workerLng
    ) {
        return ResponseEntity.ok(
                segregationService.confirmPickup(tokenId, workerId, workerLat, workerLng));
    }

    // ─────────────────────────────────────────────────────────────────────
    // WORKER: Reject pickup with proof photos
    // ─────────────────────────────────────────────────────────────────────

    @PostMapping(value = "/reject-pickup", consumes = "multipart/form-data")
    public ResponseEntity<WorkerPickupActionDTO> rejectPickup(
            @RequestParam("tokenId")                          String tokenId,
            @RequestParam("workerId")                         Long workerId,
            @RequestParam("workerLat")                        double workerLat,
            @RequestParam("workerLng")                        double workerLng,
            @RequestParam("reason")                           String reason,
            @RequestParam(value = "subReason", required = false)  String subReason,
            @RequestParam(value = "remarks",   required = false)  String remarks,
            @RequestParam(value = "proofImages", required = false) List<MultipartFile> proofImages
    ) throws Exception {
        return ResponseEntity.ok(
                segregationService.rejectPickup(
                        tokenId, workerId, workerLat, workerLng,
                        reason, subReason, remarks, proofImages));
    }
}