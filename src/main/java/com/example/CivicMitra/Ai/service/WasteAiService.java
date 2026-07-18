package com.example.CivicMitra.Ai.service;

import com.example.CivicMitra.Ai.response.WasteAnalysis;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.*;

@Service
public class WasteAiService {

    @org.springframework.beans.factory.annotation.Value("${groq.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    public WasteAnalysis analyzeWasteImage(byte[] imageBytes, String originalFilename) {
        System.out.println("DEBUG: Sending image to Groq, original bytes: " + imageBytes.length);

        // Compress image to save tokens and prevent "invalid image data" errors from large resolutions
        imageBytes = compressImage(imageBytes);
        System.out.println("DEBUG: Compressed image bytes: " + imageBytes.length);

        // Step 1 — base64 encode
        String base64 = Base64.getEncoder().encodeToString(imageBytes);
        String mime = "image/jpeg"; // compressImage always returns jpeg

        // Step 2 — build request body for Groq API (OpenAI compatible format)
        Map<String, Object> textContent = Map.of(
            "type", "text",
            "text", buildPrompt()
        );
        Map<String, Object> imageContent = Map.of(
            "type", "image_url",
            "image_url", Map.of(
                "url", "data:" + mime + ";base64," + base64
            )
        );

        Map<String, Object> message = Map.of(
            "role", "user",
            "content", List.of(textContent, imageContent)
        );

        // Use HashMap (not Map.of) so we can add reasoning_effort to disable thinking.
        // Disabling thinking saves ~1700 completion tokens per call, keeping us under TPM limit.
        Map<String, Object> requestBody = new java.util.HashMap<>();
        requestBody.put("model", "qwen/qwen3.6-27b");
        requestBody.put("messages", List.of(message));
        requestBody.put("temperature", 0.1);
        requestBody.put("reasoning_effort", "none"); // Disable chain-of-thought to save tokens

        // Step 3 — set headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        // Step 4 — call Groq directly with retry
        int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                ResponseEntity<String> response = restTemplate.postForEntity(
                        GROQ_URL, entity, String.class);

                System.out.println("DEBUG: Groq status: " + response.getStatusCode());

                String body = response.getBody();
                System.out.println("DEBUG: Groq raw response: " + body);

                // Step 5 — extract content from OpenAI format
                JsonNode root = objectMapper.readTree(body);
                String rawContent = root
                        .path("choices")
                        .path(0)
                        .path("message")
                        .path("content")
                        .asText();

                System.out.println("DEBUG: AI content: " + rawContent);

                // Step 6 — clean (if needed) and parse JSON
                rawContent = cleanJson(rawContent);

                return objectMapper.readValue(rawContent, WasteAnalysis.class);

            } catch (Exception e) {
                System.err.println("ERROR calling Groq (Attempt " + attempt + "): " + e.getMessage());

                // Do NOT retry on image format errors — they will never recover
                if (e.getMessage() != null && e.getMessage().contains("invalid image data")) {
                    throw new RuntimeException(
                        "Unsupported or corrupt image. Please upload a JPEG, PNG, or WebP photo.", e);
                }

                if (attempt == maxRetries) {
                    throw new RuntimeException(
                            "Failed to get AI analysis after " + maxRetries + " attempts: " + e.getMessage(), e);
                }
                try {
                    long sleepMs = 2000L * attempt;
                    // Check if there is a "Please try again in X.Xs" message
                    if (e.getMessage() != null && e.getMessage().contains("Please try again in ")) {
                        String msg = e.getMessage();
                        int start = msg.indexOf("Please try again in ") + 20;
                        int end = msg.indexOf("s.", start);
                        if (start != -1 && end != -1) {
                            try {
                                double seconds = Double.parseDouble(msg.substring(start, end));
                                sleepMs = (long) (seconds * 1000) + 1500; // wait extra 1.5 secs to be safe
                                System.out.println("DEBUG: Extracted wait time, sleeping for " + sleepMs + " ms");
                            } catch (NumberFormatException nfe) {
                                sleepMs = 21000L; // Fallback
                            }
                        } else {
                            sleepMs = 21000L;
                        }
                    } else if (e.getMessage() != null && e.getMessage().contains("429 Too Many Requests")) {
                        sleepMs = 21000L;
                    }
                    Thread.sleep(sleepMs);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Thread interrupted during retry backoff", ie);
                }
            }
        }
        throw new RuntimeException("Failed to get AI analysis");
    }

    private byte[] compressImage(byte[] originalImage) {
        int maxDim = 384; // Smaller target = fewer tokens per API call
        try {
            java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(originalImage);
            java.awt.image.BufferedImage image = javax.imageio.ImageIO.read(bais);

            if (image == null) {
                // ImageIO can't decode the format (e.g. HEIC/WEBP).
                // Wrap bytes in a placeholder RGB image so we can still output a valid JPEG.
                System.out.println("DEBUG: ImageIO could not read format; forcing JPEG re-encode at " + maxDim + "px");
                // Decode via Toolkit as a last resort
                java.awt.Image awtImage = java.awt.Toolkit.getDefaultToolkit().createImage(originalImage);
                java.awt.MediaTracker tracker = new java.awt.MediaTracker(new java.awt.Container());
                tracker.addImage(awtImage, 0);
                tracker.waitForAll();
                int w = awtImage.getWidth(null);
                int h = awtImage.getHeight(null);
                if (w <= 0 || h <= 0) {
                    throw new RuntimeException(
                        "Image format not supported. Please upload a JPEG, PNG, or WebP image.");
                }
                image = new java.awt.image.BufferedImage(w, h, java.awt.image.BufferedImage.TYPE_INT_RGB);
                java.awt.Graphics2D g = image.createGraphics();
                g.drawImage(awtImage, 0, 0, null);
                g.dispose();
            }

            int width = image.getWidth();
            int height = image.getHeight();
            double scale = Math.min(1.0, Math.min((double) maxDim / width, (double) maxDim / height));
            int newWidth  = Math.max(1, (int) (width  * scale));
            int newHeight = Math.max(1, (int) (height * scale));

            java.awt.image.BufferedImage resized = new java.awt.image.BufferedImage(newWidth, newHeight, java.awt.image.BufferedImage.TYPE_INT_RGB);
            java.awt.Graphics2D g2d = resized.createGraphics();
            g2d.setRenderingHint(java.awt.RenderingHints.KEY_INTERPOLATION, java.awt.RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g2d.drawImage(image, 0, 0, newWidth, newHeight, null);
            g2d.dispose();

            // Write with explicit quality (0.80) to control output size
            javax.imageio.ImageWriter writer = javax.imageio.ImageIO.getImageWritersByFormatName("jpeg").next();
            javax.imageio.plugins.jpeg.JPEGImageWriteParam params = new javax.imageio.plugins.jpeg.JPEGImageWriteParam(null);
            params.setCompressionMode(javax.imageio.ImageWriteParam.MODE_EXPLICIT);
            params.setCompressionQuality(0.80f);
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            writer.setOutput(javax.imageio.ImageIO.createImageOutputStream(baos));
            writer.write(null, new javax.imageio.IIOImage(resized, null, null), params);
            writer.dispose();

            System.out.println("DEBUG: Compressed " + width + "x" + height + " -> " + newWidth + "x" + newHeight
                    + " JPEG, " + baos.size() + " bytes");
            return baos.toByteArray();
        } catch (Exception e) {
            System.err.println("Error compressing image: " + e.getMessage());
            return originalImage;
        }
    }

    private String cleanJson(String raw) {
        if (raw == null) throw new RuntimeException("AI returned null");

        // Remove <think>...</think> blocks which contain reasoning
        if (raw.contains("<think>")) {
            raw = raw.replaceAll("(?s)<think>.*?</think>", "");
        }

        raw = raw.strip();
        if (raw.startsWith("```json")) raw = raw.substring(7);
        else if (raw.startsWith("```")) raw = raw.substring(3);
        if (raw.endsWith("```"))
            raw = raw.substring(0, raw.length() - 3);
        raw = raw.strip();

        // Fix missing closing brace
        if (!raw.endsWith("}")) {
            if (raw.endsWith(",")) {
                raw = raw.substring(0, raw.length() - 1);
            }
            raw = raw + "\n}";
        }

        int start = raw.indexOf("{");
        int end = raw.lastIndexOf("}");
        if (start != -1 && end != -1 && end > start) {
            raw = raw.substring(start, end + 1);
        }

        return raw;
    }

    private String buildPrompt() {
        return """
SYSTEM ROLE:
You are a deterministic waste-bin image classifier for India's SWM Rules 2026.

OBJECTIVE:
Analyze ONE uploaded image and return EXACTLY ONE valid JSON object.

OUTPUT REQUIREMENTS:
- Output ONLY JSON.
- No markdown.
- No explanations.
- No reasoning.
- No extra text.
- No code fences.
- Every field is mandatory.
- If a value cannot be determined, use the closest valid value and reduce confidence.
- Confidence must be between 0.00 and 1.00.

CLASSIFICATION RULES

GREEN BIN
Waste:
- Food waste
- Vegetable waste
- Fruit waste
- Cooked food
- Garden waste
- Leaves
- Organic waste

Return:
category = "WET"
department = "MOH"
facilityKey = "DADUMAJRA_CBG"

--------------------------------

BLUE BIN
Waste:
- Paper
- Cardboard
- Plastic
- Metal
- Glass
- Dry recyclable packaging

Return:
category = "DRY"
department = "Engineering"
facilityKey = "DADUMAJRA_RDF"

--------------------------------

RED BAG
Waste:
- Sanitary pads
- Diapers
- Bandages
- Household biomedical waste

Return:
category = "SANITARY"
department = "CPCC"
facilityKey = "NIMBUA_TSDF"

--------------------------------

BLACK BIN
Waste:
- Batteries
- Paint
- Chemicals
- CFL
- Tube lights
- E-waste
- Hazardous waste

Return:
category = "HAZARDOUS"
department = "CPCC"
facilityKey = "NIMBUA_TSDF"

VALIDATION RULES

detectedBinType:
Allowed values:
GREEN
BLUE
RED
BLACK
UNKNOWN

resourcePotential:
HIGH
MEDIUM
LOW
NONE

locationConsistency:
INDIA
POSSIBLY_INDIA
UNKNOWN
NOT_INDIA

isSuspicious = true if:
- Screenshot
- Stock photo
- AI generated image
- Edited image
- Cartoon
- Advertisement
- No real waste bin
- Clearly outside India

Otherwise false.

isEmpty = true if:
- No visible waste inside the bin.

Otherwise false.

hasCrossContamination = true if:
- Waste does not belong in the detected bin.

Otherwise false.

contaminationDetail:
Short description.
Empty string if none.

isCorrectBinType:
true only if waste matches detected bin.

isProperlyWrapped:
Applicable only for sanitary waste.
true only if visibly wrapped.
Otherwise false.

aiDescription:
Maximum 20 words.
Describe only visible objects.
Do not guess.

Return EXACTLY this JSON:

{
  "category":"",
  "department":"",
  "facilityKey":"",
  "resourcePotential":"",
  "confidence":0.00,
  "locationConsistency":"",
  "isSuspicious":false,
  "aiDescription":"",
  "detectedBinType":"",
  "isCorrectBinType":true,
  "hasCrossContamination":false,
  "contaminationDetail":"",
  "isEmpty":false,
  "isProperlyWrapped":false
}
""";
    }
}