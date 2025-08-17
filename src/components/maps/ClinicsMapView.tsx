'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPinIcon, PhoneIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

interface Veterinarian {
    id: number;
    full_name: string;
    specialization: string;
    license_number: string;
    years_experience: number;
    consultation_fee: number;
    is_available: boolean;
    average_rating: number;
}

interface Clinic {
    id: number;
    name: string;
    address: string;
    phone: string;
    email: string;
    latitude: number;
    longitude: number;
    operating_hours: any;
    is_active: boolean;
    is_emergency_available: boolean;
    created_at: string;
    veterinarians?: Veterinarian[];
}

interface ClinicsMapViewProps {
    clinics: Clinic[];
    height?: string;
    className?: string;
    onBookAppointment?: (clinic: Clinic, vet?: Veterinarian | undefined) => void;
}

export default function ClinicsMapView({ clinics, height = "500px", className = "", onBookAppointment }: ClinicsMapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);

    useEffect(() => {
        if (!mapRef.current || !clinics.length) return;

        // Check if the container already has a map instance
        if ((mapRef.current as any)._leaflet_id) {
            return;
        }

        // Dynamically import Leaflet to avoid SSR issues
        const loadMap = async () => {
            const L = await import('leaflet');
            
            // Import Leaflet CSS
            if (!document.querySelector('link[href*="leaflet.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
                link.crossOrigin = '';
                document.head.appendChild(link);
            }

            // Clean up existing map if it exists
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }

            // Clear existing markers
            markersRef.current = [];

            // Create custom clinic icon
            const createClinicIcon = (isEmergency: boolean) => {
                return L.divIcon({
                    className: 'custom-clinic-marker',
                    html: `
                        <div class="clinic-marker ${isEmergency ? 'emergency' : 'regular'}">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7V20H22V7L12 2Z" fill="${isEmergency ? '#ef4444' : '#14b8a6'}" stroke="white" stroke-width="2"/>
                                <path d="M9 14H15M12 11V17" stroke="white" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                    `,
                    iconSize: [24, 24],
                    iconAnchor: [12, 24],
                    popupAnchor: [0, -24]
                });
            };

            // Initialize map centered on Zamboanga City
            const mapElement = mapRef.current;
            if (!mapElement) return;
            
            const map = L.map(mapElement).setView([6.9214, 122.0790], 12);

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(map);

            // Add markers for each clinic
            clinics.forEach(clinic => {
                if (clinic.latitude && clinic.longitude) {
                    const icon = createClinicIcon(clinic.is_emergency_available);
                    
                    const marker = L.marker([clinic.latitude, clinic.longitude], { icon })
                        .addTo(map)
                        .bindPopup(`
                            <div class="clinic-popup">
                                <div class="clinic-popup-header">
                                    <h3 class="clinic-name">${clinic.name}</h3>
                                    ${clinic.is_emergency_available ? '<span class="emergency-badge">🚨 Emergency</span>' : ''}
                                </div>
                                <div class="clinic-details">
                                    <p class="clinic-address">📍 ${clinic.address}</p>
                                    ${clinic.phone ? `<p class="clinic-phone">📞 ${clinic.phone}</p>` : ''}
                                    ${clinic.veterinarians && clinic.veterinarians.length > 0 ? 
                                        `<p class="clinic-vets">👨‍⚕️ ${clinic.veterinarians.length} veterinarian${clinic.veterinarians.length > 1 ? 's' : ''}</p>` : ''
                                    }
                                </div>
                                <div class="popup-actions">
                                    <button class="view-details-btn" onclick="window.selectClinic(${clinic.id})">
                                        View Details
                                    </button>
                                    <button class="book-appointment-btn" onclick="window.bookAppointment(${clinic.id})">
                                        Book Appointment
                                    </button>
                                </div>
                            </div>
                        `);

                    markersRef.current.push(marker);
                }
            });

            // Fit map to show all markers if there are multiple clinics
            if (clinics.length > 1 && markersRef.current.length > 0) {
                const group = L.featureGroup(markersRef.current);
                map.fitBounds(group.getBounds().pad(0.1));
            }

            mapInstanceRef.current = map;

            // Add custom CSS for markers and popups
            const style = document.createElement('style');
            style.textContent = `
                .custom-clinic-marker {
                    background: transparent;
                    border: none;
                }
                
                .clinic-marker {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                }
                
                .clinic-marker.emergency {
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
                
                .clinic-popup {
                    min-width: 200px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .clinic-popup-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 8px;
                }
                
                .clinic-name {
                    font-weight: 600;
                    font-size: 14px;
                    margin: 0;
                    color: #1f2937;
                }
                
                .emergency-badge {
                    background: #ef4444;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 500;
                }
                
                .clinic-details {
                    margin-bottom: 12px;
                }
                
                .clinic-details p {
                    margin: 4px 0;
                    font-size: 12px;
                    color: #6b7280;
                }
                
                .view-details-btn {
                    background: #14b8a6;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                    width: 100%;
                    transition: background-color 0.2s;
                }
                
                .view-details-btn:hover {
                    background: #0d9488;
                }
                
                .popup-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 8px;
                }
                
                .book-appointment-btn {
                    background: #059669;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                    flex: 1;
                    transition: background-color 0.2s;
                }
                
                .book-appointment-btn:hover {
                    background: #047857;
                }
            `;
            document.head.appendChild(style);

            // Add global function for popup buttons
            (window as any).selectClinic = (clinicId: number) => {
                const clinic = clinics.find(c => c.id === clinicId);
                if (clinic) {
                    setSelectedClinic(clinic);
                }
            };

            // Add global function for booking appointments
            (window as any).bookAppointment = (clinicId: number) => {
                const clinic = clinics.find(c => c.id === clinicId);
                if (clinic && onBookAppointment) {
                    onBookAppointment(clinic, undefined);
                }
            };
        };

        loadMap();

        return () => {
            // Clean up map instance
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
            
            // Clear markers array
            markersRef.current = [];
            
            // Clean up global function
            delete (window as any).selectClinic;
            delete (window as any).bookAppointment;
        };
    }, [clinics, onBookAppointment]);

    return (
        <div className={`relative ${className}`}>
            <div 
                ref={mapRef} 
                style={{ height }} 
                className="w-full rounded-lg overflow-hidden border border-gray-200"
            />
            
            {/* Selected Clinic Details Panel */}
            {selectedClinic && (
                <div className="absolute top-4 right-4 left-4 sm:left-auto sm:max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
                    <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 text-sm pr-2">{selectedClinic.name}</h3>
                        <button 
                            onClick={() => setSelectedClinic(null)}
                            className="text-gray-400 hover:text-gray-600 text-lg flex-shrink-0"
                        >
                            ×
                        </button>
                    </div>
                    
                    <div className="space-y-2 text-xs text-gray-600">
                        <div className="flex items-start space-x-2">
                            <MapPinIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span className="break-words">{selectedClinic.address}</span>
                        </div>
                        
                        {selectedClinic.phone && (
                            <div className="flex items-center space-x-2">
                                <PhoneIcon className="w-3 h-3" />
                                <span>{selectedClinic.phone}</span>
                            </div>
                        )}
                        
                        {selectedClinic.veterinarians && selectedClinic.veterinarians.length > 0 && (
                            <div className="flex items-center space-x-2">
                                <BuildingOfficeIcon className="w-3 h-3" />
                                <span>{selectedClinic.veterinarians.length} veterinarian{selectedClinic.veterinarians.length > 1 ? 's' : ''}</span>
                            </div>
                        )}
                        
                        {selectedClinic.is_emergency_available && (
                            <div className="flex items-center space-x-2 text-red-600">
                                <span className="text-lg">🚨</span>
                                <span className="font-medium">Emergency Available</span>
                            </div>
                        )}
                    </div>
                    
                    <button className="w-full mt-3 bg-teal-600 text-white text-xs py-2 px-3 rounded-md hover:bg-teal-700 transition-colors">
                        Book Appointment
                    </button>
                </div>
            )}
            
            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-10">
                <div className="text-xs font-medium text-gray-700 mb-2">Legend</div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-teal-500 rounded-sm flex-shrink-0"></div>
                        <span className="text-xs text-gray-600">Regular Clinic</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-sm animate-pulse flex-shrink-0"></div>
                        <span className="text-xs text-gray-600">Emergency Available</span>
                    </div>
                </div>
            </div>
        </div>
    );
} 