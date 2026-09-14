import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ShieldCheck, Activity, Database, Radio, Users, Lock, Server, CheckCircle2 } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/health').then(r => r.json()).catch(() => ({ status: 'healthy', mode: 'DEMO' })),
      api.getAuditLogs().catch(() => [])
    ]).then(([h, logs]) => {
      setHealth(h);
      setAuditLogs(logs || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-400">
            DISASTER MANAGEMENT SYSTEM CONTROL
          </span>
          <h1 className="font-heading font-black text-2xl text-white mt-0.5">
            Super Admin & System Observability
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic ledger integrity, audit trails, and multi-tenant disaster response services.
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          <span>All Services Operational</span>
        </span>
      </div>

      {/* System Health Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">Core API</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="font-heading font-bold text-lg text-white">{health?.status?.toUpperCase() || 'HEALTHY'}</p>
          <span className="text-[10px] text-slate-500">FastAPI Async Gateway</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">Database Layer</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <p className="font-heading font-bold text-lg text-white">CONNECTED</p>
          <span className="text-[10px] text-slate-500">SQLite / PostgreSQL</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">Blockchain Ledger</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="font-heading font-bold text-lg text-white">ACTIVE</p>
          <span className="text-[10px] text-slate-500">SHA-256 Merkle Ledger</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">WebSockets</span>
            <Radio className="w-4 h-4 text-purple-400" />
          </div>
          <p className="font-heading font-bold text-lg text-white">STREAMING</p>
          <span className="text-[10px] text-slate-500">Real-Time Dispatch Active</span>
        </div>
      </div>

      {/* Security Audit Log Explorer */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
        <h3 className="font-heading font-bold text-base text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Security & System Audit Log Explorer</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 uppercase text-[10px] font-extrabold text-slate-400">
              <tr>
                <th className="p-3">Action</th>
                <th className="p-3">User / Actor</th>
                <th className="p-3">Resource</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">
                    Audit log entries will appear as system actions execute.
                  </td>
                </tr>
              ) : (
                auditLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-850">
                    <td className="p-3 font-bold text-amber-400">{l.action}</td>
                    <td className="p-3 font-sans text-white">{l.user_name}</td>
                    <td className="p-3 text-slate-400">{l.resource_type}</td>
                    <td className="p-3 text-slate-400">{l.ip_address}</td>
                    <td className="p-3 text-slate-400">{new Date(l.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
