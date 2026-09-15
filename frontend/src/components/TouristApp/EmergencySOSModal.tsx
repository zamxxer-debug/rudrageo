import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { SOSIncident } from '../../types';
import { AlertOctagon, PhoneCall, XCircle, CheckCircle2, ShieldAlert, Radio, Battery, MapPin, X, Camera, Image, Trash2 } from 'lucide-react';

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  touristLat?: number;
  touristLng?: number;
}

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({
  isOpen,
  onClose,
  touristLat = 11.4425,
  touristLng = 76.7142
}) => {
  const { connectivity } = useAuth();
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [activeIncident, setActiveIncident] = useState<SOSIncident | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Accidental activation');
  const [photoData, setPhotoData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const holdIntervalRef = useRef<any>(null);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger hold counter
  const startHold = () => {
    if (activeIncident) return;
    setHolding(true);
    setHoldProgress(0);

    const stepMs = 50;
    const totalMs = 3000;
    const increment = (stepMs / totalMs) * 100;

    holdIntervalRef.current = setInterval(() => {
      setHoldProgress(prev => {
        if (prev >= 100) {
          clearInterval(holdIntervalRef.current);
          triggerEmergency();
          return 100;
        }
        return prev + increment;
      });
    }, stepMs);
  };

  const endHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }
    setHolding(false);
    setHoldProgress(0);
  };

  const triggerEmergency = async () => {
    setIsActivating(true);
    try {
      // Vibrate device if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([300, 100, 300, 100, 500]);
      }

      const res = await api.triggerSOS({
        lat: touristLat,
        lng: touristLng,
        battery_level: 68,
        accuracy_meters: 6.5,
        image_data: photoData || undefined,
        notes: photoData ? 'Emergency SOS activated with live scene photo attachment.' : 'Emergency SOS activated from mobile interface.'
      }, connectivity === 'ONLINE');

      setActiveIncident(res);
    } catch (err) {
      console.error('SOS Trigger Error:', err);
    } finally {
      setIsActivating(false);
      setHolding(false);
    }
  };

  const handleCancel = async () => {
    if (!activeIncident) return;
    try {
      await api.cancelSOS(activeIncident.id, cancelReason);
      setActiveIncident(null);
      setCancelModal(false);
      onClose();
    } catch (err) {
      console.error(err);
      setActiveIncident(null);
      setCancelModal(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-red-600/60 rounded-3xl shadow-2xl shadow-red-950/60 overflow-hidden">
        {/* Top Emergency Banner */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white">
          <div className="flex items-center gap-2.5">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
            <div>
              <h2 className="font-heading font-extrabold text-base tracking-wide uppercase">
                {activeIncident ? 'SOS ACTIVE — DISPATCHED' : 'EMERGENCY SOS ASSISTANCE'}
              </h2>
              <span className="text-[11px] opacity-90">Rudra Police & Disaster Response Network</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-red-800/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!activeIncident ? (
            /* Pre-Activation Interface */
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="space-y-1">
                <p className="text-slate-300 font-medium text-sm">
                  Press and hold the button for <strong className="text-white">3 seconds</strong> to trigger emergency rescue.
                </p>
              </div>

              {/* 3-Second Tactile Hold Button with SVG Ring */}
              <div className="relative flex items-center justify-center my-2">
                {/* Circular Progress Indicator */}
                <svg className="w-48 h-48 transform -rotate-90 pointer-events-none">
                  <circle
                    cx="96"
                    cy="96"
                    r="86"
                    stroke="#334155"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="86"
                    stroke="#EF4444"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={540}
                    strokeDashoffset={540 - (540 * holdProgress) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-75 ease-linear"
                  />
                </svg>

                {/* Tactile Push Button */}
                <button
                  onMouseDown={startHold}
                  onMouseUp={endHold}
                  onMouseLeave={endHold}
                  onTouchStart={startHold}
                  onTouchEnd={endHold}
                  className="absolute w-36 h-36 rounded-full sos-tactile-button flex flex-col items-center justify-center text-white cursor-pointer select-none"
                >
                  <AlertOctagon className={`w-12 h-12 mb-1 ${holding ? 'animate-bounce' : 'animate-pulse'}`} />
                  <span className="font-heading font-black text-xl tracking-wider uppercase">HOLD SOS</span>
                  <span className="text-[10px] uppercase font-bold opacity-80">
                    {holding ? `${Math.ceil((100 - holdProgress) / 33)}s...` : '3 SEC'}
                  </span>
                </button>
              </div>

              {/* === Camera / Photo Attachment === */}
              <div className="w-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoCapture}
                />
                {photoData ? (
                  /* Thumbnail preview */
                  <div className="relative flex items-center gap-3 bg-slate-800/80 border border-emerald-500/40 rounded-xl p-2.5">
                    <img
                      src={photoData}
                      alt="Scene snapshot"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-600 shrink-0"
                    />
                    <div className="flex-1 text-left">
                      <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <Image className="w-3.5 h-3.5" /> Photo attached
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Will be sent with your SOS signal</p>
                    </div>
                    <button
                      onClick={() => setPhotoData(null)}
                      className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-900/60 text-slate-400 hover:text-red-300 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-dashed border-slate-600 hover:border-amber-500/60 bg-slate-800/50 hover:bg-amber-950/20 text-slate-400 hover:text-amber-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Open Camera — Snap Scene Photo</span>
                  </button>
                )}
              </div>

              {/* Instant Tap Fallback for Rapid Emergency */}
              <div className="w-full">
                <button
                  onClick={triggerEmergency}
                  disabled={isActivating}
                  className="w-full py-2.5 bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Radio className="w-4 h-4 text-red-400" />
                  <span>Tap to Trigger Immediately Without Delay</span>
                </button>
              </div>

              {/* Status Meta */}
              <div className="w-full grid grid-cols-3 gap-2 text-center text-xs bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                <div>
                  <span className="text-[10px] text-slate-400 block">GPS</span>
                  <span className="font-mono text-white text-[11px] font-semibold">{touristLat.toFixed(4)}, {touristLng.toFixed(4)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Accuracy</span>
                  <span className="text-emerald-400 text-[11px] font-semibold">±6.5m</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Mode</span>
                  <span className={`text-[11px] font-semibold ${connectivity === 'ONLINE' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {connectivity}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Post-Activation Live Emergency Status */
            <div className="space-y-5 animate-in zoom-in-95">
              <div className="p-4 rounded-2xl bg-red-950/50 border-2 border-red-500/60 flex items-start gap-3">
                <div className="p-2.5 bg-red-600 rounded-xl text-white animate-pulse">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-red-400 uppercase tracking-wider">
                      RESCUE SIGNAL BROADCASTING
                    </span>
                    <span className="text-xs font-mono font-bold text-white bg-red-900/60 px-2 py-0.5 rounded">
                      {activeIncident.incident_code}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white mt-1">Police Command HQ & Local Guardians Alerted</p>
                  <p className="text-xs text-slate-300 mt-1">
                    Stay in a sheltered location if safe. Do not wander off marked roads. Responders have locked onto your coordinates.
                  </p>
                </div>
              </div>

              {/* Live Incident Status Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    Transmitted Location
                  </span>
                  <p className="font-mono text-white font-semibold">{touristLat.toFixed(5)}, {touristLng.toFixed(5)}</p>
                  <span className="text-[10px] text-slate-400">Sector: Nilgiris Ghats</span>
                </div>

                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold flex items-center gap-1.5 mb-1">
                    <Battery className="w-3.5 h-3.5 text-emerald-400" />
                    Device Telemetry
                  </span>
                  <p className="font-semibold text-white">68% Battery • GPS Locked</p>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    {activeIncident.connectivity_mode === 'synced_from_offline' ? 'Queued Offline' : 'Live Cloud Feed'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href="tel:112"
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all text-center"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call Emergency (112)</span>
                </a>

                <button
                  onClick={() => setCancelModal(true)}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span>Cancel SOS Alert</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cancellation Confirmation Sub-Modal */}
        {cancelModal && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm p-6 flex flex-col justify-center animate-in fade-in">
            <div className="space-y-4 max-w-sm mx-auto text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm SOS Cancellation</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Are you certain you are safe? Emergency dispatchers will stand down upon confirmation.
                </p>
              </div>

              <div className="text-left">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Reason for cancellation:</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
                >
                  <option value="Accidental button press">Accidental button press</option>
                  <option value="Threat resolved safely">Threat resolved safely</option>
                  <option value="Reached safe shelter">Reached safe shelter</option>
                  <option value="Test / drill demonstration">Test / drill demonstration</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setCancelModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Return to SOS
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-md shadow-red-900/50"
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
