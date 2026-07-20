package com.example.CivicMitra.Ai.service;

import com.example.CivicMitra.Ai.response.WasteAnalysis;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Calls OpenRouter's OpenAI-compatible API for waste image analysis.
 * Uses google/gemini-2.0-flash-exp:free — free vision model, no thinking-mode overhead.
 *
 * OpenRouter aggregates many models under one API key and one endpoint,
 * with generous free tiers and no per-minute token limits for low-traffic apps.
 * Sign up and get a free key at: https://openrouter.ai
 */
@Service
public class WasteAiService {

    private static final Logger log = LoggerFactory.getLogger(WasteAiService.class);

    private static final String OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

    /**
     * Free vision models tried in order. If one is rate-limited (429), the next is tried.
     * All use different upstream providers so rate limits are independent.
     */
    private static final List<String> MODELS = Arrays.asList(
        "nvidia/nemotron-nano-12b-v2-vl:free",   // NVIDIA backend
        "google/gemma-4-31b-it:free",              // Google AI Studio backend
        "google/gemma-4-26b-a4b-it:free"           // Google AI Studio backend (alt)
    );

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

            Required JSON schema (return this exact structure, no extra keys):
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

    @Value("${openrouter.api.key}")
    private String openRouterApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public WasteAnalysis analyzeWasteImage(byte[] imageBytes, String originalFilename) {
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openRouterApiKey);
        headers.set("HTTP-Referer", "https://civicmitra.app");
        headers.set("X-Title", "CivicMitra Waste Auditor");

        Exception lastException = null;

        for (String model : MODELS) {
            try {
                log.info("Trying vision model: {}", model);
                WasteAnalysis result = callModel(model, base64Image, headers);
                log.info("Success with model: {}", model);
                return result;
            } catch (Exception e) {
                String msg = e.getMessage() != null ? e.getMessage() : "";
                if (msg.contains("429") || msg.contains("rate") || msg.contains("Rate") || msg.contains("quota")) {
                    log.warn("Model {} rate-limited, trying next. Reason: {}", model, msg);
                    lastException = e;
                } else {
                    // Non-rate-limit error (bad JSON, 4xx other than 429, etc.) — fail fast
                    throw new RuntimeException("Vision analysis failed with model " + model + ": " + e.getMessage(), e);
                }
            }
        }

        throw new RuntimeException(
            "All vision models are rate-limited. Please wait a minute and retry. Last error: " +
            (lastException != null ? lastException.getMessage() : "unknown"), lastException
        );
    }

    private WasteAnalysis callModel(String model, String base64Image, HttpHeaders headers) throws Exception {
        // OpenRouter uses the standard OpenAI chat-completions format with image_url content parts.
        Map<String, Object> requestBody = Map.of(
            "model", model,
            "temperature", 0.1,
            "max_tokens", 1024,
            "messages", List.of(
                Map.of("role", "user",
                       "content", List.of(
                           Map.of("type", "text",
                                  "text", WASTE_ANALYSIS_PROMPT),
                           Map.of("type", "image_url",
                                  "image_url", Map.of(
                                      "url", "data:image/jpeg;base64," + base64Image
                                  ))
                       ))
            )
        );

        ResponseEntity<String> response = restTemplate.exchange(
            OPENROUTER_URL, HttpMethod.POST,
            new HttpEntity<>(requestBody, headers),
            String.class
        );

        // Parse standard OpenAI response envelope: choices[0].message.content
        JsonNode root = objectMapper.readTree(response.getBody());
        String raw = root
            .path("choices").get(0)
            .path("message")
            .path("content")
            .asText();

        return objectMapper.readValue(cleanJson(raw), WasteAnalysis.class);
    }

    /**
     * Strips optional markdown code fences and extracts the first valid JSON object.
     */
    private String cleanJson(String raw) {
        if (raw == null || raw.isBlank())
            throw new RuntimeException("OpenRouter returned empty content");

        raw = raw.strip();

        if (raw.startsWith("```json")) raw = raw.substring(7);
        else if (raw.startsWith("```")) raw = raw.substring(3);
        if (raw.endsWith("```")) raw = raw.substring(0, raw.length() - 3);

        raw = raw.strip();

        int start = raw.indexOf("{");
        int end   = raw.lastIndexOf("}");
        if (start != -1 && end != -1 && end > start) {
            raw = raw.substring(start, end + 1);
        }

        return raw;
    }
}
