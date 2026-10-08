import React, { useState } from 'react';
import type { AppState } from '../types';
import { MetricCard, ProgressBar } from '../components/shared';
import { DEMO_POLLUTION_TIMESERIES } from '../data/demoData';
import { exposureColor } from '../lib/scoring';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend, AreaChart, Area,
  BarChart, Bar,
} from 'recharts';
import { Clock, Wind, TrendingDown, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface InsightsPageProps {
  state: AppState;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-card p-3 text-xs">
      <p className="font-semibold text-slate-200 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-semibold text-slate-200">{Math.round(p.value)}</span>
          {p.name.includes('PM2.5') && <span className="text-slate-500">µg/m³</span>}
        </div>
      ))}
    </div>
  );
};

export const InsightsPage: React.FC<InsightsPageProps> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<'pollution' | 'departure' | 'hotspots'>('pollution');
  const result = state.result;
  const depOptions = result?.departureTimeOptions || [];
  const bestDep = depOptions.find(d => d.isBest);
  const nowDep = depOptions[0];

  const tabs = [
    { id: 'pollution', label: 'Pollution Trends',   icon: <Wind size={13} /> },
    { id: 'departure', label: 'Departure Analysis', icon: <Clock size={13} /> },
    { id: 'hotspots',  label: 'Hotspot Analysis',   icon: <AlertTriangle size={13} /> },
  ] as const;

  return (
    <div className="h-full pt-14 overflow-y-auto bg-dark-900 px-6 py-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-slate-100 mb-1">Environmental Insights</h1>
          <p className="text-sm text-slate-500">Air quality trends, departure time optimization, and pollution hotspots</p>
        </div>

        {/* Quick metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            label="Current PM2.5"
            value={result?.environmentalConditions.airQuality.pm25 ?? 68}
            unit="µg/m³"
            icon={<Wind size={14} />}
            color="#f97316"
          />
          <MetricCard
            label="Current AQI"
            value={result?.environmentalConditions.airQuality.aqi ?? 142}
            icon={<Activity size={14} />}
            color="#ef4444"
            sublabel={result?.environmentalConditions.aqiCategory ?? 'Unhealthy for Sensitive Groups'}
          />
          <MetricCard
            label="Temperature"
            value={result?.environmentalConditions.weather.temperature ?? 33}
            unit="°C"
            icon={<Thermometer size={14} />}
            color="#f59e0b"
          />
          {bestDep && nowDep && (
            <MetricCard
              label="Best Departure"
              value={`${Math.round(((nowDep.exposureScore - bestDep.exposureScore) / nowDep.exposureScore) * 100)}%`}
              sublabel="Estimated exposure reduction"
              icon={<TrendingDown size={14} />}
              color="#22c55e"
            />
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-slate-800/60">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-eco-400 border-eco-400'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Pollution Trends */}
        {activeTab === 'pollution' && (
          <div className="space-y-6 fade-in-up">
            <div className="glass-card p-5">
              <h3 className="font-semibold text-slate-100 mb-1">PM2.5 Throughout the Day</h3>
              <p className="text-xs text-slate-500 mb-4">
                Shaded area = predicted. WHO daily guideline: 15 µg/m³.
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={DEMO_POLLUTION_TIMESERIES} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="pm25Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={15} stroke="#22c55e" strokeDasharray="4 2" label={{ value: 'WHO 15', fill: '#22c55e', fontSize: 10 }} />
                  <ReferenceLine y={65} stroke="#f97316" strokeDasharray="4 2" label={{ value: 'Unhealthy 65', fill: '#f97316', fontSize: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="pm25"
                    stroke="#f97316"
                    fill="url(#pm25Grad)"
                    strokeWidth={2}
                    name="PM2.5"
                    dot={(props: any) => {
                      const d = DEMO_POLLUTION_TIMESERIES[props.index];
                      return d?.predicted
                        ? <circle key={props.key} cx={props.cx} cy={props.cy} r={3} fill="#f9731660" stroke="#f97316" strokeWidth={1} strokeDasharray="2 2" />
                        : <circle key={props.key} cx={props.cx} cy={props.cy} r={3} fill="#f97316" />;
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-semibold text-slate-100 mb-4">AQI Over Time</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={DEMO_POLLUTION_TIMESERIES} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={100} stroke="#eab308" strokeDasharray="4 2" />
                  <ReferenceLine y={150} stroke="#ef4444" strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="aqi" stroke="#3b82f6" strokeWidth={2} name="AQI" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* AQI scale */}
            <div className="glass-card p-5">
              <h3 className="font-semibold text-slate-100 mb-4 text-sm">AQI Reference Scale</h3>
              <div className="space-y-2">
                {[
                  { range: '0–50',   label: 'Good',                           color: '#22c55e' },
                  { range: '51–100', label: 'Moderate',                       color: '#eab308' },
                  { range: '101–150',label: 'Unhealthy for Sensitive Groups',  color: '#f97316' },
                  { range: '151–200',label: 'Unhealthy',                      color: '#ef4444' },
                  { range: '201–300',label: 'Very Unhealthy',                 color: '#a855f7' },
                ].map(({ range, label, color }) => (
                  <div key={range} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color }} />
                    <span className="text-xs text-slate-400 w-20 flex-shrink-0">{range}</span>
                    <span className="text-xs text-slate-300">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Departure Time Analysis */}
        {activeTab === 'departure' && (
          <div className="space-y-6 fade-in-up">
            {depOptions.length > 0 ? (
              <>
                <div className="glass-card p-5">
                  <h3 className="font-semibold text-slate-100 mb-1">Departure Time vs Exposure</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Estimated environmental exposure on the recommended route for different departure times.
                  </p>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={depOptions.map(d => ({ name: d.label, Exposure: d.exposureScore, PM25: d.pm25 }))}
                      margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Exposure" fill="#3b82f6" radius={[4, 4, 0, 0]}
                        label={{ position: 'top', fontSize: 10, fill: '#94a3b8' }}
                      />
                      <Bar dataKey="PM25" fill="#f97316" radius={[4, 4, 0, 0]} name="PM2.5" />
                      <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {depOptions.map((opt, i) => (
                    <div
                      key={i}
                      className={`glass-card p-4 relative overflow-hidden transition-all duration-200 ${opt.isBest ? 'border-eco-500/40' : ''}`}
                    >
                      {opt.isBest && (
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-eco-500 to-teal-500" />
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{opt.label}</p>
                          {opt.recommendation && (
                            <p className="text-xs text-eco-400 mt-0.5">{opt.recommendation}</p>
                          )}
                        </div>
                        {opt.isBest && <CheckCircle2 size={16} className="text-eco-400" />}
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center">
                          <div className="text-lg font-bold" style={{ color: exposureColor(opt.exposureScore < 30 ? 'low' : opt.exposureScore < 55 ? 'moderate' : opt.exposureScore < 75 ? 'elevated' : 'high') }}>
                            {opt.exposureScore}
                          </div>
                          <div className="text-xs text-slate-500">Exposure</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-400">{opt.pm25}</div>
                          <div className="text-xs text-slate-500">PM2.5</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-400">{opt.temperature}°C</div>
                          <div className="text-xs text-slate-500">Temp</div>
                        </div>
                      </div>
                      <ProgressBar value={opt.exposureScore} />
                    </div>
                  ))}
                </div>

                {bestDep && nowDep && (
                  <div className="glass-card p-5 border-eco-500/20">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-eco-500/15 border border-eco-500/25 flex items-center justify-center flex-shrink-0">
                        <TrendingDown size={18} className="text-eco-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-100 mb-1">Time-based Recommendation</h3>
                        <p className="text-sm text-slate-300">
                          Leaving at{' '}
                          <strong className="text-eco-400">{bestDep.label}</strong>
                          {' '}may reduce estimated environmental exposure by{' '}
                          <strong className="text-eco-400">
                            {Math.round(((nowDep.exposureScore - bestDep.exposureScore) / nowDep.exposureScore) * 100)}%
                          </strong>
                          {' '}(from {nowDep.exposureScore} to {bestDep.exposureScore}).
                        </p>
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                          <Info size={11} />
                          Based on available environmental data. Actual conditions may vary.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="glass-card p-8 text-center text-slate-500 text-sm">
                Analyze a route to see departure time options.
              </div>
            )}
          </div>
        )}

        {/* Hotspot Analysis */}
        {activeTab === 'hotspots' && (
          <div className="space-y-4 fade-in-up">
            {result ? (
              result.routes.map(route => {
                const hotspots = route.segments.filter(s => s.isHotspot);
                return (
                  <div key={route.id} className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full" style={{ background: route.color }} />
                      <h3 className="font-semibold text-slate-100 text-sm">{route.name}</h3>
                      <span className="text-xs text-slate-500">– {hotspots.length} hotspot{hotspots.length !== 1 ? 's' : ''}</span>
                    </div>

                    {hotspots.length === 0 ? (
                      <div className="flex items-center gap-2 text-eco-400 text-sm">
                        <CheckCircle2 size={14} />
                        No high-exposure hotspots on this route
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {hotspots.map(seg => (
                          <div key={seg.id} className="bg-red-500/5 border border-red-500/15 rounded-xl p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-200">{seg.streetName}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{seg.hotspotReason}</p>
                              </div>
                              <span className="text-xs badge-high px-2 py-0.5 rounded-full font-semibold">
                                High Exposure
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center">
                              <div>
                                <div className="text-sm font-bold text-red-400">{seg.pm25}</div>
                                <div className="text-xs text-slate-500">PM2.5</div>
                              </div>
                              <div>
                                <div className="text-sm font-bold text-orange-400">{seg.temperature}°C</div>
                                <div className="text-xs text-slate-500">Temp</div>
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-300">{Math.round(seg.distanceMeters)}m</div>
                                <div className="text-xs text-slate-500">Length</div>
                              </div>
                              <div>
                                <div className="text-sm font-bold" style={{ color: exposureColor(seg.exposureLevel) }}>
                                  {seg.overallExposureScore}
                                </div>
                                <div className="text-xs text-slate-500">Score</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="glass-card p-8 text-center text-slate-500 text-sm">
                Analyze a route to see hotspot details.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Missing imports
const Activity = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const Thermometer = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
  </svg>
);
