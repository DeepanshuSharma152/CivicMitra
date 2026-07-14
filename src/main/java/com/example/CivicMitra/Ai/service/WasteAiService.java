package com.example.CivicMitra.Ai.service;

import com.example.CivicMitra.Ai.response.WasteAnalysis;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;

@Service
public class WasteAiService {
    private final ChatClient chatClient;

    public WasteAiService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public WasteAnalysis analyzeWasteImage(byte[] imageBytes) {
        ByteArrayResource imageResource = new ByteArrayResource(imageBytes);

        return chatClient.prompt()
                .user(u -> u
                        .text("""
                        You are the Senior Solid Waste Management (SWM) Compliance Auditor
                        for the Municipal Corporation of India, operating under the revised
                        Solid Waste Management Rules, 2026, notified by the Ministry of
                        Environment, Forest and Climate Change. These rules mandate strict
                        4-bin segregation at source. Non-compliance attracts fines up to
                        ₹14,000 per violation.

                        Analyze the provided image carefully and return a JSON assessment.

                        ═══════════════════════════════════════════════
                        TASK 1 — WASTE CLASSIFICATION & FACILITY ROUTING
                        ═══════════════════════════════════════════════
                        Identify the primary waste type and assign the correct FACILITY_KEY:

                        'DADUMAJRA_CBG'  → Wet/Organic waste:
                            Kitchen scraps, food leftovers, vegetable and fruit peels,
                            tea leaves, eggshells, cooked food, flowers, garden/garden waste.
                            This waste is biodegradable and goes to the Compressed Biogas plant.

                        'DADUMAJRA_RDF'  → Dry/Recyclable waste:
                            Clean plastic bottles, packaging material, paper, cardboard,
                            glass bottles, metal items, rubber, wood, textiles.
                            This is non-biodegradable but recyclable.

                        'SECTOR_25_CD'   → Construction & Demolition waste:
                            Bricks, concrete, tiles, sand, gravel, debris from construction.

                        'NIMBUA_TSDF'    → Special/Hazardous waste:
                            Expired medicines, e-waste (batteries, phone chargers, laptops,
                            CFLs, tube lights, bulbs), chemicals, pesticide bottles, paint
                            containers, broken thermometers, needles, syringes.
                            This is toxic waste requiring special treatment.

                        Set "facilityKey" to one of the four keys above.
                        Set "category" to a short label e.g. "Wet Waste", "Dry Waste",
                            "Hazardous", "Construction".
                        Set "department" to "MOH" for wet waste, "Engineering" for dry/CD,
                            "CPCC" for hazardous.
                        Set "resourcePotential" to e.g. "Biogas + Organic Manure",
                            "Recyclable Material", "RDF Fuel", "Special Treatment Required".

                        ═══════════════════════════════════════════════
                        TASK 2 — 4-BIN COMPLIANCE CHECK (SWM Rules 2026)
                        ═══════════════════════════════════════════════
                        Chandigarh's 4-bin system under SWM Rules 2026:

                        GREEN bin  → ONLY: kitchen/organic/wet waste listed in Task 1 CBG.
                                     Biodegradable. Used for composting/biogas.

                        BLUE bin   → ONLY: dry recyclables listed in Task 1 RDF.
                                     Must be clean/rinsed if soiled. Non-biodegradable.

                        RED bag    → ONLY: sanitary waste.
                                     Diapers, sanitary pads, tampons, condoms, bandages,
                                     cotton, used tissues, incontinence sheets.
                                     CRITICAL RULE: All items MUST be wrapped or pouched
                                     before placing in the red bag, as per SWM Rules 2026.
                                     Loose/unwrapped sanitary items = hygiene violation.

                        BLACK bin  → ONLY: domestic hazardous/special waste.
                                     Expired medicines, e-waste (batteries, chargers,
                                     bulbs, CFLs, tubes), chemicals, broken glass,
                                     pesticide bottles, paint containers.

                        Evaluate the submitted image against these rules:

                        "detectedBinType"    → One of: GREEN, BLUE, RED, BLACK, UNKNOWN.
                                               Set to UNKNOWN if no bin is visible or
                                               bin color is indeterminate.

                        "isCorrectBinType"   → true if the waste content matches
                                               the bin's designated category.
                                               false if wrong waste is in this bin type.

                        "hasCrossContamination" → true if conflicting waste types are
                                               visibly mixed. Examples:
                                               - Plastic bottle in green bin
                                               - Food waste in blue bin
                                               - Medicine in green bin
                                               false if waste appears correctly sorted.

                        "contaminationDetail"→ If hasCrossContamination is true, describe
                                               exactly what is wrong, e.g.
                                               "Plastic packaging visible in wet waste bin."
                                               Empty string "" if no contamination.

                        "isProperlyWrapped"  → ONLY relevant for RED bin submissions.
                                               true if sanitary items are wrapped/pouched.
                                               false if items are loose/unwrapped.
                                               For non-RED bins, always set to true.

                        ═══════════════════════════════════════════════
                        TASK 3 — ANTI-FRAUD & AUTHENTICITY CHECKS
                        ═══════════════════════════════════════════════
                        Detect attempts to cheat the system:

                        "isSuspicious" → Set to true if ANY of these apply:
                            - Image appears to be a stock photo or downloaded from internet
                            - Image is a screenshot of another photo
                            - Image is too dark, blurry, or obscured to assess properly
                            - Bin appears staged or artificially arranged
                            - Background is clearly not a real Indian home/street environment
                            false if the image appears to be a genuine real-time photo.

                        "locationConsistency" → HIGH: background clearly shows Indian
                                               residential/urban environment consistent
                                               with Chandigarh or North India.
                                               MEDIUM: environment is ambiguous but not
                                               clearly foreign or fake.
                                               LOW: background looks foreign, studio-shot,
                                               or clearly inconsistent with India.

                        ═══════════════════════════════════════════════
                        TASK 4 — CONFIDENCE SCORING
                        ═══════════════════════════════════════════════
                        "confidence" → Score from 0.0 to 1.0 reflecting how certain you
                                       are about your waste classification and bin assessment.
                                       0.9+ = very clear image, obvious waste type
                                       0.7-0.9 = reasonably clear, minor ambiguity
                                       0.5-0.7 = unclear image or mixed waste signals
                                       Below 0.5 = too unclear to assess reliably

                        ═══════════════════════════════════════════════
                        TASK 5 — EMPTY BIN DETECTION
                        ═══════════════════════════════════════════════
                        "isEmpty" → true if the bin contains NO visible waste at all.
                                    An empty bin photo is a cheating attempt —
                                    AI confidence will be high (clearly a bin) but
                                    there is nothing to verify segregation against.
                                    false if ANY waste is visible inside the bin.
                                    Note: even a small amount of correctly sorted
                                    waste makes isEmpty = false.

                        ═══════════════════════════════════════════════
                        TASK 6 — GENERAL DESCRIPTION
                        ═══════════════════════════════════════════════
                        "aiDescription" → 1-2 sentences describing what you see in
                                          the image and your compliance assessment.
                                          Be specific and factual.

                        ═══════════════════════════════════════════════
                        OUTPUT FORMAT — STRICTLY VALID JSON ONLY
                        ═══════════════════════════════════════════════
                        Return ONLY a valid JSON object. No preamble, no explanation,
                        no markdown, no code blocks. Just the raw JSON.

                        Required keys (all must be present):
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
                        """)
                        .media(MimeTypeUtils.IMAGE_JPEG, imageResource)
                )
                .call()
                .entity(WasteAnalysis.class);
    }
}