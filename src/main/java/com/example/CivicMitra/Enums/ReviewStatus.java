package com.example.CivicMitra.Enums;

public enum ReviewStatus {

    /** No review has been requested — default state for accepted pickups. */
    NONE,

    /** Citizen has contested the rejection — awaiting supervisor review. */
    PENDING,

    /** Supervisor has reviewed the log entry and evidence photos. */
    REVIEWED,

    /** Supervisor overturned the worker's rejection — streak reinstated. */
    OVERTURNED
}
