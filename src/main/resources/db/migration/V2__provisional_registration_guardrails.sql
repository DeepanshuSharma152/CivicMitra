-- =============================================================================
-- Migration V2: Provisional Self-Registration with 3 Guardrails
-- Created: 2026-07-21
-- Description:
--   Adds provisional registration support to households table,
--   DPDP consent tracking to users table, and creates the
--   ward officer verification queue.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Extend households table
-- -----------------------------------------------------------------------------
ALTER TABLE households
    ADD COLUMN household_code       VARCHAR(30)  UNIQUE                                                                    NULL,
    ADD COLUMN verification_status  ENUM('PROVISIONAL','PENDING_VERIFICATION','VERIFIED','REJECTED') DEFAULT 'PROVISIONAL' NOT NULL,
    ADD COLUMN claimed_by_user_id   BIGINT                                                                                 NULL,
    ADD COLUMN registered_mobile    VARCHAR(15)                                                                            NULL,
    ADD COLUMN block_code           VARCHAR(20)                                                                            NULL,
    ADD COLUMN gps_locked           BOOLEAN      DEFAULT FALSE                                                             NOT NULL,
    ADD COLUMN gps_lock_lat         DOUBLE                                                                                 NULL,
    ADD COLUMN gps_lock_lng         DOUBLE                                                                                 NULL,
    ADD COLUMN verified_by_officer_id BIGINT                                                                               NULL,
    ADD COLUMN verified_at          TIMESTAMP                                                                              NULL,
    ADD COLUMN qr_sticker_code      VARCHAR(50)  UNIQUE                                                                    NULL,
    ADD INDEX  idx_household_code   (household_code),
    ADD INDEX  idx_verification_status (verification_status),
    ADD CONSTRAINT fk_household_claimed_by
        FOREIGN KEY (claimed_by_user_id) REFERENCES users(id);

-- -----------------------------------------------------------------------------
-- 2. Add DPDP consent tracking to users table
-- -----------------------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN dpdp_consent_given   BOOLEAN      DEFAULT FALSE NOT NULL,
    ADD COLUMN dpdp_consent_at      TIMESTAMP                  NULL,
    ADD COLUMN dpdp_consent_version VARCHAR(10)  DEFAULT '1.0' NOT NULL;

-- -----------------------------------------------------------------------------
-- 3. Create ward officer verification queue
-- -----------------------------------------------------------------------------
CREATE TABLE verification_queue (
    id                  BIGINT       PRIMARY KEY AUTO_INCREMENT,
    household_id        BIGINT       NOT NULL,
    assigned_officer_id BIGINT       NULL,
    status              ENUM('PENDING','IN_PROGRESS','VERIFIED','REJECTED') DEFAULT 'PENDING' NOT NULL,
    created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP              NOT NULL,
    due_date            TIMESTAMP    NULL,   -- 14 days from created_at
    completed_at        TIMESTAMP    NULL,
    officer_notes       TEXT         NULL,
    CONSTRAINT fk_vq_household
        FOREIGN KEY (household_id) REFERENCES households(household_id)
);
