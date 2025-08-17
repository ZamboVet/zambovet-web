'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet marker icons in Next.js
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/images/marker-icon-2x.png',
    iconUrl: '/images/marker-icon.png',
    shadowUrl: '/images/marker-shadow.png',
  });
};

interface MapViewProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  markerTitle?: string;
  height?: string;
}

export default function MapView({
  // Pilar College, RT Lim Boulevard, Zamboanga City coordinates
  latitude = 6.5433,
  longitude = 122.0356,
  zoom = 16,
  markerTitle = 'Pilar College, RT Lim Boulevard, Zamboanga City',
  height = '400px'
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Only import Leaflet on the client side
    if (typeof window !== 'undefined' && mapRef.current && !mapInstanceRef.current) {
      fixLeafletIcon();
      
      // Initialize map
      const map = L.map(mapRef.current).setView([latitude, longitude], zoom);
      mapInstanceRef.current = map;
      
      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Add marker for Pilar College
      L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup(markerTitle)
        .openPopup();
      
      // Cleanup function
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, [latitude, longitude, zoom, markerTitle]);

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <div ref={mapRef} style={{ height }} className="z-0"></div>
    </div>
  );
}
