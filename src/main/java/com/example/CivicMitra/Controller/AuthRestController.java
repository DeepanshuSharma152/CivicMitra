package com.example.CivicMitra.Controller;

import com.example.CivicMitra.DTO.LoginRequestDto;
import com.example.CivicMitra.DTO.RegisterRequestDTO;
import com.example.CivicMitra.DTO.RegisterResponseDTO;
import com.example.CivicMitra.JWTAuth.JwtService;
import com.example.CivicMitra.Service.CustomUserDetailsService;
import com.example.CivicMitra.Service.UserService;
import com.example.CivicMitra.model.core.User;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthRestController {

    private static final Logger logger = LoggerFactory.getLogger(AuthRestController.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserService userService;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequestDTO request) {
        try {
            logger.info("New registration: {}", request.getEmail());
            RegisterResponseDTO response = userService.registerUser(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            logger.error("Registration failed: {}", e.getMessage());
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Registration failed", e);
            return ResponseEntity.status(500).body(Map.of("error", "An unexpected error occurred during registration"));
        }
    }

    @PostMapping("/login") // Changed from GET to POST for security
    public ResponseEntity<?> login(@RequestBody LoginRequestDto loginRequest) {
        // 1. Authenticate the user (Spring checks email & password)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        // 2. If successful, fetch user details
        var user = customUserDetailsService.loadUserByUsername(loginRequest.getEmail());
        // 3. Generate the "Stall Pass" (JWT)
        String jwtToken = jwtService.generateToken(user);

        // Fetch the actual User entity to get the name and role
        User user1 = userService.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 4. Send the token back to React
        return ResponseEntity.ok(Map.of(
                "token", jwtToken,
                "email", user.getUsername(),
                "role", user1.getRole().name(), // This fixes your React "Access Denied" logic
                 "name", user1.getFullName(),
                "message", "Login successful"
        ));
    }
}
