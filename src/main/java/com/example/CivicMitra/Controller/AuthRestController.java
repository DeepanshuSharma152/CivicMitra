package com.example.CivicMitra.Controller;

import com.example.CivicMitra.DTO.LoginRequestDto;
import com.example.CivicMitra.DTO.OtpResponseDTO;
import com.example.CivicMitra.DTO.RegisterRequestDTO;
import com.example.CivicMitra.DTO.RegisterResponseDTO;
import com.example.CivicMitra.JWTAuth.JwtService;
import com.example.CivicMitra.Service.CustomUserDetailsService;
import com.example.CivicMitra.Service.OtpService;
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

    @Autowired
    private OtpService otpService;

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

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDto loginRequest) {
        // 1. Authenticate user credentials
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        // 2. Fetch user details and generate JWT
        var user = customUserDetailsService.loadUserByUsername(loginRequest.getEmail());
        String jwtToken = jwtService.generateToken(user);

        User user1 = userService.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(Map.of(
                "token", jwtToken,
                "email", user.getUsername(),
                "role", user1.getRole().name(),
                "name", user1.getFullName(),
                "userId", user1.getId(),
                "message", "Login successful"
        ));
    }

    /**
     * POST /api/v1/auth/login-otp/send?email={email}
     * Industry-grade 2-step Login OTP generation backend endpoint.
     */
    @PostMapping("/login-otp/send")
    public ResponseEntity<?> sendLoginOtp(@RequestParam String email) {
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email parameter is required."));
        }

        User user = userService.findByEmail(email.trim())
                .orElseThrow(() -> new RuntimeException("No registered account found with email: " + email));

        OtpResponseDTO response = otpService.generateOtpResponse(user.getEmail());
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/v1/auth/login-otp/verify
     * Industry-grade 2-step Login OTP verification & JWT token issuing backend endpoint.
     */
    @PostMapping("/login-otp/verify")
    public ResponseEntity<?> verifyLoginOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        String otp = request.get("otp");

        if (email == null || password == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "email, password, and otp parameters are required."));
        }

        // 1. Verify Backend OTP first
        boolean otpValid = otpService.verifyOtp(email, otp);
        if (!otpValid) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP code."));
        }

        // 2. Authenticate credentials with Spring Security
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email.trim(), password)
        );

        var userDetails = customUserDetailsService.loadUserByUsername(email.trim());
        String jwtToken = jwtService.generateToken(userDetails);

        User userEntity = userService.findByEmail(email.trim())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(Map.of(
                "token", jwtToken,
                "email", userDetails.getUsername(),
                "role", userEntity.getRole().name(),
                "name", userEntity.getFullName(),
                "userId", userEntity.getId(),
                "message", "2-Step OTP Login verified successfully"
        ));
    }
}
