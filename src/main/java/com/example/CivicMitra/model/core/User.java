package com.example.CivicMitra.model.core;

import com.example.CivicMitra.Enums.UserRole;
import com.example.CivicMitra.model.complaints.Complaint;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name="users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;

    @Column(unique = true,nullable = false)
    private String email;

    @Column(unique = true, nullable = false, length = 10)
    @Size(min = 10, max = 10)
    @Pattern(regexp = "^[0-9]{10}$")
    private String phoneNumber;

    @Column(nullable = false)
    private String hashedPassword;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false)
    private UserRole role;

    private int complaintsFiledCount = 0;
    private int complaintsVerifiedCount = 0; // Upvoted by community
    private int complaintsFlaggedCount = 0;   // Rejected as fake
    private double reputationScore = 10.0;   // Start everyone at a neutral 10.0

    @OneToMany(mappedBy ="user",cascade = CascadeType.ALL,orphanRemoval = true)
    @JsonIgnore // <--- ADD THIS IMPORT: com.fasterxml.jackson.annotation.JsonIgnore
    private List<Complaint> complaints = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "municipality_id")
    private Municipality municipality;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id")
    private Ward ward;

    public Long getId() {
        return id;
    }

}
