import React from 'react';
import type { AppState } from '../types';
import { exposureColor, formatDuration, formatDistance } from '../lib/scoring';
import { ExposureBadge, ProgressBar, ScoreRing } from '../components/shared';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  Legend,
} from 'recharts';
import { Wind, Thermometer, Clock, AlertTriangle, Award } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface RoutesPageProps {
  state: AppState;
  onSelectRoute: (id: string) => void;
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
        </div>
      ))}
    </div>
  );
};

export const RoutesPage: React.FC<RoutesPageProps> = ({ state, onSelectRoute }) => {
  const { theme } = useTheme();
  const { result, selectedRouteId } = state;

  if (!result) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-app)',
      }}>
        Analyze a route from the Navigator console first to compare alternative paths.
      </div>
    );
  }

  const { routes } = result;

  // Comparison bar chart data
  const barData = routes.map(r => ({
    name: r.name.split('–')[0].trim(),
    'Air Score': r.airScore,
    'Heat Score': r.heatScore,
    'Exposure': r.overallExposureScore,
    color: r.color,
  }));

  // Radar chart data
  const radarData = [
    { subject: 'Air Quality', ...Object.fromEntries(routes.map(r => [r.name.split('–')[0].trim(), 100 - r.airScore])) },
    { subject: 'Heat',        ...Object.fromEntries(routes.map(r => [r.name.split('–')[0].trim(), 100 - r.heatScore])) },
    { subject: 'Shade',       ...Object.fromEntries(routes.map(r => [r.name.split('–')[0].trim(), r.shadeScore])) },
    { subject: 'Speed',       ...Object.fromEntries(routes.map(r => [r.name.split('–')[0].trim(), Math.max(0, 100 - (r.totalDurationSeconds / 3600) * 100)])) },
    { subject: 'No Hotspots', ...Object.fromEntries(routes.map(r => [r.name.split('–')[0].trim(), Math.max(0, 100 - r.hotspotCount * 25)])) },
  ];

  const gridColor = theme === 'dark' ? '#1E293B' : '#E2E8F0';
  const axisColor = theme === 'dark' ? '#94A3B8' : '#64748B';

  return (
    <div style={{ height: '100%', paddingTop: 64, overflowY: 'auto', background: 'var(--bg-app)', padding: '64px 24px 32px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px' }}>
            Route Comparison & Weather Exposure
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            {state.request.origin || 'Origin'} → {state.request.destination || 'Destination'}
          </p>
        </div>

        {/* Route cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
          {routes.map(route => {
            const isSelected = selectedRouteId === route.id;
            const isRec = route.id === result.recommendedRouteId;
            return (
              <button
                key={route.id}
                onClick={() => onSelectRoute(route.id)}
                style={{
                  background: 'var(--bg-card)',
                  border: isSelected ? `2px solid ${route.color}` : '1px solid var(--border-color)',
                  borderRadius: 16,
                  padding: '18px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isSelected ? 'var(--shadow-elevated)' : 'var(--shadow-card)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Gradient top accent */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: route.color }} />

                {isRec && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'rgba(34, 197, 94, 0.15)', color: '#22C55E',
                    padding: '2px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 800,
                  }}>
                    <Award size={12} color="#22C55E" />
                    <span>Best</span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 4 }}>
                  <ScoreRing score={route.overallExposureScore} size={62} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 14, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {route.name}
                    </h3>
                    <ExposureBadge level={route.exposureLevel} size="sm" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={12} color="var(--text-muted)" />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{formatDuration(route.totalDurationSeconds)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Wind size={12} color="#F97316" />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>PM2.5: {route.avgPm25}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Thermometer size={12} color="#38BDF8" />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{route.avgTemperature}°C</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={12} color="#EF4444" />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{route.hotspotCount} hotspot{route.hotspotCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <ProgressBar label="Air" value={route.airScore} />
                  <ProgressBar label="Heat" value={route.heatScore} color="#F97316" />
                  <ProgressBar label="Shade" value={route.shadeScore} color="#22C55E" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Comparison table */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 16, padding: '20px', marginBottom: 28, boxShadow: 'var(--shadow-card)',
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 14px' }}>
            Detailed Path Matrix
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border-color)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 700 }}>Route Option</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 700 }}>Duration</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 700 }}>Distance</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 700 }}>Air Score</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 700 }}>Heat Score</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 700 }}>Exposure Score</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 700 }}>Classification</th>
                </tr>
              </thead>
              <tbody>
                {routes.map(route => {
                  const isRec = route.id === result.recommendedRouteId;
                  return (
                    <tr
                      key={route.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        background: isRec ? 'var(--bg-subtle)' : 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                      onClick={() => onSelectRoute(route.id)}
                    >
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 9, height: 9, borderRadius: '50%', background: route.color }} />
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{route.name.split('–')[0].trim()}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {formatDuration(route.totalDurationSeconds)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--text-secondary)' }}>
                        {formatDistance(route.totalDistanceMeters)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px 12px' }}>
                        <ExposureBadge level={route.airScore < 30 ? 'low' : route.airScore < 55 ? 'moderate' : route.airScore < 75 ? 'elevated' : 'high'} size="sm" />
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px 12px' }}>
                        <ExposureBadge level={route.heatScore < 30 ? 'low' : route.heatScore < 55 ? 'moderate' : route.heatScore < 75 ? 'elevated' : 'high'} size="sm" />
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px 12px' }}>
                        <span style={{ fontWeight: 800, color: exposureColor(route.exposureLevel) }}>
                          {route.overallExposureScore}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {isRec ? (
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#22C55E', background: 'rgba(34,197,94,0.15)', padding: '2px 8px', borderRadius: 12 }}>
                            Recommended
                          </span>
                        ) : route.label === 'fastest' ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', background: 'rgba(37,99,235,0.1)', padding: '2px 8px', borderRadius: 12 }}>
                            Fastest
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#FACC15', background: 'rgba(250,204,21,0.15)', padding: '2px 8px', borderRadius: 12 }}>
                            Balanced
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Bar chart */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 16, padding: '20px', boxShadow: 'var(--shadow-card)',
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px' }}>
              Exposure Score Comparison
            </h3>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} />
                <YAxis tick={{ fill: axisColor, fontSize: 11 }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Air Score" fill="#22C55E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Heat Score" fill="#F97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Exposure" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: '11px', color: axisColor }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar chart */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 16, padding: '20px', boxShadow: 'var(--shadow-card)',
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px' }}>
              Multi-Factor Atmospheric Radar
            </h3>
            <ResponsiveContainer width="100%" height={230}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={gridColor} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: axisColor, fontSize: 11 }} />
                {routes.map(r => (
                  <Radar
                    key={r.id}
                    name={r.name.split('–')[0].trim()}
                    dataKey={r.name.split('–')[0].trim()}
                    stroke={r.color}
                    fill={r.color}
                    fillOpacity={0.15}
                  />
                ))}
                <Legend wrapperStyle={{ fontSize: '11px', color: axisColor }} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
