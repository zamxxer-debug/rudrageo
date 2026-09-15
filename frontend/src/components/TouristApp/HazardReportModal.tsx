import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AlertTriangle, Camera, MapPin, CheckCircle2, Sparkles, X, Upload, Image, Trash2 } from 'lucide-react';

interface HazardReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLat?: number;
  currentLng?: number;
}

export const HazardReportModal: React.FC<HazardReportModalProps> = ({
  isOpen,
  onClose,
  currentLat = 11.4435,
  currentLng = 76.7138
}) => {
  const { connectivity } = useAuth();
  const [hazardType, setHazardType] = useState('landslide');
  const [description, setDescription] = useState('Rockfall across northbound lane before Kalhatty hairpin 20.');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<any>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoData(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await api.reportHazard({
        hazard_type: hazardType,
        description,
        lat: currentLat,
        lng: currentLng,
        image_url: photoData || undefined
      }, connectivity === 'ONLINE');

      setSubmitted(res);
      setTimeout(() => {
        setSubmitted(null);
        setPhotoData(null);
        onClose();
      }, 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-heading font-bold text-white text-base">Report Terrain Hazard</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-white">Hazard Report Logged</h4>
              <p className="text-xs text-slate-300">
                {connectivity === 'ONLINE'
                  ? 'Police HQ and nearby responders have been notified.'
                  : 'Report queued in local offline storage and will sync automatically.'}
              </p>
              {submitted.ai_classification && (
                <div className="p-2 bg-slate-800 rounded-lg text-xs text-amber-300 border border-slate-700 inline-block">
                  🤖 AI: <strong>{submitted.ai_classification}</strong> ({Math.round(submitted.ai_confidence * 100)}% confidence)
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Hazard Category:</label>
                <select
                  value={hazardType}
                  onChange={(e) => setHazardType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="landslide">Landslide / Rockfall / Mudslide</option>
                  <option value="flood">Flash Flood / Stream Overflow</option>
                  <option value="broken_road">Road Damage / Subsidence</option>
                  <option value="unsafe_bridge">Unsafe Bridge / Culvert Breach</option>
                  <option value="wildlife">Wild Animal Sighting (Elephant/Leopard)</option>
                  <option value="lost_person">Lost Trekker / Medical Emergency</option>
                  <option value="other">Other Terrain Hazard</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description:</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe location, severity, and immediate danger..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* Camera / Photo Attachment */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  <Camera className="w-3.5 h-3.5 inline-block mr-1" /> Photo Evidence (Optional):
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoCapture}
                />
                {photoData ? (
                  <div className="flex items-center gap-3 bg-slate-800/80 border border-emerald-500/40 rounded-xl p-2.5">
                    <img
                      src={photoData}
                      alt="Hazard photo"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-600 shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <Image className="w-3 h-3" /> Photo ready
                      </p>
                      <p className="text-[10px] text-slate-400">Will accompany hazard report</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhotoData(null)}
                      className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-900/60 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-600 hover:border-amber-500/50 bg-slate-800/40 hover:bg-amber-950/20 text-slate-400 hover:text-amber-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Open Camera / Pick from Gallery</span>
                  </button>
                )}
              </div>

              {/* Location Stamp */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>GPS: {currentLat.toFixed(5)}, {currentLng.toFixed(5)} (Nilgiris)</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
              >
                {submitting ? 'Transmitting Report...' : 'Submit Hazard Report'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
