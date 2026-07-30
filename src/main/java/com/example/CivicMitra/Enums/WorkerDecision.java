package com.example.CivicMitra.Enums;

public enum WorkerDecision {

    /** Waste was collected successfully — QR consumed, streak updated. */
    ACCEPTED,

    /** Waste was not collected — bins not out, contaminated, or no access. */
    REJECTED,

    /** Some bins were collected but not all (e.g. hazardous bin missing). */
    PARTIAL,

    /** Worker was unable to reach the household (locked gate, road blocked, etc.). */
    UNABLE_TO_COLLECT
}
