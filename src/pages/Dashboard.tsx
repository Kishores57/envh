import React, { useState, useCallback } from 'react';
import type { AppState, RouteRequest, RouteSegment } from '../types';
import { RouteForm } from '../components/RouteForm/RouteForm';
import { EcoMap } from '../components/Map/EcoMap';
import { RouteRecommendation } from '../components/RouteRecommendation/RouteRecommendation';
import { SegmentDetail } from '../components/SegmentDetail/SegmentDetail';
import { PulseIndicator, LoadingSpinner } from '../components/shared';
import { analyzeRoute } from '../lib/aws';
import { DEMO_ORIGIN, DEMO_DESTINATION, DEMO_ORIGIN_COORDS, DEMO_DEST_COORDS } from '../data/demoData';
import { Wind, Activity, AlertTriangle, Leaf, Thermometer, Map } from 'lucide-react';

interface DashboardProps {
  state: AppState;
  onStateChange: (partial: Partial<AppState>) => void;
}

// Illustrated idle SVG scene
const MapIdleScene: React.FC<{ isAnalyzing: boolean }> = ({ isAnalyzing }) => (
  <svg viewBox="0 0 600 380" style={{ width: '100%', maxWidth: 560, opacity: 0.9 }} xmlns="http://www.w3.org/2000/svg">
    {/* Map base */}
    <rect x="0" y="0" width="600" height="380" fill="#101C1A" rx="16" />
    <rect x="10" y="10" width="580" height="360" fill="#0d1714" rx="14" />

    {/* Grid lines */}
    {[60, 120, 180, 240, 300, 360].map(y => (
      <line key={y} x1="10" y1={y} x2="590" y2={y} stroke="#172622" strokeWidth="1" />
    ))}
    {[80, 160, 240, 320, 400, 480, 560].map(x => (
      <line key={x} x1={x} y1="10" x2={x} y2="370" stroke="#172622" strokeWidth="1" />
    ))}

    {/* Water body */}
    <ellipse cx="520" cy="280" rx="90" ry="55" fill="#0a1e28" stroke="#162a36" strokeWidth="1.5" />
    <ellipse cx="520" cy="280" rx="80" ry="48" fill="#0d2030" />

    {/* Green parks */}
    <rect x="40" y="40" width="80" height="60" fill="#0f2a1a" rx="8" />
    <rect x="45" y="45" width="70" height="50" fill="#122e1d" rx="6" />
    {/* Trees in park */}
    {[[60,60],[75,55],[90,65],[70,72],[85,70]].map(([x, y], i) => (
      <g key={i}>
        <circle cx={x} cy={y} r="6" fill="#1a4a25" />
        <circle cx={x} cy={y} r="4" fill="#1e5a2c" />
        <circle cx={x} cy={y-3} r="2.5" fill="#22692f" />
      </g>
    ))}
    <text x="80" y="108" fill="#29683a" fontSize="7" fontWeight="700" textAnchor="middle" letterSpacing="0.05em">PARK</text>

    {/* Another park (right) */}
    <rect x="460" y="50" width="100" height="70" fill="#0f2a1a" rx="8" />
    {[[475,70],[492,60],[510,72],[485,84],[503,82]].map(([x, y], i) => (
      <g key={i}>
        <circle cx={x} cy={y} r="6" fill="#1a4a25" />
        <circle cx={x} cy={y} r="4" fill="#1e5a2c" />
      </g>
    ))}

    {/* Roads – major */}
    <path d="M0 190 L600 190" stroke="#1E332E" strokeWidth="14" />
    <path d="M0 190 L600 190" stroke="#29423B" strokeWidth="10" />
    <path d="M0 190 L600 190" stroke="#1E332E" strokeWidth="2" strokeDasharray="20 10" />

    <path d="M300 0 L300 380" stroke="#1E332E" strokeWidth="12" />
    <path d="M300 0 L300 380" stroke="#29423B" strokeWidth="8" />
    <path d="M300 0 L300 380" stroke="#1E332E" strokeWidth="2" strokeDasharray="20 10" />

    {/* Roads – minor */}
    <path d="M0 100 L280 100 Q300 100 300 120" stroke="#172622" strokeWidth="6" fill="none" />
    <path d="M0 280 L280 280 Q300 280 300 260" stroke="#172622" strokeWidth="6" fill="none" />
    <path d="M400 0 L400 180" stroke="#172622" strokeWidth="6" />
    <path d="M140 0 L140 380" stroke="#172622" strokeWidth="5" />
    <path d="M0 310 L600 310" stroke="#172622" strokeWidth="5" />

    {/* Pollution zone (translucent red area) */}
    <ellipse cx="200" cy="230" rx="65" ry="40" fill="rgba(255,90,95,0.06)" stroke="rgba(255,90,95,0.2)" strokeWidth="1.5" />
    <ellipse cx="200" cy="230" rx="45" ry="28" fill="rgba(255,90,95,0.08)" />
    {/* Pollution particles */}
    {isAnalyzing ? null : [[195,218],[210,228],[190,240],[208,242]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r="2.5" fill="rgba(255,90,95,0.5)" className="particle-drift" style={{ animationDelay: `${i * 0.8}s` }} />
    ))}
    <text x="200" y="234" fill="rgba(255,90,95,0.6)" fontSize="8" fontWeight="800" textAnchor="middle" letterSpacing="0.08em">POLLUTION</text>

    {/* Heat zone */}
    <ellipse cx="440" cy="150" rx="50" ry="35" fill="rgba(255,138,61,0.06)" stroke="rgba(255,138,61,0.2)" strokeWidth="1.5" />
    <text x="440" y="154" fill="rgba(255,138,61,0.6)" fontSize="8" fontWeight="800" textAnchor="middle" letterSpacing="0.08em">HEAT ZONE</text>

    {/* Sample route A (orange) */}
    <path d="M60 190 L200 190 Q220 190 220 210 L220 310 L440 310" stroke="rgba(255,138,61,0.35)" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeDasharray="6 3" />

    {/* Sample route B (green) – recommended */}
    <path d="M60 190 L140 190 L140 100 L300 100 L300 190 L440 190 L440 310" stroke="#00C982" strokeWidth="4" fill="none" strokeLinecap="round"
      style={{ filter: 'drop-shadow(0 0 6px rgba(0,201,130,0.5))' }}
    />

    {/* Sample route C (yellow) */}
    <path d="M60 190 L300 190 Q320 190 320 200 L320 280 L440 280 L440 310" stroke="rgba(244,197,66,0.35)" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeDasharray="6 3" />

    {/* Origin marker */}
    <circle cx="60" cy="190" r="9" fill="#00C982" stroke="#F4F7F5" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 6px rgba(0,201,130,0.7))' }} className="float-anim" />
    <circle cx="60" cy="190" r="3.5" fill="#07110F" />
    <text x="60" y="211" fill="#00C982" fontSize="7.5" fontWeight="800" textAnchor="middle" letterSpacing="0.05em">HOME</text>

    {/* Destination marker */}
    <path d="M440 302 L440 321 C440 326 445 331 450 328 L458 322 C463 318 463 309 458 305 L450 299 C445 295 440 297 440 302 Z" fill="#F4C542" stroke="#F4F7F5" strokeWidth="2"
      style={{ filter: 'drop-shadow(0 0 6px rgba(244,197,66,0.7))' }}
    />
    <circle cx="450" cy="313" r="2.5" fill="#07110F" />
    <text x="450" y="336" fill="#F4C542" fontSize="7.5" fontWeight="800" textAnchor="middle" letterSpacing="0.05em">COLLEGE</text>

    {/* Green corridor highlight */}
    <rect x="138" y="98" width="4" height="94" fill="rgba(0,201,130,0.2)" />
    <rect x="298" y="98" width="4" height="94" fill="rgba(0,201,130,0.2)" />
    <text x="220" y="88" fill="rgba(0,201,130,0.5)" fontSize="7" fontWeight="700" textAnchor="middle" letterSpacing="0.06em">GREEN CORRIDOR</text>

    {/* Hotspot indicator */}
    <circle cx="200" cy="190" r="16" fill="rgba(255,90,95,0.1)" stroke="rgba(255,90,95,0.4)" strokeWidth="1.5" className="breathe" />
    <circle cx="200" cy="190" r="8" fill="rgba(255,90,95,0.2)" stroke="rgba(255,90,95,0.6)" strokeWidth="1" />
    <circle cx="200" cy="190" r="3.5" fill="#FF5A5F" />

    {/* Loading overlay when analyzing */}
    {isAnalyzing && (
      <>
        <rect x="0" y="0" width="600" height="380" fill="rgba(7,17,15,0.7)" rx="14" />
        <circle cx="300" cy="190" r="30" fill="none" stroke="#00C982" strokeWidth="3" strokeDasharray="120 60" style={{ transformOrigin: '300px 190px', animation: 'spin 1s linear infinite' }} />
        <text x="300" y="195" fill="#00C982" fontSize="11" fontWeight="700" textAnchor="middle" letterSpacing="0.06em">ANALYZING</text>
        <text x="300" y="210" fill="#516860" fontSize="8" fontWeight="500" textAnchor="middle">Processing environmental data...</text>
      </>
    )}
  </svg>
);

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

  const envConds = state.result?.environmentalConditions;
  const selectedRoute = state.result?.routes.find(r => r.id === state.selectedRouteId);

  return (
    <div style={{ display: 'flex', height: '100%', paddingTop: 56, background: '#07110F', overflow: 'hidden' }}>

      {/* ─── LEFT PANEL ─── */}
      <aside style={{
        width: 280, flexShrink: 0,
        borderRight: '1.5px solid #29423B',
        padding: '16px 14px',
        overflowY: 'auto',
        background: '#101C1A',
        boxShadow: '4px 0 0 rgba(0,0,0,0.25)',
        position: 'relative',
      }}>
        {/* Panel label */}
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', color: '#29423B', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Map size={11} />
          Navigation Console
        </div>

        {/* Live conditions mini bar */}
        {envConds && (
          <div style={{
            marginBottom: 16,
            padding: '10px 12px',
            background: '#0d1714',
            border: '1.5px solid #1E332E',
            borderRadius: 10,
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#516860' }}>
                Live Conditions
              </span>
              <PulseIndicator color="#00C982" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {[
                { value: envConds.airQuality.aqi, label: 'AQI', color: envConds.aqiColor },
                { value: envConds.airQuality.pm25, label: 'PM2.5', color: '#FF8A3D' },
                { value: `${envConds.weather.temperature}°`, label: 'Temp', color: '#FF5A5F' },
              ].map(({ value, label, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 9, color: '#516860', fontWeight: 600, marginTop: 3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
                </div>
              ))}
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

      {/* ─── CENTER MAP ─── */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          {state.result ? (
            <EcoMap
              routes={state.result.routes}
              selectedRouteId={state.selectedRouteId}
              selectedSegmentId={selectedSegment?.id || null}
              onSegmentClick={seg => setSelectedSegment(seg)}
              onRouteClick={id => { onStateChange({ selectedRouteId: id }); setSelectedSegment(null); }}
              originCoords={DEMO_ORIGIN_COORDS}
              destCoords={DEMO_DEST_COORDS}
              originLabel={state.request.origin || DEMO_ORIGIN}
              destLabel={state.request.destination || DEMO_DESTINATION}
            />
          ) : (
            /* Idle / loading state with illustrated map */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              height: '100%', background: '#07110F', padding: 40,
            }}>
              {state.isAnalyzing ? (
                <div style={{ textAlign: 'center', maxWidth: 520 }}>
                  <MapIdleScene isAnalyzing={true} />
                  <div style={{ marginTop: 24 }}>
                    <LoadingSpinner size={28} label="Analyzing environmental conditions..." />
                    <div style={{ display: 'flex', gap: 7, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
                      {['Routing engine', 'Air quality API', 'Heat analysis', 'Exposure scoring'].map((step, i) => (
                        <span key={step} style={{
                          fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
                          background: '#101C1A', border: '1px solid #29423B',
                          padding: '3px 9px', borderRadius: 20, color: '#81938D',
                          animation: `pulse-eco 2s ${i * 0.3}s ease-in-out infinite`,
                        }}>
                          {step}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <MapIdleScene isAnalyzing={false} />
                  <div style={{ marginTop: 28, textAlign: 'center', maxWidth: 400 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                      <Wind size={20} color="#00C982" />
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#F4F7F5', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
                        Enter your route
                      </h2>
                    </div>
                    <p style={{ fontSize: 13, color: '#81938D', marginBottom: 20, lineHeight: 1.6 }}>
                      Set your origin and destination on the left panel, then click <strong style={{ color: '#00C982' }}>Analyze Route</strong> to see environmental conditions.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
                      {[
                        { icon: <Wind size={14} />, text: 'PM2.5 & AQI analysis', color: '#FF8A3D' },
                        { icon: <Thermometer size={14} />, text: 'Heat exposure', color: '#FF5A5F' },
                        { icon: <Leaf size={14} />, text: 'Green corridors', color: '#00C982' },
                      ].map(({ icon, text, color }) => (
                        <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#81938D' }}>
                          <span style={{ color }}>{icon}</span>
                          {text}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Segment detail overlay */}
        {selectedSegment && (
          <div style={{ position: 'absolute', bottom: 16, left: 16, width: 320, zIndex: 1000 }}>
            <SegmentDetail segment={selectedSegment} onClose={() => setSelectedSegment(null)} />
          </div>
        )}

        {/* Map top-left info overlay */}
        {state.result && (
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 500,
            background: 'rgba(7, 17, 15, 0.94)',
            border: '1.5px solid #29423B',
            borderRadius: 9, padding: '6px 11px',
            display: 'flex', alignItems: 'center', gap: 7,
            boxShadow: '0 4px 0 rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(12px)',
            fontSize: 11, fontWeight: 600,
          }}>
            <Activity size={11} style={{ color: '#00C982' }} />
            <span style={{ color: '#81938D' }}>Source:</span>
            <span style={{ color: '#00C982', textTransform: 'capitalize' }}>{state.result.dataSource}</span>
          </div>
        )}

        {/* Selected route quick stats overlay */}
        {selectedRoute && !selectedSegment && (
          <div style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 500,
            background: 'rgba(7, 17, 15, 0.96)',
            border: '1.5px solid #29423B',
            borderRadius: 9, padding: '7px 14px',
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 4px 0 rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)',
            animation: 'slideInUp 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%', background: selectedRoute.color,
                boxShadow: `0 0 6px ${selectedRoute.color}`,
              }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#F4F7F5' }}>{selectedRoute.name}</span>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11 }}>
              <span style={{ color: '#81938D' }}>Exposure: <span style={{ fontWeight: 700, color: '#F4F7F5' }}>{selectedRoute.overallExposureScore}/100</span></span>
              <span style={{ color: '#81938D' }}>PM2.5: <span style={{ fontWeight: 700, color: '#FF8A3D' }}>{selectedRoute.avgPm25} µg/m³</span></span>
              {selectedRoute.hotspotCount > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#FF5A5F', fontWeight: 600 }}>
                  <AlertTriangle size={10} />
                  {selectedRoute.hotspotCount} hotspot{selectedRoute.hotspotCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ─── RIGHT PANEL ─── */}
      <aside style={{
        width: 288, flexShrink: 0,
        borderLeft: '1.5px solid #29423B',
        padding: '16px 14px',
        overflowY: 'auto',
        background: '#101C1A',
        boxShadow: '-4px 0 0 rgba(0,0,0,0.25)',
      }}>
        {/* Panel label */}
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', color: '#29423B', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Leaf size={11} />
          Analysis Results
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
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(0,201,130,0.06)',
              border: '1.5px solid #1E332E',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 14,
              boxShadow: '0 4px 0 rgba(0,0,0,0.25)',
            }}>
              <Activity size={22} color="#29423B" />
            </div>
            <p style={{ fontSize: 12, color: '#516860', lineHeight: 1.6, maxWidth: 200 }}>
              Route analysis results will appear here after you click <strong style={{ color: '#81938D' }}>Analyze Route</strong>.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
};
