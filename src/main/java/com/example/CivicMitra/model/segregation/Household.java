package com.example.CivicMitra.model.segregation;

import com.example.CivicMitra.model.core.User;
import com.example.CivicMitra.model.core.Ward;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "households")
@Getter
@Setter
public class Household {

    // ── Core identity ────────────────────────────────────────────────────────
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long householdId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ward_id", nullable = false)
    private Ward ward;

    @Column(nullable = false)
    private String houseNumber;       // "1234-B"

    private boolean hasApp = false;   // For Scenario B (Manual checks)

    // Link to the resident (The User who pays the bills/files segregation)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_resident_id")
    private User primaryResident;

    // ── GPS fields ──────────────────────────────────────────────────────────
    /** Registration GPS — set at self-registration time by auto-capture */
    private Double lat;
    private Double lng;

    /** GPS Lock — set at first successful waste submission */
    @Column(nullable = false)
    private boolean gpsLocked = false;

    private Double gpsLockLat;
    private Double gpsLockLng;

    // ── Provisional registration fields ─────────────────────────────────────

    /** Auto-generated: CVM-{MUN}-W{wardId}-{RANDOM6} */
    @Column(unique = true)
    private String householdCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerificationStatus verificationStatus = VerificationStatus.PROVISIONAL;

    /** The user who self-registered this household */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claimed_by_user_id")
    private User claimedByUser;

    private String registeredMobile;
    private String blockCode;

    /** QR sticker code printed on the physical sticker sent to the door */
    @Column(unique = true)
    private String qrStickerCode;

    // ── Verification outcome ─────────────────────────────────────────────────
    private Long verifiedByOfficerId;
    private LocalDateTime verifiedAt;

    // ── Enum ─────────────────────────────────────────────────────────────────
    public enum VerificationStatus {
        PROVISIONAL,
        PENDING_VERIFICATION,
        VERIFIED,
        REJECTED
    }
}