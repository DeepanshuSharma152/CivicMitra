package com.example.CivicMitra.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * Returned by the three draft endpoints (start / add-bin / finalize preview).
 * Tells the citizen which bins they have uploaded so far, which are still
 * required, and whether they are allowed to finalize yet.
 */
@Getter
@Setter
@AllArgsConstructor
public class DraftSubmissionResponseDTO {

    /** The submission id that acts as the draft's identifier. */
    private Long draftId;

    /** Bin types already uploaded, e.g. ["GREEN", "BLUE"]. */
    private List<String> binsUploaded;

    /**
     * Mandatory bins still missing before finalize is allowed.
     * Empty when canFinalize == true.
     */
    private List<String> binsMissing;

    /**
     * True once all mandatory bins (GREEN + BLUE) have been uploaded.
     * The citizen may call /draft/{id}/finalize only when this is true.
     */
    private boolean canFinalize;

    /** Human-readable status message for the UI. */
    private String message;
}
