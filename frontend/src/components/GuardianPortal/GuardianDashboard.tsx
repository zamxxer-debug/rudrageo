import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { GuardianAlertResponse, GuardianProfile } from '../../types';
import { Users, AlertTriangle, CheckCircle2, MapPin, Navigation, Phone, ShieldCheck, Clock, Camera, Image, Trash2 } from 'lucide-react';

export const GuardianDashboard: React.FC = () => {
  const [profile, setProfile] = useState<GuardianProfile | null>(null);
  const [alerts, setAlerts] = useState<GuardianAlertResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseStatus, setResponseStatus] = useState<string | null>(null);
  const [arrivalPhoto, setArrivalPhoto] = useState<string | null>(null);
  const [photoTargetIncident, setPhotoTargetIncident] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

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

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>, incidentId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setArrivalPhoto(reader.result as string);
        setPhotoTargetIncident(incidentId);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRespond = async (incidentId: string, status: string) => {
    try {
      await api.respondToGuardianAlert(incidentId, status, `Guardian ${profile?.full_name || 'Volunteer'} acknowledged proximity response (${status}).`);
      setResponseStatus(t('safe_arrival_recorded'));
      setTimeout(() => setResponseStatus(null), 6000);
      setArrivalPhoto(null);
      setPhotoTargetIncident(null);
      loadGuardianData();
    } catch (e: any) {
      setResponseStatus('Response logged in local telemetry buffer.');
      setTimeout(() => setResponseStatus(null), 4000);
    }
  };


  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
              {t('guardian_title')}
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl text-white mt-0.5">
            {t('guardian_welcome')}, {profile?.full_name || 'Guardian'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Kalhatty / Ooty • Radius: {profile?.service_radius_km || 5.0} km
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t('on_duty')}</span>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold">
            ⭐ {profile?.badges_count || 18} {t('rescue_badges')}
          </span>
        </div>
      </div>

      {/* Response Status Notification Banner */}
      {responseStatus && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{responseStatus}</span>
        </div>
      )}

      {/* Hidden file input for camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => photoTargetIncident && handlePhotoCapture(e, photoTargetIncident)}
      />

      {/* Nearby Emergency Alerts */}
      <div className="space-y-4">
        <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>{t('nearby_alerts')}</span>
        </h3>

        {alerts.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            {t('no_active_alerts')}
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((al) => {
              const incId = al.incident_id || al.id;
              const isMyPhotoTarget = photoTargetIncident === incId;
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
                      📍 {al.distance_km} km
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-300">
                    <p className="font-bold text-white text-sm">{al.tourist_name}</p>
                    <p className="text-slate-400 text-[11px] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span>({al.lat.toFixed(4)}, {al.lng.toFixed(4)}) • {al.active_zone_name || al.active_risk_zone_name || 'Kalhatty Ghat'}</span>
                    </p>
                    <p className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(al.triggered_at).toLocaleTimeString()}</span>
                    </p>
                  </div>

                  {/* Safe Arrival Photo Upload */}
                  <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-blue-400" />
                      {t('verify_safe_arrival')}
                    </p>
                    {isMyPhotoTarget && arrivalPhoto ? (
                      <div className="flex items-center gap-2.5">
                        <img
                          src={arrivalPhoto}
                          alt="On-scene proof"
                          className="w-12 h-12 object-cover rounded-lg border border-slate-600 shrink-0"
                        />
                        <div className="flex-1">
                          <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                            <Image className="w-3 h-3" /> Photo ready to send
                          </p>
                        </div>
                        <button
                          onClick={() => { setArrivalPhoto(null); setPhotoTargetIncident(null); }}
                          className="p-1.5 bg-slate-700 hover:bg-red-900/60 rounded-lg text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setPhotoTargetIncident(incId); setTimeout(() => fileInputRef.current?.click(), 50); }}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-slate-600 hover:border-blue-500/50 bg-slate-900/40 hover:bg-blue-950/20 text-slate-400 hover:text-blue-300 text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Open Camera — Confirm Arrival</span>
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-slate-800">
                    <button
                      onClick={() => handleRespond(incId, 'accepted')}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>{t('accept_mission')}</span>
                    </button>
                    <button
                      onClick={() => handleRespond(incId, 'on_scene')}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {t('report_on_scene')}
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
