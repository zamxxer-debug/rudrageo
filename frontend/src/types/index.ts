export type UserRole = 'tourist' | 'police' | 'tourism_officer' | 'guardian' | 'admin';

export type ConnectivityStatus = 'ONLINE' | 'LIMITED' | 'OFFLINE';

export interface Destination {
  id: string;
  name: string;
  region: string;
  state: string;
  country: string;
  center_lat: number;
  center_lng: number;
  is_active: boolean;
  tourist_footfall_category: string;
}

export interface GuardianAlertResponse {
  id: string;
  incident_id?: string;
  incident_code: string;
  tourist_name: string;
  nationality?: string;
  lat: number;
  lng: number;
  status: string;
  initial_risk_score: number;
  triggered_at: string;
  battery_level?: number;
  active_zone_name?: string;
  active_risk_zone_name?: string;
  distance_km?: number;
}


export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  drishti_id?: string;
  nationality?: string;
  is_foreign_tourist?: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship_type: string;
  phone: string;
  email?: string;
  notify_on_sos: boolean;
}

export interface DigitalIdData {
  drishti_id: string;
  tourist_name: string;
  nationality: string;
  destination: string;
  issued_at: string;
  expires_at: string;
  status: 'active' | 'revoked' | 'expired';
  qr_signature: string;
  qr_payload_encoded: string;
  emergency_contact?: string;
  blood_group?: string;
  is_foreign_tourist: boolean;
}

export interface RiskZone {
  id: string;
  destination_id: string;
  zone_code: string;
  name: string;
  description?: string;
  zone_type: 'landslide' | 'cliff' | 'flood' | 'avalanche' | 'wildlife' | 'border_military' | 'forest_restricted' | 'general_hazard';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  geometry_type: 'circle' | 'polygon';
  coordinates_json: string;
  radius_meters: number;
  warning_distance_meters: number;
  is_restricted: boolean;
  safety_instructions?: string;
}

export interface EmergencyFacility {
  id: string;
  name: string;
  facility_type: 'police_station' | 'hospital' | 'shelter' | 'forest_checkpost' | 'tourism_office';
  lat: number;
  lng: number;
  contact_number: string;
  is_24x7: boolean;
}

export interface WeatherData {
  temperature_c: number;
  rainfall_mm: number;
  wind_speed_kmh: number;
  visibility_meters: number;
  weather_condition: string;
  disaster_warning?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  event_type: string;
  actor_name: string;
  description: string;
  payload_json?: string;
}

export interface SOSIncident {
  id: string;
  incident_code: string;
  tourist_id: string;
  tourist_name: string;
  nationality: string;
  phone?: string;
  triggered_at: string;
  lat: number;
  lng: number;
  accuracy_meters: number;
  battery_level: number;
  connectivity_mode: 'online' | 'synced_from_offline' | 'sms_fallback';
  status: 'triggered' | 'acknowledged' | 'assigned' | 'responding' | 'rescued' | 'closed' | 'cancelled';
  initial_risk_score: number;
  active_risk_zone_name?: string;
  assigned_team_name?: string;
  assigned_guardian_name?: string;
  blockchain_tx_hash?: string;
  closed_at?: string;
  timeline_events: TimelineEvent[];
}

export interface RescueTeam {
  id: string;
  name: string;
  specialization: string;
  contact_number: string;
  current_lat: number;
  current_lng: number;
  status: 'available' | 'assigned' | 'en_route' | 'on_scene' | 'off_duty';
  members_count: number;
  vehicle_type: string;
}

export interface GuardianProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  verification_status: string;
  service_radius_km: number;
  current_lat: number;
  current_lng: number;
  is_available: boolean;
  volunteer_type: string;
  badges_count: number;
}

export interface RiskEvaluation {
  total_score: number;
  category: 'SAFE' | 'CAUTION' | 'HIGH' | 'CRITICAL';
  factors: {
    location_proximity_score: number;
    environmental_weather_score: number;
    terrain_elevation_score: number;
    historical_frequency_score: number;
    connectivity_isolation_score: number;
  };
  explanation: string;
  action_advisory: string;
}

export interface HazardReport {
  id: string;
  reporter_name: string;
  hazard_type: string;
  description: string;
  lat: number;
  lng: number;
  image_url?: string;
  ai_classification?: string;
  ai_confidence: number;
  status: string;
  verified_by_authority: boolean;
  created_at: string;
}

export interface OfflineSyncItem {
  local_event_id: string;
  event_type: 'SOS_TRIGGER' | 'HAZARD_REPORT' | 'BREADCRUMB';
  payload: any;
  client_timestamp: string;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retry_count: number;
}
