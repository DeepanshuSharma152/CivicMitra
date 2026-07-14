package com.example.CivicMitra.Repository;

import com.example.CivicMitra.model.complaints.ComplaintAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplaintAuditLogRepository extends JpaRepository<ComplaintAuditLog,Long> {

    // Get full audit trail for one complaint, newest first
    List<ComplaintAuditLog> findByComplaint_ComplaintIdOrderByScoredAtDesc(
            Long complaintId);
}
