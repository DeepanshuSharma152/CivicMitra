package com.example.CivicMitra.Config;


import com.example.CivicMitra.Repository.MunicipalityRepository;
import com.example.CivicMitra.Repository.WardRepository;
import com.example.CivicMitra.model.core.Municipality;
import com.example.CivicMitra.model.core.Ward;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataSeeder implements CommandLineRunner {

    private final MunicipalityRepository municipalityRepository;
    private final WardRepository wardRepository;

    public DataSeeder(MunicipalityRepository municipalityRepository, WardRepository wardRepository) {
        this.municipalityRepository = municipalityRepository;
        this.wardRepository = wardRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {

        // 1. Check if the database is completely empty
        if (municipalityRepository.count() == 0) {

            // 2. Create the Root Municipality
            Municipality chandigarh = new Municipality();
            chandigarh.setName("Chandigarh Municipal Corporation");
            // Add any other required fields for your Municipality entity here

            // Save it so it gets ID: 1
            chandigarh = municipalityRepository.save(chandigarh);
            System.out.println("🌱 Successfully seeded Municipality: " + chandigarh.getName());

            // 3. Create a Root Ward (Assuming households need a Ward ID too)
            Ward sector17 = new Ward();
            sector17.setWardNumber(1); // Assuming Ward number 1 for Sector 17
            sector17.setMunicipality(chandigarh);
            // Add any other required fields for your Ward entity here

            // Save it so it gets ID: 1
            wardRepository.save(sector17);
            System.out.println("🌱 Successfully seeded Ward: " + sector17.getWardNumber());
        }
    }
}
