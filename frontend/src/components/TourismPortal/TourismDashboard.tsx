import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { RiskZone, Destination } from '../../types';
import { Compass, Plus, AlertTriangle, ShieldCheck, MapPin, CheckCircle2, Layers } from 'lucide-react';

export const TourismDashboard: React.FC = () => {
  const [zones, setZones] = useState<RiskZone[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDest, setSelectedDest] = useState<string>('Nilgiris - Ooty');

  useEffect(() => {
    api.getZones().then(data => setZones(data || [])).catch(console.error);
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
            TAMIL NADU TOURISM DEVELOPMENT CORPORATION & DISASTER MANAGEMENT
          </span>
          <h1 className="font-heading font-black text-2xl text-white mt-0.5">
            Tourism Risk & Safety Zone Control
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage tourist corridors, buffer distances, and safety instructions for sensitive mountain sectors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Region: Nilgiris</span>
          </span>
        </div>
      </div>

      {/* Safety Zones Manager List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-base text-white">
            Active Hazard & Restricted Zones ({zones.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {zones.map((z) => (
            <div
              key={z.id}
              className={`p-5 rounded-2xl border bg-slate-900/90 space-y-3 ${
                z.risk_level === 'critical' ? 'border-red-500/50' : 'border-amber-500/50'
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
                <span className="font-mono text-xs text-slate-400 font-bold">{z.zone_code}</span>
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
