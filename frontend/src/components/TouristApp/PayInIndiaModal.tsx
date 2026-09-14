import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../services/api';
import { CreditCard, QrCode, ArrowRightLeft, ShieldCheck, CheckCircle2, AlertCircle, X, ExternalLink } from 'lucide-react';

interface PayInIndiaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PayInIndiaModal: React.FC<PayInIndiaModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'generate' | 'converter'>('scan');

  // Scanner state
  const [qrInput, setQrInput] = useState('upi://pay?pa=nilgiris.tea@icici&pn=Nilgiri%20Estate%20Tea&am=450.00&cu=INR&tn=Ooty%20Organic%20Tea');
  const [parsedResult, setParsedResult] = useState<any>(null);

  // Intent generator state
  const [amountInr, setAmountInr] = useState(500);
  const [foreignCurrency, setForeignCurrency] = useState('USD');
  const [generatedIntent, setGeneratedIntent] = useState<any>(null);

  // Currency Converter state
  const [convertInr, setConvertInr] = useState(2500);

  if (!isOpen) return null;

  const handleParseQR = async () => {
    try {
      const res = await api.parseUPIQR(qrInput);
      setParsedResult(res);
    } catch (e: any) {
      setParsedResult({ is_valid_upi: false, raw_payload: qrInput, guidance_for_foreign_tourist: e.message });
    }
  };

  const handleGenerateIntent = async () => {
    try {
      const res = await api.generateUPIIntent(amountInr, 'Nilgiris Tourism & Safety Hub', foreignCurrency);
      setGeneratedIntent(res);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-heading font-bold text-white text-base">Pay in India — UPI Assistant</h3>
              <p className="text-[11px] text-slate-400">Digital payments assistance for international travelers</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'scan' ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Merchant QR</span>
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'generate' ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Tourist Payment QR</span>
          </button>
          <button
            onClick={() => setActiveTab('converter')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'converter' ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Currency Converter</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* TAB 1: SCAN MERCHANT QR */}
          {activeTab === 'scan' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs text-slate-300">
                <p className="font-semibold text-white mb-1">Scan or Paste Merchant BharatQR / UPI String</p>
                <p className="text-slate-400 text-[11px]">
                  You can scan any local tea shop, taxi driver, or hotel UPI QR code to preview verified merchant details and rupee amount.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-300">Merchant QR URI / String:</label>
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-amber-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleParseQR}
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
                  >
                    Parse Merchant Payment QR
                  </button>
                </div>
              </div>

              {parsedResult && (
                <div className={`p-4 rounded-xl border space-y-3 ${
                  parsedResult.is_valid_upi ? 'bg-slate-800/80 border-emerald-500/40' : 'bg-red-950/40 border-red-500/40'
                }`}>
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      {parsedResult.is_valid_upi ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                      <span>{parsedResult.is_valid_upi ? 'NPCI Compliant UPI QR' : 'Unrecognized Format'}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{parsedResult.currency}</span>
                  </div>

                  {parsedResult.is_valid_upi && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Verified Payee:</span>
                        <span className="font-bold text-white">{parsedResult.payee_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Merchant VPA:</span>
                        <span className="font-mono text-emerald-300">{parsedResult.payee_vpa}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Amount:</span>
                        <span className="font-bold text-lg text-white">
                          {parsedResult.amount_inr ? `₹${parsedResult.amount_inr.toFixed(2)}` : 'Open Amount'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">EUR Equivalent (~):</span>
                        <span className="font-bold text-sm text-amber-300">
                          {parsedResult.amount_inr ? `€${(parsedResult.amount_inr / 91.80).toFixed(2)}` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/40">
                    💡 {parsedResult.guidance_for_foreign_tourist}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GENERATE TOURIST PAYMENT QR */}
          {activeTab === 'generate' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs text-slate-300">
                <p className="font-semibold text-white mb-1">Generate Tourist Payment Ticket</p>
                <p className="text-slate-400 text-[11px]">
                  Authorized local tourism operators and shops can scan your temporary UPI voucher ticket.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Amount in INR (₹):</label>
                  <input
                    type="number"
                    value={amountInr}
                    onChange={(e) => setAmountInr(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Your Currency:</label>
                  <select
                    value={foreignCurrency}
                    onChange={(e) => setForeignCurrency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateIntent}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
              >
                Generate Tourist UPI Payment QR
              </button>

              {generatedIntent && (
                <div className="flex flex-col items-center bg-slate-800/60 p-4 rounded-xl border border-slate-700 text-center space-y-3">
                  <div className="p-2.5 bg-white rounded-xl">
                    <QRCodeSVG value={generatedIntent.qr_payload} size={150} level="M" />
                  </div>
                  <div>
                    <span className="font-bold text-base text-white">₹{generatedIntent.amount_inr}</span>
                    <span className="text-xs text-amber-300 block">
                      ≈ {generatedIntent.foreign_currency} {generatedIntent.amount_foreign} (Rate: 1 {generatedIntent.foreign_currency} = ₹{generatedIntent.exchange_rate})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Ref: {generatedIntent.transaction_ref}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONVERTER & PPI TRAVELER GUIDE */}
          {activeTab === 'converter' && (
            <div className="space-y-4">
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-3">
                <span className="text-xs font-bold text-white block">Instant Currency Calculator</span>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400 block">Indian Rupees (INR)</span>
                    <input
                      type="number"
                      value={convertInr}
                      onChange={(e) => setConvertInr(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm font-bold text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/60 text-center">
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">USD ($)</span>
                    <span className="font-bold text-emerald-400 text-xs">${(convertInr / 84.50).toFixed(2)}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">EUR (€)</span>
                    <span className="font-bold text-emerald-400 text-xs">€{(convertInr / 91.80).toFixed(2)}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">GBP (£)</span>
                    <span className="font-bold text-emerald-400 text-xs">£{(convertInr / 108.20).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* RBI Travel Wallet Guidelines */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-xs text-amber-200">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>How to get official UPI in India as a foreign visitor</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] opacity-90">
                  <li>At Bengaluru, Mumbai, or Delhi International Airports, visit an authorized foreign exchange or PPI provider counter (e.g. Cheq UPI, Thomas Cook).</li>
                  <li>Show your Passport & Valid Indian Visa for instant digital KYC.</li>
                  <li>Load your travel wallet in INR using your international credit/debit card.</li>
                  <li>Scan any UPI QR across shops, restaurants, and taxis without extra international POS bank fees!</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
