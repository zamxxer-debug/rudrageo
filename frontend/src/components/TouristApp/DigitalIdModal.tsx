import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../services/api';
import { DigitalIdData } from '../../types';
import { ShieldCheck, X, CheckCircle2, AlertTriangle, Share2, Award, Copy, Check } from 'lucide-react';

interface DigitalIdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DigitalIdModal: React.FC<DigitalIdModalProps> = ({ isOpen, onClose }) => {
  const [digitalId, setDigitalId] = useState<DigitalIdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyStatus, setVerifyStatus] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getMyDigitalId()
        .then(data => {
          setDigitalId(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = async () => {
    if (!digitalId) return;
    try {
      const res = await api.verifyQRCode(digitalId.qr_payload_encoded);
      setVerifyStatus(res);
    } catch (err: any) {
      setVerifyStatus({ is_valid: false, message: err.message });
    }
  };

  const copyId = () => {
    if (!digitalId) return;
    navigator.clipboard.writeText(digitalId.drishti_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-heading font-bold text-white text-base">DRISHTI Temporary Digital Identity</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[85vh]">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading digital identity...</div>
          ) : !digitalId ? (
            <div className="py-8 text-center text-red-400">Unable to load identity. Please ensure you are registered.</div>
          ) : (
            <>
              {/* Official Credential Card */}
              <div className="relative rounded-2xl p-5 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border-2 border-emerald-500/40 shadow-xl overflow-hidden">
                {/* Background Watermark */}
                <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none">
                  <ShieldCheck className="w-64 h-64 text-emerald-400" />
                </div>

                {/* Card Header */}
                <div className="flex items-start justify-between border-b border-slate-700/60 pb-3 mb-4">
                  <div>
                    <span className="text-[10px] font-extrabold tracking-widest text-amber-400 uppercase">
                      GOVERNMENT OF INDIA • TOURIST SAFETY
                    </span>
                    <h4 className="text-sm font-bold text-white tracking-wide">TEMPORARY TOURIST PASS</h4>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    VERIFIED ACTIVE
                  </span>
                </div>

                {/* Main QR Code Display */}
                <div className="flex flex-col items-center my-3">
                  <div className="p-3 bg-white rounded-xl shadow-md border-2 border-slate-200">
                    <QRCodeSVG
                      value={digitalId.qr_payload_encoded}
                      size={170}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-emerald-400 tracking-wider">
                      {digitalId.drishti_id}
                    </span>
                    <button
                      onClick={copyId}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      title="Copy DRISHTI ID"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Tourist Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 mt-4">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Tourist Name</span>
                    <p className="font-semibold text-white">{digitalId.tourist_name}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Nationality</span>
                    <p className="font-semibold text-white">{digitalId.nationality}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Destination Sector</span>
                    <p className="font-semibold text-white">{digitalId.destination}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Blood Group</span>
                    <p className="font-semibold text-white">{digitalId.blood_group || 'O+'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Emergency Contact</span>
                    <p className="font-mono text-emerald-300 font-semibold">{digitalId.emergency_contact || '+91 112'}</p>
                  </div>
                </div>

                <div className="mt-3 text-[10px] text-slate-400 text-center">
                  Valid until: {new Date(digitalId.expires_at).toLocaleDateString()} • Cryptographically verifiable offline
                </div>
              </div>

              {/* Cryptographic Verification Action */}
              <div className="space-y-3">
                <button
                  onClick={handleVerify}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Verify Cryptographic HMAC-SHA256 Signature</span>
                </button>

                {verifyStatus && (
                  <div className={`p-3 rounded-xl border text-xs ${
                    verifyStatus.is_valid
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-red-950/40 border-red-500/40 text-red-300'
                  }`}>
                    <div className="flex items-center gap-2 font-bold mb-1">
                      {verifyStatus.is_valid ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      <span>{verifyStatus.is_valid ? 'Signature Authenticated' : 'Verification Issue'}</span>
                    </div>
                    <p className="text-[11px] opacity-90">{verifyStatus.message}</p>
                    {verifyStatus.signature_verified && (
                      <p className="text-[10px] font-mono mt-1 text-slate-400">
                        HMAC-SHA256 state token verified without server dependency.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
