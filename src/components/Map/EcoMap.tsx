import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Route, RouteSegment, Coordinates } from '../../types';
import { scoreToMapColor } from '../../lib/scoring';
import { formatDistance } from '../../lib/scoring';

// Fix Leaflet icon in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const originIcon = L.divIcon({
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#22c55e;border:3px solid #fff;box-shadow:0 0 10px rgba(34,197,94,0.6)"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const destIcon = L.divIcon({
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 10px rgba(59,130,246,0.6)"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const hotspotIcon = (color: string) => L.divIcon({
  html: `<div style="width:20px;height:20px;border-radius:50%;background:${color}33;border:2px solid ${color};display:flex;align-items:center;justify-content:center;">
    <div style="width:8px;height:8px;border-radius:50%;background:${color}"></div>
  </div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Auto-fit bounds
function FitBounds({ coordinates }: { coordinates: Coordinates[] }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
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

  // Collect all coordinates for fitting bounds
  const allCoords = routes.flatMap(r => r.coordinates);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ width: '100%', height: '100%', borderRadius: '12px' }}
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

        return (
          <React.Fragment key={route.id}>
            {/* Background glow for selected route */}
            {isSelected && (
              <Polyline
                positions={route.coordinates.map(c => [c.lat, c.lng])}
                pathOptions={{ color: route.color, weight: 12, opacity: 0.15 }}
              />
            )}

            {/* Draw per-segment coloring for selected route */}
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
                        color: isSel ? '#fff' : color,
                        weight: isHov || isSel ? 8 : 5,
                        opacity: isHov || isSel ? 1 : 0.85,
                      }}
                      eventHandlers={{
                        click: () => onSegmentClick?.(seg),
                        mouseover: () => setHoveredSegId(seg.id),
                        mouseout: () => setHoveredSegId(null),
                      }}
                    >
                      {isHov && (
                        <Popup>
                          <div className="p-1">
                            <p className="font-semibold text-slate-100 mb-1">{seg.streetName || 'Segment'}</p>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                              <span className="text-slate-400">PM2.5</span>
                              <span className="font-medium text-slate-200">{seg.pm25} µg/m³</span>
                              <span className="text-slate-400">Temperature</span>
                              <span className="font-medium text-slate-200">{seg.temperature}°C</span>
                              <span className="text-slate-400">Distance</span>
                              <span className="font-medium text-slate-200">{formatDistance(seg.distanceMeters)}</span>
                              <span className="text-slate-400">Exposure</span>
                              <span className="font-medium" style={{ color: scoreToMapColor(seg.overallExposureScore) }}>
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
                  <Polyline
                    positions={route.coordinates.map(c => [c.lat, c.lng])}
                    pathOptions={{
                      color: route.color,
                      weight: 4,
                      opacity: isOther ? 0.35 : 0.7,
                      dashArray: isOther ? '6 4' : undefined,
                    }}
                    eventHandlers={{ click: () => onRouteClick?.(route.id) }}
                  />
                )
            }

            {/* Hotspot markers */}
            {isSelected && route.segments
              .filter(s => s.isHotspot)
              .map(seg => {
                const center = seg.coordinates[Math.floor(seg.coordinates.length / 2)];
                if (!center) return null;
                return (
                  <Marker
                    key={`hotspot-${seg.id}`}
                    position={[center.lat, center.lng]}
                    icon={hotspotIcon('#ef4444')}
                  >
                    <Popup>
                      <div className="p-1">
                        <p className="font-semibold text-red-400 mb-1">⚠ High Exposure Segment</p>
                        <p className="text-xs text-slate-300 mb-2">{seg.streetName}</p>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                          <span className="text-slate-400">PM2.5</span>
                          <span className="font-medium text-red-300">{seg.pm25} µg/m³</span>
                          <span className="text-slate-400">Reason</span>
                          <span className="text-slate-200">{seg.hotspotReason?.split('–')[0] || 'High traffic'}</span>
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
          <Popup><div className="p-1 font-medium text-eco-400">{originLabel}</div></Popup>
        </Marker>
      )}

      {/* Destination marker */}
      {destCoords && (
        <Marker position={[destCoords.lat, destCoords.lng]} icon={destIcon}>
          <Popup><div className="p-1 font-medium text-blue-400">{destLabel}</div></Popup>
        </Marker>
      )}

      {/* Legend overlay */}
      <div className="leaflet-top leaflet-right" style={{ marginRight: '8px', marginTop: '8px' }}>
        <div className="leaflet-control" style={{
          background: 'rgba(15,23,42,0.9)',
          border: '1px solid rgba(51,65,85,0.6)',
          borderRadius: '8px',
          padding: '8px 10px',
          fontSize: '11px',
          color: '#94a3b8',
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4, color: '#f8fafc' }}>Exposure</div>
          {[
            { color: '#22c55e', label: 'Low' },
            { color: '#eab308', label: 'Moderate' },
            { color: '#f97316', label: 'Elevated' },
            { color: '#ef4444', label: 'High' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <div style={{ width: 20, height: 3, background: color, borderRadius: 2 }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </MapContainer>
  );
};
