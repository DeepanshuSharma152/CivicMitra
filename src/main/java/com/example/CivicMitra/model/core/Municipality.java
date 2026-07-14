package com.example.CivicMitra.model.core;

import com.example.CivicMitra.Enums.MunicipalityStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "municipalities")
@Getter
@Setter
public class Municipality {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long municipalityId;

    @Column(nullable = false, unique = true)
    private String name;           // "Chandigarh MC"

    @Column(nullable = false, unique = true)
    private String slug;           // "chandigarh" - used for clean API routing

    @Column(nullable = false)
    private String state;

    private String contactEmail;
    private String helplineNumber;

    @Enumerated(EnumType.STRING)
    private MunicipalityStatus status = MunicipalityStatus.ACTIVE;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
