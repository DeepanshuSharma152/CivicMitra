package com.example.CivicMitra.Service;

import com.example.CivicMitra.Ai.service.WasteAiService;
import com.example.CivicMitra.DTO.DraftSubmissionResponseDTO;
import com.example.CivicMitra.Enums.BinType;
import com.example.CivicMitra.Enums.SubmissionStatus;
import com.example.CivicMitra.Repository.DraftBinImageRepository;
import com.example.CivicMitra.Repository.HouseholdRepository;
import com.example.CivicMitra.Repository.SegregationRepository;
import com.example.CivicMitra.model.segregation.DraftBinImage;
import com.example.CivicMitra.model.segregation.Household;
import com.example.CivicMitra.model.segregation.SegregationSubmission;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Owns all business logic for the per-bin draft upload flow:
 *   startDraft → addBin → finalizeDraft
 *
 * The controller is intentionally kept thin — it only handles HTTP
 * concerns (parameter binding, status codes) and delegates everything here.
 */
@Service
public class SegregationDraftService {

    /** Bins that must be present before a draft can be finalized. */
    private static final Set<String> MANDATORY_BINS = Set.of("GREEN", "BLUE");

    private final SegregationRepository submissionRepository;
    private final HouseholdRepository householdRepository;
    private final DraftBinImageRepository draftBinImageRepository;
    private final SegregationProcessingService processingService;

    public SegregationDraftService(SegregationRepository submissionRepository,
                                   HouseholdRepository householdRepository,
                                   DraftBinImageRepository draftBinImageRepository,
                                   SegregationProcessingService processingService) {
        this.submissionRepository   = submissionRepository;
        this.householdRepository    = householdRepository;
        this.draftBinImageRepository = draftBinImageRepository;
        this.processingService      = processingService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 1 — Start a new draft
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Creates a DRAFT submission for the given household.
     * Validates the household exists and the daily attempt limit has not been reached.
     *
     * @throws IllegalArgumentException if the household is not found
     * @throws IllegalStateException    if the daily attempt limit (5) is reached
     */
    @Transactional
    public DraftSubmissionResponseDTO startDraft(Long householdId, double lat, double lng) {
        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new IllegalArgumentException("Household not found: " + householdId));

        int attemptNumber = validateAndGetAttemptNumber(household);

        SegregationSubmission draft = new SegregationSubmission();
        draft.setHousehold(household);
        draft.setLat(lat);
        draft.setLng(lng);
        draft.setAttemptNumber(attemptNumber);
        draft.setStatus(SubmissionStatus.DRAFT);
        draft = submissionRepository.save(draft);

        return buildDraftResponse(draft.getId(), List.of());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 2 — Add one bin image to an open draft
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Validates the bin type, stores the image, and returns the updated draft state.
     * If the citizen re-uploads the same bin type, the previous record is replaced.
     *
     * @throws IllegalArgumentException if the draft is not found, is not in DRAFT
     *                                  status, or the bin type is unrecognised
     * @throws IOException              if reading the MultipartFile bytes fails
     */
    @Transactional
    public DraftSubmissionResponseDTO addBin(Long draftId, String binType, MultipartFile binImage)
            throws IOException {

        SegregationSubmission draft = requireOpenDraft(draftId);

        String normalizedBinType = validateBinType(binType);

        // Remove previous image for this bin type (citizen retook photo)
        draftBinImageRepository
                .findBySubmission_IdOrderByAddedAtAsc(draftId)
                .stream()
                .filter(d -> d.getBinType().equals(normalizedBinType))
                .forEach(draftBinImageRepository::delete);

        DraftBinImage draftBin = new DraftBinImage();
        draftBin.setSubmission(draft);
        draftBin.setBinType(normalizedBinType);
        draftBin.setImageBytes(binImage.getBytes());
        draftBinImageRepository.save(draftBin);

        List<DraftBinImage> allImages = draftBinImageRepository
                .findBySubmission_IdOrderByAddedAtAsc(draftId);

        return buildDraftResponse(draftId, allImages);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 3 — Finalize the draft and kick off async AI
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Validates all mandatory bins are present, transitions the submission to
     * PROCESSING, and hands off to {@link SegregationProcessingService} for
     * async AI analysis.
     *
     * @return the submission id (same as draftId) for the citizen to poll
     * @throws IllegalArgumentException if the draft is not found, not in DRAFT
     *                                  status, or mandatory bins are missing
     */
    @Transactional
    public Map<String, Object> finalizeDraft(Long draftId) {
        SegregationSubmission draft = requireOpenDraft(draftId);

        List<DraftBinImage> stagedImages = draftBinImageRepository
                .findBySubmission_IdOrderByAddedAtAsc(draftId);

        if (stagedImages.isEmpty()) {
            throw new IllegalArgumentException(
                    "No bin images uploaded yet. Add at least GREEN and BLUE bins.");
        }

        List<String> uploaded = stagedImages.stream()
                .map(DraftBinImage::getBinType)
                .toList();

        List<String> missing = MANDATORY_BINS.stream()
                .filter(b -> !uploaded.contains(b))
                .sorted()
                .toList();

        if (!missing.isEmpty()) {
            throw new IllegalArgumentException(
                    "Cannot finalize. Missing mandatory bins: " + missing);
        }

        // Transition to PROCESSING before handing off
        draft.setStatus(SubmissionStatus.PROCESSING);
        submissionRepository.save(draft);

        // Read bytes eagerly — DraftBinImage rows must be accessible before
        // the async thread starts (Hibernate session is closed after this tx)
        List<WasteAiService.ImagePayload> images = stagedImages.stream()
                .map(img -> new WasteAiService.ImagePayload(img.getImageBytes(), img.getBinType()))
                .toList();

        processingService.processSubmission(
                draftId,
                draft.getHousehold().getHouseholdId(),
                draft.getAttemptNumber(),
                images
        );

        return Map.of(
                "submissionId",  draftId,
                "status",        "PROCESSING",
                "binsSubmitted", uploaded,
                "message",       "Waste analysis started. Poll /api/v1/segregation/status/" + draftId
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Status helper — used by the status endpoint to describe a DRAFT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Builds the status view for a submission that is still in DRAFT state.
     * Called by the controller's GET /status/{id} when status == DRAFT.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getDraftStatus(Long draftId) {
        List<DraftBinImage> staged = draftBinImageRepository
                .findBySubmission_IdOrderByAddedAtAsc(draftId);

        List<String> uploaded = staged.stream()
                .map(DraftBinImage::getBinType)
                .toList();

        List<String> missing = MANDATORY_BINS.stream()
                .filter(b -> !uploaded.contains(b))
                .sorted()
                .toList();

        return Map.of(
                "status",       "DRAFT",
                "submissionId", draftId,
                "binsUploaded", uploaded,
                "binsMissing",  missing,
                "canFinalize",  missing.isEmpty(),
                "message",      missing.isEmpty()
                        ? "All mandatory bins uploaded. Ready to finalize."
                        : "Draft in progress. Missing: " + missing
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private SegregationSubmission requireOpenDraft(Long draftId) {
        SegregationSubmission draft = submissionRepository.findById(draftId)
                .orElseThrow(() -> new IllegalArgumentException("Draft not found: " + draftId));

        if (draft.getStatus() != SubmissionStatus.DRAFT) {
            throw new IllegalStateException(
                    "Submission " + draftId + " is not in DRAFT status (current: " + draft.getStatus() + ").");
        }
        return draft;
    }

    private String validateBinType(String binType) {
        String upper = binType.toUpperCase().trim();
        try {
            BinType.valueOf(upper);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Unknown binType '" + binType + "'. Valid values: GREEN, BLUE, RED, BLACK.");
        }
        return upper;
    }

    private int validateAndGetAttemptNumber(Household household) {
        LocalDate today = LocalDate.now();
        long attemptsToday = submissionRepository.countByHouseholdAndSubmittedAtBetween(
                household,
                today.atStartOfDay(),
                today.atTime(23, 59, 59));

        if (attemptsToday >= 5) {
            throw new IllegalStateException("Maximum 5 attempts per day reached.");
        }
        return (int) attemptsToday + 1;
    }

    private DraftSubmissionResponseDTO buildDraftResponse(Long draftId, List<DraftBinImage> images) {
        List<String> uploaded = images.stream()
                .map(DraftBinImage::getBinType)
                .toList();

        List<String> missing = new ArrayList<>(MANDATORY_BINS.stream()
                .filter(b -> !uploaded.contains(b))
                .sorted()
                .toList());

        boolean canFinalize = missing.isEmpty();

        String message = uploaded.isEmpty()
                ? "Draft started. Upload GREEN and BLUE bin images, then finalize."
                : canFinalize
                    ? "All mandatory bins uploaded. You can now finalize your submission."
                    : "Added bin(s). Still needed: " + missing + ".";

        return new DraftSubmissionResponseDTO(draftId, uploaded, missing, canFinalize, message);
    }
}
