package com.example.CivicMitra.Controller;

import com.example.CivicMitra.DTO.QRScanResponseDTO;
import com.example.CivicMitra.DTO.SegregationResponseDTO;
import com.example.CivicMitra.DTO.WorkerPickupActionDTO;
import com.example.CivicMitra.DTO.WorkerScanDetailsDTO;
import com.example.CivicMitra.Enums.SubmissionStatus;
import com.example.CivicMitra.Service.SegregationDraftService;
import com.example.CivicMitra.Service.SegregationService;
import com.example.CivicMitra.model.segregation.SegregationSubmission;
import com.example.CivicMitra.Repository.SegregationRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * REST controller for the segregation flow.
 *
 * This controller is intentionally thin — it handles HTTP concerns only
 * (parameter binding, status codes, exception → HTTP status mapping).
 * All business logic lives in {@link SegregationService} and
 * {@link SegregationDraftService}.
 *
 * Draft (per-bin) flow:
 *  POST /draft/start           → create DRAFT, returns draftId
 *  POST /draft/{id}/add-bin    → add one bin image
 *  POST /draft/{id}/finalize   → trigger async AI, returns 202
 *
 * Legacy batch flow (backward-compatible):
 *  POST /submit                → all bins at once, returns 202
 *
 * Polling:
 *  GET  /status/{id}           → citizen polls until status != PROCESSING
 */
@RestController
@RequestMapping("/api/v1/segregation")
public class SegregationController {

    private final SegregationService segregationService;
    private final SegregationDraftService draftService;
    private final SegregationRepository submissionRepository;

    public SegregationController(SegregationService segregationService,
                                 SegregationDraftService draftService,
                                 SegregationRepository submissionRepository) {
        this.segregationService   = segregationService;
        this.draftService         = draftService;
        this.submissionRepository = submissionRepository;
    }

    // ─────────────────────────────────────────────────────────────────────
    // CITIZEN: Per-bin draft flow
    // ─────────────────────────────────────────────────────────────────────

    /** Step 1 — Creates an empty DRAFT submission. */
    @PostMapping("/draft/start")
    public ResponseEntity<?> startDraft(
            @RequestParam("householdId") Long householdId,
            @RequestParam("lat")         double lat,
            @RequestParam("lng")         double lng
    ) {
        try {
            return ResponseEntity.ok(draftService.startDraft(householdId, lat, lng));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error starting draft: " + e.getMessage()));
        }
    }

    /** Step 2 — Adds one bin image to an open DRAFT. */
    @PostMapping(value = "/draft/{draftId}/add-bin", consumes = "multipart/form-data")
    public ResponseEntity<?> addBinToDraft(
            @PathVariable            Long          draftId,
            @RequestParam("binType") String        binType,
            @RequestParam("binImage") MultipartFile binImage
    ) {
        try {
            return ResponseEntity.ok(draftService.addBin(draftId, binType, binImage));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error adding bin: " + e.getMessage()));
        }
    }

    /** Step 3 — Finalizes the draft and kicks off async AI analysis. */
    @PostMapping("/draft/{draftId}/finalize")
    public ResponseEntity<?> finalizeDraft(@PathVariable Long draftId) {
        try {
            return ResponseEntity.accepted().body(draftService.finalizeDraft(draftId));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error finalizing draft: " + e.getMessage()));
        }
    }

    @Value("${civicmitra.ai.demo-mode:false}")
    private boolean demoMode;

    @GetMapping("/debug/demo")
    public String checkDemo() {
        return "demoMode=" + demoMode;
    }

    // ─────────────────────────────────────────────────────────────────────
    // CITIZEN: Legacy batch submission (backward-compatible)
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Accepts all bin images in a single request.
     * Kept for backward compatibility; new clients should prefer the /draft flow.
     */
    @PostMapping(value = "/submit", consumes = "multipart/form-data")
    public ResponseEntity<?> submitSegregation(
            @RequestParam("binImages")   List<MultipartFile> binImages,
            @RequestParam("binTypes")    List<String>        binTypes,
            @RequestParam("householdId") Long                householdId,
            @RequestParam("lat")         double              lat,
            @RequestParam("lng")         double              lng
    ) {
        try {
            return ResponseEntity.accepted()
                    .body(segregationService.submitSegregationAsync(binImages, binTypes, householdId, lat, lng));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
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

            case APPROVED -> ResponseEntity.ok(
                    segregationService.getQRForSubmission(submissionId));

            case PENDING_RETRY -> ResponseEntity.ok(Map.of(
                    "status",        "PENDING_RETRY",
                    "submissionId",  submissionId,
                    "failureReason", submission.getFailureReason() != null
                                        ? submission.getFailureReason()
                                        : "One or more bins failed verification.",
                    "message",       "Some bins failed. Please correct and resubmit."
            ));

            case FAILED -> ResponseEntity.ok(Map.of(
                    "status",        "FAILED",
                    "submissionId",  submissionId,
                    "failureReason", submission.getFailureReason() != null
                                        ? submission.getFailureReason()
                                        : "All 5 daily attempts failed.",
                    "message",       "All attempts exhausted. A violation has been logged."
            ));

            case PROCESSING_FAILED -> ResponseEntity.ok(Map.of(
                    "status",       "PROCESSING_FAILED",
                    "submissionId", submissionId,
                    "message",      submission.getErrorMessage() != null
                                        ? submission.getErrorMessage()
                                        : "AI analysis failed. Please retry later."
            ));

            case DRAFT -> ResponseEntity.ok(draftService.getDraftStatus(submissionId));

            default -> ResponseEntity.ok(Map.of(
                    "status",       "PROCESSING",
                    "submissionId", submissionId,
                    "message",      "AI analysis in progress. Check back in a few seconds."
            ));
        };
    }

    // ─────────────────────────────────────────────────────────────────────
    // CITIZEN: QR details & history
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

    @GetMapping("/history/{householdId}")
    public ResponseEntity<List<SegregationResponseDTO>> getSegregationHistory(
            @PathVariable Long householdId) {
        try {
            return ResponseEntity.ok(segregationService.getHistoryForHousehold(householdId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // WORKER: QR verify / scan / confirm / reject
    // ─────────────────────────────────────────────────────────────────────

    @PostMapping("/verify-qr")
    public ResponseEntity<QRScanResponseDTO> verifyQR(
            @RequestParam("tokenId")   String tokenId,
            @RequestParam("workerId")  Long   workerId,
            @RequestParam("workerLat") double workerLat,
            @RequestParam("workerLng") double workerLng
    ) {
        try {
            return ResponseEntity.ok(
                    segregationService.verifyAndConsumeQR(tokenId, workerId, workerLat, workerLng));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    @PostMapping("/scan-qr")
    public ResponseEntity<WorkerScanDetailsDTO> scanQR(
            @RequestParam("tokenId")   String tokenId,
            @RequestParam("workerLat") double workerLat,
            @RequestParam("workerLng") double workerLng
    ) {
        return ResponseEntity.ok(segregationService.scanQR(tokenId, workerLat, workerLng));
    }

    @PostMapping("/confirm-pickup")
    public ResponseEntity<WorkerPickupActionDTO> confirmPickup(
            @RequestParam("tokenId")                               String tokenId,
            @RequestParam("workerId")                              Long   workerId,
            @RequestParam("workerLat")                             double workerLat,
            @RequestParam("workerLng")                             double workerLng,
            @RequestParam(value = "gpsStatus",      required = false) String gpsStatus,
            @RequestParam(value = "distanceMetres", required = false) Double distanceMetres
    ) {
        return ResponseEntity.ok(
                segregationService.confirmPickup(
                        tokenId, workerId, workerLat, workerLng,
                        gpsStatus, distanceMetres));
    }

    @PostMapping(value = "/reject-pickup", consumes = "multipart/form-data")
    public ResponseEntity<WorkerPickupActionDTO> rejectPickup(
            @RequestParam("tokenId")                              String              tokenId,
            @RequestParam("workerId")                             Long                workerId,
            @RequestParam("workerLat")                            double              workerLat,
            @RequestParam("workerLng")                            double              workerLng,
            @RequestParam("reason")                               String              reason,
            @RequestParam(value = "subReason",   required = false) String             subReason,
            @RequestParam(value = "remarks",     required = false) String             remarks,
            @RequestParam(value = "proofImages", required = false) List<MultipartFile> proofImages
    ) throws Exception {
        return ResponseEntity.ok(
                segregationService.rejectPickup(
                        tokenId, workerId, workerLat, workerLng,
                        reason, subReason, remarks, proofImages));
    }
}