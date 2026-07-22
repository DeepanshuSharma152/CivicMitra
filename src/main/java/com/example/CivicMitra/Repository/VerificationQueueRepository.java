package com.example.CivicMitra.Repository;

import com.example.CivicMitra.model.segregation.VerificationQueue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VerificationQueueRepository extends JpaRepository<VerificationQueue, Long> {

    /** All pending queue entries for a given officer's ward */
    List<VerificationQueue> findByAssignedOfficerIdAndStatus(
            Long officerId, VerificationQueue.Status status);

    /** Check if a household already has an open queue entry */
    boolean existsByHouseholdIdAndStatusIn(Long householdId,
                                           List<VerificationQueue.Status> statuses);
}
