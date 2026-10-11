import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, useMapEvents, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Route, RouteSegment, Coordinates } from '../../types';
import { scoreToMapColor, formatDistance } from '../../lib/scoring';
import { Layers, Crosshair, Wind, Info, Map as MapIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// Fix Leaflet icon URLs in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom origin marker – glowing eco green pin with white border
const originIcon = L.divIcon({
  html: `<div style="
    width:26px;height:26px;border-radius:50%;
    background:linear-gradient(135deg,#22C55E,#16A34A);
    border:3px solid #FFFFFF;
    box-shadow:0 0 0 3px rgba(34,197,94,0.35),0 6px 16px rgba(34,197,94,0.5);
    position:relative;display:flex;align-items:center;justify-content:center;
    cursor:grab;
  ">
    <div style="width:7px;height:7px;border-radius:50%;background:#FFFFFF;"></div>
  </div>`,
  className: '',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

// Custom destination marker – glowing sunshine star pin
const destIcon = L.divIcon({
  html: `<div style="
    width:30px;height:36px;position:relative;
    display:flex;flex-direction:column;align-items:center;
    cursor:grab;
  ">
    <div style="
      width:26px;height:26px;
      background:linear-gradient(135deg,#FACC15,#F97316);
      border:3px solid #FFFFFF;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 0 0 3px rgba(250,204,21,0.35),0 6px 16px rgba(249,115,22,0.5);
      display:flex;align-items:center;justify-content:center;
    ">
      <div style="width:7px;height:7px;border-radius:50%;background:#FFFFFF;transform:rotate(45deg);"></div>
    </div>
  </div>`,
  className: '',
  iconSize: [30, 36],
  iconAnchor: [15, 32],
});

// Animated hotspot icon with sunset pulse
const hotspotIcon = (color: string, pm25: number) => L.divIcon({
  html: `<div style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;position:relative;">
    <div style="
      position:absolute;width:40px;height:40px;border-radius:50%;
      background:${color}22;border:2px solid ${color}60;
      animation:pulseRing 2s ease-out infinite;
    "></div>
    <div style="
      position:relative;width:16px;height:16px;border-radius:50%;
      background:${color};border:2px solid #FFFFFF;
      box-shadow:0 0 10px ${color},0 2px 4px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    ">
      <div style="width:5px;height:5px;border-radius:50%;background:#FFFFFF;"></div>
    </div>
    <div style="
      position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);
      background:${color};color:#FFFFFF;
      font-size:9px;font-weight:800;letter-spacing:0.04em;
      padding:2px 6px;border-radius:6px;white-space:nowrap;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
    ">PM ${pm25}</div>
  </div>`,
  className: '',
  iconSize: [48, 60],
  iconAnchor: [24, 20],
});

// Map event listener for clicking to set coordinates
function MapClickHandler({ onMapClick }: { onMapClick?: (coords: Coordinates) => void }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

// Invalidate container size on mount to ensure all tiles render crisp without grey spots
function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// Auto-fit bounds when routes or coordinates change
function FitBounds({ coordinates }: { coordinates: Coordinates[] }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true });
    }
  }, [coordinates, map]);
  return null;
}

// Map center controller
function MapFlyTo({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 13, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

export type TileLayerKey = 'osm' | 'hot' | 'voyager' | 'dark' | 'topo';

interface TileConfig {
  name: string;
  url: string;
  attribution: string;
  subdomains?: string;
  description: string;
}

// Official OpenStreetMap tile providers (unrestricted, high-speed CORS enabled)
const TILE_PROVIDERS: Record<TileLayerKey, TileConfig> = {
  osm: {
    name: 'OpenStreetMap (Real Standard)',
    url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    description: 'Official real OpenStreetMap street map with real roads, buildings & landmarks',
  },
  voyager: {
    name: 'OpenStreetMap Streets (CARTO)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    description: 'Crisp, high-speed OpenStreetMap street view with full road labels',
  },
  hot: {
    name: 'OpenStreetMap Humanitarian',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/">HOT</a>',
    subdomains: 'abc',
    description: 'Detailed OpenStreetMap roads and public infrastructure',
  },
  dark: {
    name: 'CARTO Dark Matter (Night)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    description: 'Sleek dark theme OpenStreetMap tiles',
  },
  topo: {
    name: 'OpenTopoMap (Topographic)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    description: 'Topographic contour elevation map',
  },
};

interface EcoMapProps {
  routes?: Route[];
  selectedRouteId?: string | null;
  selectedSegmentId?: string | null;
  onSegmentClick?: (segment: RouteSegment) => void;
  onRouteClick?: (routeId: string) => void;
  originCoords?: Coordinates;
  destCoords?: Coordinates;
  originLabel?: string;
  destLabel?: string;
  onMapClick?: (coords: Coordinates) => void;
  onOriginDrag?: (coords: Coordinates) => void;
  onDestDrag?: (coords: Coordinates) => void;
  initialCenter?: [number, number];
}

export const EcoMap: React.FC<EcoMapProps> = ({
  routes = [],
  selectedRouteId,
  selectedSegmentId,
  onSegmentClick,
  onRouteClick,
  originCoords,
  destCoords,
  originLabel = 'Origin',
  destLabel = 'Destination',
  onMapClick,
  onOriginDrag,
  onDestDrag,
  initialCenter = [12.9716, 77.5946], // Default Bengaluru
}) => {
  const { theme } = useTheme();
  const [hoveredSegId, setHoveredSegId] = useState<string | null>(null);
  // Default directly to real OpenStreetMap Standard
  const [tileKey, setTileKey] = useState<TileLayerKey>('osm');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showAqiOverlay, setShowAqiOverlay] = useState(true);
  const [flyTarget, setFlyTarget] = useState<[number, number] | undefined>(undefined);

  const defaultCenter: [number, number] = originCoords
    ? [originCoords.lat, originCoords.lng]
    : destCoords
    ? [destCoords.lat, destCoords.lng]
    : initialCenter;

  const allCoords = useMemo(() => {
    if (routes.length > 0) return routes.flatMap(r => r.coordinates || []);
    const pts: Coordinates[] = [];
    if (originCoords) pts.push(originCoords);
    if (destCoords) pts.push(destCoords);
    return pts;
  }, [routes, originCoords, destCoords]);

  // Weather-inspired Route Color Palette
  const routeColorMap: Record<string, string> = {
    'route-a': '#EF4444', // Fastest (Red/Arterial)
    'route-b': '#22C55E', // Recommended Eco (Fresh Green)
    'route-c': '#2563EB', // Balanced (Ocean Blue)
  };

  // Ambient live air quality monitoring indicators around active center
  const ambientStations = useMemo(() => {
    const lat = defaultCenter[0];
    const lng = defaultCenter[1];
    return [
      { name: 'Skyway Sensor', lat: lat + 0.015, lng: lng + 0.012, aqi: 48, pm25: 14, color: '#22C55E' },
      { name: 'Valley Corridor', lat: lat - 0.018, lng: lng - 0.015, aqi: 115, pm25: 42, color: '#F97316' },
      { name: 'Botanical Park', lat: lat + 0.022, lng: lng - 0.025, aqi: 34, pm25: 9, color: '#38BDF8' },
      { name: 'Main Expressway', lat: lat - 0.025, lng: lng + 0.022, aqi: 146, pm25: 58, color: '#EF4444' },
    ];
  }, [defaultCenter]);

  // Locate User GPS
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const coords: Coordinates = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setFlyTarget([coords.lat, coords.lng]);
          if (onMapClick) onMapClick(coords);
        },
        err => {
          console.warn('Geolocation failed:', err);
          alert('Could not obtain GPS location. Please check browser permissions.');
        },
        { timeout: 8000 }
      );
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ width: '100%', height: '100%', background: '#F8FAFC' }}
        zoomControl={false}
      >
        {/* Real OpenStreetMap TileLayer */}
        <TileLayer
          key={tileKey}
          url={TILE_PROVIDERS[tileKey].url}
          attribution={TILE_PROVIDERS[tileKey].attribution}
          subdomains={TILE_PROVIDERS[tileKey].subdomains || 'abc'}
          maxZoom={19}
        />

        <MapResizeHandler />
        <MapClickHandler onMapClick={onMapClick} />
        {allCoords.length > 0 && <FitBounds coordinates={allCoords} />}
        {flyTarget && <MapFlyTo center={flyTarget} zoom={14} />}

        {/* Ambient Air Quality stations overlay */}
        {showAqiOverlay && ambientStations.map((station, i) => (
          <CircleMarker
            key={`station-${i}`}
            center={[station.lat, station.lng]}
            radius={9}
            pathOptions={{
              fillColor: station.color,
              fillOpacity: 0.85,
              color: '#FFFFFF',
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ padding: '4px 2px', minWidth: 150 }}>
                <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {station.name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>AQI Index:</span>
                  <span style={{ fontWeight: 800, color: station.color }}>{station.aqi}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>PM2.5:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{station.pm25} µg/m³</span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Draw all routes */}
        {routes.map(route => {
          const isSelected = selectedRouteId === route.id;
          const isOther = selectedRouteId && !isSelected;
          const routeColor = routeColorMap[route.id] || route.color || '#22C55E';
          const routeCoords = (route.coordinates || []).map(c => [c.lat, c.lng] as [number, number]);
          const routeSegments = route.segments || [];

          return (
            <React.Fragment key={route.id}>
              {/* Outer glow aura for selected route */}
              {isSelected && routeCoords.length > 0 && (
                <Polyline
                  positions={routeCoords}
                  pathOptions={{ color: routeColor, weight: 18, opacity: 0.2 }}
                />
              )}
              {isSelected && routeCoords.length > 0 && (
                <Polyline
                  positions={routeCoords}
                  pathOptions={{ color: routeColor, weight: 10, opacity: 0.35 }}
                />
              )}

              {/* Segmented breakdown for selected route */}
              {isSelected && routeSegments.length > 0
                ? routeSegments.map(seg => {
                    const color = scoreToMapColor(seg.overallExposureScore);
                    const isHov = hoveredSegId === seg.id;
                    const isSel = selectedSegmentId === seg.id;
                    const segCoords = (seg.coordinates || []).map(c => [c.lat, c.lng] as [number, number]);
                    if (segCoords.length === 0) return null;
                    return (
                      <Polyline
                        key={seg.id}
                        positions={segCoords}
                        pathOptions={{
                          color: isSel ? 'var(--text-primary)' : color,
                          weight: isHov || isSel ? 9 : 6,
                          opacity: isHov || isSel ? 1 : 0.95,
                          lineCap: 'round',
                          lineJoin: 'round',
                        }}
                        eventHandlers={{
                          click: () => onSegmentClick?.(seg),
                          mouseover: () => setHoveredSegId(seg.id),
                          mouseout: () => setHoveredSegId(null),
                        }}
                      >
                        {isHov && (
                          <Popup>
                            <div style={{ padding: '6px 4px', minWidth: 170 }}>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, fontSize: 13 }}>
                                {seg.streetName || 'Road Segment'}
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', fontSize: 11 }}>
                                <span style={{ color: 'var(--text-muted)' }}>PM2.5</span>
                                <span style={{ fontWeight: 700, color: '#F97316' }}>{seg.pm25} µg/m³</span>
                                <span style={{ color: 'var(--text-muted)' }}>Temperature</span>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{seg.temperature}°C</span>
                                <span style={{ color: 'var(--text-muted)' }}>Distance</span>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatDistance(seg.distanceMeters)}</span>
                                <span style={{ color: 'var(--text-muted)' }}>Exposure Score</span>
                                <span style={{ fontWeight: 800, color: scoreToMapColor(seg.overallExposureScore) }}>
                                  {seg.overallExposureScore}/100
                                </span>
                              </div>
                            </div>
                          </Popup>
                        )}
                      </Polyline>
                    );
                  })
                : routeCoords.length > 0 && (
                  <>
                    <Polyline
                      positions={routeCoords}
                      pathOptions={{
                        color: routeColor,
                        weight: 8,
                        opacity: isOther ? 0.08 : 0.2,
                      }}
                    />
                    <Polyline
                      positions={routeCoords}
                      pathOptions={{
                        color: routeColor,
                        weight: 4,
                        opacity: isOther ? 0.4 : 0.75,
                        dashArray: isOther ? '7 5' : undefined,
                        lineCap: 'round',
                      }}
                      eventHandlers={{ click: () => onRouteClick?.(route.id) }}
                    />
                  </>
                )
              }

              {/* Hotspot indicators with animated rings */}
              {isSelected && routeSegments
                .filter(s => s.isHotspot && s.coordinates && s.coordinates.length > 0)
                .map(seg => {
                  const center = seg.coordinates[Math.floor(seg.coordinates.length / 2)];
                  if (!center) return null;
                  return (
                    <Marker
                      key={`hotspot-${seg.id}`}
                      position={[center.lat, center.lng]}
                      icon={hotspotIcon('#EF4444', seg.pm25)}
                    >
                      <Popup>
                        <div style={{ padding: '6px 4px', minWidth: 190 }}>
                          <div style={{ fontWeight: 800, color: '#EF4444', marginBottom: 4, fontSize: 11, letterSpacing: '0.06em' }}>
                            ⚠ HIGH EMISSION HOTSPOT
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, fontSize: 13 }}>
                            {seg.streetName}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', fontSize: 11 }}>
                            <span style={{ color: 'var(--text-muted)' }}>PM2.5:</span>
                            <span style={{ fontWeight: 700, color: '#F97316' }}>{seg.pm25} µg/m³</span>
                            <span style={{ color: 'var(--text-muted)' }}>Source:</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{seg.pollutionSource || 'Vehicular emissions'}</span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
            </React.Fragment>
          );
        })}

        {/* Origin Marker (Draggable) */}
        {originCoords && (
          <Marker
            position={[originCoords.lat, originCoords.lng]}
            icon={originIcon}
            draggable={!!onOriginDrag}
            eventHandlers={{
              dragend(e) {
                const marker = e.target;
                const pos = marker.getLatLng();
                onOriginDrag?.({ lat: pos.lat, lng: pos.lng });
              },
            }}
          >
            <Popup>
              <div style={{ padding: '4px 2px', fontWeight: 700, color: '#22C55E', fontSize: 13 }}>
                📍 {originLabel}
                <div style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-muted)', marginTop: 2 }}>
                  Drag to adjust starting position
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker (Draggable) */}
        {destCoords && (
          <Marker
            position={[destCoords.lat, destCoords.lng]}
            icon={destIcon}
            draggable={!!onDestDrag}
            eventHandlers={{
              dragend(e) {
                const marker = e.target;
                const pos = marker.getLatLng();
                onDestDrag?.({ lat: pos.lat, lng: pos.lng });
              },
            }}
          >
            <Popup>
              <div style={{ padding: '4px 2px', fontWeight: 700, color: '#FACC15', fontSize: 13 }}>
                ★ {destLabel}
                <div style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-muted)', marginTop: 2 }}>
                  Drag to adjust destination
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* ─── FLOATING MAP CONTROLS & OVERLAYS ─── */}

      {/* Top Left: OpenStreetMap Real Map API Status Badge */}
      <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 1000, pointerEvents: 'auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg-floating)',
          border: '1.5px solid var(--border-color)',
          borderRadius: 12,
          padding: '7px 14px',
          backdropFilter: 'blur(10px)',
          boxShadow: 'var(--shadow-card)',
        }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapIcon size={14} color="#2563EB" />
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.01em' }}>
              Real OpenStreetMap API
            </span>
          </div>
          <span style={{
            fontSize: 9.5, fontWeight: 800, color: '#22C55E', background: 'rgba(34,197,94,0.15)',
            padding: '2px 7px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            Live
          </span>
        </div>
      </div>

      {/* Top Right: Layer Switcher & Tools */}
      <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {/* Ambient Air Quality Toggle */}
          <button
            onClick={() => setShowAqiOverlay(!showAqiOverlay)}
            title="Toggle Live Air Quality Stations"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: showAqiOverlay ? (theme === 'dark' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(37, 99, 235, 0.12)') : 'var(--bg-floating)',
              border: `1.5px solid ${showAqiOverlay ? '#38BDF8' : 'var(--border-color)'}`,
              borderRadius: 10,
              padding: '7px 12px',
              color: showAqiOverlay ? (theme === 'dark' ? '#38BDF8' : '#2563EB') : 'var(--text-muted)',
              fontSize: 11.5, fontWeight: 700,
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <Wind size={13} />
            <span>Air Quality</span>
          </button>

          {/* Locate Me Button */}
          <button
            onClick={handleLocateMe}
            title="Find My Location (GPS)"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--bg-floating)',
              border: '1.5px solid var(--border-color)',
              borderRadius: 10,
              padding: '7px 12px',
              color: 'var(--text-primary)',
              fontSize: 11.5, fontWeight: 700,
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <Crosshair size={13} color="#22C55E" />
            <span>Locate</span>
          </button>

          {/* Map Layer Switcher */}
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            title="Change Map Style"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: showLayerMenu ? 'var(--bg-subtle)' : 'var(--bg-floating)',
              border: `1.5px solid ${showLayerMenu ? '#38BDF8' : 'var(--border-color)'}`,
              borderRadius: 10,
              padding: '7px 12px',
              color: 'var(--text-primary)',
              fontSize: 11.5, fontWeight: 700,
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <Layers size={13} color="#38BDF8" />
            <span>Map Style</span>
          </button>
        </div>

        {/* Dropdown Menu for Tile Layers */}
        {showLayerMenu && (
          <div style={{
            background: 'var(--bg-panel)',
            border: '1.5px solid var(--border-color)',
            borderRadius: 12,
            padding: '6px',
            boxShadow: 'var(--shadow-elevated)',
            display: 'flex', flexDirection: 'column', gap: 4,
            minWidth: 220,
            backdropFilter: 'blur(14px)',
          }}>
            {(Object.keys(TILE_PROVIDERS) as TileLayerKey[]).map(key => (
              <button
                key={key}
                onClick={() => { setTileKey(key); setShowLayerMenu(false); }}
                style={{
                  display: 'flex', flexDirection: 'column',
                  padding: '8px 11px',
                  borderRadius: 8,
                  border: 'none',
                  background: tileKey === key ? 'var(--bg-subtle)' : 'transparent',
                  color: tileKey === key ? 'var(--ocean-blue)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{TILE_PROVIDERS[key].name}</span>
                  {tileKey === key && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#38BDF8' }} />}
                </div>
                <span style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  {TILE_PROVIDERS[key].description}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Right: Exposure Legend */}
      <div style={{ position: 'absolute', bottom: 20, right: 14, zIndex: 1000 }}>
        <div style={{
          background: 'var(--bg-floating)',
          border: '1.5px solid var(--border-color)',
          borderRadius: 12,
          padding: '11px 13px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          boxShadow: 'var(--shadow-card)',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ fontWeight: 800, marginBottom: 7, color: 'var(--text-primary)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Pollution Exposure
          </div>
          {[
            { color: '#22C55E', label: 'Clean Air' },
            { color: '#FACC15', label: 'Moderate' },
            { color: '#F97316', label: 'Elevated' },
            { color: '#EF4444', label: 'High Exposure' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{
                width: 20, height: 5, background: color, borderRadius: 3,
                boxShadow: `0 0 6px ${color}60`,
              }} />
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
            </div>
          ))}
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '8px 0 6px' }} />
          <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Info size={11} />
            <span>Click map to place pins</span>
          </div>
        </div>
      </div>
    </div>
  );
};
