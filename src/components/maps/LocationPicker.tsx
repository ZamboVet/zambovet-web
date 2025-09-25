'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  initialPosition?: [number, number];
  height?: string;
}

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    click: (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });

  return null;
}

export default function LocationPicker({
  onLocationSelect,
  initialPosition = [13.7563, 100.5018], // Default to Bangkok, Thailand
  height = '400px'
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(initialPosition);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLocationSelect = async (lat: number, lng: number) => {
    setPosition([lat, lng]);
    
    // Try to get address from coordinates using Nominatim (OpenStreetMap)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&limit=1`
      );
      const data = await response.json();
      const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      
      onLocationSelect(lat, lng, address);
    } catch (error) {
      console.error('Error getting address:', error);
      onLocationSelect(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  // Function to get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          handleLocationSelect(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your current location. Please click on the map to select a location.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser. Please click on the map to select a location.');
    }
  };

  if (!mounted) {
    return (
      <div className={`w-full bg-stone-100 rounded-lg flex items-center justify-center`} style={{ height }}>
        <div className="text-stone-500">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-stone-600">
          Click on the map to select your clinic location, or use current location
        </p>
        <button
          type="button"
          onClick={getCurrentLocation}
          className="px-3 py-1 text-xs bg-teal-100 text-teal-700 rounded-md hover:bg-teal-200 transition-colors"
        >
          Use Current Location
        </button>
      </div>
      
      <div className="relative rounded-lg overflow-hidden border border-stone-300">
        <MapContainer
          center={initialPosition}
          zoom={13}
          style={{ height, width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {position && <Marker position={position} />}
          
          <MapClickHandler onLocationSelect={handleLocationSelect} />
        </MapContainer>
      </div>
      
      {position && (
        <div className="text-xs text-stone-500 bg-stone-50 p-2 rounded">
          Selected coordinates: {position[0].toFixed(6)}, {position[1].toFixed(6)}
        </div>
      )}
    </div>
  );
}
