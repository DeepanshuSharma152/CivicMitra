package com.example.CivicMitra.model.segregation;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Temporarily stores one bin image while a draft submission is being assembled.
 * These rows are consumed (and read into WasteAiService.ImagePayload) when the
 * citizen calls the /draft/{id}/finalize endpoint. After finalization the rows
 * are no longer needed but are retained for audit purposes.
 */
@Entity
@Table(name = "draft_bin_images")
@Getter
@Setter
@NoArgsConstructor
public class DraftBinImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The draft submission this image belongs to. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    private SegregationSubmission submission;

    /**
     * The bin type the citizen declared for this image, e.g. "GREEN".
     * Stored as a plain string (not enum) so the draft layer stays
     * decoupled from BinType validation — validation happens at finalize.
     */
    @Column(nullable = false, length = 16)
    private String binType;

    /**
     * Raw image bytes stored as BLOB.
     * Kept in the DB for simplicity (avoids filesystem config),
     * and cleaned up by the daily DRAFT expiry job.
     */
    @Lob
    @Column(nullable = false, columnDefinition = "LONGBLOB")
    private byte[] imageBytes;

    @CreationTimestamp
    private LocalDateTime addedAt;
}
