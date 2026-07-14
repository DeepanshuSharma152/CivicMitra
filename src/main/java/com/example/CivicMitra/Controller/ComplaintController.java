package com.example.CivicMitra.Controller;


import com.example.CivicMitra.DTO.ComplaintRequestDTO;
import com.example.CivicMitra.DTO.ComplaintResponseDTO;
import com.example.CivicMitra.Enums.ComplaintStatus;
import com.example.CivicMitra.Service.ComplaintService;
import com.example.CivicMitra.Service.UserService;
import com.example.CivicMitra.exception.ResourceNotFoundException;
import com.example.CivicMitra.model.core.User;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.List;


@RestController
@RequestMapping("/api/v1/complaints") // Base URL
public class ComplaintController {
    @Autowired
    private ComplaintService complaintService;

    @Autowired
    private UserService userService;

    // GET /api/v1/complaints
    // This replaces your old /list method. The service handles Role filtering.
    @GetMapping
    public ResponseEntity<List<ComplaintResponseDTO>> getAllComplaints() {

        List<ComplaintResponseDTO> response=complaintService.getAllComplaints();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-complaints")
    public ResponseEntity<List<ComplaintResponseDTO>> getMyComplaints(Principal principal) {
        // 1. Find user by email from the token
        User user = userService.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. Fetch only their complaints using your existing repo method
        List<ComplaintResponseDTO> response = complaintService.getComplaintForUser(principal.getName());

        return ResponseEntity.ok(response);
    }

    // 2. GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<ComplaintResponseDTO> getComplaintById(@PathVariable Long id){
        return complaintService.getComplaintById(id)
                .map(dto -> ResponseEntity.ok(dto))
                .orElseThrow(()-> new ResourceNotFoundException("Complaint not found with id:" + id)); // Rule: 404 if missing
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> create(
            @RequestPart("image") MultipartFile image,
            @Valid @RequestPart("complaint") ComplaintRequestDTO dto,
            Principal principal
    ) {
        try {

            // The controller just passes the data to the service
            ComplaintResponseDTO response = complaintService.createComplaintWithFile(image, dto, principal.getName());

            // Return 201 Created with the new data
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing file: " + e.getMessage());
        }
    }

    // PUT /api/v1/complaints/{id}
    @PutMapping("/{id}")
    public ResponseEntity<ComplaintResponseDTO> updateComplaint(
            @PathVariable Long id,
            @RequestBody ComplaintRequestDTO dto) {

        return complaintService.updateComplaint(id, dto)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Cannot update. Complaint not found with id: " + id));
    }

    // DELETE /api/v1/complaints/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComplaint(@PathVariable Long id){
      complaintService.deleteComplaint(id);
      return ResponseEntity.noContent().build(); // Rule: 204 No Content

    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('AUTHORITY')") // Extra security: only Authorities can change status
    public ResponseEntity<ComplaintResponseDTO> updateStatus(
            @PathVariable Long id,
            @RequestParam ComplaintStatus status) {  // Spring automatically converts String "RESOLVED" to Enum

        ComplaintResponseDTO updated = complaintService.updateComplaintStatus(id, status);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/upvote")
    public ResponseEntity<Void> upvoteComplaint(@PathVariable Long id,Principal principal) {

        complaintService.upvoteComplaint(id, principal.getName());
        return ResponseEntity.ok().build();
    }

}
//In REST APIs
//
//You are NOT returning a page.
//You are returning an HTTP response.
//
//An HTTP response has:
//
//Status code (200, 201, 400, 401, 403…)
//
//Headers
//
//Body (JSON)

//ResponseEntity represents the full HTTP response,
// allowing control over status codes, headers, and body.
// DTOs define what data is exposed, while ResponseEntity defines how that data is delivered.