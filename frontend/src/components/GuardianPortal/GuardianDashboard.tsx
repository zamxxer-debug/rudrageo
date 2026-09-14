import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { GuardianAlertResponse, GuardianProfile } from '../../types';
import { Users, AlertTriangle, CheckCircle2, MapPin, Navigation, Phone, ShieldCheck, Clock } from 'lucide-react';

export const GuardianDashboard: React.FC = () => {
  const [profile, setProfile] = useState<GuardianProfile | null>(null);
  const [alerts, setAlerts] = useState<GuardianAlertResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGuardianData = async () => {
    setLoading(true);
    try {
      const [prof, alertList] = await Promise.all([
        api.getGuardianProfile(),
        api.getGuardianNearbyAlerts()
      ]);
      setProfile(prof);
      setAlerts(alertList || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuardianData();
    const interval = setInterval(loadGuardianData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleRespond = async (incidentId: string, status: string) => {
    await api.respondToGuardianAlert(incidentId, status, `Guardian ${profile?.full_name} accepted proximity response.`);
    loadGuardianData();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
              VERIFIED COMMUNITY GUARDIAN NETWORK
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl text-white mt-0.5">
            Welcome, {profile?.full_name || 'Guardian Volunteer'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Sector: Kalhatty / Ooty • Operating Radius: {profile?.service_radius_km || 5.0} km
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Available on Duty</span>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold">
            ⭐ {profile?.badges_count || 18} Rescue Badges
          </span>
        </div>
      </div>

      {/* Nearby Emergency Alerts */}
      <div className="space-y-4">
        <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>Nearby Emergency Alerts Within Your Sector</span>
        </h3>

        {alerts.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            No active distress signals in your immediate radius ({profile?.service_radius_km || 5} km). Stay alert.
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((al) => {
              const incId = al.incident_id || al.id;
              return (
                <div
                  key={incId}
                  className="p-5 rounded-2xl bg-slate-900 border-2 border-red-500/50 shadow-xl space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="font-mono font-bold text-white text-sm">{al.incident_code}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-500/20 text-red-300 border border-red-500/30">
                        CRITICAL SOS
                      </span>
                    </div>
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                      📍 {al.distance_km} km away from you
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-300">
                    <p className="font-bold text-white text-sm">Distressed Tourist: {al.tourist_name}</p>
                    <p className="text-slate-400 text-[11px] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span>Location: ({al.lat.toFixed(4)}, {al.lng.toFixed(4)}) • Sector: {al.active_zone_name || al.active_risk_zone_name || 'Kalhatty Ghat'}</span>
                    </p>
                    <p className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Triggered at: {new Date(al.triggered_at).toLocaleTimeString()}</span>
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleRespond(incId, 'accepted')}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Accept & Navigate to Tourist</span>
                    </button>
                    <button
                      onClick={() => handleRespond(incId, 'on_scene')}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Report On Scene
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
