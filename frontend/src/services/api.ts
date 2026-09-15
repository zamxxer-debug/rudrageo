import {
  enqueueOfflineEvent,
  getPendingOfflineEvents,
  markEventSynced,
  cacheSafetyZones,
  getCachedSafetyZones,
  cacheDigitalIdentity,
  getCachedDigitalIdentity
} from './offlineSync';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const AUTH_PROVIDER = import.meta.env.VITE_AUTH_PROVIDER || 'backend';

export function getAuthToken(): string | null {
  return sessionStorage.getItem('rudra_token') || localStorage.getItem('rudra_token');
}

export function setAuthToken(token: string) {
  if (sessionStorage.getItem('rudra_session_only') === 'true') {
    sessionStorage.setItem('rudra_token', token);
    localStorage.removeItem('rudra_token');
    return;
  }
  localStorage.setItem('rudra_token', token);
  sessionStorage.removeItem('rudra_token');
}

export function clearAuthToken() {
  localStorage.removeItem('rudra_token');
  sessionStorage.removeItem('rudra_token');
}

async function request(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorDetail = 'Network request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch (e) {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  register: async (data: any) => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getMe: async () => {
    return request('/auth/me');
  },

  getUsers: async () => {
    return request('/auth/users');
  },

  createUser: async (data: { email: string; password: string; full_name: string; phone?: string; role: string }) => {
    return request('/auth/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Digital Identity
  getMyDigitalId: async () => {
    try {
      const data = await request('/digital-id/my-id');
      await cacheDigitalIdentity(data);
      return data;
    } catch (err) {
      // Fallback to offline cached identity
      const cached = await getCachedDigitalIdentity();
      if (cached) return cached;
      throw err;
    }
  },

  verifyQRCode: async (qrPayload: string) => {
    return request('/digital-id/verify', {
      method: 'POST',
      body: JSON.stringify({ qr_payload: qrPayload })
    });
  },

  // Zones & Geofencing
  getZones: async (destinationId?: string) => {
    try {
      const query = destinationId ? `?destination_id=${destinationId}` : '';
      const data = await request(`/zones${query}`);
      await cacheSafetyZones(data);
      return data;
    } catch (err) {
      const cached = await getCachedSafetyZones();
      if (cached.length > 0) return cached;
      throw err;
    }
  },

  createZone: async (zoneData: any) => {
    return request('/zones', {
      method: 'POST',
      body: JSON.stringify(zoneData)
    });
  },

  getFacilities: async (destinationId?: string) => {
    const query = destinationId ? `?destination_id=${destinationId}` : '';
    return request(`/zones/facilities${query}`);
  },

  checkProximity: async (lat: number, lng: number, destinationId?: string) => {
    return request('/zones/check-proximity', {
      method: 'POST',
      body: JSON.stringify({ lat, lng, destination_id: destinationId })
    });
  },


  // AI Risk & Weather
  evaluateRisk: async (lat: number, lng: number, destinationId?: string) => {
    return request('/risk/evaluate', {
      method: 'POST',
      body: JSON.stringify({ lat, lng, destination_id: destinationId })
    });
  },

  askAIAssistant: async (message: string, lat?: number, lng?: number, riskScore?: number, language?: string) => {
    return request('/risk/assistant', {
      method: 'POST',
      body: JSON.stringify({
        message,
        current_lat: lat,
        current_lng: lng,
        current_risk_score: riskScore,
        language: language || 'en'
      })
    });
  },

  getWeather: async (lat?: number, lng?: number) => {
    const latVal = lat !== undefined ? lat : 11.4102;
    const lngVal = lng !== undefined ? lng : 76.6950;
    return request(`/risk/weather?lat=${latVal}&lng=${lngVal}`);
  },

  // SOS Emergency Operations
  triggerSOS: async (payload: { lat: number; lng: number; accuracy_meters?: number; battery_level?: number; notes?: string; image_data?: string }, isOnline: boolean = true) => {

    if (!isOnline) {
      // Offline mode: Enqueue to encrypted local IndexedDB
      const localId = await enqueueOfflineEvent('SOS_TRIGGER', payload);
      return {
        id: localId,
        incident_code: 'DRS-QUEUED-OFFLINE',
        tourist_name: 'You (Queued in Local Storage)',
        lat: payload.lat,
        lng: payload.lng,
        battery_level: payload.battery_level || 85,
        status: 'triggered',
        connectivity_mode: 'synced_from_offline',
        initial_risk_score: 90,
        timeline_events: [
          {
            id: localId,
            timestamp: new Date().toISOString(),
            event_type: 'offline_enqueued',
            actor_name: 'Local Device Client',
            description: 'SOS queued in local encrypted offline storage. Will automatically synchronize upon network restoration.'
          }
        ]
      };
    }

    return request('/sos/trigger', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getActiveIncidents: async () => {
    return request('/sos/active');
  },

  getIncidentDetail: async (incidentId: string) => {
    return request(`/sos/${incidentId}`);
  },

  updateIncidentStatus: async (incidentId: string, status: string, notes?: string, reason?: string) => {
    return request(`/sos/${incidentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes, reason })
    });
  },

  assignRescueTeam: async (incidentId: string, teamId: string, notes?: string) => {
    return request(`/sos/${incidentId}/assign-team`, {
      method: 'POST',
      body: JSON.stringify({ team_id: teamId, notes })
    });
  },

  assignGuardian: async (incidentId: string, guardianId: string, notes?: string) => {
    return request(`/sos/${incidentId}/assign-guardian`, {
      method: 'POST',
      body: JSON.stringify({ guardian_id: guardianId, notes })
    });
  },

  cancelSOS: async (incidentId: string, reason?: string) => {
    return request(`/sos/${incidentId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'False alarm / Resolved' })
    });
  },

  // Offline Synchronization Batch Engine
  flushOfflineQueue: async () => {
    const pending = await getPendingOfflineEvents();
    if (pending.length === 0) return { synced_count: 0 };

    const batch = {
      device_id: navigator.userAgent.substring(0, 50),
      events: pending.map(item => ({
        local_event_id: item.local_event_id,
        event_type: item.event_type,
        payload: item.payload,
        client_timestamp: item.client_timestamp
      }))
    };

    const res = await request('/sync/batch', {
      method: 'POST',
      body: JSON.stringify(batch)
    });

    if (res.results) {
      for (const r of res.results) {
        if (r.status === 'SYNCED' || r.status === 'DUPLICATE_IGNORED') {
          await markEventSynced(r.local_event_id);
        }
      }
    }
    return res;
  },

  // Community Guardian
  getGuardianProfile: async () => {
    return request('/guardian/profile');
  },

  getGuardianNearbyAlerts: async () => {
    return request('/guardian/nearby-alerts');
  },

  respondToGuardianAlert: async (incidentId: string, status: string, notes?: string) => {
    return request('/guardian/respond', {
      method: 'POST',
      body: JSON.stringify({ incident_id: incidentId, status, notes })
    });
  },

  // Hazards Crowdsourcing
  reportHazard: async (payload: { hazard_type: string; description: string; lat: number; lng: number; image_url?: string }, isOnline: boolean = true) => {
    if (!isOnline) {
      const localId = await enqueueOfflineEvent('HAZARD_REPORT', payload);
      return {
        id: localId,
        reporter_name: 'You (Offline)',
        hazard_type: payload.hazard_type,
        description: `[Offline Queued] ${payload.description}`,
        lat: payload.lat,
        lng: payload.lng,
        ai_classification: 'Offline Cached Hazard',
        ai_confidence: 0.85,
        status: 'reported',
        verified_by_authority: false,
        created_at: new Date().toISOString()
      };
    }

    return request('/hazards', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getHazards: async () => {
    return request('/hazards');
  },

  // Payment & UPI
  parseUPIQR: async (qrPayload: string) => {
    return request('/payment/parse-qr', {
      method: 'POST',
      body: JSON.stringify({ qr_payload: qrPayload })
    });
  },

  generateUPIIntent: async (amountInr: number, merchantName: string, foreignCurrency?: string) => {
    return request('/payment/generate-intent', {
      method: 'POST',
      body: JSON.stringify({
        amount_inr: amountInr,
        merchant_name: merchantName,
        foreign_currency: foreignCurrency || 'USD'
      })
    });
  },

  getExchangeRates: async () => {
    return request('/payment/exchange-rates');
  },

  // Blockchain Ledger Audit
  getBlockchainRecords: async () => {
    return request('/blockchain/records');
  },

  getIncidentBlockchainRecords: async (incidentId: string) => {
    return request(`/blockchain/incident/${incidentId}`);
  },

  verifyBlockchainIntegrity: async (recordId: string, currentPayload: any) => {
    return request('/blockchain/verify-integrity', {
      method: 'POST',
      body: JSON.stringify({ record_id: recordId, current_payload: currentPayload })
    });
  },

  // Operations Analytics
  getAnalyticsOverview: async () => {
    return request('/analytics/overview');
  },

  // Security Audit Logs
  getAuditLogs: async () => {
    return request('/audit/logs');
  },

  // Observability & Cloud Readiness Checks
  getHealth: async () => {
    return request('/health');
  },

  getDatabaseHealth: async () => {
    return request('/health/database');
  },

  getSupabaseHealth: async () => {
    return request('/health/supabase');
  }
};

