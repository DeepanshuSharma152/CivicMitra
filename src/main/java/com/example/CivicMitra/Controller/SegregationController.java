package com.example.CivicMitra.Controller;


import com.example.CivicMitra.DTO.QRScanResponseDTO;
import com.example.CivicMitra.DTO.SegregationResponseDTO;
import com.example.CivicMitra.model.segregation.SegregationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/segregation")
public class SegregationController {

    private final SegregationService segregationService;

    public SegregationController(SegregationService segregationService) {
        this.segregationService = segregationService;
    }


    // POST /submit
    // Accepts binImages (files), binTypes, householdId, lat, and lng
    // Calls segregationService.submitSegregation and wraps in ResponseEntity.ok

    @PostMapping("/submit")
    public ResponseEntity<?> submitSegregation(
            @RequestParam("binImages") List<MultipartFile> binImages,
            @RequestParam("binTypes") List<String> binTypes,
            @RequestParam("householdId") Long householdId,
            @RequestParam("lat") double lat,
            @RequestParam("lng") double lng
    ) {
        try {
            SegregationResponseDTO response =segregationService.submitSegregation(binImages, binTypes, householdId, lat, lng);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error submitting segregation data: " + e.getMessage());
        }
    }

    // GET /qr/{submissionId}
    // Returns the full submission response including QR token + base64 PNG image
    @GetMapping("/qr/{submissionId}")
    public ResponseEntity<?> getQRForSubmission(@PathVariable Long submissionId) {
        try {
            SegregationResponseDTO response = segregationService.getQRForSubmission(submissionId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body("Submission not found: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching QR: " + e.getMessage());
        }
    }

    // GET /history/{householdId}
    // Calls segregationService.getHistoryForHousehold
    @GetMapping("/history/{householdId}")
    public ResponseEntity<List<SegregationResponseDTO>> getSegregationHistory(@PathVariable Long householdId) {
        try {
            List<SegregationResponseDTO> history = segregationService.getHistoryForHousehold(householdId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }


// POST /verify-qr
// Takes tokenId, workerId, workerLat, workerLng as request parameters
// Calls segregationService.verifyAndConsumeQR
    @PostMapping("/verify-qr")
    public ResponseEntity<QRScanResponseDTO> verifyQR(
            @RequestParam("tokenId") String tokenId,
            @RequestParam("workerId") Long workerId,
            @RequestParam("workerLat") double workerLat,
            @RequestParam("workerLng") double workerLng
    ) {
        try {
            QRScanResponseDTO response = segregationService.verifyAndConsumeQR(tokenId, workerId, workerLat, workerLng);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Return a 500 with no body to avoid mismatched constructor arguments for QRScanResponseDTO
            return ResponseEntity.status(500).body(null);
        }
    }
    }


