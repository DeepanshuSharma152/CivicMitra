package com.example.CivicMitra.Enums;

public enum MunicipalityStatus {
    ACTIVE("active");

    private final String displayName;

    MunicipalityStatus (String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
