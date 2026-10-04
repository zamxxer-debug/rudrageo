-- Bring databases created from the legacy supabase_schema.sql in line with
-- the columns used by the current SQLAlchemy auth models. Existing rows stay.

ALTER TABLE destinations
    ADD COLUMN IF NOT EXISTS default_zoom INTEGER DEFAULT 13,
    ADD COLUMN IF NOT EXISTS emergency_helpline VARCHAR(50) DEFAULT '112';

ALTER TABLE tourist_profiles
    ADD COLUMN IF NOT EXISTS passport_token VARCHAR(255),
    ADD COLUMN IF NOT EXISTS dob VARCHAR(20),
    ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS primary_language VARCHAR(50) DEFAULT 'English',
    ADD COLUMN IF NOT EXISTS travel_start_date VARCHAR(20),
    ADD COLUMN IF NOT EXISTS travel_end_date VARCHAR(20),
    ADD COLUMN IF NOT EXISTS accommodation_address TEXT,
    ADD COLUMN IF NOT EXISTS medical_notes_encrypted TEXT,
    ADD COLUMN IF NOT EXISTS privacy_consent_at TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE tourist_profiles
    ALTER COLUMN location_sharing_consent DROP DEFAULT;
ALTER TABLE tourist_profiles
    ALTER COLUMN location_sharing_consent TYPE VARCHAR(50)
    USING location_sharing_consent::text;
ALTER TABLE tourist_profiles
    ALTER COLUMN location_sharing_consent SET DEFAULT 'emergency_only';

ALTER TABLE digital_identities
    ADD COLUMN IF NOT EXISTS tourist_id VARCHAR(36),
    ADD COLUMN IF NOT EXISTS revoked_reason VARCHAR(255);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'digital_identities'
          AND column_name = 'tourist_profile_id'
    ) THEN
        EXECUTE 'UPDATE digital_identities SET tourist_id = tourist_profile_id WHERE tourist_id IS NULL';
        EXECUTE 'ALTER TABLE digital_identities ALTER COLUMN tourist_profile_id DROP NOT NULL';
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'digital_identities'
              AND column_name = 'tamper_proof_hash'
        ) THEN
            EXECUTE $migration$ALTER TABLE digital_identities ALTER COLUMN tamper_proof_hash SET DEFAULT ''$migration$;
        END IF;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_digital_identities_tourist_id
    ON digital_identities(tourist_id);

ALTER TABLE emergency_contacts
    ADD COLUMN IF NOT EXISTS tourist_id VARCHAR(36),
    ADD COLUMN IF NOT EXISTS priority_order INTEGER DEFAULT 1;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'emergency_contacts'
          AND column_name = 'tourist_profile_id'
    ) THEN
        EXECUTE 'UPDATE emergency_contacts SET tourist_id = tourist_profile_id WHERE tourist_id IS NULL';
        EXECUTE 'ALTER TABLE emergency_contacts ALTER COLUMN tourist_profile_id DROP NOT NULL';
    END IF;
END $$;

ALTER TABLE audit_logs
    ADD COLUMN IF NOT EXISTS user_id VARCHAR(36),
    ADD COLUMN IF NOT EXISTS user_agent VARCHAR(255),
    ADD COLUMN IF NOT EXISTS details_json TEXT;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'audit_logs'
          AND column_name = 'actor_user_id'
    ) THEN
        EXECUTE 'UPDATE audit_logs SET user_id = actor_user_id WHERE user_id IS NULL';
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'audit_logs'
          AND column_name = 'payload_json'
    ) THEN
        EXECUTE 'UPDATE audit_logs SET details_json = payload_json WHERE details_json IS NULL';
    END IF;
END $$;