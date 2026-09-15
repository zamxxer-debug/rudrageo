-- ==============================================================================
-- RUDRA (DRISHTI) PLATFORM - SUPABASE POSTGRESQL DATABASE SCHEMA
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'tourist',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS destinations (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL DEFAULT 'India',
    center_lat DOUBLE PRECISION NOT NULL,
    center_lng DOUBLE PRECISION NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    tourist_footfall_category VARCHAR(50) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tourist_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nationality VARCHAR(100) NOT NULL DEFAULT 'Indian',
    is_foreign_tourist BOOLEAN NOT NULL DEFAULT FALSE,
    passport_hash VARCHAR(255),
    blood_group VARCHAR(10),
    medical_notes TEXT,
    preferred_language VARCHAR(20) DEFAULT 'en',
    current_destination_id VARCHAR(36) REFERENCES destinations(id) ON DELETE SET NULL,
    location_sharing_consent BOOLEAN NOT NULL DEFAULT TRUE,
    last_known_lat DOUBLE PRECISION,
    last_known_lng DOUBLE PRECISION,
    last_known_altitude_m DOUBLE PRECISION,
    last_ping_at TIMESTAMP WITH TIME ZONE,
    current_risk_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS digital_identities (
    id VARCHAR(36) PRIMARY KEY,
    tourist_profile_id VARCHAR(36) UNIQUE NOT NULL REFERENCES tourist_profiles(id) ON DELETE CASCADE,
    drishti_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    qr_payload_encoded TEXT NOT NULL,
    qr_signature VARCHAR(255) NOT NULL,
    tamper_proof_hash VARCHAR(255) NOT NULL,
    is_synced_blockchain BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
    id VARCHAR(36) PRIMARY KEY,
    tourist_profile_id VARCHAR(36) NOT NULL REFERENCES tourist_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship_type VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    notify_on_sos BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS location_breadcrumbs (
    id VARCHAR(36) PRIMARY KEY,
    tourist_profile_id VARCHAR(36) NOT NULL REFERENCES tourist_profiles(id) ON DELETE CASCADE,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    accuracy_meters DOUBLE PRECISION,
    altitude_meters DOUBLE PRECISION,
    battery_level INTEGER,
    connectivity_mode VARCHAR(50) DEFAULT 'ONLINE',
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS risk_zones (
    id VARCHAR(36) PRIMARY KEY,
    destination_id VARCHAR(36) NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
    zone_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    zone_type VARCHAR(50) NOT NULL,
    risk_level VARCHAR(50) NOT NULL,
    geometry_type VARCHAR(50) NOT NULL DEFAULT 'circle',
    coordinates_json TEXT NOT NULL,
    radius_meters DOUBLE PRECISION DEFAULT 250.0,
    warning_distance_meters DOUBLE PRECISION DEFAULT 100.0,
    is_restricted BOOLEAN NOT NULL DEFAULT FALSE,
    safety_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emergency_facilities (
    id VARCHAR(36) PRIMARY KEY,
    destination_id VARCHAR(36) NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(50) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    contact_number VARCHAR(50) NOT NULL,
    is_24x7 BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS weather_snapshots (
    id VARCHAR(36) PRIMARY KEY,
    destination_id VARCHAR(36) NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    temperature_c DOUBLE PRECISION NOT NULL,
    rainfall_mm DOUBLE PRECISION NOT NULL,
    wind_speed_kmh DOUBLE PRECISION NOT NULL,
    humidity_percent DOUBLE PRECISION NOT NULL,
    visibility_meters DOUBLE PRECISION NOT NULL,
    weather_condition VARCHAR(100) NOT NULL,
    landslide_risk_score INTEGER NOT NULL DEFAULT 10,
    flash_flood_risk_score INTEGER NOT NULL DEFAULT 5,
    disaster_warning TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sos_incidents (
    id VARCHAR(36) PRIMARY KEY,
    incident_code VARCHAR(100) UNIQUE NOT NULL,
    tourist_profile_id VARCHAR(36) NOT NULL REFERENCES tourist_profiles(id) ON DELETE CASCADE,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    altitude_m DOUBLE PRECISION,
    accuracy_meters DOUBLE PRECISION,
    battery_level INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'triggered',
    trigger_source VARCHAR(50) NOT NULL DEFAULT 'manual_app',
    connectivity_mode VARCHAR(50) NOT NULL DEFAULT 'online',
    initial_risk_score INTEGER NOT NULL DEFAULT 85,
    active_risk_zone_name VARCHAR(255),
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    merkle_root_hash VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS incident_events (
    id VARCHAR(36) PRIMARY KEY,
    incident_id VARCHAR(36) NOT NULL REFERENCES sos_incidents(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    actor_user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    actor_name VARCHAR(255),
    description TEXT NOT NULL,
    meta_json TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS risk_score_logs (
    id VARCHAR(36) PRIMARY KEY,
    tourist_profile_id VARCHAR(36) NOT NULL REFERENCES tourist_profiles(id) ON DELETE CASCADE,
    total_score INTEGER NOT NULL,
    terrain_factor INTEGER NOT NULL,
    weather_factor INTEGER NOT NULL,
    isolation_factor INTEGER NOT NULL,
    time_of_day_factor INTEGER NOT NULL,
    speed_factor INTEGER NOT NULL,
    explanation TEXT,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rescue_teams (
    id VARCHAR(36) PRIMARY KEY,
    destination_id VARCHAR(36) NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
    team_name VARCHAR(255) NOT NULL,
    team_type VARCHAR(100) NOT NULL,
    base_lat DOUBLE PRECISION NOT NULL,
    base_lng DOUBLE PRECISION NOT NULL,
    leader_name VARCHAR(255) NOT NULL,
    leader_phone VARCHAR(50) NOT NULL,
    members_count INTEGER NOT NULL DEFAULT 4,
    status VARCHAR(50) NOT NULL DEFAULT 'available',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS rescue_dispatches (
    id VARCHAR(36) PRIMARY KEY,
    incident_id VARCHAR(36) NOT NULL REFERENCES sos_incidents(id) ON DELETE CASCADE,
    rescue_team_id VARCHAR(36) NOT NULL REFERENCES rescue_teams(id) ON DELETE CASCADE,
    dispatched_by_user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'dispatched',
    dispatched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    eta_minutes INTEGER DEFAULT 15,
    arrived_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    dispatch_notes TEXT
);

CREATE TABLE IF NOT EXISTS guardian_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'verified',
    guardian_type VARCHAR(100) NOT NULL DEFAULT 'community_volunteer',
    service_radius_km DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    is_on_duty BOOLEAN NOT NULL DEFAULT TRUE,
    badges_count INTEGER NOT NULL DEFAULT 0,
    successful_rescues_count INTEGER NOT NULL DEFAULT 0,
    rating DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guardian_assignments (
    id VARCHAR(36) PRIMARY KEY,
    incident_id VARCHAR(36) NOT NULL REFERENCES sos_incidents(id) ON DELETE CASCADE,
    guardian_profile_id VARCHAR(36) NOT NULL REFERENCES guardian_profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'alerted',
    distance_km DOUBLE PRECISION NOT NULL,
    notified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    arrived_at TIMESTAMP WITH TIME ZONE,
    guardian_notes TEXT
);

CREATE TABLE IF NOT EXISTS hazard_reports (
    id VARCHAR(36) PRIMARY KEY,
    reporter_user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    hazard_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    image_url TEXT,
    ai_classification VARCHAR(100),
    ai_confidence DOUBLE PRECISION,
    status VARCHAR(50) NOT NULL DEFAULT 'reported',
    verified_by_authority BOOLEAN NOT NULL DEFAULT FALSE,
    upvotes INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blockchain_records (
    id VARCHAR(36) PRIMARY KEY,
    incident_id VARCHAR(36) REFERENCES sos_incidents(id) ON DELETE SET NULL,
    record_type VARCHAR(100) NOT NULL,
    block_number INTEGER NOT NULL,
    merkle_root_hash VARCHAR(255) NOT NULL,
    payload_hash VARCHAR(255) NOT NULL,
    prev_hash VARCHAR(255) NOT NULL,
    tx_hash VARCHAR(255) NOT NULL,
    gas_used INTEGER DEFAULT 21000,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    actor_user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    actor_email VARCHAR(255),
    actor_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    ip_address VARCHAR(50),
    payload_json TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS offline_sync_queues (
    id VARCHAR(36) PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    local_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload_json TEXT NOT NULL,
    client_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sync_status VARCHAR(50) NOT NULL DEFAULT 'PROCESSED'
);

CREATE TABLE IF NOT EXISTS payment_transactions (
    id VARCHAR(36) PRIMARY KEY,
    tourist_user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    merchant_vpa VARCHAR(255) NOT NULL,
    merchant_name VARCHAR(255) NOT NULL,
    amount_inr DOUBLE PRECISION NOT NULL,
    foreign_currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    amount_foreign DOUBLE PRECISION NOT NULL,
    exchange_rate DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    upi_ref_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_digital_identities_drishti_id ON digital_identities(drishti_id);
CREATE INDEX IF NOT EXISTS idx_sos_incidents_status ON sos_incidents(status);
CREATE INDEX IF NOT EXISTS idx_sos_incidents_incident_code ON sos_incidents(incident_code);
CREATE INDEX IF NOT EXISTS idx_hazard_reports_status ON hazard_reports(status);
CREATE INDEX IF NOT EXISTS idx_risk_zones_risk_level ON risk_zones(risk_level);
