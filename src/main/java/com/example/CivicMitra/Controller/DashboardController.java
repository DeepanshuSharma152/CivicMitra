package com.example.CivicMitra.Controller;

import com.example.CivicMitra.DTO.HouseholdSetupRequestDTO;
import com.example.CivicMitra.Repository.HouseholdRepository;
import com.example.CivicMitra.Service.UserService;
import com.example.CivicMitra.model.core.User;
import com.example.CivicMitra.model.segregation.Household;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard")
@Transactional
public class DashboardController {

    private final UserService userService;
    private final HouseholdRepository householdRepository;

    public DashboardController(UserService userService, HouseholdRepository householdRepository) {
        this.userService = userService;
        this.householdRepository = householdRepository;
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> profile(Principal principal) {
        User user = currentUser(principal);
        Household household = householdRepository.findFirstByPrimaryResident_Id(user.getId()).orElse(null);
        return ResponseEntity.ok(profileResponse(user, household));
    }

    @PutMapping("/household")
    public ResponseEntity<Map<String, Object>> saveHousehold(
            @Valid @RequestBody HouseholdSetupRequestDTO request,
            Principal principal) {
        User user = currentUser(principal);
        if (user.getWard() == null) {
            return ResponseEntity.badRequest().body(Map.<String, Object>of("error", "Add a ward to your account before setting up your household."));
        }

        Household household = householdRepository.findFirstByPrimaryResident_Id(user.getId()).orElseGet(Household::new);
        household.setPrimaryResident(user);
        household.setWard(user.getWard());
        household.setHouseNumber(request.getHouseNumber().trim());
        household.setLat(request.getLat());
        household.setLng(request.getLng());
        household.setHasApp(true);
        household = householdRepository.save(household);

        return ResponseEntity.ok(profileResponse(user, household));
    }

    private User currentUser(Principal principal) {
        return userService.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalStateException("Signed-in user was not found."));
    }

    private Map<String, Object> profileResponse(User user, Household household) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("name", user.getFullName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole().name());
        response.put("municipality", user.getMunicipality() == null ? null : user.getMunicipality().getName());
        response.put("ward", user.getWard() == null ? null : user.getWard().getSectorName());
        response.put("wardId", user.getWard() == null ? null : user.getWard().getWardId());
        response.put("householdId", household == null ? null : household.getHouseholdId());
        response.put("houseNumber", household == null ? null : household.getHouseNumber());
        return response;
    }
}
