import React, { useState, useCallback } from 'react';
import type { AppState, RouteRequest, RouteSegment } from '../types';
import { RouteForm } from '../components/RouteForm/RouteForm';
import { EcoMap } from '../components/Map/EcoMap';
import { RouteRecommendation } from '../components/RouteRecommendation/RouteRecommendation';
import { SegmentDetail } from '../components/SegmentDetail/SegmentDetail';
import { PulseIndicator, LoadingSpinner } from '../components/shared';
import { analyzeRoute } from '../lib/aws';
import { DEMO_ORIGIN, DEMO_DESTINATION, DEMO_ORIGIN_COORDS, DEMO_DEST_COORDS } from '../data/demoData';
import { Wind, Activity, AlertTriangle, Info } from 'lucide-react';

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
      onStateChange({
        result,
        selectedRouteId: result.recommendedRouteId,
        isAnalyzing: false,
      });
    } catch (err) {
      console.error('Analysis failed:', err);
      onStateChange({ isAnalyzing: false });
    }
  }, [state.request, onStateChange]);

  const envConds = state.result?.environmentalConditions;
  const selectedRoute = state.result?.routes.find(r => r.id === state.selectedRouteId);

  return (
    <div className="flex h-full pt-14 bg-dark-900 overflow-hidden">

      {/* Left Panel – Route Form */}
      <aside className="w-72 flex-shrink-0 border-r border-slate-800/60 p-4 overflow-y-auto bg-dark-800/60">
        {/* Live conditions mini bar */}
        {envConds && (
          <div className="mb-4 p-3 rounded-xl bg-dark-600 border border-slate-700/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Conditions</span>
              <PulseIndicator color="#22c55e" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: envConds.aqiColor }}>{envConds.airQuality.aqi}</div>
                <div className="text-xs text-slate-500">AQI</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-400">{envConds.airQuality.pm25}</div>
                <div className="text-xs text-slate-500">PM2.5</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-400">{envConds.weather.temperature}°C</div>
                <div className="text-xs text-slate-500">Temp</div>
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

      {/* Center – Map */}
      <main className="flex-1 relative overflow-hidden">
        {/* Map */}
        <div className="absolute inset-0">
          {state.result ? (
            <EcoMap
              routes={state.result.routes}
              selectedRouteId={state.selectedRouteId}
              selectedSegmentId={selectedSegment?.id || null}
              onSegmentClick={seg => setSelectedSegment(seg)}
              onRouteClick={id => {
                onStateChange({ selectedRouteId: id });
                setSelectedSegment(null);
              }}
              originCoords={DEMO_ORIGIN_COORDS}
              destCoords={DEMO_DEST_COORDS}
              originLabel={state.request.origin || DEMO_ORIGIN}
              destLabel={state.request.destination || DEMO_DESTINATION}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-dark-800 text-slate-600">
              {state.isAnalyzing ? (
                <div className="text-center">
                  <LoadingSpinner size={48} label="Analyzing environmental conditions..." />
                  <p className="text-sm text-slate-500 mt-4 max-w-xs text-center">
                    Fetching air quality data, calculating route segments, estimating exposure...
                  </p>
                  <div className="mt-4 flex gap-2 justify-center">
                    {['Routing engine', 'Air quality', 'Heat analysis', 'Scoring'].map((step, i) => (
                      <span key={step} className="text-xs bg-dark-600 px-2 py-1 rounded-full text-slate-500 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>
                        {step}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center max-w-sm px-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-eco-600/20 to-teal-600/20 border border-eco-500/20 flex items-center justify-center mx-auto mb-4">
                    <Wind size={28} className="text-eco-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-300 mb-2">Enter your route</h2>
                  <p className="text-sm text-slate-500">
                    Enter origin and destination on the left, then click{' '}
                    <strong className="text-eco-400">Analyze Route</strong> to see environmental conditions along your path.
                  </p>
                  <div className="mt-4 flex flex-col gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-eco-500" />
                      Segment-by-segment PM2.5 & heat analysis
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      Pollution hotspot detection
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      Departure time optimization
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Segment detail overlay */}
        {selectedSegment && (
          <div className="absolute bottom-4 left-4 w-80 z-[1000]">
            <SegmentDetail
              segment={selectedSegment}
              onClose={() => setSelectedSegment(null)}
            />
          </div>
        )}

        {/* Data source badge */}
        {state.result && (
          <div className="absolute top-3 left-3 z-[500]">
            <div className="glass-card py-1.5 px-3 flex items-center gap-2">
              <Info size={11} className="text-slate-500" />
              <span className="text-xs text-slate-400">
                Data: <span className="text-eco-400 font-semibold capitalize">{state.result.dataSource}</span>
              </span>
            </div>
          </div>
        )}

        {/* Route score overlay */}
        {selectedRoute && !selectedSegment && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500]">
            <div className="glass-card py-2 px-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: selectedRoute.color }} />
                <span className="text-xs font-semibold text-slate-200">{selectedRoute.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400">Exposure: <span className="font-bold text-slate-200">{selectedRoute.overallExposureScore}/100</span></span>
                <span className="text-slate-400">PM2.5: <span className="font-bold text-slate-200">{selectedRoute.avgPm25} µg/m³</span></span>
              </div>
              {selectedRoute.hotspotCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-red-400">
                  <AlertTriangle size={11} />
                  {selectedRoute.hotspotCount} hotspot{selectedRoute.hotspotCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Right Panel – Recommendation */}
      <aside className="w-72 flex-shrink-0 border-l border-slate-800/60 p-4 overflow-y-auto bg-dark-800/60">
        {state.result ? (
          <RouteRecommendation
            result={state.result}
            selectedRouteId={state.selectedRouteId}
            onSelectRoute={id => {
              onStateChange({ selectedRouteId: id });
              setSelectedSegment(null);
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Activity size={32} className="text-slate-700 mb-3" />
            <p className="text-sm text-slate-600">
              Route analysis results will appear here after you click Analyze Route.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
};
