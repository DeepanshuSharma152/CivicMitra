package com.example.CivicMitra.model.complaints;

import com.example.CivicMitra.Enums.ComplaintStatus;
import com.example.CivicMitra.model.core.TreatmentFacility;
import com.example.CivicMitra.model.core.User;
import com.example.CivicMitra.model.core.Ward;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "complaints")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long complaintId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id")
    private Ward ward;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_key")
    private TreatmentFacility assignedFacility;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    private ComplaintStatus status = ComplaintStatus.PENDING;

    private int upvotes = 0;
    private String imagePath;

    @ElementCollection
    @CollectionTable(name = "complaint_categories", joinColumns = @JoinColumn(name = "complaint_id"))
    @Column(name = "category")
    private Set<String> categories = new HashSet<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "complaint", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ComplaintMetadata metadata;

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL)
    private List<ComplaintAuditLog> auditLogs = new ArrayList<>();
}