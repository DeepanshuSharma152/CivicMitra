package com.example.CivicMitra.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.example.CivicMitra.Enums.UserRole;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequestDTO {

    private String fullName;
    private String email;
    private String phoneNumber;
    private String password;
    private UserRole role;
    private Long municipalityId;
    private Long wardId;
}
