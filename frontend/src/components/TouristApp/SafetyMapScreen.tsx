import React, { useEffect, useState, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../services/api';
import { cacheSafetyZones } from '../../services/offlineSync';
import { RiskZone, EmergencyFacility } from '../../types';
import { MapPin, Download, AlertTriangle, ShieldCheck, Hospital, Phone, Navigation, CheckCircle2, Layers, Crosshair, Eye, ShieldAlert, Sparkles } from 'lucide-react';

interface SafetyMapScreenProps {
  currentLat: number;
  currentLng: number;
  onLocationSelect?: (lat: number, lng: number) => void;
}

type MapTheme = 'dark' | 'standard' | 'topo';

const TILE_SERVERS: Record<MapTheme, { url: string; subdomains?: string[]; maxZoom?: number }> = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    subdomains: ['a', 'b', 'c', 'd'],
    maxZoom: 19
  },
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 18
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    maxZoom: 17
  }
};

export const SafetyMapScreen: React.FC<SafetyMapScreenProps> = ({
  currentLat,
  currentLng,
  onLocationSelect
}) => {
  const [zones, setZones] = useState<RiskZone[]>([]);
  const [facilities, setFacilities] = useState<EmergencyFacility[]>([]);
  const [selectedZone, setSelectedZone] = useState<RiskZone | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<EmergencyFacility | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [mapTheme, setMapTheme] = useState<MapTheme>('dark');
  const [facilityFilter, setFacilityFilter] = useState<'all' | 'hospital' | 'police' | 'shelter'>('all');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const touristMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Load zones & facilities
  useEffect(() => {
    Promise.all([
      api.getZones(),
      api.getFacilities()
    ]).then(([zonesData, facilitiesData]) => {
      setZones(zonesData || []);
      setFacilities(facilitiesData || []);
    }).catch(err => {
      console.error('Failed loading map data:', err);
    });
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    // Add zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const activeTileConfig = TILE_SERVERS[mapTheme];
    const tileLayer = L.tileLayer(activeTileConfig.url, {
      maxZoom: activeTileConfig.maxZoom || 18,
      subdomains: (activeTileConfig.subdomains as any) || 'abc'
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    map.on('click', (event: L.LeafletMouseEvent) => {
      onLocationSelect?.(event.latlng.lat, event.latlng.lng);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onLocationSelect]);

  // Handle Tile Theme Switch
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const activeTileConfig = TILE_SERVERS[mapTheme];
    const newTileLayer = L.tileLayer(activeTileConfig.url, {
      maxZoom: activeTileConfig.maxZoom || 18,
      subdomains: (activeTileConfig.subdomains as any) || 'abc'
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [mapTheme]);

  // Render zones, facilities, and nearest route line onto Leaflet map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing overlay layers except tileLayer
    map.eachLayer((layer: any) => {
      if (layer !== tileLayerRef.current) {
        map.removeLayer(layer);
      }
    });

    // Draw Risk Zones
    zones.forEach(zone => {
      try {
        const coords = JSON.parse(zone.coordinates_json);
        const color = zone.risk_level === 'critical' ? '#EF4444' : zone.risk_level === 'high' ? '#F97316' : '#F59E0B';

        if (zone.geometry_type === 'circle') {
          const circle = L.circle([coords[0], coords[1]], {
            color: color,
            fillColor: color,
            fillOpacity: 0.3,
            weight: 2,
            radius: zone.radius_meters || 250
          }).addTo(map);

          circle.bindPopup(`
            <div style="font-family: inherit; padding: 4px;">
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${color};">${zone.risk_level} HAZARD</span>
              <h4 style="font-size: 13px; font-weight: bold; margin: 2px 0;">${zone.name}</h4>
              <p style="font-size: 11px; color: #475569; margin: 4px 0;">${zone.safety_instructions || zone.description}</p>
            </div>
          `);

          circle.on('click', () => setSelectedZone(zone));
        } else if (zone.geometry_type === 'polygon') {
          const polygon = L.polygon(coords, {
            color: color,
            fillColor: color,
            fillOpacity: 0.3,
            weight: 2
          }).addTo(map);

          polygon.bindPopup(`
            <div style="font-family: inherit; padding: 4px;">
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${color};">${zone.risk_level} HAZARD</span>
              <h4 style="font-size: 13px; font-weight: bold; margin: 2px 0;">${zone.name}</h4>
              <p style="font-size: 11px; color: #475569; margin: 4px 0;">${zone.safety_instructions || zone.description}</p>
            </div>
          `);

          polygon.on('click', () => setSelectedZone(zone));
        }
      } catch (e) {
        console.error('Error rendering zone on map:', e);
      }
    });

    // Filtered Facilities
    const filteredFacs = facilities.filter(f => {
      if (facilityFilter === 'all') return true;
      if (facilityFilter === 'hospital') return f.facility_type.includes('hospital');
      if (facilityFilter === 'police') return f.facility_type.includes('police');
      if (facilityFilter === 'shelter') return f.facility_type.includes('shelter') || f.facility_type.includes('forest');
      return true;
    });

    // Draw Facilities
    filteredFacs.forEach(fac => {
      const isHospital = fac.facility_type.includes('hospital');
      const isPolice = fac.facility_type.includes('police');
      const iconColor = isHospital ? '#EF4444' : isPolice ? '#3B82F6' : '#10B981';
      const iconSymbol = isHospital ? '🏥' : isPolice ? '👮' : '🛡️';

      const iconHtml = `<div style="background-color: ${iconColor}; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 13px; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">${iconSymbol}</div>`;
      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-fac-icon',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([fac.lat, fac.lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: inherit; padding: 4px;">
          <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: ${iconColor};">${fac.facility_type.replace('_', ' ')}</span>
          <h4 style="font-size: 13px; font-weight: bold; margin: 2px 0;">${fac.name}</h4>
          <p style="font-size: 11px; margin: 4px 0;">📞 ${fac.contact_number}</p>
        </div>
      `);
      marker.on('click', () => {
        setSelectedFacility(fac);
        drawRouteToFacility(fac.lat, fac.lng);
      });
    });

    // Draw Tourist Location Marker
    const touristIconHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 rounded-full bg-emerald-500/30 animate-ping"></div>
        <div class="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-xl shadow-emerald-950 flex items-center justify-center text-[10px] text-white font-black">
          📍
        </div>
      </div>
    `;
    const touristIcon = L.divIcon({
      html: touristIconHtml,
      className: 'custom-tourist-icon',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    touristMarkerRef.current = L.marker([currentLat, currentLng], { icon: touristIcon }).addTo(map);
  }, [zones, facilities, facilityFilter, mapTheme]);

  // Update tourist position smoothly
  useEffect(() => {
    if (touristMarkerRef.current) {
      touristMarkerRef.current.setLatLng([currentLat, currentLng]);
    }
  }, [currentLat, currentLng]);

  const drawRouteToFacility = (targetLat: number, targetLng: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
    }

    const route = L.polyline([[currentLat, currentLng], [targetLat, targetLng]], {
      color: '#3B82F6',
      weight: 3,
      dashArray: '6, 8',
      opacity: 0.8
    }).addTo(map);

    routeLineRef.current = route;
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([currentLat, currentLng], 14, { animate: true });
    }
  };

  const handleDownloadArea = async () => {
    setDownloading(true);
    try {
      await cacheSafetyZones(zones);
      setTimeout(() => {
        setDownloading(false);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      }, 1000);
    } catch (e) {
      setDownloading(false);
    }
  };

  return (
    <div className="relative w-full h-[650px] rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col shadow-2xl">
      {/* Top Map Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Tile Layer Selector */}
          <div className="flex items-center bg-slate-900/95 border border-slate-700/80 rounded-xl p-1 shadow-xl backdrop-blur-md text-xs font-bold text-slate-300">
            <button
              onClick={() => setMapTheme('dark')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                mapTheme === 'dark' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Voyager
            </button>
            <button
              onClick={() => setMapTheme('standard')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                mapTheme === 'standard' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Street
            </button>
            <button
              onClick={() => setMapTheme('topo')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                mapTheme === 'topo' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Terrain
            </button>
          </div>

          {/* Facility Filter */}
          <div className="hidden sm:flex items-center bg-slate-900/95 border border-slate-700/80 rounded-xl p-1 shadow-xl backdrop-blur-md text-xs font-bold text-slate-300">
            <button
              onClick={() => setFacilityFilter('all')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${facilityFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
            >
              All
            </button>
            <button
              onClick={() => setFacilityFilter('hospital')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${facilityFilter === 'hospital' ? 'bg-red-500/20 text-red-300' : 'text-slate-400'}`}
            >
              🏥 Hospitals
            </button>
            <button
              onClick={() => setFacilityFilter('police')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${facilityFilter === 'police' ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400'}`}
            >
              👮 Police
            </button>
          </div>

          <button
            onClick={handleDownloadArea}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/95 hover:bg-slate-850 text-white border border-slate-700/80 shadow-xl backdrop-blur-md transition-all cursor-pointer"
          >
            <Download className={`w-3.5 h-3.5 text-emerald-400 ${downloading ? 'animate-bounce' : ''}`} />
            <span>{downloading ? 'Caching...' : downloadSuccess ? 'Cached (Offline Ready)' : 'Offline Pack'}</span>
          </button>
        </div>

        {/* Recenter & Teleport Guidance */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleRecenter}
            title="Recenter Map to Your Current GPS Position"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900/95 hover:bg-slate-800 text-amber-300 border border-slate-700/80 shadow-xl backdrop-blur-md transition-colors cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5 text-amber-400" />
            <span>Recenter GPS</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full flex-1 z-0" />

      {/* Click-to-teleport banner hint at bottom */}
      <div className="absolute top-16 left-4 z-[400] bg-slate-950/80 border border-slate-800/80 px-3 py-1 rounded-full text-[10px] text-slate-400 shadow-md backdrop-blur-sm pointer-events-none hidden sm:block">
        💡 Click anywhere on map to simulate moving GPS coordinates
      </div>

      {/* Selected Zone Info Drawer */}
      {selectedZone && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-[400] p-4 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded border ${
                selectedZone.risk_level === 'critical'
                  ? 'bg-red-500/20 text-red-300 border-red-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {selectedZone.risk_level} Hazard
              </span>
              <span className="font-mono text-xs text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded">{selectedZone.zone_code}</span>
            </div>
            <button onClick={() => setSelectedZone(null)} className="text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer">✕</button>
          </div>
          <h4 className="text-sm font-bold text-white mt-1.5">{selectedZone.name}</h4>
          <p className="text-xs text-slate-300 mt-1">{selectedZone.description}</p>
          <div className="mt-2 p-2.5 bg-slate-800/80 rounded-xl text-[11px] text-amber-300 border border-slate-700/60">
            <strong>Safety Directive:</strong> {selectedZone.safety_instructions}
          </div>
        </div>
      )}

      {/* Selected Facility Info Drawer */}
      {selectedFacility && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-sm z-[400] p-4 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {selectedFacility.facility_type.replace('_', ' ')}
            </span>
            <button onClick={() => { setSelectedFacility(null); if (routeLineRef.current && mapInstanceRef.current) mapInstanceRef.current.removeLayer(routeLineRef.current); }} className="text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer">✕</button>
          </div>
          <h4 className="text-sm font-bold text-white mt-1.5">{selectedFacility.name}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">24x7 Emergency Station • Sector Nilgiris</p>
          <div className="flex items-center gap-2 mt-3">
            <a
              href={`tel:${selectedFacility.contact_number}`}
              className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Helpline ({selectedFacility.contact_number})</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

