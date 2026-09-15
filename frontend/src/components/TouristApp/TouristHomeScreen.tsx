import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { WeatherData, RiskEvaluation } from '../../types';
import {
  AlertOctagon,
  Map,
  QrCode,
  ShieldCheck,
  CreditCard,
  Bot,
  AlertTriangle,
  CloudRain,
  Compass,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  PhoneCall
} from 'lucide-react';
import { DigitalIdModal } from './DigitalIdModal';
import { EmergencySOSModal } from './EmergencySOSModal';
import { SafetyMapScreen } from './SafetyMapScreen';
import { PayInIndiaModal } from './PayInIndiaModal';
import { DrishtiAIAssistantModal } from './DrishtiAIAssistantModal';
import { HazardReportModal } from './HazardReportModal';

interface TouristHomeScreenProps {
  currentLat: number;
  currentLng: number;
  onOpenSOSModal: () => void;
  isSOSOpen: boolean;
  onCloseSOSModal: () => void;
  isDigitalIdOpen: boolean;
  onOpenDigitalIdModal?: () => void;
  onCloseDigitalIdModal: () => void;
  onLocationSelect: (lat: number, lng: number) => void;
}

export const TouristHomeScreen: React.FC<TouristHomeScreenProps> = ({
  currentLat,
  currentLng,
  onOpenSOSModal,
  isSOSOpen,
  onCloseSOSModal,
  isDigitalIdOpen,
  onOpenDigitalIdModal,
  onCloseDigitalIdModal,
  onLocationSelect
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'map'>('home');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [riskEval, setRiskEval] = useState<RiskEvaluation | null>(null);

  // Modals
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isHazardOpen, setIsHazardOpen] = useState(false);

  useEffect(() => {
    // Fetch live weather and risk evaluation
    api.getWeather(currentLat, currentLng)
      .then(data => setWeather(data))
      .catch(console.error);

    api.evaluateRisk(currentLat, currentLng)
      .then(res => setRiskEval(res))
      .catch(console.error);
  }, [currentLat, currentLng]);

  const getSafetyBadge = (category?: string) => {
    switch (category) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse',
          dot: 'bg-red-500',
          label: 'CRITICAL HAZARD'
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
          dot: 'bg-orange-500',
          label: 'HIGH RISK CAUTION'
        };
      case 'CAUTION':
        return {
          bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          dot: 'bg-amber-500',
          label: 'CAUTION ZONE'
        };
      default:
        return {
          bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          dot: 'bg-emerald-400',
          label: 'SAFE CORRIDOR'
        };
    }
  };

  const badge = getSafetyBadge(riskEval?.category);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'home'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tourist Safety Hub
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'map'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Map className="w-3.5 h-3.5 text-emerald-400" />
            <span>Interactive Safety Map</span>
          </button>
        </div>

        {/* Location pill */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Nilgiris • Ooty Sector</span>
        </div>
      </div>

      {activeTab === 'map' ? (
        <div className="space-y-4">
          <SafetyMapScreen currentLat={currentLat} currentLng={currentLng} onLocationSelect={onLocationSelect} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Welcome & Live Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Welcome to Nilgiris</span>
              <h1 className="font-heading font-extrabold text-2xl text-white mt-0.5">
                Good Morning, {user?.full_name?.split(' ')[0] || 'Traveler'}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                DRISHTI Temporary ID: <span className="font-mono text-emerald-400 font-bold">{user?.drishti_id || 'DRS-IN-7F92A1C4'}</span>
              </p>
            </div>

            {/* Safety Indicator Badge */}
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border ${badge.bg}`}>
              <span className={`w-3 h-3 rounded-full ${badge.dot}`} />
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider block opacity-80">CURRENT STATUS</span>
                <span className="text-xs font-black tracking-wide">{badge.label}</span>
              </div>
            </div>
          </div>

          {/* Primary SOS Emergency Call-To-Action Banner */}
          <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-red-950/80 via-red-900/60 to-slate-900 border-2 border-red-600/70 shadow-2xl shadow-red-950/60 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left z-10">
              <span className="text-[11px] font-extrabold tracking-widest text-red-400 uppercase flex items-center justify-center sm:justify-start gap-1.5">
                <AlertOctagon className="w-4 h-4" />
                CRITICAL EMERGENCY RESPONSE
              </span>
              <h2 className="font-heading font-black text-2xl text-white tracking-wide">NEED IMMEDIATE RESCUE?</h2>
              <p className="text-xs text-red-200/80 max-w-md">
                Alerts Nilgiris Police Command HQ, 4x4 Mountain Rescue Units, and nearby Community Guardians instantly.
              </p>
            </div>

            <button
              onClick={onOpenSOSModal}
              className="sos-tactile-button px-8 py-4 rounded-2xl text-white font-heading font-black text-lg tracking-wider uppercase flex items-center gap-3 shadow-xl transition-all cursor-pointer z-10 hover:scale-105"
            >
              <AlertOctagon className="w-6 h-6 animate-pulse" />
              <span>SOS EMERGENCY</span>
            </button>
          </div>

          {/* Environmental & Risk Explainability Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Risk Explainability Intelligence */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>AI Risk Intelligence Score</span>
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {riskEval?.total_score || 22}/100
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    (riskEval?.total_score || 0) > 75
                      ? 'bg-red-500'
                      : (riskEval?.total_score || 0) > 50
                      ? 'bg-orange-500'
                      : (riskEval?.total_score || 0) > 25
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${riskEval?.total_score || 22}%` }}
                />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {riskEval?.explanation || 'You are located on a monitored tourist corridor with normal soil stability.'}
              </p>

              <div className="p-2.5 bg-slate-800/60 rounded-xl text-[11px] text-amber-300 border border-slate-700/60">
                <strong>Advisory:</strong> {riskEval?.action_advisory || 'Keep within marked paths and ensure battery remains charged.'}
              </div>
            </div>

            {/* Live Mountain Weather Card */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CloudRain className="w-4 h-4 text-blue-400" />
                  <span>Nilgiris Environmental Telemetry</span>
                </span>
                <span className="text-xs text-slate-400">Live Ghats Sensor</span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="font-heading font-extrabold text-3xl text-white">
                  {weather?.temperature_c || 18.5}°C
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {weather?.weather_condition || 'Heavy Mist / Drizzle'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                <div>
                  <span className="text-[10px] text-slate-400 block">Precipitation</span>
                  <span className="font-bold text-white">{weather?.rainfall_mm || 14.2} mm</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Wind Speed</span>
                  <span className="font-bold text-white">{weather?.wind_speed_kmh || 22.4} km/h</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Visibility</span>
                  <span className="font-bold text-amber-400">{weather?.visibility_meters || 3500} m</span>
                </div>
              </div>

              {weather?.disaster_warning && (
                <p className="text-[10px] text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/30">
                  ⚠️ {weather.disaster_warning}
                </p>
              )}
            </div>
          </div>

          {/* Quick Action Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Safety Map Button */}
            <button
              onClick={() => setActiveTab('map')}
              className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Map className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-xs">Safety Map</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Danger zones & shelters</p>
            </button>

            {/* My Digital ID */}
            <button
              onClick={() => onOpenDigitalIdModal ? onOpenDigitalIdModal() : null}
              className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-xs">My Digital ID</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">DRISHTI QR Pass</p>
            </button>

            {/* Pay in India (UPI) */}
            <button
              onClick={() => setIsPayOpen(true)}
              className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-xs">Pay in India</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">UPI & QR Assistant</p>
            </button>

            {/* Drishti AI Safety Assistant */}
            <button
              onClick={() => setIsAIOpen(true)}
              className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-xs">Drishti AI</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Emergency Safety Chat</p>
            </button>
          </div>

          {/* Crowdsourced Hazard Reporting Banner */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Spotted a Landslide or Road Blockage?</h4>
                <p className="text-[11px] text-slate-400">Report hazards with GPS to warn fellow travelers and authorities.</p>
              </div>
            </div>
            <button
              onClick={() => setIsHazardOpen(true)}
              className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors shrink-0 cursor-pointer"
            >
              Report Hazard
            </button>
          </div>
        </div>
      )}

      {/* Sub-Modals */}
      <DigitalIdModal isOpen={isDigitalIdOpen} onClose={onCloseDigitalIdModal} />
      <EmergencySOSModal
        isOpen={isSOSOpen}
        onClose={onCloseSOSModal}
        touristLat={currentLat}
        touristLng={currentLng}
      />
      <PayInIndiaModal isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} />
      <DrishtiAIAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        currentLat={currentLat}
        currentLng={currentLng}
        currentRiskScore={riskEval?.total_score}
        onTriggerSOS={onOpenSOSModal}
      />
      <HazardReportModal
        isOpen={isHazardOpen}
        onClose={() => setIsHazardOpen(false)}
        currentLat={currentLat}
        currentLng={currentLng}
      />
    </div>
  );
};
