package com.example.CivicMitra.Enums;


public enum ComplaintStatus {
    PENDING("Pending"),
    UNDER_REVIEW("Under Review"),
    RESOLVED("Resolved"),
    REJECTED("Rejected"),
    VERIFIED("Verified"),
    PENDING_VOTE("PendingVote");
    private final String displayName;

    ComplaintStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
