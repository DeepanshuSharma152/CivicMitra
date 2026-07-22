package com.example.CivicMitra.Ai.service;

import com.example.CivicMitra.Ai.response.WasteAnalysis;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class WasteAiService {

    private static final Logger log = LoggerFactory.getLogger(WasteAiService.class);

    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ollama.model:gemma3:4b}")
    private String ollamaModel;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String MULTI_IMAGE_PROMPT = """
        You are a municipal solid-waste compliance auditor for Chandigarh, India.
        You are given 4 photos of a household's waste bins, in this EXACT order:
        
        Image 1 = GREEN bin (wet/organic waste: food scraps, peels, cooked food, flowers, garden waste)
        Image 2 = BLUE bin (dry recyclables: plastic, paper, cardboard, glass, metal, rubber, wood, textile)
        Image 3 = RED bin (sanitary waste: diapers, napkins, pads — MUST be wrapped/pouched)
        Image 4 = BLACK bin (domestic hazardous: medicines, e-waste, batteries, bulbs, chemicals, paint, sharps)
        
        Analyze EACH image independently. For every image, evaluate:
        1. Visible waste materials and whether waste is actually present.
        2. Whether the waste matches the expected bin color/type.
        3. Cross-contamination (e.g., plastic in green bin, food in blue bin).
        4. Fraud/suspicion: stock photos, screenshots, empty bins, staged scenes, blur, darkness, non-Indian setting.
        5. For RED bin: whether sanitary items are properly wrapped.
        6. Image quality and visual certainty.
        
        Facility routing rules:
        - Wet/organic -> DADUMAJRA_CBG, Wet Waste, MOH, Biogas + Organic Manure
        - Dry recyclable -> DADUMAJRA_RDF, Dry Waste, Engineering, Recyclable Material
        - Construction -> SECTOR_25_CD, Construction, Engineering, C&D Recycling
        - Hazardous/special -> NIMBUA_TSDF, Hazardous, CPCC, Special Treatment Required
        
        Return a single top-level JSON ARRAY `[ ... ]` containing one object for each image provided (in order: GREEN, BLUE, RED, BLACK).
        Do NOT wrap the array inside an object and do NOT output a single object.
        Do NOT use markdown codeblock wrappers, comments, or explanatory text outside the JSON array.
        
        Each object must follow this exact schema:
        {
          "binType": "GREEN|BLUE|RED|BLACK",
          "detectedBinType": "GREEN|BLUE|RED|BLACK|UNKNOWN",
          "isCorrectBinType": true|false,
          "hasCrossContamination": true|false,
          "contaminationDetail": "describe issue or empty string",
          "isEmpty": true|false,
          "isSuspicious": true|false,
          "isProperlyWrapped": true|false,
          "locationConsistency": "HIGH|MEDIUM|LOW",
          "confidence": 0.0,
          "category": "",
          "department": "",
          "facilityKey": "",
          "resourcePotential": "",
          "aiDescription": "one concise sentence"
        }
        """;

    /**
     * Analyzes all 4 bin images in a SINGLE Ollama call.
     * Returns a list of WasteAnalysis in the same order as the input images.
     */
    public List<WasteAnalysis> analyzeAllBins(List<ImagePayload> images) {
        if (images == null || images.isEmpty()) {
            throw new IllegalArgumentException("No images provided");
        }

        List<String> base64Images = images.stream()
                .map(img -> Base64.getEncoder().encodeToString(img.getImageBytes()))
                .toList();

        // Build Ollama chat message with multiple images
        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", MULTI_IMAGE_PROMPT);
        message.put("images", base64Images);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", ollamaModel);
        requestBody.put("messages", List.of(message));
        requestBody.put("stream", false);
        requestBody.put("format", "json"); // Force JSON output
        requestBody.put("options", Map.of("temperature", 0.1));

        try {
            log.info("Calling Ollama with {} images in single prompt...", images.size());
            long start = System.currentTimeMillis();

            ResponseEntity<String> response = restTemplate.postForEntity(
                    ollamaBaseUrl + "/api/chat",
                    new HttpEntity<>(requestBody),
                    String.class
            );

            long duration = System.currentTimeMillis() - start;
            log.info("Ollama multi-image inference took {}ms", duration);

            return parseMultiImageResponse(response.getBody(), images);
        } catch (Exception e) {
            log.error("Ollama multi-image call failed: {}", e.getMessage());
            throw new RuntimeException("AI analysis failed: " + e.getMessage(), e);
        }
    }

    private List<WasteAnalysis> parseMultiImageResponse(String responseBody, List<ImagePayload> images) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        String raw = root.path("message").path("content").asText();

        if (raw == null || raw.isBlank()) {
            throw new RuntimeException("Ollama returned empty content");
        }

        String cleaned = cleanJson(raw);
        JsonNode parsedNode = objectMapper.readTree(cleaned);

        JsonNode arrayNode = null;
        if (parsedNode.isArray()) {
            arrayNode = parsedNode;
        } else if (parsedNode.isObject()) {
            // Check if there is an array property inside the object (e.g. "analyses", "results", "bins", "items", "data")
            Iterator<String> fieldNames = parsedNode.fieldNames();
            while (fieldNames.hasNext()) {
                String fieldName = fieldNames.next();
                JsonNode child = parsedNode.get(fieldName);
                if (child != null && child.isArray()) {
                    arrayNode = child;
                    break;
                }
            }
        }

        List<WasteAnalysis> results = new ArrayList<>();

        if (arrayNode != null && arrayNode.isArray()) {
            if (arrayNode.size() != images.size()) {
                log.warn("Ollama returned {} results for {} images. Padding or truncating.", arrayNode.size(), images.size());
            }
            for (int i = 0; i < images.size(); i++) {
                if (i < arrayNode.size()) {
                    WasteAnalysis analysis = objectMapper.treeToValue(arrayNode.get(i), WasteAnalysis.class);
                    analysis.setBinType(images.get(i).getBinType());
                    results.add(analysis);
                } else {
                    results.add(buildFallbackAnalysis(images.get(i).getBinType()));
                }
            }
        } else if (parsedNode.isObject()) {
            log.warn("Ollama returned a single JSON object instead of an array for {} images", images.size());
            WasteAnalysis singleAnalysis = objectMapper.treeToValue(parsedNode, WasteAnalysis.class);
            singleAnalysis.setBinType(images.get(0).getBinType());
            results.add(singleAnalysis);

            for (int i = 1; i < images.size(); i++) {
                results.add(buildFallbackAnalysis(images.get(i).getBinType()));
            }
        } else {
            throw new RuntimeException("Unexpected JSON structure from Ollama: " + cleaned.substring(0, Math.min(200, cleaned.length())));
        }

        return results;
    }

    private WasteAnalysis buildFallbackAnalysis(String binType) {
        WasteAnalysis fallback = new WasteAnalysis();
        fallback.setBinType(binType);
        fallback.setDetectedBinType("UNKNOWN");
        fallback.setCorrectBinType(true);
        fallback.setConfidence(0.5);
        fallback.setAiDescription("Fallback evaluation for " + binType + " bin");
        return fallback;
    }

    private String cleanJson(String raw) {
        raw = raw.strip();

        if (raw.startsWith("```json")) raw = raw.substring(7);
        else if (raw.startsWith("```")) raw = raw.substring(3);
        if (raw.endsWith("```")) raw = raw.substring(0, raw.length() - 3);
        raw = raw.strip();

        int startArray = raw.indexOf("[");
        int endArray = raw.lastIndexOf("]");
        int startObj = raw.indexOf("{");
        int endObj = raw.lastIndexOf("}");

        if (startArray != -1 && endArray != -1 && endArray > startArray) {
            if (startObj == -1 || startArray < startObj) {
                return raw.substring(startArray, endArray + 1);
            }
        }
        if (startObj != -1 && endObj != -1 && endObj > startObj) {
            return raw.substring(startObj, endObj + 1);
        }

        return raw;
    }

    // DTO to pair image bytes with expected bin type
    public static class ImagePayload {
        private final byte[] imageBytes;
        private final String binType;

        public ImagePayload(byte[] imageBytes, String binType) {
            this.imageBytes = imageBytes;
            this.binType = binType;
        }

        public byte[] getImageBytes() { return imageBytes; }
        public String getBinType() { return binType; }
    }
}