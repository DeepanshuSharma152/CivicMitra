package com.example.CivicMitra.DTO;


// DTO for standardized error responses across all REST endpoints
// Fields needed: message (the error description),
// status (HTTP status code as int),
// timestamp (when the error occurred),
// path (the API endpoint that failed)
// Use Lombok @Getter @Setter @AllArgsConstructor @NoArgsConstructor
// Must have an all-args constructor AND a constructor
// that takes only (String message) for simple error cases

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ErrorResponseDTO {
    private String message;
    private int status;
    private String timestamp;
    private String path;
    // Constructor for simple error cases where only message is provided
    public ErrorResponseDTO(String message) {
        this.message = message;
    }
}
