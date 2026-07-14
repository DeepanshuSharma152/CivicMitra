package com.example.CivicMitra.DTO;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
// Used for POST and PUT (Input)
public class ComplaintRequestDTO {

    @NotBlank(message = "Title is mandatory")
    @Size(min = 5, max = 100, message = "Title must be between 5 and 100 characters")
    private String title;

    @NotBlank(message = "Description cannot be empty")
    private String description;

    @NotNull(message = "Ward ID is required")
    private Long wardId;

    // 1. Coordinates from the Map Picker (What the user says)
    private Double reportedLat;
    private Double reportedLng;

    // 2. Coordinates from the Device Hardware (Silent capture)
    private Double deviceLat;
    private Double deviceLng;

    private String category;

}
