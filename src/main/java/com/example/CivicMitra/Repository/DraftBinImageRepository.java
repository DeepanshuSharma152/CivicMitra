package com.example.CivicMitra.Repository;

import com.example.CivicMitra.model.segregation.DraftBinImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface DraftBinImageRepository extends JpaRepository<DraftBinImage, Long> {

    /** All draft images for a given submission, ordered by upload time. */
    List<DraftBinImage> findBySubmission_IdOrderByAddedAtAsc(Long submissionId);

    /** Used by the expiry cleanup job to remove stale DRAFT images. */
    void deleteBySubmission_IdIn(List<Long> submissionIds);
}
