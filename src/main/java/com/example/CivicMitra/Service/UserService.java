package com.example.CivicMitra.Service;

import com.example.CivicMitra.DTO.RegisterRequestDTO;
import com.example.CivicMitra.DTO.RegisterResponseDTO;
import com.example.CivicMitra.Enums.UserRole;
import com.example.CivicMitra.Repository.HouseholdRepository;
import com.example.CivicMitra.Repository.MunicipalityRepository;
import com.example.CivicMitra.Repository.UserRepository;
import com.example.CivicMitra.Repository.WardRepository;
import com.example.CivicMitra.model.core.Municipality;
import com.example.CivicMitra.model.core.User;
import com.example.CivicMitra.model.core.Ward;
import com.example.CivicMitra.model.segregation.Household;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private HouseholdRepository householdRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Register a new user from RegisterRequestDTO.
     *
     * Steps:
     * 1. Check email not already taken — throw RuntimeException if duplicate
     * 2. Hash password using BCryptPasswordEncoder
     * 3. Fetch Municipality by municipalityId — throw if not found
     * 4. Create User entity, set all common fields from DTO
     * 5. If role is CITIZEN and householdId not null:
     *      - fetch Household, verify it belongs to same municipality (via ward)
     *      - set household.primaryResident = new user
     *      - save household
     * 6. If role is WORKER and wardId not null:
     *      - fetch Ward, verify municipality match
     *      - link ward to user
     * 7. If role is AUTHORITY: set designation
     * 8. If role is MUNICIPALITY_PARTNER: set facilityKey
     * 9. Save user, return RegisterResponseDTO with userId, email, role, municipalityId
     */
    @Transactional
    public RegisterResponseDTO registerUser(RegisterRequestDTO dto) {

        // ── Step 1: Email & Phone uniqueness checks ───────────────
        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new RuntimeException(
                    "Email '" + dto.getEmail() + "' is already registered.");
        }
        if (dto.getPhoneNumber() != null && !dto.getPhoneNumber().isBlank()) {
            if (userRepository.findByPhoneNumber(dto.getPhoneNumber().trim()).isPresent()) {
                throw new RuntimeException(
                        "Phone number '" + dto.getPhoneNumber() + "' is already registered.");
            }
        }

        // ── Step 2: Hash password ─────────────────────────────────
        String hashedPassword = passwordEncoder.encode(dto.getPassword());

        // ── Step 3: Fetch and validate Municipality ───────────────
        if (dto.getMunicipalityId() == null) {
            throw new RuntimeException("municipalityId is required for all roles.");
        }
        Municipality municipality = municipalityRepository
                .findByMunicipalityId(dto.getMunicipalityId())
                .orElseThrow(() -> new RuntimeException(
                        "Municipality not found with ID: " + dto.getMunicipalityId()));

        // ── Step 4: Build User entity ─────────────────────────────
        User user = new User();
        user.setFullName(dto.getFullName());
        user.setEmail(dto.getEmail());
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setRole(dto.getRole());
        user.setHashedPassword(hashedPassword);
        user.setMunicipality(municipality);

        // ── Step 5: CITIZEN — link to household ──────────────────
        if (dto.getRole() == UserRole.CITIZEN && dto.getHouseholdId() != null) {
            Household household = householdRepository
                    .findById(dto.getHouseholdId())
                    .orElseThrow(() -> new RuntimeException(
                            "Household not found with ID: " + dto.getHouseholdId()));

            // Verify household is in the same municipality (via its ward)
            Long householdMunicipalityId = household.getWard()
                    .getMunicipality().getMunicipalityId();
            if (!householdMunicipalityId.equals(dto.getMunicipalityId())) {
                throw new RuntimeException(
                        "Household " + dto.getHouseholdId() +
                        " does not belong to municipality " + dto.getMunicipalityId());
            }

            // Check if household already has a primary resident
            if (household.getPrimaryResident() != null) {
                throw new RuntimeException(
                        "Household " + household.getHouseNumber() +
                        " already has a registered primary resident.");
            }

            // Save the user first so it has an ID before linking
            user = userRepository.save(user);

            // Link user to household
            household.setPrimaryResident(user);
            householdRepository.save(household);

            return buildResponse(user, municipality);
        }

        // ── Step 6: WORKER — link to ward ────────────────────────
        if (dto.getRole() == UserRole.WORKER && dto.getWardId() != null) {
            Ward ward = wardRepository.findById(dto.getWardId())
                    .orElseThrow(() -> new RuntimeException(
                            "Ward not found with ID: " + dto.getWardId()));

            // Verify ward is in the same municipality
            if (!ward.getMunicipality().getMunicipalityId().equals(dto.getMunicipalityId())) {
                throw new RuntimeException(
                        "Ward " + dto.getWardId() +
                        " does not belong to municipality " + dto.getMunicipalityId());
            }
            user.setWard(ward);
        }

        // ── Step 7: AUTHORITY — store designation ─────────────────
        if (dto.getRole() == UserRole.AUTHORITY && dto.getDesignation() != null) {
            user.setDesignation(dto.getDesignation());
        }

        // ── Step 8: MUNICIPALITY_PARTNER — store facilityKey ─────
        if (dto.getRole() == UserRole.MUNICIPALITY_PARTNER && dto.getFacilityKey() != null) {
            user.setFacilityKey(dto.getFacilityKey());
        }

        // ── Step 9: Save and return ───────────────────────────────
        user = userRepository.save(user);
        return buildResponse(user, municipality);
    }

    // ── Helpers ──────────────────────────────────────────────────

    private RegisterResponseDTO buildResponse(User user, Municipality municipality) {
        return new RegisterResponseDTO(
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                municipality.getMunicipalityId(),
                "User registered successfully"
        );
    }

    /** Legacy method kept for backward compatibility */
    public User registerCitizen(User user) {
        user.setHashedPassword(passwordEncoder.encode(user.getHashedPassword()));
        return userRepository.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}
