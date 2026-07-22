package com.example.CivicMitra.Service;


import com.example.CivicMitra.Ai.response.WasteAnalysis;
import com.example.CivicMitra.model.complaints.ComplaintMetadata;
import org.springframework.stereotype.Service;


@Service
public class TrustService {
    private static final double EARTH_RADIUS_KM = 6371.0;

    public int calculateTrustScore(WasteAnalysis ai, Double deviceLat, Double deviceLng, double userRep, int upvotes, ComplaintMetadata meta) {
        int score = 50; // Base starting point

        // 1. AI Logic
        if (ai != null) {
            if ("HIGH".equals(ai.getLocationConsistency())) score += 15;
            if (ai.isSuspicious()) score -= 40;
            score += (int)(ai.getConfidence() * 10);
        }

        // 2. Proximity Check (Device vs Reported)
        if (deviceLat != null && deviceLng != null
                && meta != null
                && meta.getReportedLat() != null
                && meta.getReportedLng() != null) {
            double dist = haversine(deviceLat, deviceLng, meta.getReportedLat(), meta.getReportedLng());

            if (dist < 0.5) score += 20;      // Within 500m
            else if (dist > 5.0) score -= 40; // Over 5km away
        } else{
            // Edge Case: No GPS? We don't penalize, but we don't reward.
            // The score stays near 50-60, relying on AI and Upvotes.
            score -= 5;
        }

        // 3. User Reputation Factor
        score += (int)(userRep * 0.5);

        // 4. Community Validation (The "Rescuer")
        // Each upvote adds 5 points to the trust of THIS specific complaint
        score += (upvotes * 5);

        return Math.max(0, Math.min(100, score));
    }

    public double haversine(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
