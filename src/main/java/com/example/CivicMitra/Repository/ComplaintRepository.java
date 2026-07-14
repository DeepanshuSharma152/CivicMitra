package com.example.CivicMitra.Repository;

import com.example.CivicMitra.model.complaints.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint,Long> {

    void deleteByComplaintId(Long complaintId);

    // 1. FOR AUTHORITY: Get all complaints with every 3NF link fetched in ONE query
    // We fetch User, Ward, Facility, and Metadata to ensure the dashboard is lightning fast.
    @Query("SELECT c FROM Complaint c " +
            "JOIN FETCH c.user " +
            "LEFT JOIN FETCH c.ward " +
            "LEFT JOIN FETCH c.assignedFacility " +
            "LEFT JOIN FETCH c.metadata " +
            "ORDER BY c.createdAt DESC")
    List<Complaint> findAllWithAllDetails();

    // 2. FOR CITIZEN: Get only their complaints with Ward and Facility info
    @Query("SELECT c FROM Complaint c " +
            "JOIN FETCH c.user " +
            "LEFT JOIN FETCH c.ward " +
            "LEFT JOIN FETCH c.assignedFacility " +
            "WHERE c.user.id = :userId " +
            "ORDER BY c.createdAt DESC")
    List<Complaint> findByUserIdWithDetails(@Param("userId") Long userId);

    // 3. RESEARCH QUERY: Find all complaints assigned to a specific plant (e.g., DADUMAJRA_CBG)
    @Query("SELECT c FROM Complaint c WHERE c.assignedFacility.facilityKey = :facilityKey")
    List<Complaint> findByFacility(@Param("facilityKey") String facilityKey);

    // 4. SECTOR ANALYSIS: Find all complaints in a specific Ward
    @Query("SELECT c FROM Complaint c WHERE c.ward.wardId = :wardId")
    List<Complaint> findByWardId(@Param("wardId") Long wardId);



}
