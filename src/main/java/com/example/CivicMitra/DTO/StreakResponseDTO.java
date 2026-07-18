package com.example.CivicMitra.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Response DTO for GET /api/v1/households/{id}/streak.
 *
 * LocalDate fields are serialized by Jackson as "YYYY-MM-DD" when non-null,
 * and as JSON null when null. No manual toString() or "none" sentinel needed.
 */
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class StreakResponseDTO {

    private Long householdId;
    private String houseNumber;

    private int currentStreak;
    private int longestStreak;
    private int totalGreenDays;

    private LocalDate lastGreenDate;       // null → JSON null (no scans yet)
    private int fraudFlagCount;
    private LocalDate fineImmunityUntil;   // null → JSON null (not yet earned)
}
