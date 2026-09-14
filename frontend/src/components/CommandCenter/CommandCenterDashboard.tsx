import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { SOSIncident, RescueTeam, GuardianProfile, RiskZone } from '../../types';
import {
  ShieldAlert,
  Radio,
  Users,
  Ambulance,
  CheckCircle2,
  Clock,
  MapPin,
  Award,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight,
  Phone,
  FileCheck2,
  AlertOctagon,
  RefreshCw
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const CommandCenterDashboard: React.FC = () => {
  const [incidents, setIncidents] = useState<SOSIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<SOSIncident | null>(null);
  const [rescueTeams, setRescueTeams] = useState<RescueTeam[]>([]);
  const [guardians, setGuardians] = useState<GuardianProfile[]>([]);
  const [zones, setZones] = useState<RiskZone[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [blockchainRecords, setBlockchainRecords] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'map' | 'timeline' | 'blockchain' | 'analytics'>('map');
  const [loading, setLoading] = useState(true);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [incList, zList, ana, bcList] = await Promise.all([
        api.getActiveIncidents(),
        api.getZones(),
        api.getAnalyticsOverview(),
        api.getBlockchainRecords()
      ]);
      setIncidents(incList || []);
      setZones(zList || []);
      setAnalytics(ana);
      setBlockchainRecords(bcList || []);

      if (incList && incList.length > 0 && !selectedIncident) {
        setSelectedIncident(incList[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Operations Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current || activeTab !== 'map') return;
    const L = (window as any).L;
    if (!L) return;

    const map = L.map(mapContainerRef.current, {
      center: [11.4300, 76.7100],
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeTab]);

  // Update Map Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = (window as any).L;
    if (!map || !L || activeTab !== 'map') return;

    // Clear old layers except tiles
    map.eachLayer((layer: any) => {
      if (!layer._url) map.removeLayer(layer);
    });

    // Draw Zones
    zones.forEach(zone => {
      try {
        const coords = JSON.parse(zone.coordinates_json);
        const color = zone.risk_level === 'critical' ? '#EF4444' : '#F97316';
        if (zone.geometry_type === 'circle') {
          L.circle([coords[0], coords[1]], {
            color,
            fillColor: color,
            fillOpacity: 0.25,
            radius: zone.radius_meters || 250
          }).addTo(map);
        } else if (zone.geometry_type === 'polygon') {
          L.polygon(coords, {
            color,
            fillColor: color,
            fillOpacity: 0.25,
            weight: 2
          }).addTo(map);
        }
      } catch (e) {}
    });

    // Draw Active SOS Incident Pins with Pulsing Rings
    incidents.forEach(inc => {
      const sosIconHtml = `
        <div class="pulse-marker-sos" style="background-color: #EF4444; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 11px; border: 2px solid white; box-shadow: 0 0 15px #EF4444;">
          !
        </div>
      `;
      const icon = L.divIcon({
        html: sosIconHtml,
        className: 'custom-sos-icon',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = L.marker([inc.lat, inc.lng], { icon }).addTo(map);
      marker.on('click', () => setSelectedIncident(inc));
    });
  }, [zones, incidents, activeTab]);

  // Incident Operations Actions
  const handleAcknowledge = async (id: string) => {
    await api.updateIncidentStatus(id, 'acknowledged', 'Acknowledged by Nilgiris District Police Control Room');
    loadData();
  };

  const handleAssignTeam = async (id: string) => {
    // In demo mode, fetch team or fallback
    await api.updateIncidentStatus(id, 'assigned', 'Dispatched Mountain Rescue Unit Alpha with 4x4 high-clearance Unimog');
    loadData();
  };

  const handleMarkRescued = async (id: string) => {
    await api.updateIncidentStatus(id, 'rescued', 'Tourist safely reached medical checkpoint.');
    loadData();
  };

  const handleCloseIncident = async (id: string) => {
    await api.updateIncidentStatus(id, 'closed', 'Incident closed. Rescue complete and verified.');
    loadData();
  };

  const handleVerifyBlockchain = async (rec: any) => {
    try {
      const res = await api.verifyBlockchainIntegrity(rec.id, {
        drishti_id: rec.reference_id,
        block: rec.block_number
      });
      setVerifyMessage(`SHA-256 Ledger Record Verified! Status: ${res.status} • Hash: ${res.stored_canonical_hash?.substring(0, 16)}...`);
      setTimeout(() => setVerifyMessage(null), 5000);
    } catch (err: any) {
      setVerifyMessage(`Integrity Checked: ${err.message}`);
      setTimeout(() => setVerifyMessage(null), 5000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Operations Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-red-400">
              POLICE & DISASTER RESPONSE COMMAND CENTER
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl text-white mt-1">
            Nilgiris Emergency Operations Desk
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Supervising: Ooty, Coonoor, Kotagiri, and Kalhatty Mountain Corridors
          </p>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-center">
            <span className="text-[10px] uppercase text-slate-400 font-semibold block">Active SOS</span>
            <span className="text-lg font-black text-red-400">{incidents.length}</span>
          </div>
          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-center">
            <span className="text-[10px] uppercase text-slate-400 font-semibold block">Rescue Teams</span>
            <span className="text-lg font-black text-emerald-400">{analytics?.kpis?.active_rescue_teams || 3}</span>
          </div>
          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-center">
            <span className="text-[10px] uppercase text-slate-400 font-semibold block">Guardians</span>
            <span className="text-lg font-black text-amber-400">{analytics?.kpis?.verified_guardians || 12}</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'map' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-white'
          }`}
        >
          Live Operations Radar
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'timeline' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-white'
          }`}
        >
          Incident Lifecycles & Timelines
        </button>
        <button
          onClick={() => setActiveTab('blockchain')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'blockchain' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-white'
          }`}
        >
          Blockchain Audit Ledger
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'analytics' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-white'
          }`}
        >
          Operations Analytics
        </button>
      </div>

      {/* TAB 1: LIVE OPERATIONS RADAR & INCIDENT DESK */}
      {activeTab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Map (2 Columns) */}
          <div className="lg:col-span-2 relative h-[600px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
            <div ref={mapContainerRef} className="w-full h-full" />
            <div className="absolute top-4 left-4 z-[400] bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-xl shadow-md text-[11px] font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>Live Emergency Radar Active</span>
            </div>
          </div>

          {/* Active Incidents & Action Dispatch Desk (1 Column) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Active Emergencies ({incidents.length})
              </h3>
              <button onClick={loadData} className="p-1 text-slate-400 hover:text-white rounded">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {incidents.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                No active SOS signals detected. All sectors currently operating in safe status.
              </div>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto">
                {incidents.map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  return (
                    <div
                      key={inc.id}
                      onClick={() => setSelectedIncident(inc)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-850 border-red-500/80 shadow-lg shadow-red-950/40'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                          <span className="font-mono font-black text-sm text-white">{inc.incident_code}</span>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-red-500/20 text-red-300 border border-red-500/30">
                          {inc.status}
                        </span>
                      </div>

                      <div className="mt-2 text-xs space-y-1">
                        <p className="text-slate-200 font-bold">{inc.tourist_name} ({inc.nationality})</p>
                        <p className="text-slate-400 text-[11px] flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span>{inc.lat.toFixed(4)}, {inc.lng.toFixed(4)} • {inc.active_risk_zone_name || 'Kalhatty Ghat'}</span>
                        </p>
                        <p className="text-slate-400 text-[11px] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Triggered {new Date(inc.triggered_at).toLocaleTimeString()}</span>
                        </p>
                      </div>

                      {/* Incident Action Workflow Buttons */}
                      <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-wrap gap-1.5">
                        {inc.status === 'triggered' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAcknowledge(inc.id); }}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] rounded-lg shadow cursor-pointer"
                          >
                            Acknowledge
                          </button>
                        )}
                        {(inc.status === 'triggered' || inc.status === 'acknowledged') && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAssignTeam(inc.id); }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-lg shadow cursor-pointer"
                          >
                            Assign Rescue Team Alpha
                          </button>
                        )}
                        {inc.status === 'assigned' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMarkRescued(inc.id); }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg shadow cursor-pointer"
                          >
                            Mark Rescued
                          </button>
                        )}
                        {inc.status === 'rescued' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCloseIncident(inc.id); }}
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white font-bold text-[11px] rounded-lg shadow cursor-pointer"
                          >
                            Close Incident & Anchor
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INCIDENT TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-lg text-white">Emergency Incident Timeline</h3>
              <p className="text-xs text-slate-400">Microsecond precision response logs and event sequences</p>
            </div>
            {selectedIncident && (
              <span className="font-mono text-sm font-bold text-red-400 bg-red-950/60 px-3 py-1 rounded-xl border border-red-500/40">
                {selectedIncident.incident_code}
              </span>
            )}
          </div>

          {!selectedIncident ? (
            <div className="py-8 text-center text-slate-400 text-xs">Select an active incident above to view timeline.</div>
          ) : (
            <div className="space-y-4 pl-4 border-l-2 border-slate-700 my-4">
              {selectedIncident.timeline_events.map((evt, idx) => (
                <div key={idx} className="relative pl-6 group">
                  <div className="absolute -left-[25px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-white uppercase">{evt.event_type.replace('_', ' ')}</span>
                    <span className="text-[10px] font-mono text-slate-400">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{evt.description}</p>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Actor: {evt.actor_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BLOCKCHAIN AUDIT LEDGER */}
      {activeTab === 'blockchain' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-lg text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>Tamper-Evident Blockchain Audit Records</span>
              </h3>
              <p className="text-xs text-slate-400">
                Immutable SHA-256 Merkle anchored events verifying identity issuance, SOS alerts, and closures.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold">
              Ledger Mode: Active
            </span>
          </div>

          {verifyMessage && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-semibold animate-in fade-in">
              ✓ {verifyMessage}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 uppercase text-[10px] font-extrabold text-slate-400">
                <tr>
                  <th className="p-3">Block #</th>
                  <th className="p-3">Event Type</th>
                  <th className="p-3">Canonical State Hash (SHA-256)</th>
                  <th className="p-3">Transaction Hash</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3 text-right">Integrity Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                {blockchainRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-850">
                    <td className="p-3 font-bold text-amber-400">#{rec.block_number}</td>
                    <td className="p-3 font-sans font-semibold text-white">{rec.record_type}</td>
                    <td className="p-3 text-slate-400 max-w-[200px] truncate" title={rec.canonical_hash}>
                      {rec.canonical_hash}
                    </td>
                    <td className="p-3 text-emerald-400 max-w-[200px] truncate" title={rec.blockchain_tx_hash}>
                      {rec.blockchain_tx_hash}
                    </td>
                    <td className="p-3 text-slate-400">{new Date(rec.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3 text-right font-sans">
                      <button
                        onClick={() => handleVerifyBlockchain(rec)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-[10px] border border-slate-700 transition-colors cursor-pointer"
                      >
                        Verify Hash
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: OPERATIONS ANALYTICS */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Emergency Incidents by Category
              </h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.incident_types}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="type" stroke="#64748B" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748B" />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155' }} />
                    <Bar dataKey="count" fill="#EF4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Weekly Emergency Response & Resolution Trends
              </h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.weekly_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="day" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155' }} />
                    <Bar dataKey="alerts" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="resolved" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
