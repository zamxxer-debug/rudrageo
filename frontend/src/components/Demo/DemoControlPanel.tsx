import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Play, Sparkles, Wifi, WifiOff, AlertOctagon, CheckCircle2, ChevronUp, ChevronDown, MapPin, Radio, X } from 'lucide-react';

interface DemoControlPanelProps {
  onLocationChange: (lat: number, lng: number) => void;
  onOpenSOSModal: () => void;
}

export const DemoControlPanel: React.FC<DemoControlPanelProps> = ({
  onLocationChange,
  onOpenSOSModal
}) => {
  const { connectivity, setConnectivity, toggleOfflineMode, switchRoleDemo, triggerSync } = useAuth();
  const { t } = useLanguage();
  // Default to collapsed / closed so it does not obstruct the screen
  const [collapsed, setCollapsed] = useState(true);
  const [stepStatus, setStepStatus] = useState<string>('Ready for simulation');

  // Step 1: Safe Corridor (Botanical Garden, Ooty)
  const runStep1 = () => {
    onLocationChange(11.4180, 76.7100);
    setConnectivity('ONLINE');
    setStepStatus('Step 1: Tourist in Safe Corridor (Risk: 22 - Safe)');
  };

  // Step 2: Warning Buffer (Kalhatty Ghat hairpins approaching)
  const runStep2 = () => {
    onLocationChange(11.4420, 76.7120);
    setStepStatus('Step 2: Approaching Kalhatty Ghat buffer (Risk: 68 - Caution)');
  };

  // Step 3: Simulate Network Drop (Deep valley signal loss)
  const runStep3 = () => {
    setConnectivity('OFFLINE');
    setStepStatus('Step 3: Signal lost. Switched to Offline mode');
  };

  // Step 4: Critical Landslide Zone Breach (Hairpin curve 22)
  const runStep4 = () => {
    onLocationChange(11.4460, 76.7145);
    setStepStatus('Step 4: Hazard breach! (Risk: 92 - Critical SOS)');
  };

  // Step 5: Trigger SOS (Queues in local IndexedDB)
  const runStep5 = () => {
    onOpenSOSModal();
    setStepStatus('Step 5: Emergency SOS triggered & stored locally');
  };

  // Step 6: Restore Network & Auto-Sync
  const runStep6 = async () => {
    setConnectivity('ONLINE');
    setStepStatus('Step 6: Network restored. Syncing queue...');
    const synced = await triggerSync();
    setStepStatus(`Step 6: ${synced} Offline events synced to Police HQ`);
  };

  // Step 7: Switch to Police Operations HQ
  const runStep7 = () => {
    switchRoleDemo('police');
    setStepStatus('Step 7: Switched to Police Command Center');
  };

  if (collapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-40 animate-in fade-in">
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-850 border border-amber-500/60 shadow-xl shadow-amber-950/30 text-amber-300 hover:text-white text-xs font-bold transition-all cursor-pointer backdrop-blur-md"
        >
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>{t('demo_hud')}</span>
          <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300 font-mono">
            {connectivity}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-slate-900/95 border border-amber-500/60 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden animate-in slide-in-from-bottom-3">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-200" />
          <span className="font-heading font-black text-xs uppercase tracking-wider">
            {t('demo_hud_full')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded font-mono font-bold">
            {connectivity}
          </span>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 hover:bg-amber-800/50 rounded text-amber-100 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="text-[11px] text-amber-300 font-medium bg-slate-950/60 p-2 rounded-xl border border-slate-800 flex items-center justify-between">
          <span className="truncate">{stepStatus}</span>
        </div>

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
            2. Approach Hazard
          </button>
          <button
            onClick={runStep3}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-red-300 rounded-xl border border-slate-700 text-left transition-colors cursor-pointer"
          >
            3. Drop Signal (Offline)
          </button>
          <button
            onClick={runStep4}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-red-400 rounded-xl border border-slate-700 text-left transition-colors cursor-pointer"
          >
            4. Enter Hazard Zone
          </button>
          <button
            onClick={runStep5}
            className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-left font-bold transition-colors cursor-pointer"
          >
            5. Trigger SOS
          </button>
          <button
            onClick={runStep6}
            className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-left font-bold transition-colors cursor-pointer"
          >
            6. Reconnect & Sync
          </button>
        </div>

        <div className="pt-2 border-t border-slate-800 flex gap-2">
          <button
            onClick={runStep7}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
          >
            7. Switch to Police HQ
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
    </div>
  );
};
