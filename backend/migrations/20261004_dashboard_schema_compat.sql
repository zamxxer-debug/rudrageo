-- Align legacy dashboard tables from supabase_schema.sql with the current ORM.
-- Legacy columns are retained and their values are copied into ORM columns.

ALTER TABLE public.sos_incidents
    ADD COLUMN IF NOT EXISTS tourist_id VARCHAR(36),
    ADD COLUMN IF NOT EXISTS active_risk_zone_id VARCHAR(36),
    ADD COLUMN IF NOT EXISTS offline_event_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(255),
    ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITHOUT TIME ZONE,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE;

UPDATE public.sos_incidents
SET tourist_id = tourist_profile_id
WHERE tourist_id IS NULL;

UPDATE public.sos_incidents AS incident
SET active_risk_zone_id = zone.id
FROM public.risk_zones AS zone
WHERE incident.active_risk_zone_id IS NULL
  AND incident.active_risk_zone_name = zone.name;

ALTER TABLE public.sos_incidents
    ALTER COLUMN tourist_profile_id DROP NOT NULL,
    ALTER COLUMN tourist_id SET NOT NULL;

ALTER TABLE public.incident_events
    ADD COLUMN IF NOT EXISTS actor_id VARCHAR(36),
    ADD COLUMN IF NOT EXISTS payload_json TEXT;

UPDATE public.incident_events
SET actor_id = actor_user_id
WHERE actor_id IS NULL;

UPDATE public.incident_events
SET payload_json = meta_json
WHERE payload_json IS NULL;

ALTER TABLE public.blockchain_records
    ADD COLUMN IF NOT EXISTS reference_id VARCHAR(36),
    ADD COLUMN IF NOT EXISTS canonical_hash VARCHAR(66),
    ADD COLUMN IF NOT EXISTS blockchain_tx_hash VARCHAR(66),
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'simulated',
    ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITHOUT TIME ZONE,
    ADD COLUMN IF NOT EXISTS payload_summary TEXT;

UPDATE public.blockchain_records
SET reference_id = COALESCE(incident_id, id),
    canonical_hash = COALESCE(payload_hash, merkle_root_hash, id),
    blockchain_tx_hash = COALESCE(tx_hash, id),
    timestamp = COALESCE(recorded_at::timestamp, CURRENT_TIMESTAMP)
WHERE reference_id IS NULL
   OR canonical_hash IS NULL
   OR blockchain_tx_hash IS NULL
   OR timestamp IS NULL;

ALTER TABLE public.blockchain_records
    ALTER COLUMN reference_id SET NOT NULL,
    ALTER COLUMN canonical_hash SET NOT NULL,
    ALTER COLUMN blockchain_tx_hash SET NOT NULL;

ALTER TABLE public.rescue_teams
    ADD COLUMN IF NOT EXISTS name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS specialization VARCHAR(50),
    ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS current_lat DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS current_lng DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(100) DEFAULT '4x4 Rescue Ambulance';

UPDATE public.rescue_teams
SET name = COALESCE(name, team_name),
    specialization = COALESCE(specialization, team_type),
    contact_number = COALESCE(contact_number, leader_phone),
    current_lat = COALESCE(current_lat, base_lat),
    current_lng = COALESCE(current_lng, base_lng);

ALTER TABLE public.rescue_teams
    ALTER COLUMN name SET NOT NULL,
    ALTER COLUMN specialization SET NOT NULL,
    ALTER COLUMN contact_number SET NOT NULL,
    ALTER COLUMN current_lat SET NOT NULL,
    ALTER COLUMN current_lng SET NOT NULL,
    ALTER COLUMN team_name DROP NOT NULL,
    ALTER COLUMN team_type DROP NOT NULL,
    ALTER COLUMN base_lat DROP NOT NULL,
    ALTER COLUMN base_lng DROP NOT NULL,
    ALTER COLUMN leader_name DROP NOT NULL,
    ALTER COLUMN leader_phone DROP NOT NULL;

ALTER TABLE public.rescue_dispatches
    ADD COLUMN IF NOT EXISTS team_id VARCHAR(36),
    ADD COLUMN IF NOT EXISTS notes TEXT;

UPDATE public.rescue_dispatches
SET team_id = COALESCE(team_id, rescue_team_id),
    notes = COALESCE(notes, dispatch_notes);

ALTER TABLE public.rescue_dispatches
    ALTER COLUMN rescue_team_id DROP NOT NULL,
    ALTER COLUMN team_id SET NOT NULL;

ALTER TABLE public.guardian_profiles
    ADD COLUMN IF NOT EXISTS verified_by_authority_id VARCHAR(36),
    ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS volunteer_type VARCHAR(100);

UPDATE public.guardian_profiles AS guardian
SET is_available = COALESCE(guardian.is_available, guardian.is_on_duty, TRUE),
    phone = COALESCE(guardian.phone, account.phone, ''),
    volunteer_type = COALESCE(guardian.volunteer_type, guardian.guardian_type, 'Community volunteer')
FROM public.users AS account
WHERE guardian.user_id = account.id;

UPDATE public.guardian_profiles
SET phone = COALESCE(phone, ''),
    volunteer_type = COALESCE(volunteer_type, 'Community volunteer'),
    is_available = COALESCE(is_available, TRUE);

ALTER TABLE public.guardian_profiles
    ALTER COLUMN phone SET NOT NULL,
    ALTER COLUMN guardian_type DROP NOT NULL,
    ALTER COLUMN is_on_duty DROP NOT NULL;

ALTER TABLE public.guardian_assignments
    ADD COLUMN IF NOT EXISTS guardian_id VARCHAR(36),
    ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITHOUT TIME ZONE,
    ADD COLUMN IF NOT EXISTS notes TEXT;

UPDATE public.guardian_assignments
SET guardian_id = COALESCE(guardian_id, guardian_profile_id),
    assigned_at = COALESCE(assigned_at, notified_at),
    notes = COALESCE(notes, guardian_notes);

ALTER TABLE public.guardian_assignments
    ALTER COLUMN guardian_profile_id DROP NOT NULL,
    ALTER COLUMN guardian_id SET NOT NULL;

ALTER TABLE public.risk_zones
    ADD COLUMN IF NOT EXISTS active_from VARCHAR(20),
    ADD COLUMN IF NOT EXISTS active_until VARCHAR(20);