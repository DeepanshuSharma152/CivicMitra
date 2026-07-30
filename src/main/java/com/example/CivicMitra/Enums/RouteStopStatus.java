package com.example.CivicMitra.Enums;

public enum RouteStopStatus {

    /** Stop has not been visited yet — default at route start. */
    PENDING,

    /** Worker visited and a CollectionLog entry was created (ACCEPTED or REJECTED). */
    COMPLETED,

    /** Worker did not visit within the expected time window. */
    MISSED,

    /** Stop was intentionally skipped by the supervisor (holiday, special instruction). */
    SKIPPED
}
