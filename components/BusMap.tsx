import React, { useEffect, useRef, useState } from 'react';
import { LatLng, BusRoute } from '../types';
import { searchAddress } from '../services/geocodingService';

interface BusMapProps {
  route?: BusRoute;
  currentLocation?: LatLng;
  onMapClick?: (lat: number, lng: number) => void;
  isDrawingMode?: boolean;
  previewPoints?: LatLng[];
  isOptimizing?: boolean;
  nextPoint?: LatLng;
}

const BusMap: React.FC<BusMapProps> = ({ 
  route, 
  currentLocation, 
  onMapClick, 
  isDrawingMode, 
  previewPoints,
  isOptimizing,
  nextPoint
}) => {
  const mapRef = useRef<any>(null);
  const busMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const previewPolylineRef = useRef<any>(null);
  const previewMarkersRef = useRef<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ name: string; location: LatLng }[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const calculateBearing = (start: LatLng, end: LatLng) => {
    const startLat = (start.lat * Math.PI) / 180;
    const startLng = (start.lng * Math.PI) / 180;
    const endLat = (end.lat * Math.PI) / 180;
    const endLng = (end.lng * Math.PI) / 180;
    const y = Math.sin(endLng - startLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  };

  useEffect(() => {
    const L = (window as any).L;
    if (!mapRef.current && L) {
      mapRef.current = L.map('map', { zoomControl: false }).setView([-23.5505, -46.6333], 13);
      
      // Tema Dark - CartoDB Dark Matter
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapRef.current);
      
      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
    }
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const handleClick = (e: any) => { if (isDrawingMode && onMapClick) onMapClick(e.latlng.lat, e.latlng.lng); };
    mapRef.current.off('click');
    mapRef.current.on('click', handleClick);
  }, [isDrawingMode, onMapClick]);

  useEffect(() => {
    const L = (window as any).L;
    if (!mapRef.current || !L) return;

    if (route && !isDrawingMode) {
      if (polylineRef.current) polylineRef.current.remove();
      const pathData = route.geometry || route.points;
      if (pathData.length > 0) {
        polylineRef.current = L.polyline(pathData.map(p => [p.lat, p.lng]), { 
          color: route.isOffRoute ? '#f87171' : '#60a5fa', weight: 6, lineJoin: 'round'
        }).addTo(mapRef.current);
        if (!previewPoints?.length) mapRef.current.fitBounds(polylineRef.current.getBounds(), { padding: [50, 50] });
      }
    }

    if (isDrawingMode && previewPoints) {
      if (previewPolylineRef.current) previewPolylineRef.current.remove();
      previewMarkersRef.current.forEach(m => m.remove());
      previewMarkersRef.current = [];
      previewPolylineRef.current = L.polyline(previewPoints.map(p => [p.lat, p.lng]), { 
        color: '#fbbf24', weight: 3, dashArray: '5, 10' 
      }).addTo(mapRef.current);
      previewPoints.forEach((p, i) => {
        const marker = L.circleMarker([p.lat, p.lng], {
          radius: 5, fillColor: i === 0 ? '#34d399' : '#fbbf24', color: '#fff', weight: 2, fillOpacity: 1
        }).addTo(mapRef.current);
        previewMarkersRef.current.push(marker);
      });
    } else {
      if (previewPolylineRef.current) previewPolylineRef.current.remove();
      previewMarkersRef.current.forEach(m => m.remove());
    }

    if (currentLocation && !isDrawingMode) {
      const rotation = nextPoint ? calculateBearing(currentLocation, nextPoint) : 0;
      if (busMarkerRef.current) {
        busMarkerRef.current.setLatLng([currentLocation.lat, currentLocation.lng]);
        const el = busMarkerRef.current.getElement();
        if (el) { const inner = el.querySelector('.bus-icon-inner'); if (inner) inner.style.transform = `rotate(${rotation}deg)`; }
      } else {
        const busIcon = L.divIcon({
          className: 'bus-icon',
          html: `<div class="bus-icon-inner bg-blue-500 text-white p-2 rounded-full shadow-lg border-2 border-slate-900 transition-transform duration-500 flex items-center justify-center" style="transform: rotate(${rotation}deg)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                </div>`,
          iconSize: [36, 36], iconAnchor: [18, 18]
        });
        busMarkerRef.current = L.marker([currentLocation.lat, currentLocation.lng], { icon: busIcon }).addTo(mapRef.current);
      }
    } else if (busMarkerRef.current) { busMarkerRef.current.remove(); busMarkerRef.current = null; }
  }, [route, currentLocation, isDrawingMode, previewPoints, nextPoint]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length < 3) return;
    setIsSearching(true);
    const results = await searchAddress(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const selectResult = (res: { name: string; location: LatLng }) => {
    if (mapRef.current) {
      mapRef.current.setView([res.location.lat, res.location.lng], 16);
      if (isDrawingMode && onMapClick) {
        onMapClick(res.location.lat, res.location.lng);
      }
    }
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <div className="relative w-full h-[400px] md:h-[600px] rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-800">
      <div id="map" className="w-full h-full"></div>
      
      {isDrawingMode && (
        <div className="absolute top-6 left-6 right-6 z-[1000] max-w-md">
          <form onSubmit={handleSearch} className="relative group">
            <input 
              type="text" 
              placeholder="Pesquisar endereço para ponto..." 
              className="w-full bg-slate-800/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl border border-slate-700 focus:border-blue-500 outline-none shadow-2xl transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
            
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                {searchResults.map((res, i) => (
                  <button 
                    key={i}
                    onClick={() => selectResult(res)}
                    className="w-full text-left px-6 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white border-b border-slate-700 last:border-0 transition-colors"
                  >
                    {res.name}
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>
      )}

      {isOptimizing && (
        <div className="absolute inset-0 z-[2000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-slate-700">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-slate-100">Otimizando trajeto...</p>
          </div>
        </div>
      )}

      {route?.isOffRoute && !isDrawingMode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-red-500 text-white px-6 py-2 rounded-full font-bold shadow-2xl animate-pulse">
          ⚠️ DESVIO DE ROTA DETECTADO
        </div>
      )}
    </div>
  );
};

export default BusMap;
