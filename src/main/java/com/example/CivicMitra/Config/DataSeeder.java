package com.example.CivicMitra.Config;

import com.example.CivicMitra.Enums.MunicipalityStatus;
import com.example.CivicMitra.Repository.FacilityRepository;
import com.example.CivicMitra.Repository.HouseholdRepository;
import com.example.CivicMitra.Repository.MunicipalityRepository;
import com.example.CivicMitra.Repository.WardRepository;
import com.example.CivicMitra.model.core.Municipality;
import com.example.CivicMitra.model.core.TreatmentFacility;
import com.example.CivicMitra.model.core.Ward;
import com.example.CivicMitra.model.segregation.Household;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Dev-only data seeder. Runs once after the application is fully started.
 *
 * Seeds (idempotent — checks existence before every insert):
 *   1. Municipality: Chandigarh MC
 *   2. Wards: Sector 17, Sector 22, Manimajra
 *   3. TreatmentFacilities: DADUMAJRA_CBG, DADUMAJRA_RDF, SECTOR_25_CD, NIMBUA_TSDF
 *   4. Households: H-101 through H-105 in Sector 17
 *
 * Only runs under the "dev" Spring profile.
 * Set spring.profiles.active=dev in application.properties to activate.
 */
@Component
@Profile("dev")
public class DataSeeder implements ApplicationListener<ApplicationReadyEvent> {

    private final MunicipalityRepository municipalityRepository;
    private final WardRepository wardRepository;
    private final FacilityRepository facilityRepository;
    private final HouseholdRepository householdRepository;

    public DataSeeder(MunicipalityRepository municipalityRepository,
                      WardRepository wardRepository,
                      FacilityRepository facilityRepository,
                      HouseholdRepository householdRepository) {
        this.municipalityRepository = municipalityRepository;
        this.wardRepository = wardRepository;
        this.facilityRepository = facilityRepository;
        this.householdRepository = householdRepository;
    }

    @Override
    @Transactional
    public void onApplicationEvent(ApplicationReadyEvent event) {

        // ── 1. Municipality ───────────────────────────────────────
        Municipality chandigarh;
        if (municipalityRepository.count() == 0) {
            chandigarh = new Municipality();
            chandigarh.setName("Chandigarh MC");
            chandigarh.setState("Punjab");
            chandigarh.setSlug("chandigarh");
            chandigarh.setStatus(MunicipalityStatus.ACTIVE);
            chandigarh = municipalityRepository.save(chandigarh);
            System.out.println("🌱 Seeded Municipality: " + chandigarh.getName()
                    + " (ID=" + chandigarh.getMunicipalityId() + ")");
        } else {
            chandigarh = municipalityRepository.findAll().get(0);
            System.out.println("✅ Municipality already exists: " + chandigarh.getName());
        }

        // ── 2. Wards ──────────────────────────────────────────────
        Ward sector17 = seedWard(chandigarh, 1, "Sector 17");
        Ward sector22 = seedWard(chandigarh, 2, "Sector 22");
        /*Ward manimajra =*/ seedWard(chandigarh, 3, "Manimajra");

        // ── 3. Treatment Facilities ───────────────────────────────
        seedFacility(chandigarh, "DADUMAJRA_CBG",
                "Dadumajra CBG Plant",   "Wet Waste",       200);
        seedFacility(chandigarh, "DADUMAJRA_RDF",
                "Dadumajra RDF Plant",   "Dry Waste",       150);
        seedFacility(chandigarh, "SECTOR_25_CD",
                "Sector 25 C&D Facility","Construction",     50);
        seedFacility(chandigarh, "NIMBUA_TSDF",
                "Nimbua TSDF",           "Hazardous",        30);

        // ── 4. Households in Sector 17 ────────────────────────────
        // Coordinates: roughly around Sector 17 Chandigarh (30.7333, 76.7794)
        double baseLat = 30.7333;
        double baseLng = 76.7794;
        String[] houseNumbers = {"H-101", "H-102", "H-103", "H-104", "H-105"};

        for (int i = 0; i < houseNumbers.length; i++) {
            seedHousehold(sector17, houseNumbers[i],
                    baseLat + (i * 0.0001),   // slight offset per house
                    baseLng + (i * 0.0001));
        }
    }

    // ── Helpers ────────────────────────────────────────────────────

    private Ward seedWard(Municipality municipality, int wardNumber, String sectorName) {
        if (!wardRepository.existsBySectorName(sectorName)) {
            Ward ward = new Ward();
            ward.setWardNumber(wardNumber);
            ward.setSectorName(sectorName);
            ward.setMunicipality(municipality);
            ward = wardRepository.save(ward);
            System.out.println("🌱 Seeded Ward: " + sectorName
                    + " (ID=" + ward.getWardId() + ")");
            return ward;
        } else {
            Ward existing = wardRepository.findBySectorName(sectorName).orElseThrow();
            System.out.println("✅ Ward already exists: " + sectorName);
            return existing;
        }
    }

    private void seedFacility(Municipality municipality,
                              String key, String name,
                              String resourceType, int capacityTpd) {
        if (!facilityRepository.existsById(key)) {
            TreatmentFacility facility = new TreatmentFacility();
            facility.setFacilityKey(key);
            facility.setFacilityName(name);
            facility.setResourceType(resourceType);
            facility.setCapacityTpd(capacityTpd);
            facility.setOperational(true);
            facility.setMunicipality(municipality);
            facilityRepository.save(facility);
            System.out.println("🌱 Seeded TreatmentFacility: " + key);
        } else {
            System.out.println("✅ Facility already exists: " + key);
        }
    }

    private void seedHousehold(Ward ward, String houseNumber, double lat, double lng) {
        // Uses a single SQL WHERE query — safe on large tables, no full table scan
        if (!householdRepository.existsByHouseNumberAndWard_WardId(houseNumber, ward.getWardId())) {
            Household household = new Household();
            household.setHouseNumber(houseNumber);
            household.setWard(ward);
            household.setLat(lat);
            household.setLng(lng);
            household.setHasApp(true);
            Household saved = householdRepository.save(household);
            System.out.println("🌱 Seeded Household: " + houseNumber
                    + " (ID=" + saved.getHouseholdId() + ")");
        } else {
            System.out.println("✅ Household already exists: " + houseNumber);
        }
    }
}
