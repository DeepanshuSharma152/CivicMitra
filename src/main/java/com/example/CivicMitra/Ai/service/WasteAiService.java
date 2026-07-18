package com.example.CivicMitra.Ai.service;

import com.example.CivicMitra.Ai.response.WasteAnalysis;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;

@Service
public class WasteAiService {
    private static final String WASTE_ANALYSIS_PROMPT = """
            You are a municipal solid-waste compliance auditor for Chandigarh.
            Inspect the image carefully and return one valid JSON object only.
            Do not include markdown, comments, extra keys, or explanatory text.

            Audit checklist:
            1. Identify visible waste materials, bin/bag color, and whether any waste is present.
            2. Route the primary waste stream to the correct facility.
            3. Check whether the waste belongs in the detected bin type.
            4. Check for cross-contamination, fraud/suspicious image signs, and image clarity.
            5. For RED sanitary waste, verify items are wrapped or pouched.
            6. If uncertain, use UNKNOWN/false conservatively and lower confidence.

            Facility routing:
            - Wet/organic: food scraps, peels, cooked food, flowers, garden waste -> DADUMAJRA_CBG, Wet Waste, MOH, Biogas + Organic Manure
            - Dry recyclable: plastic, paper, cardboard, glass, metal, rubber, wood, textile -> DADUMAJRA_RDF, Dry Waste, Engineering, Recyclable Material
            - Construction: brick, concrete, tile, sand, gravel, debris -> SECTOR_25_CD, Construction, Engineering, C&D Recycling
            - Hazardous/special: medicines, e-waste, batteries, bulbs/CFLs, chemicals, paint, pesticide containers, sharps -> NIMBUA_TSDF, Hazardous, CPCC, Special Treatment Required

            Bin compliance:
            - GREEN allows wet/organic only.
            - BLUE allows clean dry recyclables only.
            - RED allows sanitary waste only; loose/unwrapped sanitary waste is non-compliant.
            - BLACK allows domestic hazardous/special waste only.

            Field rules:
            - detectedBinType: GREEN, BLUE, RED, BLACK, or UNKNOWN if no bin/bag color is clear.
            - isCorrectBinType: true only when visible waste matches the bin rule; false for mismatch or insufficient visual evidence.
            - hasCrossContamination: true when incompatible waste categories are mixed; contaminationDetail must name the issue, otherwise empty string.
            - isEmpty: true only when no waste is visible inside the bin/bag.
            - isSuspicious: true for stock/downloaded/screenshot images, staged scenes, unusable blur/darkness, heavy obstruction, or clearly non-local setting.
            - locationConsistency: HIGH for clearly Indian/North Indian residential/street context, MEDIUM for ambiguous, LOW for clearly inconsistent.
            - confidence: 0.0-1.0 based on visual certainty; reduce for blur, partial views, poor lighting, mixed contents, or unclear bin color.
            - aiDescription: one concise sentence naming the visible waste, bin type, and compliance concern if any.

            Required JSON schema:
            {
              "category": "",
              "department": "",
              "facilityKey": "",
              "resourcePotential": "",
              "confidence": 0.0,
              "locationConsistency": "",
              "isSuspicious": false,
              "aiDescription": "",
              "detectedBinType": "",
              "isCorrectBinType": false,
              "hasCrossContamination": false,
              "contaminationDetail": "",
              "isEmpty": false,
              "isProperlyWrapped": true
            }
            """;

    private final ChatClient chatClient;

    public WasteAiService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public WasteAnalysis analyzeWasteImage(byte[] imageBytes) {
        ByteArrayResource imageResource = new ByteArrayResource(imageBytes);

        return chatClient.prompt()
                .user(u -> u
                        .text(WASTE_ANALYSIS_PROMPT)
                        .media(MimeTypeUtils.IMAGE_JPEG, imageResource)
                )
                .call()
                .entity(WasteAnalysis.class);
    }
}
