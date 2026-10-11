import React, { useState } from 'react';
import type { AppState } from '../types';
import { MetricCard, ProgressBar } from '../components/shared';
import { DEMO_POLLUTION_TIMESERIES } from '../data/demoData';
import { exposureColor } from '../lib/scoring';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, AreaChart, Area,
  BarChart, Bar, Legend,
} from 'recharts';
import { Clock, Wind, TrendingDown, AlertTriangle, CheckCircle2, Activity, Thermometer } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface InsightsPageProps {
  state: AppState;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: 'var(--bg-floating)',
      border: '1px solid var(--border-color)',
      borderRadius: 10,
      padding: '8px 12px',
      boxShadow: 'var(--shadow-elevated)',
      backdropFilter: 'blur(8px)',
      fontSize: 11,
    }}>
      <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '2px 0' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ color: 'var(--text-muted)' }}>{p.name}:</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{Math.round(p.value)}</span>
          {p.name.includes('PM2.5') && <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>µg/m³</span>}
        </div>
      ))}
    </div>
  );
};

export const InsightsPage: React.FC<InsightsPageProps> = ({ state }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'pollution' | 'departure' | 'hotspots'>('pollution');
  const result = state.result;
  const depOptions = result?.departureTimeOptions || [];
  const bestDep = depOptions.find(d => d.isBest);
  const nowDep = depOptions[0];

  const gridColor = theme === 'dark' ? '#1E293B' : '#E2E8F0';
  const axisColor = theme === 'dark' ? '#94A3B8' : '#64748B';

  const tabs = [
    { id: 'pollution', label: 'Pollution Trends',   icon: <Wind size={13} /> },
    { id: 'departure', label: 'Departure Analysis', icon: <Clock size={13} /> },
    { id: 'hotspots',  label: 'Hotspot Analysis',   icon: <AlertTriangle size={13} /> },
  ] as const;

  return (
    <div style={{ height: '100%', paddingTop: 64, overflowY: 'auto', background: 'var(--bg-app)', padding: '64px 24px 32px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px' }}>
            Atmospheric & Environmental Insights
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Real-time air quality forecasts, optimal departure timing, and micro-climate emission hotspots
          </p>
        </div>

        {/* Quick metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 24 }}>
          <MetricCard
            label="Current PM2.5"
            value={result?.environmentalConditions.airQuality.pm25 ?? 42}
            unit="µg/m³"
            icon={<Wind size={14} />}
            color="#F97316"
          />
          <MetricCard
            label="Current AQI"
            value={result?.environmentalConditions.airQuality.aqi ?? 115}
            icon={<Activity size={14} />}
            color="#EF4444"
            sublabel={result?.environmentalConditions.aqiCategory ?? 'Moderate Air Quality'}
          />
          <MetricCard
            label="Temperature"
            value={result?.environmentalConditions.weather.temperature ?? 28}
            unit="°C"
            icon={<Thermometer size={14} />}
            color="#38BDF8"
          />
          {bestDep && nowDep && (
            <MetricCard
              label="Best Departure"
              value={`${Math.round(((nowDep.exposureScore - bestDep.exposureScore) / (nowDep.exposureScore || 1)) * 100)}%`}
              sublabel="Estimated exposure reduction"
              icon={<TrendingDown size={14} />}
              color="#22C55E"
            />
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, borderBottom: '1.5px solid var(--border-color)', paddingBottom: 2 }}>
          {tabs.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px',
                  fontSize: 13, fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  borderBottom: `2.5px solid ${active ? '#38BDF8' : 'transparent'}`,
                  background: 'transparent',
                  color: active ? '#38BDF8' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                  marginBottom: -2,
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Pollution Trends */}
        {activeTab === 'pollution' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: 16, padding: '20px', boxShadow: 'var(--shadow-card)',
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px' }}>
                PM2.5 Concentration Forecast Throughout the Day
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px' }}>
                Shaded area = diurnal trend prediction. WHO daily target guideline: 15 µg/m³.
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={DEMO_POLLUTION_TIMESERIES} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="pm25WeatherGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="hour" tick={{ fill: axisColor, fontSize: 11 }} />
                  <YAxis tick={{ fill: axisColor, fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={15} stroke="#22C55E" strokeDasharray="4 2" label={{ value: 'WHO Target 15', fill: '#22C55E', fontSize: 10 }} />
                  <ReferenceLine y={65} stroke="#EF4444" strokeDasharray="4 2" label={{ value: 'Unhealthy 65', fill: '#EF4444', fontSize: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="pm25"
                    stroke="#F97316"
                    fill="url(#pm25WeatherGrad)"
                    strokeWidth={2.5}
                    name="PM2.5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: 16, padding: '20px', boxShadow: 'var(--shadow-card)',
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px' }}>
                AQI Index Trajectory
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={DEMO_POLLUTION_TIMESERIES} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="hour" tick={{ fill: axisColor, fontSize: 11 }} />
                  <YAxis tick={{ fill: axisColor, fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={100} stroke="#FACC15" strokeDasharray="4 2" />
                  <ReferenceLine y={150} stroke="#EF4444" strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="aqi" stroke="#38BDF8" strokeWidth={2.5} name="AQI" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* AQI Scale */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: 16, padding: '18px', boxShadow: 'var(--shadow-card)',
            }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 12px' }}>
                Air Quality Index Standards
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                {[
                  { range: '0–50',   label: 'Good Air',                      color: '#22C55E' },
                  { range: '51–100', label: 'Moderate',                     color: '#FACC15' },
                  { range: '101–150',label: 'Unhealthy (Sensitive Groups)', color: '#F97316' },
                  { range: '151–200',label: 'Unhealthy',                    color: '#EF4444' },
                ].map(({ range, label, color }) => (
                  <div key={range} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 4, background: color }} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{range}:</span>
                    <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 700 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Departure Time Analysis */}
        {activeTab === 'departure' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {depOptions.length > 0 ? (
              <>
                <div style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderRadius: 16, padding: '20px', boxShadow: 'var(--shadow-card)',
                }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                    Departure Time vs. Estimated Exposure
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px' }}>
                    Calculated air pollution variation over the next 2 hours on your recommended route.
                  </p>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={depOptions.map(d => ({ name: d.label, Exposure: d.exposureScore, PM25: d.pm25 }))}
                      margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 10 }} />
                      <YAxis tick={{ fill: axisColor, fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Exposure" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="PM25" fill="#F97316" radius={[4, 4, 0, 0]} name="PM2.5" />
                      <Legend wrapperStyle={{ fontSize: '11px', color: axisColor }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                  {depOptions.map((opt, i) => (
                    <div
                      key={i}
                      style={{
                        background: 'var(--bg-card)',
                        border: opt.isBest ? '2px solid #22C55E' : '1px solid var(--border-color)',
                        borderRadius: 14, padding: '16px',
                        boxShadow: 'var(--shadow-card)',
                        position: 'relative', overflow: 'hidden',
                      }}
                    >
                      {opt.isBest && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#22C55E' }} />
                      )}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px' }}>{opt.label}</p>
                          {opt.recommendation && (
                            <p style={{ fontSize: 11, color: '#22C55E', fontWeight: 600, margin: 0 }}>{opt.recommendation}</p>
                          )}
                        </div>
                        {opt.isBest && <CheckCircle2 size={16} color="#22C55E" />}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
                        <div style={{ textAlign: 'center', background: 'var(--bg-subtle)', padding: '6px', borderRadius: 8 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: exposureColor(opt.exposureScore < 30 ? 'low' : opt.exposureScore < 55 ? 'moderate' : 'elevated') }}>
                            {opt.exposureScore}
                          </div>
                          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 600 }}>Exposure</div>
                        </div>
                        <div style={{ textAlign: 'center', background: 'var(--bg-subtle)', padding: '6px', borderRadius: 8 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#F97316' }}>{opt.pm25}</div>
                          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 600 }}>PM2.5</div>
                        </div>
                        <div style={{ textAlign: 'center', background: 'var(--bg-subtle)', padding: '6px', borderRadius: 8 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#38BDF8' }}>{opt.temperature}°C</div>
                          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 600 }}>Temp</div>
                        </div>
                      </div>
                      <ProgressBar value={opt.exposureScore} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: 16, padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13,
              }}>
                Analyze a route in the Navigator console to view departure time optimization.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Hotspot Analysis */}
        {activeTab === 'hotspots' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {result ? (
              result.routes.map(route => {
                const hotspots = route.segments.filter(s => s.isHotspot);
                return (
                  <div key={route.id} style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                    borderRadius: 16, padding: '20px', boxShadow: 'var(--shadow-card)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: route.color }} />
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{route.name}</h3>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>– {hotspots.length} emission hotspot{hotspots.length !== 1 ? 's' : ''}</span>
                    </div>

                    {hotspots.length === 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#22C55E', fontSize: 13, fontWeight: 600 }}>
                        <CheckCircle2 size={16} />
                        <span>Clean corridor: No severe hotspots identified along this route.</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {hotspots.map(seg => (
                          <div key={seg.id} style={{
                            background: 'rgba(239, 68, 68, 0.06)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: 12, padding: '12px 14px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px' }}>{seg.streetName}</p>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{seg.hotspotReason}</p>
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', padding: '2px 8px', borderRadius: 12 }}>
                                High Exposure
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: '#EF4444' }}>{seg.pm25}</div>
                                <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>PM2.5</div>
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: '#F97316' }}>{seg.temperature}°C</div>
                                <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>Temp</div>
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)' }}>{Math.round(seg.distanceMeters)}m</div>
                                <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>Length</div>
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: exposureColor(seg.exposureLevel) }}>
                                  {seg.overallExposureScore}
                                </div>
                                <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>Score</div>
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
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: 16, padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13,
              }}>
                Analyze a route in the Navigator console to inspect emission hotspot segments.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
