package com.example.CivicMitra.Controller;


import com.example.CivicMitra.DTO.QRScanResponseDTO;
import com.example.CivicMitra.DTO.SegregationResponseDTO;
import com.example.CivicMitra.DTO.WorkerPickupActionDTO;
import com.example.CivicMitra.DTO.WorkerScanDetailsDTO;
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

    @PostMapping("/scan-qr")
    public ResponseEntity<WorkerScanDetailsDTO> scanQR(
            @RequestParam("tokenId") String tokenId,
            @RequestParam("workerLat") double workerLat,
            @RequestParam("workerLng") double workerLng
    ) {
        return ResponseEntity.ok(segregationService.scanQR(tokenId, workerLat, workerLng));
    }

    @PostMapping("/confirm-pickup")
    public ResponseEntity<WorkerPickupActionDTO> confirmPickup(
            @RequestParam("tokenId") String tokenId,
            @RequestParam("workerId") Long workerId,
            @RequestParam("workerLat") double workerLat,
            @RequestParam("workerLng") double workerLng
    ) {
        return ResponseEntity.ok(segregationService.confirmPickup(tokenId, workerId, workerLat, workerLng));
    }

    @PostMapping(value = "/reject-pickup", consumes = "multipart/form-data")
    public ResponseEntity<WorkerPickupActionDTO> rejectPickup(
            @RequestParam("tokenId") String tokenId,
            @RequestParam("workerId") Long workerId,
            @RequestParam("workerLat") double workerLat,
            @RequestParam("workerLng") double workerLng,
            @RequestParam("reason") String reason,
            @RequestParam(value = "subReason", required = false) String subReason,
            @RequestParam(value = "remarks", required = false) String remarks,
            @RequestParam(value = "proofImages", required = false) List<MultipartFile> proofImages
    ) throws Exception {
        return ResponseEntity.ok(segregationService.rejectPickup(
                tokenId, workerId, workerLat, workerLng, reason, subReason, remarks, proofImages));
    }
    }

