import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useLocation, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import './CampusMap.css';
import NavigationInfoPanel from './NavigationInfoPanel';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// Expose Leaflet to window so the OSMBuildings script can find it
window.L = L;

// New Component to render 3D buildings locally
const OSM3DBuildings = ({ buildings }) => {
    const map = useMap();
    
    useEffect(() => {
        // Wait until we have buildings to cross-reference colors
        if (!buildings || buildings.length === 0) return;

        let osmb = null;

        const loadOSMB = () => {
            if (window.OSMBuildings) {
                // Initialize OSMBuildings on the CURRENT map
                osmb = new window.OSMBuildings(map).date(new Date(2026, 4, 25, 12, 0));
                
                // Load the locally generated GeoJSON file
                fetch('/campus-buildings.json')
                    .then(res => res.json())
                    .then(geojson => {
                        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#E67E22'];
                        
                        geojson.features.forEach(feature => {
                            if (feature.geometry.type === 'Polygon') {
                                // Calculate simple centroid
                                const coords = feature.geometry.coordinates[0];
                                let clng = 0, clat = 0;
                                coords.forEach(c => { clng += c[0]; clat += c[1]; });
                                clng /= coords.length;
                                clat /= coords.length;

                                // Find if it matches a marked database building
                                const closeBuildingIndex = buildings.findIndex(b => {
                                    const blng = b.location.coordinates[0];
                                    const blat = b.location.coordinates[1];
                                    const dist = Math.sqrt(Math.pow(blng - clng, 2) + Math.pow(blat - clat, 2));
                                    return dist < 0.0006; 
                                });

                                if (closeBuildingIndex !== -1) {
                                    feature.properties.color = colors[closeBuildingIndex % colors.length];
                                    feature.properties.roofColor = feature.properties.color;
                                } else {
                                    feature.properties.color = '#cccccc'; // Default sleek gray
                                    feature.properties.roofColor = '#e0e0e0';
                                }
                            }
                        });

                        osmb.set(geojson);
                    })
                    .catch(err => console.error("Could not load 3D buildings:", err));
            } else {
                console.error("OSMBuildings script loaded but window.OSMBuildings is undefined");
            }
        };

        if (!window.OSMBuildings) {
            const script = document.createElement('script');
            script.src = "https://cdn.osmbuildings.org/classic/0.2.2b/OSMBuildings-Leaflet.js";
            script.async = true;
            script.onload = loadOSMB;
            document.head.appendChild(script);
        } else {
            loadOSMB();
        }

        return () => {
            if (osmb && map) {
                try {
                    // Try to safely remove it if the component unmounts or map changes
                    map.removeLayer(osmb);
                } catch (e) {
                    console.error("Error removing osmb layer:", e);
                }
            }
        };
    }, [map, buildings]);
    
    return null;
};

const MapController = ({ path, fitBoundsOnLoad }) => {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => map.invalidateSize(), 100);
        let polyline = null;
        if (path && path.length > 0) {
            const latLngs = path.map(coords => [coords[1], coords[0]]);
            polyline = L.polyline(latLngs, { color: '#007bff', weight: 6, opacity: 0.9 }).addTo(map);
            
            // Fluent flyToBounds animation to smoothly show the entire route
            if (fitBoundsOnLoad) {
                map.flyToBounds(polyline.getBounds(), { padding: [50, 50], duration: 1.5 });
            }
        }
        return () => {
            clearTimeout(timer);
            if (polyline) map.removeLayer(polyline);
        };
    }, [map, path, fitBoundsOnLoad]);
    return null;
};

// Main Map Component
const CampusMap = () => {
    const INITIAL_CENTER = [23.03378, 72.5475]; 
    const campusBounds = L.latLngBounds([23.030, 72.542], [23.038, 72.552]);
    
    const [buildings, setBuildings] = useState([]);
    const [userPosition, setUserPosition] = useState(null);
    const [currentPath, setCurrentPath] = useState(null);
    const [currentDistance, setCurrentDistance] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();
    
    // Get all possible state properties
    const { start, startName, destination, destinationName } = location.state || {};
    
    // The start point is EITHER a custom building OR the user's live position
    const routeStartPoint = start || (userPosition ? [userPosition.lng, userPosition.lat] : null);
    
    // Navigation is active if we have a valid start point and a destination
    const isNavigating = !!(routeStartPoint && destination);

    // --- REAL-TIME ROUTING EFFECT ---
    // Use stringified coordinates to avoid unnecessary re-renders due to array reference changes
    const startStr = JSON.stringify(routeStartPoint);
    const destStr = JSON.stringify(destination);

    useEffect(() => {
        if (isNavigating && routeStartPoint && destination) {
            const fetchRoute = async () => {
                try {
                    const response = await fetch('http://localhost:5001/api/routing/get-path', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            startCoords: JSON.parse(startStr), 
                            endCoords: JSON.parse(destStr) 
                        })
                    });
                    if (!response.ok) throw new Error("Network response was not ok");
                    const data = await response.json();
                    setCurrentPath(data.path);
                    setCurrentDistance(data.distance);
                } catch (error) {
                    console.error("Failed to fetch real-time route:", error);
                }
            };
            
            // Short debounce
            const handler = setTimeout(() => {
                fetchRoute();
            }, 300);
            
            return () => clearTimeout(handler);
        }
    }, [startStr, destStr, isNavigating]); 

    useEffect(() => {
        const fetchBuildings = async () => { 
            try {
                const response = await fetch('http://localhost:5001/api/buildings');
                const data = await response.json();
                if (Array.isArray(data)) {
                    setBuildings(data);
                }
            } catch (error) {
                console.error("Failed to fetch buildings:", error);
            }
         };
        fetchBuildings();
    }, []);

    const handleCancelNavigation = () => {
        setCurrentPath(null);
        setCurrentDistance(0);

        navigate('/directions', { replace: true });
    };

    const userLocationIcon = new L.divIcon({ className: 'user-location-icon', html: '<div class="user-dot"></div>', iconSize: [20, 20] });

    return (
        <div className="map-page-container">
            {isNavigating && <NavigationInfoPanel destinationName={destinationName} distance={currentDistance} onCancel={handleCancelNavigation}/>}
            <div className="map-wrapper">
                <MapContainer center={INITIAL_CENTER} zoom={17} className="leaflet-map" maxBounds={campusBounds} minZoom={16}>
                    <TileLayer 
                        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" 
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        maxZoom={20}
                    />
                    <OSM3DBuildings buildings={buildings} />
                    
                    {!isNavigating && Array.isArray(buildings) && buildings.map(b => <Marker key={b._id} position={[b.location.coordinates[1], b.location.coordinates[0]]}><Popup><b>{b.name}</b></Popup></Marker>)}
                    
                    <LocationTracker campusBounds={campusBounds} onLocationUpdate={setUserPosition} />
                    
                    {userPosition && <Marker position={userPosition} icon={userLocationIcon}><Popup>Your Location</Popup></Marker>}
                    {isNavigating && start && <Marker position={[start[1], start[0]]}><Popup>{startName}</Popup></Marker>}
                    {isNavigating && destination && <Marker position={[destination[1], destination[0]]}><Popup>{destinationName}</Popup></Marker>}
                    
                    {/* The controller now only needs the calculated path to draw */}
                    <MapController path={currentPath} fitBoundsOnLoad={!!start} />
                </MapContainer>
                
                {/* Show a loading overlay if we are waiting for GPS */}
                {!routeStartPoint && destination && (
                    <div className="location-loading-overlay" style={{
                        position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', 
                        background: 'rgba(0,0,0,0.8)', color: 'white', padding: '10px 20px', 
                        borderRadius: '20px', zIndex: 1000, fontWeight: 'bold'
                    }}>
                        📍 Waiting for GPS location...
                    </div>
                )}
            </div>
        </div>
    );
};

// LocationTracker remains unchanged
const LocationTracker = ({ campusBounds, onLocationUpdate }) => {
    const map = useMap();
    useEffect(() => {
        map.locate({ watch: true, enableHighAccuracy: true }).on("locationfound", function (e) {
            // Unconditionally accept location to allow testing off-campus
            onLocationUpdate(e.latlng);
        }).on("locationerror", function (e) {
            console.error("Location error:", e.message);
            // We no longer fallback to a default location. If GPS fails or is denied,
            // we simply don't show the user location dot.
        });
    }, [map, campusBounds, onLocationUpdate]);
    return null;
};

export default CampusMap;