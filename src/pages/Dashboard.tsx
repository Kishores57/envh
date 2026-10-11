import React, { useState, useCallback } from 'react';
import type { AppState, RouteRequest, RouteSegment, Coordinates } from '../types';
import { RouteForm } from '../components/RouteForm/RouteForm';
import { EcoMap } from '../components/Map/EcoMap';
import { RouteRecommendation } from '../components/RouteRecommendation/RouteRecommendation';
import { SegmentDetail } from '../components/SegmentDetail/SegmentDetail';
import { PulseIndicator, LoadingSpinner } from '../components/shared';
import { analyzeRoute } from '../lib/aws';
import { reverseGeocode } from '../lib/openSourceApi';
import { DEMO_ORIGIN, DEMO_DESTINATION, DEMO_ORIGIN_COORDS, DEMO_DEST_COORDS } from '../data/demoData';
import { Activity, AlertTriangle, Leaf, Map, Sparkles, CloudSun } from 'lucide-react';

interface DashboardProps {
  state: AppState;
  onStateChange: (partial: Partial<AppState>) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, onStateChange }) => {
  const [selectedSegment, setSelectedSegment] = useState<RouteSegment | null>(null);

  const handleRequestChange = useCallback((partial: Partial<RouteRequest>) => {
    onStateChange({ request: { ...state.request, ...partial } });
  }, [state.request, onStateChange]);

  const handleAnalyze = useCallback(async () => {
    onStateChange({ isAnalyzing: true, result: null, selectedRouteId: null });
    try {
      const result = await analyzeRoute(state.request);
      onStateChange({ result, selectedRouteId: result.recommendedRouteId, isAnalyzing: false });
    } catch (err) {
      console.error('Analysis failed:', err);
      onStateChange({ isAnalyzing: false });
    }
  }, [state.request, onStateChange]);

  // Handle map click: drop origin first, then destination
  const handleMapClick = useCallback(async (coords: Coordinates) => {
    try {
      const address = await reverseGeocode(coords.lat, coords.lng);
      if (!state.request.originCoords) {
        onStateChange({
          request: {
            ...state.request,
            origin: address,
            originCoords: coords,
          },
        });
      } else if (!state.request.destinationCoords) {
        onStateChange({
          request: {
            ...state.request,
            destination: address,
            destinationCoords: coords,
          },
        });
      } else {
        // If both already set, update destination
        onStateChange({
          request: {
            ...state.request,
            destination: address,
            destinationCoords: coords,
          },
        });
      }
    } catch (err) {
      console.warn('Map click reverse geocode failed:', err);
    }
  }, [state.request, onStateChange]);

  // Handle origin marker drag
  const handleOriginDrag = useCallback(async (coords: Coordinates) => {
    try {
      const address = await reverseGeocode(coords.lat, coords.lng);
      onStateChange({
        request: {
          ...state.request,
          origin: address,
          originCoords: coords,
        },
      });
    } catch {}
  }, [state.request, onStateChange]);

  // Handle destination marker drag
  const handleDestDrag = useCallback(async (coords: Coordinates) => {
    try {
      const address = await reverseGeocode(coords.lat, coords.lng);
      onStateChange({
        request: {
          ...state.request,
          destination: address,
          destinationCoords: coords,
        },
      });
    } catch {}
  }, [state.request, onStateChange]);

  const envConds = state.result?.environmentalConditions;
  const selectedRoute = state.result?.routes.find(r => r.id === state.selectedRouteId);

  // Active coordinates
  const currentOriginCoords = state.request.originCoords || (state.result ? DEMO_ORIGIN_COORDS : undefined);
  const currentDestCoords = state.request.destinationCoords || (state.result ? DEMO_DEST_COORDS : undefined);

  return (
    <div style={{ display: 'flex', height: '100%', paddingTop: 60, background: 'var(--bg-app)', overflow: 'hidden' }}>

      {/* ─── LEFT PANEL: NAVIGATION CONSOLE ─── */}
      <aside style={{
        width: 310, flexShrink: 0,
        borderRight: '1px solid var(--border-color)',
        padding: '16px 14px',
        overflowY: 'auto',
        background: 'var(--bg-panel)',
        boxShadow: 'var(--shadow-card)',
        position: 'relative',
        zIndex: 20,
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}>
        {/* Panel label */}
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--text-muted)',
          textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7
        }}>
          <Map size={13} color="#38BDF8" />
          <span>Trip Planner & Weather</span>
        </div>

        {/* Live Weather & Environmental Mini Widget */}
        {envConds ? (
          <div style={{
            marginBottom: 16,
            padding: '12px 14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 14,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Atmospheric Monitor
              </span>
              <PulseIndicator color="#22C55E" label="Live Sensor" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {[
                { value: envConds.airQuality.aqi, label: 'AQI Index', color: envConds.aqiColor },
                { value: envConds.airQuality.pm25, label: 'PM2.5', color: '#F97316' },
                { value: `${envConds.weather.temperature}°`, label: 'Temp', color: '#38BDF8' },
              ].map(({ value, label, color }) => (
                <div key={label} style={{ textAlign: 'center', background: 'var(--bg-inset)', padding: '7px 4px', borderRadius: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, marginTop: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            marginBottom: 14,
            padding: '10px 12px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #38BDF8, #2563EB)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(56, 189, 248, 0.3)', flexShrink: 0,
            }}>
              <CloudSun size={16} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                Weather Condition
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                28°C • Moderate Air • Mild Breeze
              </div>
            </div>
          </div>
        )}

        <RouteForm
          request={state.request}
          onChange={handleRequestChange}
          onSubmit={handleAnalyze}
          isAnalyzing={state.isAnalyzing}
        />
      </aside>

      {/* ─── CENTER REAL MAP ─── */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <EcoMap
            routes={state.result ? state.result.routes : []}
            selectedRouteId={state.selectedRouteId}
            selectedSegmentId={selectedSegment?.id || null}
            onSegmentClick={seg => setSelectedSegment(seg)}
            onRouteClick={id => { onStateChange({ selectedRouteId: id }); setSelectedSegment(null); }}
            originCoords={currentOriginCoords}
            destCoords={currentDestCoords}
            originLabel={state.request.origin || DEMO_ORIGIN}
            destLabel={state.request.destination || DEMO_DESTINATION}
            onMapClick={handleMapClick}
            onOriginDrag={handleOriginDrag}
            onDestDrag={handleDestDrag}
          />
        </div>

        {/* ─── Analyzing HUD Modal Overlay on top of Real Map ─── */}
        {state.isAnalyzing && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1200,
            background: 'rgba(11, 18, 32, 0.55)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: 'var(--bg-panel)',
              border: '1.5px solid var(--sky-blue)',
              borderRadius: 20,
              padding: '26px 36px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-elevated)',
              maxWidth: 440,
            }}>
              <LoadingSpinner size={36} label="Predicting Weather & Clean Air Route..." />
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 14, fontWeight: 600 }}>
                Querying OpenStreetMap roads & live Open-Meteo atmospheric radar...
              </div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
                {['OSRM Road Graph', 'Open-Meteo AQI', 'Thermal Heat Index', 'Tree Canopy Filter'].map(step => (
                  <span key={step} style={{
                    fontSize: 10, fontWeight: 700,
                    background: 'var(--bg-subtle)', border: '1px solid var(--border-color)',
                    padding: '4px 9px', borderRadius: 14, color: 'var(--sky-blue)',
                  }}>
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Guide Chip when no route analyzed yet ─── */}
        {!state.result && !state.isAnalyzing && (
          <div style={{
            position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 900,
            pointerEvents: 'auto',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--bg-floating)',
              border: '1.5px solid var(--border-color)',
              borderRadius: 30, padding: '8px 20px',
              boxShadow: 'var(--shadow-card)',
              backdropFilter: 'blur(12px)',
            }}>
              <Sparkles size={14} color="#38BDF8" />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                {!currentOriginCoords ? (
                  <>Click anywhere on map to set <strong style={{ color: '#22C55E' }}>Origin (📍)</strong></>
                ) : !currentDestCoords ? (
                  <>Origin pinned! Click map to set <strong style={{ color: '#FACC15' }}>Destination (★)</strong></>
                ) : (
                  <>Route points set! Click <strong style={{ color: '#38BDF8' }}>Calculate Eco Route</strong></>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Segment detail overlay */}
        {selectedSegment && (
          <div style={{ position: 'absolute', bottom: 16, left: 16, width: 330, zIndex: 1000 }}>
            <SegmentDetail segment={selectedSegment} onClose={() => setSelectedSegment(null)} />
          </div>
        )}

        {/* Selected route quick stats overlay */}
        {selectedRoute && !selectedSegment && (
          <div style={{
            position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 900,
            background: 'var(--bg-floating)',
            border: '1.5px solid var(--border-color)',
            borderRadius: 14, padding: '9px 18px',
            display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: 'var(--shadow-elevated)',
            backdropFilter: 'blur(14px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{
                width: 11, height: 11, borderRadius: '50%', background: selectedRoute.color,
                boxShadow: `0 0 10px ${selectedRoute.color}`,
              }} />
              <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-primary)' }}>{selectedRoute.name}</span>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11.5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Exposure: <strong style={{ color: '#22C55E' }}>{selectedRoute.overallExposureScore}/100</strong></span>
              <span style={{ color: 'var(--text-muted)' }}>PM2.5: <strong style={{ color: '#F97316' }}>{selectedRoute.avgPm25} µg/m³</strong></span>
              {selectedRoute.hotspotCount > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#EF4444', fontWeight: 700 }}>
                  <AlertTriangle size={12} />
                  {selectedRoute.hotspotCount} hotspot{selectedRoute.hotspotCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ─── RIGHT PANEL: ANALYSIS RESULTS ─── */}
      <aside style={{
        width: 320, flexShrink: 0,
        borderLeft: '1px solid var(--border-color)',
        padding: '16px 14px',
        overflowY: 'auto',
        background: 'var(--bg-panel)',
        boxShadow: 'var(--shadow-card)',
        zIndex: 20,
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}>
        {/* Panel label */}
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--text-muted)',
          textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8
        }}>
          <Leaf size={12} color="#22C55E" />
          <span>Route Environmental Score</span>
        </div>

        {state.result ? (
          <RouteRecommendation
            result={state.result}
            selectedRouteId={state.selectedRouteId}
            onSelectRoute={id => { onStateChange({ selectedRouteId: id }); setSelectedSegment(null); }}
          />
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '70%', textAlign: 'center', padding: '0 16px',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'var(--bg-subtle)',
              border: '1.5px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 14,
              boxShadow: 'var(--shadow-sm)',
            }}>
              <Activity size={24} color="#38BDF8" />
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              Awaiting Route Analysis
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 220 }}>
              Search addresses, click on the map to place pins, or load the demo route, then click <strong style={{ color: '#38BDF8' }}>Calculate Eco Route</strong>.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
};
