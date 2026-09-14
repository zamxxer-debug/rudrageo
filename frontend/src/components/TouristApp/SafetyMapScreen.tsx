import React, { useEffect, useState, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../services/api';
import { cacheSafetyZones } from '../../services/offlineSync';
import { RiskZone, EmergencyFacility } from '../../types';
import { MapPin, Download, AlertTriangle, ShieldCheck, Hospital, Phone, Navigation, CheckCircle2, Layers } from 'lucide-react';

interface SafetyMapScreenProps {
  currentLat: number;
  currentLng: number;
  onLocationSelect?: (lat: number, lng: number) => void;
}

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

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const touristMarkerRef = useRef<any>(null);

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
    if (mapInstanceRef.current) return; // Prevent re-initialization

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map);

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

  // Render zones and facilities onto Leaflet map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing overlay layers except tileLayer
    map.eachLayer((layer: any) => {
      if (!layer._url) {
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
            fillOpacity: 0.35,
            radius: zone.radius_meters || 250
          }).addTo(map);

          circle.on('click', () => setSelectedZone(zone));
        } else if (zone.geometry_type === 'polygon') {
          const polygon = L.polygon(coords, {
            color: color,
            fillColor: color,
            fillOpacity: 0.35,
            weight: 2
          }).addTo(map);

          polygon.on('click', () => setSelectedZone(zone));
        }
      } catch (e) {
        console.error('Error rendering zone on map:', e);
      }
    });

    // Draw Facilities
    facilities.forEach(fac => {
      const isHospital = fac.facility_type === 'hospital';
      const iconHtml = `<div style="background-color: ${isHospital ? '#EF4444' : '#3B82F6'}; color: white; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">${isHospital ? 'H' : 'P'}</div>`;
      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-fac-icon',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([fac.lat, fac.lng], { icon: customIcon }).addTo(map);
      marker.on('click', () => setSelectedFacility(fac));
    });

    // Draw Tourist Location Marker
    const touristIconHtml = `<div class="pulse-marker-sos" style="background-color: #10B981; border-radius: 50%; width: 18px; height: 18px; border: 3px solid white; box-shadow: 0 0 10px #10B981;"></div>`;
    const touristIcon = L.divIcon({
      html: touristIconHtml,
      className: 'custom-tourist-icon',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });

    touristMarkerRef.current = L.marker([currentLat, currentLng], { icon: touristIcon }).addTo(map);
  }, [zones, facilities]);

  // Update tourist position smoothly
  useEffect(() => {
    if (touristMarkerRef.current) {
      touristMarkerRef.current.setLatLng([currentLat, currentLng]);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo([currentLat, currentLng], { animate: true, duration: 1 });
      }
    }
  }, [currentLat, currentLng]);

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
    <div className="relative w-full h-[650px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col">
      {/* Top Map Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleDownloadArea}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900/90 hover:bg-slate-850 text-white border border-slate-700/80 shadow-lg backdrop-blur-md transition-all cursor-pointer"
          >
            <Download className={`w-4 h-4 text-emerald-400 ${downloading ? 'animate-bounce' : ''}`} />
            <span>{downloading ? 'Downloading...' : downloadSuccess ? 'Cached for Offline' : 'Download Area Offline'}</span>
          </button>
        </div>

        {/* Legend pills */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md text-[11px] font-medium text-slate-300 pointer-events-auto">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Critical</span>
          <span className="flex items-center gap-1 ml-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Warning</span>
          <span className="flex items-center gap-1 ml-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Safe</span>
        </div>
      </div>

      {/* Leaflet Map Div */}
      <div ref={mapContainerRef} className="w-full flex-1 z-0" />

      {/* Selected Zone Info Card Popup */}
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
              <span className="font-mono text-xs text-slate-400 font-bold">{selectedZone.zone_code}</span>
            </div>
            <button onClick={() => setSelectedZone(null)} className="text-slate-400 hover:text-white text-xs font-bold p-1">✕</button>
          </div>
          <h4 className="text-sm font-bold text-white mt-1.5">{selectedZone.name}</h4>
          <p className="text-xs text-slate-300 mt-1">{selectedZone.description}</p>
          <div className="mt-2 p-2 bg-slate-800/80 rounded-lg text-[11px] text-amber-300 border border-slate-700/60">
            <strong>Safety Directive:</strong> {selectedZone.safety_instructions}
          </div>
        </div>
      )}

      {/* Selected Facility Info Card Popup */}
      {selectedFacility && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-sm z-[400] p-4 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {selectedFacility.facility_type.replace('_', ' ')}
            </span>
            <button onClick={() => setSelectedFacility(null)} className="text-slate-400 hover:text-white text-xs font-bold p-1">✕</button>
          </div>
          <h4 className="text-sm font-bold text-white mt-1.5">{selectedFacility.name}</h4>
          <div className="flex items-center gap-2 mt-2">
            <a
              href={`tel:${selectedFacility.contact_number}`}
              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call {selectedFacility.contact_number}</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
