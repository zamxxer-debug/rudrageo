import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { RiskZone, Destination } from '../../types';
import { Compass, Plus, AlertTriangle, ShieldCheck, MapPin, CheckCircle2, Layers, Filter, Users, Eye, Sparkles } from 'lucide-react';

export const TourismDashboard: React.FC = () => {
  const [zones, setZones] = useState<RiskZone[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'high' | 'caution'>('all');
  const [testedZone, setTestedZone] = useState<RiskZone | null>(null);

  useEffect(() => {
    api.getZones().then(data => setZones(data || [])).catch(console.error);
  }, []);

  const filteredZones = zones.filter(z => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'critical') return z.risk_level === 'critical';
    if (selectedFilter === 'high') return z.risk_level === 'high';
    if (selectedFilter === 'caution') return z.risk_level === 'medium' || z.risk_level === 'low';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" /> TAMIL NADU TOURISM DEVELOPMENT CORPORATION & DISASTER GOVERNANCE
          </span>
          <h1 className="font-heading font-black text-2xl text-white mt-0.5">
            Tourism Risk & Geofencing Authority Desk
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage tourist corridors, carrying capacity limits, and automated geofence safety alerts for sensitive mountain sectors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white flex items-center gap-1.5 shadow-sm">
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Sector: Nilgiris District</span>
          </span>
        </div>
      </div>

      {/* Tourism Footfall & Carrying Capacity Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">Estimated Daily Footfall</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="font-heading font-bold text-xl text-white">14,280 <span className="text-xs text-slate-400 font-normal">Visitors</span></p>
          <span className="text-[10px] text-emerald-400 font-semibold">● Normal Carrying Range (68% capacity)</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">Active Geofence Corridors</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <p className="font-heading font-bold text-xl text-white">{zones.length} <span className="text-xs text-slate-400 font-normal">Monitored Zones</span></p>
          <span className="text-[10px] text-blue-400 font-semibold">● Real-time GPS Proximity Alerting</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">Restricted High-Risk Corridors</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <p className="font-heading font-bold text-xl text-red-400">
            {zones.filter(z => z.risk_level === 'critical').length} <span className="text-xs text-slate-400 font-normal">Red Alert Sectors</span>
          </p>
          <span className="text-[10px] text-amber-400 font-semibold">● Kalhatty Ghats 36 Hairpin Bends</span>
        </div>
      </div>

      {/* Safety Zone Testing Simulator Drawer */}
      {testedZone && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/40 via-slate-900 to-amber-950/30 border border-amber-500/50 shadow-2xl space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-heading font-extrabold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Simulated In-App Tourist Alert Preview</span>
            </div>
            <button
              onClick={() => setTestedZone(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-slate-200">
            When a tourist comes within <strong className="text-amber-300">{testedZone.warning_distance_meters} meters</strong> of <strong>{testedZone.name}</strong>, their mobile app will trigger:
          </p>
          <div className="p-3 bg-slate-950/90 rounded-xl border border-red-500/40 text-xs text-red-300 font-mono">
            ⚠️ <strong>SAFETY ALERT:</strong> {testedZone.safety_instructions}
          </div>
        </div>
      )}

      {/* Safety Zones Manager List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Active Hazard & Restricted Zones ({filteredZones.length})</span>
          </h3>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFilter('critical')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedFilter === 'critical' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setSelectedFilter('high')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedFilter === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              High
            </button>
            <button
              onClick={() => setSelectedFilter('caution')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedFilter === 'caution' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Caution
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredZones.map((z) => (
            <div
              key={z.id}
              className={`p-5 rounded-2xl border bg-slate-900/90 space-y-3.5 shadow-lg transition-all ${
                z.risk_level === 'critical' ? 'border-red-500/50 hover:border-red-500' : 'border-amber-500/50 hover:border-amber-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded border ${
                    z.risk_level === 'critical'
                      ? 'bg-red-500/20 text-red-300 border-red-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {z.risk_level} • {z.zone_type}
                  </span>
                  <h4 className="font-bold text-white text-sm mt-1">{z.name}</h4>
                </div>
                <span className="font-mono text-xs text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{z.zone_code}</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{z.description}</p>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                <div>
                  <span className="text-[10px] text-slate-400 block">Geometry</span>
                  <span className="font-semibold text-white capitalize">{z.geometry_type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Warning Buffer</span>
                  <span className="font-semibold text-amber-300">{z.warning_distance_meters} meters</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-800/80 rounded-xl text-[11px] text-slate-300 border border-slate-700/60">
                <span className="font-bold text-amber-400 block mb-0.5">Automated In-App Safety Alert:</span>
                "{z.safety_instructions}"
              </div>

              <button
                onClick={() => setTestedZone(z)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate In-App Alert</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

