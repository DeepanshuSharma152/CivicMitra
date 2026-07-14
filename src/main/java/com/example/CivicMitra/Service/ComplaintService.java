package com.example.CivicMitra.Service;

import com.example.CivicMitra.Ai.response.WasteAnalysis;
import com.example.CivicMitra.Ai.service.WasteAiService;
import com.example.CivicMitra.DTO.ComplaintRequestDTO;
import com.example.CivicMitra.DTO.ComplaintResponseDTO;
import com.example.CivicMitra.Enums.*;
import com.example.CivicMitra.Repository.*;
import com.example.CivicMitra.model.complaints.Complaint;
import com.example.CivicMitra.model.complaints.ComplaintAuditLog;
import com.example.CivicMitra.model.complaints.ComplaintMetadata;
import com.example.CivicMitra.model.core.TreatmentFacility;
import com.example.CivicMitra.model.core.User;
import com.example.CivicMitra.model.core.Ward;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ComplaintService {

    // Constructor injection — cleaner than @Autowired on fields
    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final WardRepository wardRepository;
    private final FacilityRepository facilityRepository;
    private final WasteAiService wasteAiService;
    private final TrustService trustService;
    private final ComplaintAuditLogRepository auditLogRepository;

    public ComplaintService(ComplaintRepository complaintRepository,
                            UserRepository userRepository,
                            WardRepository wardRepository,
                            FacilityRepository facilityRepository,
                            WasteAiService wasteAiService,
                            TrustService trustService,
                            ComplaintAuditLogRepository auditLogRepository) {
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
        this.wardRepository = wardRepository;
        this.facilityRepository = facilityRepository;
        this.wasteAiService = wasteAiService;
        this.trustService = trustService;
        this.auditLogRepository = auditLogRepository;
    }

    // ─────────────────────────────────────────
    // MAPPER
    // ─────────────────────────────────────────
    private ComplaintResponseDTO mapToResponseDto(Complaint complaint) {
        ComplaintResponseDTO dto = new ComplaintResponseDTO();
        dto.setId(complaint.getComplaintId());
        dto.setTitle(complaint.getTitle());
        dto.setDescription(complaint.getDescription());
        dto.setUpvotes(complaint.getUpvotes());
        dto.setImagePath(complaint.getImagePath());
        dto.setCreatedAt(complaint.getCreatedAt()); // FIX: field now exists in DTO

        if (complaint.getStatus() != null) {
            dto.setStatus(complaint.getStatus().name());
        }

        // FIX: location is no longer a String on Complaint — traverse Ward
        if (complaint.getWard() != null) {
            dto.setLocation(complaint.getWard().getSectorName());
            if (complaint.getWard().getMunicipality() != null) {
                dto.setMunicipalityName(
                        complaint.getWard().getMunicipality().getName()); // FIX: field now in DTO
            }
        }

        // FIX: resourcePotential is no longer on Complaint — traverse Facility
        if (complaint.getAssignedFacility() != null) {
            dto.setResourcePotential(
                    complaint.getAssignedFacility().getResourceType());
            dto.setFacilityName(
                    complaint.getAssignedFacility().getFacilityName()); // FIX: field now in DTO
        }

        // FIX: category is now a Set<String>, not a String field
        if (complaint.getCategories() != null && !complaint.getCategories().isEmpty()) {
            dto.setCategory(String.join(", ", complaint.getCategories()));
        }

        if (complaint.getUser() != null) {
            dto.setCitizenEmail(complaint.getUser().getEmail());
            dto.setUserId(complaint.getUser().getId());
        }

        // FIX: trustScore and aiConfidence live in metadata, not complaint
        if (complaint.getMetadata() != null) {
            dto.setTrustScore(complaint.getMetadata().getTrustScore());
            dto.setAiConfidence(complaint.getMetadata().getAiConfidence());
        }

        return dto;
    }

    // ─────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────
    @Transactional
    public ComplaintResponseDTO createComplaintWithFile(
            MultipartFile image,
            ComplaintRequestDTO dto,
            String email) throws IOException {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // FIX: use wardId from DTO, not a string location
        Ward ward = wardRepository.findById(dto.getWardId())
                .orElseThrow(() -> new RuntimeException("Ward not found"));

        String uploadDir = "uploads/";
        Files.createDirectories(Paths.get(uploadDir));
        String fileName = System.currentTimeMillis() + "_" + image.getOriginalFilename();
        Files.copy(image.getInputStream(),
                Paths.get(uploadDir + fileName),
                StandardCopyOption.REPLACE_EXISTING);

        byte[] imageBytes = image.getBytes();
        WasteAnalysis aiResult = wasteAiService.analyzeWasteImage(imageBytes);

        // FIX: replaces ChandigarhFacility enum — lookup from DB
        TreatmentFacility facility = facilityRepository
                .findById(aiResult.facilityKey())
                .orElseGet(() -> {
                    System.out.println(
                            "WARN: Unknown facilityKey from AI: " + aiResult.facilityKey());
                    return null;
                });

        int initialTrustScore = trustService.calculateTrustScore(
                aiResult,
                dto.getDeviceLat(),
                dto.getDeviceLng(),
                user.getReputationScore(),
                0,
                null);

        Complaint complaint = new Complaint();
        complaint.setUser(user);
        complaint.setWard(ward);                 // FK — not a string
        complaint.setAssignedFacility(facility); // FK — nullable if AI unknown
        complaint.setTitle(dto.getTitle());
        complaint.setDescription(dto.getDescription());
        complaint.setImagePath(fileName);
        complaint.setUpvotes(0);

        // FIX: categories is a Set, not a String field
        if (aiResult.category() != null) {
            complaint.getCategories().add(aiResult.category());
        }

        // Metadata
        ComplaintMetadata metadata = new ComplaintMetadata();
        metadata.setComplaint(complaint);
        metadata.setDeviceLat(dto.getDeviceLat());
        metadata.setDeviceLng(dto.getDeviceLng());
        metadata.setReportedLat(dto.getReportedLat());
        metadata.setReportedLng(dto.getReportedLng());
        metadata.setTrustScore(initialTrustScore);
        metadata.setAiConfidence(aiResult.confidence());
        metadata.setLocationConsistency(aiResult.locationConsistency());
        metadata.setAiSuspicious(aiResult.isSuspicious());
        metadata.setAiDescription(aiResult.aiDescription());
        complaint.setMetadata(metadata);

        // FIX: AuditLog instead of appending string to description
        ComplaintAuditLog auditLog = new ComplaintAuditLog();
        auditLog.setComplaint(complaint);
        auditLog.setTrustScore(initialTrustScore);
        auditLog.setScoreBreakdown(String.format(
                "{\"trigger\":\"create\",\"aiConfidence\":%.2f," +
                        "\"locationConsistency\":\"%s\",\"isSuspicious\":%b,\"userRep\":%.1f}",
                aiResult.confidence(),
                aiResult.locationConsistency(),
                aiResult.isSuspicious(),
                user.getReputationScore()));
        complaint.getAuditLogs().add(auditLog);

        // Status logic
        if (initialTrustScore > 85 && user.getReputationScore() > 20) {
            complaint.setStatus(ComplaintStatus.VERIFIED);
        } else if (initialTrustScore < 30) {
            complaint.setStatus(ComplaintStatus.REJECTED);
        } else {
            complaint.setStatus(ComplaintStatus.PENDING_VOTE);
        }

        Complaint saved = complaintRepository.save(complaint);
        user.setComplaintsFiledCount(user.getComplaintsFiledCount() + 1);
        userRepository.save(user);

        return mapToResponseDto(saved);
    }

    // ─────────────────────────────────────────
    // READ
    // ─────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ComplaintResponseDTO> getAllComplaints() {
        return complaintRepository.findAllWithAllDetails()
                .stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<ComplaintResponseDTO> getComplaintById(Long id) {
        return complaintRepository.findById(id)
                .map(this::mapToResponseDto);
    }

    @Transactional(readOnly = true)
    public List<ComplaintResponseDTO> getComplaintForUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // FIX: UserRole.AUTHORITY — use enum directly, not string comparison
        List<Complaint> complaints =
                UserRole.AUTHORITY.equals(user.getRole())
                        ? complaintRepository.findAllWithAllDetails()
                        : complaintRepository.findByUserIdWithDetails(user.getId());
        // FIX: replaced findAllWithUser() and findByUser_Id() — old methods deleted

        return complaints.stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ComplaintResponseDTO> getComplaintsByWard(Long wardId) {
        return complaintRepository.findByWardId(wardId)
                .stream().map(this::mapToResponseDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ComplaintResponseDTO> getComplaintsByFacility(String facilityKey) {
        return complaintRepository.findByFacility(facilityKey)
                .stream().map(this::mapToResponseDto).collect(Collectors.toList());
    }

    // ─────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────
    @Transactional
    public Optional<ComplaintResponseDTO> updateComplaint(
            Long id, ComplaintRequestDTO dto) {
        return complaintRepository.findById(id).map(existing -> {
            existing.setTitle(dto.getTitle());
            existing.setDescription(dto.getDescription());

            // FIX: ward is now a FK lookup, not setLocation(string)
            if (dto.getWardId() != null) {
                Ward ward = wardRepository.findById(dto.getWardId())
                        .orElseThrow(() -> new RuntimeException("Ward not found"));
                existing.setWard(ward);
            }

            // FIX: category updates the Set, not a String field
            if (dto.getCategory() != null) {
                existing.getCategories().clear();
                existing.getCategories().add(dto.getCategory());
            }

            return mapToResponseDto(complaintRepository.save(existing));
        });
    }

    @Transactional
    public ComplaintResponseDTO updateComplaintStatus(
            Long id, ComplaintStatus newStatus) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found: " + id));
        complaint.setStatus(newStatus);
        return mapToResponseDto(complaintRepository.save(complaint));
    }

    // ─────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────
    @Transactional
    public void deleteComplaint(Long id) {
        if (!complaintRepository.existsById(id)) {
            throw new RuntimeException("Complaint not found: " + id);
        }
        complaintRepository.deleteById(id);
    }

    // ─────────────────────────────────────────
    // UPVOTE
    // ─────────────────────────────────────────
    @Transactional
    public void upvoteComplaint(Long id, String currentUserEmail) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (complaint.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You cannot upvote your own complaint.");
        }

        complaint.setUpvotes(complaint.getUpvotes() + 1);

        ComplaintMetadata meta = complaint.getMetadata();
        int updatedScore = trustService.calculateTrustScore(
                null,
                meta.getDeviceLat(),
                meta.getDeviceLng(),
                complaint.getUser().getReputationScore(),
                complaint.getUpvotes(),
                meta);
        meta.setTrustScore(updatedScore);

        // Log the recalculation
        ComplaintAuditLog log = new ComplaintAuditLog();
        log.setComplaint(complaint);
        log.setTrustScore(updatedScore);
        log.setScoreBreakdown(String.format(
                "{\"trigger\":\"upvote\",\"upvotes\":%d,\"newScore\":%d}",
                complaint.getUpvotes(), updatedScore));
        complaint.getAuditLogs().add(log);

        if (updatedScore >= 80
                && !ComplaintStatus.REJECTED.equals(complaint.getStatus())) {
            complaint.setStatus(ComplaintStatus.VERIFIED);
            if (complaint.getUpvotes() == 5) {
                User reporter = complaint.getUser();
                reporter.setReputationScore(
                        Math.min(100.0, reporter.getReputationScore() + 5.0));
                reporter.setComplaintsVerifiedCount(
                        reporter.getComplaintsVerifiedCount() + 1);
                userRepository.save(reporter);
            }
        }

        complaintRepository.save(complaint);
    }
}