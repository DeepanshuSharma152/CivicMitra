package com.example.CivicMitra.Enums;

public enum ChandigarhFacility {
    DADUMAJRA_RDF("Dadumajra RDF & Pelletization Plant", "Engineering Dept", "Dry/Plastic", "30.750, 76.730"),
    DADUMAJRA_CBG("Dadumajra CBG (Indian Oil) Plant", "MOH Dept", "Wet/Organic", "30.751, 76.731"),
    SECTOR_25_CD("Sector 25 C&D Waste Recycling", "Engineering Dept", "Construction", "30.742, 76.748"),
    NIMBUA_TSDF("Nimbua TSDF (Punjab Waste Mgmt)", "CPCC", "Hazardous", "30.560, 76.850");

    public final String name;
    public final String department;
    public final String type;
    public final String coords;

    ChandigarhFacility(String name, String dept, String type, String coords) {
        this.name = name;
        this.department = dept;
        this.type = type;
        this.coords = coords;
    }
}
