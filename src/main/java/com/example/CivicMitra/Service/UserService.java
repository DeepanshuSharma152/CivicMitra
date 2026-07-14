package com.example.CivicMitra.Service;

import com.example.CivicMitra.DTO.RegisterRequestDTO;
import com.example.CivicMitra.DTO.RegisterResponseDTO;
import com.example.CivicMitra.Repository.MunicipalityRepository;
import com.example.CivicMitra.Repository.UserRepository;
import com.example.CivicMitra.Repository.WardRepository;
import com.example.CivicMitra.model.core.Municipality;
import com.example.CivicMitra.model.core.User;
import com.example.CivicMitra.model.core.Ward;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MunicipalityRepository municipalityRepository;

    @Autowired
    private WardRepository wardRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Register a new user from RegisterRequestDTO
     * - Hash password using BCrypt
     * - Lookup and set Municipality by ID
     * - Lookup and set Ward by ID (optional, for CITIZEN and WORKER roles)
     * - Save user to database
     * - Return RegisterResponseDTO with userId and role
     */
    public RegisterResponseDTO registerUser(RegisterRequestDTO request) {
        // Create new User entity
        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(request.getRole());

        // Hash the password using BCrypt
        String hashedPassword = passwordEncoder.encode(request.getPassword());
        user.setHashedPassword(hashedPassword);

        // Lookup and set Municipality by ID
        if (request.getMunicipalityId() != null) {
            Municipality municipality = municipalityRepository.findByMunicipalityId(request.getMunicipalityId())
                    .orElseThrow(() -> new RuntimeException("Municipality not found with ID: " + request.getMunicipalityId()));
            user.setMunicipality(municipality);
        }

        // Lookup and set Ward by ID (optional, only for CITIZEN and WORKER)
        if (request.getWardId() != null) {
            Ward ward = wardRepository.findById(request.getWardId())
                    .orElseThrow(() -> new RuntimeException("Ward not found with ID: " + request.getWardId()));
            user.setWard(ward);
        }

        // Save user to database
        User savedUser = userRepository.save(user);

        // Return success response with userId and role
        return new RegisterResponseDTO(
                savedUser.getId(),
                savedUser.getRole().name(),
                "User registered successfully"
        );
    }

    public User registerCitizen(User user){
        user.setHashedPassword(passwordEncoder.encode(user.getHashedPassword()));

        return userRepository.save(user);//saving user object means user info in db using repo
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

}
