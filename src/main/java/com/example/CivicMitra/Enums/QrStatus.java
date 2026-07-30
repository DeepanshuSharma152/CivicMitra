package com.example.CivicMitra.Enums;

public enum QrStatus {

    /** Token exists, not expired, not yet consumed — OK to proceed. */
    VALID,

    /** Token was found but its expiry timestamp has passed. */
    EXPIRED,

    /** Token was previously consumed by another worker scan. */
    ALREADY_USED,

    /** Token string was not found in the database at all. */
    NOT_FOUND
}
