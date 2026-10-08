import React, { useState, useEffect } from 'react';
import { EcoMap } from '../components/Map/EcoMap';
import { ScoreRing, ExposureBadge, LoadingSpinner } from '../components/shared';
import {
  getDemoAnalysisResult,
  getOnlyRouteDemoResult,
  DEMO_ORIGIN_COORDS,
  DEMO_DEST_COORDS,
  DEMO_POLLUTION_TIMESERIES,
  DEMO_AWS_SERVICES,
} from '../data/demoData';
import type { RouteAnalysisResult, RouteSegment } from '../types';
import { formatDuration, exposureColor } from '../lib/scoring';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import {
  Wind, CheckCircle2, AlertTriangle, TrendingDown, ChevronRight,
  Zap, Server, Database, Cloud, Activity, Info, Award,
  Shield, MapPin, Navigation, Thermometer,
} from 'lucide-react';

type DemoStep = 'intro' | 'routes' | 'only-route' | 'prediction' | 'aws' | 'impact';

const STEPS: { id: DemoStep; label: string; time: string }[] = [
  { id: 'intro',       label: '1. Problem',       time: '0:00' },
  { id: 'routes',      label: '2. Route Demo',    time: '0:40' },
  { id: 'only-route',  label: '3. Only Route',    time: '1:25' },
  { id: 'prediction',  label: '4. AI Prediction', time: '1:50' },
  { id: 'aws',         label: '5. AWS Stack',     time: '2:15' },
  { id: 'impact',      label: '6. Impact',        time: '2:40' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
      <p style={{ fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ color: '#94a3b8' }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: '#f8fafc' }}>{Math.round(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export const DemoPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState<DemoStep>('intro');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RouteAnalysisResult | null>(null);
  const [onlyResult, setOnlyResult] = useState<RouteAnalysisResult | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<RouteSegment | null>(null);
  const [awsAnimating, setAwsAnimating] = useState(false);
  const [awsActiveIdx, setAwsActiveIdx] = useState(-1);

  // Preload demo data
  useEffect(() => {
    setResult(getDemoAnalysisResult('cleanest'));
    setOnlyResult(getOnlyRouteDemoResult());
  }, []);

  const goToStep = async (step: DemoStep) => {
    if (step === 'routes' && !result) {
      setIsLoading(true);
      await new Promise(r => setTimeout(r, 1500));
      setResult(getDemoAnalysisResult('cleanest'));
      setIsLoading(false);
    }
    setActiveStep(step);
    setSelectedRouteId(null);
    setSelectedSegment(null);

    if (step === 'routes') {
      await new Promise(r => setTimeout(r, 500));
      setSelectedRouteId('route-b');
    }

    if (step === 'aws') {
      setAwsAnimating(true);
      setAwsActiveIdx(-1);
      for (let i = 0; i < DEMO_AWS_SERVICES.length; i++) {
        await new Promise(r => setTimeout(r, 600));
        setAwsActiveIdx(i);
      }
    }
  };

  const recommended = result?.routes.find(r => r.id === 'route-b');
  // fastest route is used for comparison context only

  return (
    <div className="h-full pt-14 bg-dark-900 overflow-hidden flex flex-col">

      {/* Step bar */}
      <div className="flex-shrink-0 border-b border-slate-800/60 px-6 py-3 bg-dark-800/80">
        <div className="flex items-center gap-2 max-w-6xl mx-auto">
          <span className="text-xs text-eco-400 font-bold uppercase tracking-wider mr-2">Demo</span>
          <div className="flex gap-1 flex-1 overflow-x-auto">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goToStep(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  activeStep === s.id
                    ? 'bg-eco-500/15 text-eco-400 border border-eco-500/30'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={activeStep === s.id ? { background: '#22c55e22', color: '#22c55e' } : { background: '#1e293b', color: '#475569' }}>
                  {i + 1}
                </span>
                {s.label}
                <span className="text-slate-600 text-[10px]">{s.time}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">

        {/* ── INTRO ── */}
        {activeStep === 'intro' && (
          <div className="h-full flex flex-col items-center justify-center px-8 text-center bg-animated">
            <div className="max-w-2xl">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-eco-500 to-teal-500 flex items-center justify-center mx-auto mb-6 glow-eco float-particle">
                <Wind size={36} className="text-white" />
              </div>
              <h1 className="text-4xl font-display font-bold text-gradient mb-4">EcoRoute AI</h1>
              <p className="text-xl text-slate-300 mb-6 font-light">Navigate Smarter. Breathe Better.</p>

              <div className="glass-card p-6 mb-8 text-left">
                <p className="text-lg text-slate-200 mb-4 font-medium">
                  "Navigation tells us how fast we can get there."
                </p>
                <p className="text-slate-400 mb-4">
                  Normal navigation optimizes for time and distance — but it doesn't tell us about the
                  <span className="text-red-400 font-semibold"> environmental exposure</span> we face on the way.
                </p>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {[
                    { icon: <Wind size={20} />, label: 'Air Pollution',    desc: 'PM2.5 · PM10 · AQI', color: '#f97316' },
                    { icon: <Thermometer size={20} />, label: 'Heat Exposure',  desc: 'Temperature · UV · Humidity', color: '#ef4444' },
                    { icon: <AlertTriangle size={20} />, label: 'Route Hotspots', desc: 'Corridor-level analysis', color: '#eab308' },
                  ].map(({ icon, label, desc, color }) => (
                    <div key={label} className="bg-dark-600 rounded-xl p-3 text-center">
                      <div style={{ color }} className="mb-2 flex justify-center">{icon}</div>
                      <p className="text-sm font-semibold text-slate-200">{label}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-slate-300 text-lg italic">
                "EcoRoute AI adds an environmental intelligence layer to navigation."
              </p>

              <button
                onClick={() => goToStep('routes')}
                className="mt-8 flex items-center gap-2 mx-auto px-8 py-3 rounded-xl bg-gradient-to-r from-eco-600 to-teal-600 text-white font-semibold hover:from-eco-500 hover:to-teal-500 transition-all duration-200 glow-eco"
              >
                Start Demo <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── ROUTES ── */}
        {activeStep === 'routes' && (
          <div className="h-full flex gap-0">
            {/* Map */}
            <div className="flex-1 relative">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner size={48} label="Loading demo scenario..." />
                </div>
              ) : result ? (
                <EcoMap
                  routes={result.routes}
                  selectedRouteId={selectedRouteId}
                  selectedSegmentId={selectedSegment?.id || null}
                  onSegmentClick={setSelectedSegment}
                  onRouteClick={id => { setSelectedRouteId(id); setSelectedSegment(null); }}
                  originCoords={DEMO_ORIGIN_COORDS}
                  destCoords={DEMO_DEST_COORDS}
                  originLabel="Home (Rajajinagar)"
                  destLabel="RV College"
                />
              ) : null}

              {/* Scenario label */}
              <div className="absolute top-3 left-3 z-[500]">
                <div className="glass-card py-2 px-4">
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin size={11} className="text-eco-400" />
                    <span className="text-eco-400 font-semibold">Rajajinagar</span>
                    <span className="text-slate-500">→</span>
                    <Navigation size={11} className="text-blue-400" />
                    <span className="text-blue-400 font-semibold">RV College</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right panel */}
            <div className="w-80 flex-shrink-0 border-l border-slate-800/60 bg-dark-800/80 p-4 overflow-y-auto">
              {/* Header callout */}
              <div className="glass-card p-4 border-eco-500/30 mb-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-eco-500/5 to-teal-500/5 pointer-events-none" />
                <div className="flex items-center gap-2 mb-2 relative">
                  <Award size={14} className="text-eco-400" />
                  <span className="text-xs font-bold text-eco-400 uppercase tracking-wider">Recommended Route</span>
                </div>
                {recommended && (
                  <>
                    <div className="flex items-center gap-3 relative">
                      <ScoreRing score={recommended.overallExposureScore} size={64} />
                      <div>
                        <p className="font-semibold text-slate-100 text-sm">{recommended.name}</p>
                        <ExposureBadge level={recommended.exposureLevel} />
                        <p className="text-xs text-slate-400 mt-1">{formatDuration(recommended.totalDurationSeconds)}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-700/50 relative">
                      <p className="text-xs text-eco-400 font-semibold">
                        60% lower estimated environmental exposure with only 4 extra minutes
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* All routes */}
              {result?.routes.map(route => (
                <button
                  key={route.id}
                  onClick={() => { setSelectedRouteId(route.id); setSelectedSegment(null); }}
                  className={`w-full glass-card-light p-3 mb-2 text-left transition-all duration-200 border ${
                    selectedRouteId === route.id ? 'border-opacity-100' : 'border-transparent'
                  }`}
                  style={selectedRouteId === route.id ? { borderColor: route.color } : {}}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: route.color, boxShadow: `0 0 6px ${route.color}` }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate">{route.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">{formatDuration(route.totalDurationSeconds)}</span>
                        <ExposureBadge level={route.exposureLevel} size="sm" />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold" style={{ color: exposureColor(route.exposureLevel) }}>
                        {route.overallExposureScore}
                      </div>
                      <div className="text-xs text-slate-500">score</div>
                    </div>
                  </div>
                </button>
              ))}

              {/* Why this route */}
              {recommended && selectedRouteId === 'route-b' && (
                <div className="glass-card-light p-3 mt-2">
                  <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Why Route B?</p>
                  <ul className="space-y-1.5">
                    {recommended.recommendationReason.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                        <CheckCircle2 size={11} className="text-eco-400 mt-0.5 flex-shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Selected segment detail */}
              {selectedSegment && (
                <div className="glass-card-light p-3 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-300">{selectedSegment.streetName}</p>
                    <button onClick={() => setSelectedSegment(null)} className="text-slate-600 hover:text-slate-400 text-xs">✕</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-500">PM2.5:</span> <span className="text-slate-200 font-semibold">{selectedSegment.pm25} µg/m³</span></div>
                    <div><span className="text-slate-500">Temp:</span> <span className="text-slate-200 font-semibold">{selectedSegment.temperature}°C</span></div>
                    <div><span className="text-slate-500">Shade:</span> <span className="text-slate-200 font-semibold">{selectedSegment.shadeScore}%</span></div>
                    <div><span className="text-slate-500">Score:</span> <span className="font-bold" style={{ color: exposureColor(selectedSegment.exposureLevel) }}>{selectedSegment.overallExposureScore}</span></div>
                  </div>
                </div>
              )}

              <button
                onClick={() => goToStep('only-route')}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
              >
                Next: Only Route Scenario <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── ONLY ROUTE ── */}
        {activeStep === 'only-route' && onlyResult && (
          <div className="h-full flex gap-0">
            <div className="flex-1 relative">
              <EcoMap
                routes={onlyResult.routes}
                selectedRouteId={onlyResult.recommendedRouteId}
                selectedSegmentId={null}
                onSegmentClick={setSelectedSegment}
                onRouteClick={() => {}}
                originCoords={DEMO_ORIGIN_COORDS}
                destCoords={DEMO_DEST_COORDS}
                originLabel="Home"
                destLabel="RV College"
              />
              <div className="absolute top-3 left-3 z-[500]">
                <div className="glass-card py-2 px-3 border-orange-500/30">
                  <div className="flex items-center gap-1.5 text-xs">
                    <AlertTriangle size={11} className="text-orange-400" />
                    <span className="text-orange-400 font-semibold">Only Practical Route</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-80 flex-shrink-0 border-l border-slate-800/60 bg-dark-800/80 p-4 overflow-y-auto">
              <div className="glass-card p-4 border-orange-500/25 mb-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={14} className="text-orange-400" />
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Only Practical Route</span>
                  </div>
                  <p className="text-xs text-slate-300 mb-3">
                    This is currently the only practical route. The highest estimated exposure occurs near the
                    <span className="text-orange-300 font-semibold"> 500m Magadi Rd traffic corridor</span>.
                  </p>
                  <div className="space-y-2">
                    {onlyResult.onlyRouteAnalysis?.mainContributors.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1 flex-shrink-0" />
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Better departure time */}
              <div className="glass-card p-4 border-eco-500/25 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown size={14} className="text-eco-400" />
                  <span className="text-xs font-bold text-eco-400">Better Departure Time</span>
                </div>
                <p className="text-xs text-slate-300 mb-3">
                  Leaving <span className="text-eco-400 font-semibold">35 minutes later</span> could reduce
                  estimated exposure by <span className="text-eco-400 font-semibold">35%</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {onlyResult.departureTimeOptions.slice(0, 2).map((d, i) => (
                    <div key={i} className={`rounded-lg p-2.5 text-center border ${d.isBest ? 'border-eco-500/30 bg-eco-500/10' : 'border-slate-700/40 bg-dark-600'}`}>
                      <div className="text-xs text-slate-400 mb-1">{d.label}</div>
                      <div className="text-base font-bold" style={{ color: d.isBest ? '#22c55e' : '#f97316' }}>{d.exposureScore}</div>
                      <div className="text-xs text-slate-500">exposure</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Practical suggestions */}
              <div className="glass-card-light p-4 mb-4">
                <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Exposure Reduction Tips</p>
                <ul className="space-y-2">
                  {onlyResult.onlyRouteAnalysis?.practicalSuggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <Shield size={11} className="text-eco-400 mt-0.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => goToStep('prediction')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
              >
                Next: AI Prediction <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── AI PREDICTION ── */}
        {activeStep === 'prediction' && (
          <div className="h-full overflow-y-auto px-6 py-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-display font-bold text-slate-100 mb-1">AI Environmental Prediction</h2>
                <p className="text-sm text-slate-500">
                  SageMaker regression model forecasts PM2.5 and heat exposure by time of day
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="glass-card p-5">
                  <h3 className="font-semibold text-slate-100 mb-1 text-sm">PM2.5 Forecast (Today)</h3>
                  <p className="text-xs text-slate-500 mb-4">Shaded = ML-predicted. Dashed line = WHO guideline (15 µg/m³)</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={DEMO_POLLUTION_TIMESERIES} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="pm25G2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="pm25" stroke="#f97316" fill="url(#pm25G2)" strokeWidth={2} name="PM2.5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="glass-card p-5">
                  <h3 className="font-semibold text-slate-100 mb-4 text-sm">Departure Time vs Exposure</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={[
                        { time: '3:00 PM', exposure: 72, color: '#ef4444' },
                        { time: '3:30 PM', exposure: 61, color: '#f97316' },
                        { time: '4:00 PM', exposure: 48, color: '#22c55e' },
                        { time: '5:00 PM', exposure: 55, color: '#eab308' },
                      ]}
                      margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="exposure" name="Exposure Score" radius={[4, 4, 0, 0]}
                        fill="#3b82f6"
                        label={{ position: 'top', fontSize: 11, fill: '#94a3b8' }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recommendation callout */}
              <div className="glass-card p-5 border-eco-500/25 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-eco-500/15 border border-eco-500/25 flex items-center justify-center flex-shrink-0">
                    <TrendingDown size={22} className="text-eco-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-100 mb-1">AI Recommendation</h3>
                    <p className="text-slate-300">
                      <span className="text-eco-400 font-semibold">Leaving at 4:00 PM</span> may reduce
                      estimated environmental exposure by <span className="text-eco-400 font-semibold">33%</span>
                      {' '}(from exposure score 72 → 48).
                    </p>
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                      <Info size={11} />
                      Prediction based on historical PM2.5 patterns. Actual conditions may vary.
                    </p>
                  </div>
                </div>
              </div>

              {/* SageMaker model info */}
              <div className="glass-card p-5">
                <h3 className="font-semibold text-slate-100 mb-4 text-sm flex items-center gap-2">
                  <Server size={14} className="text-orange-400" />
                  SageMaker Model Architecture
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-dark-600 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">Model Type</p>
                    <p className="text-sm font-semibold text-slate-200">XGBoost Regression</p>
                  </div>
                  <div className="bg-dark-600 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">Features</p>
                    <p className="text-sm font-semibold text-slate-200">Hour, Day, Temp, Historical PM2.5</p>
                  </div>
                  <div className="bg-dark-600 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">Output</p>
                    <p className="text-sm font-semibold text-slate-200">Predicted PM2.5 µg/m³</p>
                  </div>
                </div>
                <div className="mt-3 bg-dark-600 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">Artifact location</p>
                  <code className="text-xs text-eco-400 font-mono">s3://ecoroute-ai-data/models/pm25-forecast-v1/</code>
                </div>
              </div>

              <button
                onClick={() => goToStep('aws')}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
              >
                Next: AWS Architecture <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── AWS ── */}
        {activeStep === 'aws' && (
          <div className="h-full overflow-y-auto px-6 py-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-bold text-slate-100 mb-1">AWS Architecture</h2>
                <p className="text-sm text-slate-500">Real AWS services powering EcoRoute AI</p>
              </div>

              {/* Architecture diagram */}
              <div className="glass-card p-6 mb-6">
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {[
                    { label: 'Frontend', color: '#3b82f6', icon: <Activity size={16} /> },
                    { label: '→', color: '#475569', icon: null },
                    { label: 'API Gateway', color: '#8b5cf6', icon: <Zap size={16} /> },
                    { label: '→', color: '#475569', icon: null },
                    { label: 'Lambda', color: '#f59e0b', icon: <Server size={16} /> },
                    { label: '→', color: '#475569', icon: null },
                    { label: 'DynamoDB', color: '#22c55e', icon: <Database size={16} /> },
                    { label: '+', color: '#475569', icon: null },
                    { label: 'S3', color: '#f97316', icon: <Cloud size={16} /> },
                    { label: '+', color: '#475569', icon: null },
                    { label: 'SageMaker', color: '#06b6d4', icon: <Activity size={16} /> },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center">
                      {item.icon ? (
                        <div
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300"
                          style={{
                            background: `${item.color}20`,
                            border: `1px solid ${item.color}40`,
                            color: item.color,
                            opacity: awsAnimating ? (awsActiveIdx >= i / 2 ? 1 : 0.3) : 1,
                          }}
                        >
                          {item.icon}
                          {item.label}
                        </div>
                      ) : (
                        <span className="text-slate-600 mx-1 text-sm font-bold">{item.label}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Service cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {DEMO_AWS_SERVICES.map((svc, i) => (
                  <div
                    key={svc.name}
                    className="glass-card p-4 transition-all duration-500"
                    style={{
                      opacity: awsAnimating ? (awsActiveIdx >= i ? 1 : 0.2) : 1,
                      transform: awsAnimating && awsActiveIdx === i ? 'scale(1.02)' : 'scale(1)',
                      borderColor: awsActiveIdx === i ? '#22c55e60' : '',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-300">{svc.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                        svc.status === 'active' ? 'bg-eco-500/20 text-eco-400' :
                        svc.status === 'fallback' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-slate-700 text-slate-500'
                      }`}>
                        {svc.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{svc.detail}</p>
                  </div>
                ))}
              </div>

              {/* S3 structure */}
              <div className="glass-card p-5 mb-4">
                <h3 className="font-semibold text-slate-100 mb-3 text-sm flex items-center gap-2">
                  <Cloud size={14} className="text-orange-400" />
                  S3 Data Structure
                </h3>
                <div className="font-mono text-xs space-y-1">
                  {[
                    { path: 's3://ecoroute-ai-data/raw/', desc: 'CPCB/OpenAQ raw data feeds' },
                    { path: 's3://ecoroute-ai-data/processed/', desc: 'Cleaned, geo-enriched datasets' },
                    { path: 's3://ecoroute-ai-data/models/', desc: 'SageMaker model artifacts' },
                    { path: 's3://ecoroute-ai-data/demo/', desc: 'Competition demo datasets' },
                  ].map(({ path, desc }) => (
                    <div key={path} className="flex items-center gap-3 py-1 border-b border-slate-800/40">
                      <span className="text-eco-400 flex-shrink-0">{path}</span>
                      <span className="text-slate-500">— {desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => goToStep('impact')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
              >
                Next: Impact <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── IMPACT ── */}
        {activeStep === 'impact' && (
          <div className="h-full flex flex-col items-center justify-center px-8 text-center bg-animated">
            <div className="max-w-2xl">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-eco-500 to-teal-500 flex items-center justify-center mx-auto mb-6 glow-eco float-particle">
                <Wind size={36} className="text-white" />
              </div>

              <h1 className="text-5xl font-display font-bold text-gradient mb-6 leading-tight">
                Don't just find the<br />fastest way there.
              </h1>

              <p className="text-2xl text-slate-200 mb-4 font-light">
                Find a <span className="text-eco-400 font-semibold">better</span> way there.
              </p>

              <div className="glass-card p-6 mb-8">
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { value: '60%', label: 'Lower exposure', sub: 'vs fastest route', color: '#22c55e' },
                    { value: '33%', label: 'Reduced via', sub: 'departure time', color: '#06b6d4' },
                    { value: '3', label: 'Routes analyzed', sub: 'with AI scoring', color: '#f59e0b' },
                  ].map(({ value, label, sub, color }) => (
                    <div key={label} className="text-center">
                      <div className="text-4xl font-bold mb-1" style={{ color }}>{value}</div>
                      <div className="text-sm font-semibold text-slate-200">{label}</div>
                      <div className="text-xs text-slate-500">{sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => goToStep('intro')}
                  className="px-6 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm font-medium hover:border-slate-600 transition-colors"
                >
                  Restart Demo
                </button>
                <a
                  href="/"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-eco-600 to-teal-600 text-white text-sm font-semibold hover:from-eco-500 hover:to-teal-500 transition-all duration-200"
                >
                  Try Live App <ChevronRight size={16} />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
