'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet marker icons in Next.js
const fixLeafletIcon = () => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
};

// Create custom clinic icon
const createClinicIcon = () => {
    return L.divIcon({
        className: 'custom-clinic-marker',
        html: `
      <div class="clinic-marker-container">
        <div class="clinic-marker-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#10b981" stroke="#047857" stroke-width="2"/>
            <path d="M2 17l10 5 10-5" fill="none" stroke="#047857" stroke-width="2"/>
            <path d="M2 12l10 5 10-5" fill="none" stroke="#047857" stroke-width="2"/>
            <path d="M12 8v8" stroke="white" stroke-width="2"/>
            <path d="M8 10h8" stroke="white" stroke-width="2"/>
          </svg>
        </div>
        <div class="clinic-marker-pulse"></div>
      </div>
    `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

interface ClinicMapViewProps {
    latitude: number;
    longitude: number;
    clinicName: string;
    address?: string;
    height?: string;
    zoom?: number;
}

export default function ClinicMapView({
    latitude,
    longitude,
    clinicName,
    address,
    height = '300px',
    zoom = 16
}: ClinicMapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    useEffect(() => {
        // Only initialize map on client side
        if (typeof window !== 'undefined' && mapRef.current && !mapInstanceRef.current) {
            fixLeafletIcon();

            // Initialize map
            const map = L.map(mapRef.current).setView([latitude, longitude], zoom);
            mapInstanceRef.current = map;

            // Add OpenStreetMap tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            // Create custom clinic icon
            const clinicIcon = createClinicIcon();

            // Add marker for clinic with custom icon
            const marker = L.marker([latitude, longitude], { icon: clinicIcon })
                .addTo(map);

            // Create popup content
            const popupContent = `
        <div class="clinic-popup">
          <h3 class="clinic-popup-title">${clinicName}</h3>
          ${address ? `<p class="clinic-popup-address">${address}</p>` : ''}
          <div class="clinic-popup-coordinates">
            <small>📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}</small>
          </div>
        </div>
      `;

            marker.bindPopup(popupContent);

            // Add custom CSS for the clinic marker
            const style = document.createElement('style');
            style.textContent = `
        .custom-clinic-marker {
          background: none !important;
          border: none !important;
        }
        
        .clinic-marker-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .clinic-marker-icon {
          position: relative;
          z-index: 2;
          background: white;
          border-radius: 50%;
          padding: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          border: 2px solid #10b981;
        }
        
        .clinic-marker-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 48px;
          height: 48px;
          background: #10b981;
          border-radius: 50%;
          opacity: 0.3;
          animation: clinic-pulse 2s infinite;
          z-index: 1;
        }
        
        @keyframes clinic-pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.7;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.3;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }
        
        .clinic-popup {
          font-family: system-ui, -apple-system, sans-serif;
          min-width: 200px;
        }
        
        .clinic-popup-title {
          font-size: 16px;
          font-weight: 600;
          color: #047857;
          margin: 0 0 8px 0;
          padding: 0;
        }
        
        .clinic-popup-address {
          font-size: 14px;
          color: #374151;
          margin: 0 0 8px 0;
          line-height: 1.4;
        }
        
        .clinic-popup-coordinates {
          font-size: 12px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
          padding-top: 8px;
          margin-top: 8px;
        }
      `;
            document.head.appendChild(style);

            // Cleanup function
            return () => {
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.remove();
                    mapInstanceRef.current = null;
                }
                // Remove style element
                if (style.parentNode) {
                    style.parentNode.removeChild(style);
                }
            };
        }
    }, [latitude, longitude, zoom, clinicName, address]);

    return (
        <div className="relative">
            <div ref={mapRef} style={{ height, width: '100%' }} className="z-0 rounded-lg"></div>

            {/* Map overlay with clinic info */}
            <div className="absolute top-4 left-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 z-10 max-w-xs">
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <div>
                        <p className="text-sm font-semibold text-stone-900">{clinicName}</p>
                        {address && (
                            <p className="text-xs text-stone-600 truncate">{address}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Map controls overlay */}
            <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 z-10">
                <p className="text-xs text-stone-600 flex items-center space-x-1">
                    <span>🗺️</span>
                    <span>OpenStreetMap</span>
                </p>
            </div>
        </div>
    );
}
