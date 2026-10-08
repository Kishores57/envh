import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Route, RouteSegment, Coordinates } from '../../types';
import { scoreToMapColor, formatDistance } from '../../lib/scoring';

// Fix Leaflet icon in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom origin marker – glowing green dot
const originIcon = L.divIcon({
  html: `<div style="
    width:22px;height:22px;border-radius:50%;
    background:linear-gradient(145deg,#00C982,#009e68);
    border:3px solid #F4F7F5;
    box-shadow:0 0 0 4px rgba(0,201,130,0.25),0 4px 12px rgba(0,201,130,0.5),0 3px 0 rgba(0,0,0,0.3);
    position:relative;display:flex;align-items:center;justify-content:center;
  ">
    <div style="width:6px;height:6px;border-radius:50%;background:#07110F;"></div>
  </div>`,
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// Custom destination marker – star/flag
const destIcon = L.divIcon({
  html: `<div style="
    width:28px;height:34px;position:relative;
    display:flex;flex-direction:column;align-items:center;
  ">
    <div style="
      width:22px;height:22px;
      background:linear-gradient(145deg,#F4C542,#e6a020);
      border:3px solid #F4F7F5;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 0 0 3px rgba(244,197,66,0.25),0 4px 12px rgba(244,197,66,0.5),0 3px 0 rgba(0,0,0,0.3);
    "></div>
  </div>`,
  className: '',
  iconSize: [28, 34],
  iconAnchor: [14, 30],
});

// Animated hotspot icon
const hotspotIcon = (color: string, pm25: number) => L.divIcon({
  html: `<div style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;position:relative;">
    <div style="
      position:absolute;width:40px;height:40px;border-radius:50%;
      background:${color}18;border:2px solid ${color}50;
      animation:pulseRing 2s ease-out infinite;
    "></div>
    <div style="
      position:absolute;width:28px;height:28px;border-radius:50%;
      background:${color}25;border:2px solid ${color}70;
    "></div>
    <div style="
      position:relative;width:16px;height:16px;border-radius:50%;
      background:${color};border:2px solid rgba(255,255,255,0.6);
      box-shadow:0 0 8px ${color},0 2px 0 rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    ">
      <div style="width:5px;height:5px;border-radius:50%;background:#07110F;"></div>
    </div>
    <div style="
      position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);
      background:${color};color:#07110F;
      font-size:8px;font-weight:800;letter-spacing:0.05em;
      padding:1px 5px;border-radius:4px;white-space:nowrap;
    ">PM ${pm25}</div>
  </div>`,
  className: '',
  iconSize: [48, 60],
  iconAnchor: [24, 20],
});

// Auto-fit bounds
function FitBounds({ coordinates }: { coordinates: Coordinates[] }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: true });
    }
  }, [coordinates, map]);
  return null;
}

interface EcoMapProps {
  routes: Route[];
  selectedRouteId: string | null;
  selectedSegmentId: string | null;
  onSegmentClick?: (segment: RouteSegment) => void;
  onRouteClick?: (routeId: string) => void;
  originCoords?: Coordinates;
  destCoords?: Coordinates;
  originLabel?: string;
  destLabel?: string;
}

export const EcoMap: React.FC<EcoMapProps> = ({
  routes,
  selectedRouteId,
  selectedSegmentId,
  onSegmentClick,
  onRouteClick,
  originCoords,
  destCoords,
  originLabel = 'Origin',
  destLabel = 'Destination',
}) => {
  const [hoveredSegId, setHoveredSegId] = useState<string | null>(null);

  const defaultCenter: [number, number] = originCoords
    ? [originCoords.lat, originCoords.lng]
    : [12.9716, 77.5946];

  const allCoords = routes.flatMap(r => r.coordinates);

  // Route color map with richer colors
  const routeColorMap: Record<string, string> = {
    route_a: '#FF8A3D',
    route_b: '#00C982',
    route_c: '#F4C542',
  };

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {allCoords.length > 0 && <FitBounds coordinates={allCoords} />}

      {/* Draw routes */}
      {routes.map(route => {
        const isSelected = selectedRouteId === route.id;
        const isOther = selectedRouteId && !isSelected;
        const routeColor = routeColorMap[route.id] || route.color;

        return (
          <React.Fragment key={route.id}>
            {/* Wide glow halo for selected */}
            {isSelected && (
              <Polyline
                positions={route.coordinates.map(c => [c.lat, c.lng])}
                pathOptions={{ color: routeColor, weight: 18, opacity: 0.12 }}
              />
            )}
            {/* Medium glow */}
            {isSelected && (
              <Polyline
                positions={route.coordinates.map(c => [c.lat, c.lng])}
                pathOptions={{ color: routeColor, weight: 10, opacity: 0.2 }}
              />
            )}

            {/* Per-segment for selected route */}
            {isSelected
              ? route.segments.map(seg => {
                  const color = scoreToMapColor(seg.overallExposureScore);
                  const isHov = hoveredSegId === seg.id;
                  const isSel = selectedSegmentId === seg.id;
                  return (
                    <Polyline
                      key={seg.id}
                      positions={seg.coordinates.map(c => [c.lat, c.lng])}
                      pathOptions={{
                        color: isSel ? '#FFFFFF' : color,
                        weight: isHov || isSel ? 9 : 6,
                        opacity: isHov || isSel ? 1 : 0.9,
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
                          <div style={{ padding: '4px 2px', minWidth: 160 }}>
                            <div style={{ fontWeight: 700, color: '#F4F7F5', marginBottom: 6, fontSize: 13 }}>
                              {seg.streetName || 'Route Segment'}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 10px', fontSize: 11 }}>
                              <span style={{ color: '#81938D' }}>PM2.5</span>
                              <span style={{ fontWeight: 600, color: '#FF8A3D' }}>{seg.pm25} µg/m³</span>
                              <span style={{ color: '#81938D' }}>Temperature</span>
                              <span style={{ fontWeight: 600, color: '#F4F7F5' }}>{seg.temperature}°C</span>
                              <span style={{ color: '#81938D' }}>Distance</span>
                              <span style={{ fontWeight: 600, color: '#F4F7F5' }}>{formatDistance(seg.distanceMeters)}</span>
                              <span style={{ color: '#81938D' }}>Exposure</span>
                              <span style={{ fontWeight: 700, color: scoreToMapColor(seg.overallExposureScore) }}>
                                {seg.overallExposureScore}/100
                              </span>
                            </div>
                          </div>
                        </Popup>
                      )}
                    </Polyline>
                  );
                })
              : (
                <>
                  {/* Glow line for non-selected */}
                  <Polyline
                    positions={route.coordinates.map(c => [c.lat, c.lng])}
                    pathOptions={{
                      color: routeColor,
                      weight: 8,
                      opacity: isOther ? 0.05 : 0.15,
                    }}
                  />
                  <Polyline
                    positions={route.coordinates.map(c => [c.lat, c.lng])}
                    pathOptions={{
                      color: routeColor,
                      weight: 4,
                      opacity: isOther ? 0.3 : 0.65,
                      dashArray: isOther ? '8 5' : undefined,
                      lineCap: 'round',
                    }}
                    eventHandlers={{ click: () => onRouteClick?.(route.id) }}
                  />
                </>
              )
            }

            {/* Hotspot markers with animated rings */}
            {isSelected && route.segments
              .filter(s => s.isHotspot)
              .map(seg => {
                const center = seg.coordinates[Math.floor(seg.coordinates.length / 2)];
                if (!center) return null;
                return (
                  <Marker
                    key={`hotspot-${seg.id}`}
                    position={[center.lat, center.lng]}
                    icon={hotspotIcon('#FF5A5F', seg.pm25)}
                  >
                    <Popup>
                      <div style={{ padding: '4px 2px', minWidth: 180 }}>
                        <div style={{ fontWeight: 800, color: '#FF5A5F', marginBottom: 4, fontSize: 12, letterSpacing: '0.05em' }}>
                          ⚠ HIGH EXPOSURE ZONE
                        </div>
                        <div style={{ fontWeight: 600, color: '#F4F7F5', marginBottom: 8, fontSize: 13 }}>
                          {seg.streetName}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', fontSize: 11 }}>
                          <span style={{ color: '#81938D' }}>PM2.5</span>
                          <span style={{ fontWeight: 700, color: '#FF8A3D' }}>{seg.pm25} µg/m³</span>
                          <span style={{ color: '#81938D' }}>Temperature</span>
                          <span style={{ fontWeight: 600, color: '#F4F7F5' }}>{seg.temperature}°C</span>
                          <span style={{ color: '#81938D' }}>Cause</span>
                          <span style={{ color: '#B8CEC7' }}>{seg.hotspotReason?.split('–')[0] || 'High traffic'}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
          </React.Fragment>
        );
      })}

      {/* Origin marker */}
      {originCoords && (
        <Marker position={[originCoords.lat, originCoords.lng]} icon={originIcon}>
          <Popup>
            <div style={{ padding: '4px 2px', fontWeight: 700, color: '#00C982', fontSize: 13 }}>
              📍 {originLabel}
            </div>
          </Popup>
        </Marker>
      )}

      {/* Destination marker */}
      {destCoords && (
        <Marker position={[destCoords.lat, destCoords.lng]} icon={destIcon}>
          <Popup>
            <div style={{ padding: '4px 2px', fontWeight: 700, color: '#F4C542', fontSize: 13 }}>
              ★ {destLabel}
            </div>
          </Popup>
        </Marker>
      )}

      {/* Legend */}
      <div className="leaflet-top leaflet-right" style={{ marginRight: '10px', marginTop: '10px' }}>
        <div className="leaflet-control" style={{
          background: 'rgba(7,17,15,0.95)',
          border: '1.5px solid #29423B',
          borderRadius: '10px',
          padding: '10px 12px',
          fontSize: '11px',
          color: '#81938D',
          boxShadow: '0 4px 0 rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: '#F4F7F5', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Exposure
          </div>
          {[
            { color: '#00C982', label: 'Low' },
            { color: '#F4C542', label: 'Moderate' },
            { color: '#FF8A3D', label: 'Elevated' },
            { color: '#FF5A5F', label: 'High' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
              <div style={{
                width: 22, height: 4, background: color, borderRadius: 2,
                boxShadow: `0 0 6px ${color}60`,
              }} />
              <span style={{ fontWeight: 500 }}>{label}</span>
            </div>
          ))}
          <hr style={{ border: 'none', borderTop: '1px solid #1E332E', margin: '7px 0' }} />
          <div style={{ fontSize: 10, color: '#516860' }}>Click route to analyze</div>
        </div>
      </div>
    </MapContainer>
  );
};
