import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Play, Sparkles, Wifi, WifiOff, AlertOctagon, CheckCircle2, ChevronUp, ChevronDown, MapPin, Radio } from 'lucide-react';

interface DemoControlPanelProps {
  onLocationChange: (lat: number, lng: number) => void;
  onOpenSOSModal: () => void;
}

export const DemoControlPanel: React.FC<DemoControlPanelProps> = ({
  onLocationChange,
  onOpenSOSModal
}) => {
  const { connectivity, setConnectivity, toggleOfflineMode, switchRoleDemo, triggerSync } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [stepStatus, setStepStatus] = useState<string>('Ready for Demonstration');

  // Step 1: Safe Corridor (Botanical Garden, Ooty)
  const runStep1 = () => {
    onLocationChange(11.4180, 76.7100);
    setConnectivity('ONLINE');
    setStepStatus('Step 1 Active: Tourist located in Safe Corridor (Botanical Garden). Risk: 22 - SAFE.');
  };

  // Step 2: Warning Buffer (Kalhatty Ghat hairpins approaching)
  const runStep2 = () => {
    onLocationChange(11.4420, 76.7120);
    setStepStatus('Step 2 Active: Tourist approaching Kalhatty Ghat Landslide buffer (~220m). Risk: 68 - HIGH.');
  };

  // Step 3: Simulate Network Drop (Deep valley signal loss)
  const runStep3 = () => {
    setConnectivity('OFFLINE');
    setStepStatus('Step 3 Active: Network Signal Lost. Platform switched to OFFLINE-FIRST Mode.');
  };

  // Step 4: Critical Landslide Zone Breach (Hairpin curve 22)
  const runStep4 = () => {
    onLocationChange(11.4460, 76.7145);
    setStepStatus('Step 4 Active: Breach into Active Landslide Zone! Risk: 92 - CRITICAL HAZARD.');
  };

  // Step 5: Trigger SOS (Queues in local IndexedDB)
  const runStep5 = () => {
    onOpenSOSModal();
    setStepStatus('Step 5 Active: Emergency SOS Triggered. Stored in Local Encrypted Storage.');
  };

  // Step 6: Restore Network & Auto-Sync
  const runStep6 = async () => {
    setConnectivity('ONLINE');
    setStepStatus('Step 6 Active: Network Restored. Sync Engine flushing queue...');
    const synced = await triggerSync();
    setStepStatus(`Step 6 Complete: ${synced} Offline Events Ingested. Police Command Alerted!`);
  };

  // Step 7: Switch to Police Operations HQ
  const runStep7 = () => {
    switchRoleDemo('police');
    setStepStatus('Step 7 Active: Switched to Police Command Center. Realtime Radar Live.');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-slate-900/95 border-2 border-amber-500/60 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden animate-in slide-in-from-bottom-3">
      {/* Header bar */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-200" />
          <span className="font-heading font-black text-xs uppercase tracking-wider">
            Demo Simulator HUD
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded font-mono font-bold">
            {connectivity}
          </span>
          {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-3">
          <p className="text-[11px] text-amber-300 font-medium">
            Status: <span className="text-white">{stepStatus}</span>
          </p>

          {/* Sequential Golden Path Simulation Buttons */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
            <button
              onClick={runStep1}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-left transition-colors cursor-pointer"
            >
              1. Safe Corridor (Garden)
            </button>
            <button
              onClick={runStep2}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl border border-slate-700 text-left transition-colors cursor-pointer"
            >
              2. Approach Warning Zone
            </button>
            <button
              onClick={runStep3}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-red-300 rounded-xl border border-slate-700 text-left transition-colors cursor-pointer"
            >
              3. Simulate Network Drop
            </button>
            <button
              onClick={runStep4}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-red-400 rounded-xl border border-slate-700 text-left transition-colors cursor-pointer"
            >
              4. Enter Landslide Hazard
            </button>
            <button
              onClick={runStep5}
              className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-left font-bold transition-colors cursor-pointer"
            >
              5. Trigger Emergency SOS
            </button>
            <button
              onClick={runStep6}
              className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-left font-bold transition-colors cursor-pointer"
            >
              6. Reconnect & Sync Queue
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800 flex gap-2">
            <button
              onClick={runStep7}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
            >
              7. Open Police Command Desk
            </button>
            <button
              onClick={toggleOfflineMode}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              title="Toggle Online / Offline"
            >
              {connectivity === 'ONLINE' ? <WifiOff className="w-4 h-4 text-red-400" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
