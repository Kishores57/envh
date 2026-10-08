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

interface RoutesPageProps {
  state: AppState;
  onSelectRoute: (id: string) => void;
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
        </div>
      ))}
    </div>
  );
};

export const RoutesPage: React.FC<RoutesPageProps> = ({ state, onSelectRoute }) => {
  const { result, selectedRouteId } = state;

  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        Analyze a route from the Dashboard first.
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

  return (
    <div className="h-full pt-14 overflow-y-auto bg-dark-900 px-6 py-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-slate-100 mb-1">Route Comparison</h1>
          <p className="text-sm text-slate-500">
            {state.request.origin} → {state.request.destination}
          </p>
        </div>

        {/* Route cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {routes.map(route => {
            const isSelected = selectedRouteId === route.id;
            const isRec = route.id === result.recommendedRouteId;
            return (
              <button
                key={route.id}
                onClick={() => onSelectRoute(route.id)}
                className={`glass-card p-5 text-left card-hover relative overflow-hidden transition-all duration-200 border ${
                  isSelected ? 'border-opacity-100' : 'border-transparent'
                }`}
                style={isSelected ? { borderColor: route.color } : {}}
              >
                {/* Gradient top accent */}
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: route.color }} />

                {isRec && (
                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <Award size={12} className="text-eco-400" />
                    <span className="text-xs text-eco-400 font-bold">Best</span>
                  </div>
                )}

                <div className="flex items-start gap-3 mt-2">
                  <ScoreRing score={route.overallExposureScore} size={60} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-100 text-sm mb-1 truncate">{route.name}</h3>
                    <ExposureBadge level={route.exposureLevel} size="sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-500" />
                    <span className="text-xs text-slate-300">{formatDuration(route.totalDurationSeconds)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wind size={12} className="text-slate-500" />
                    <span className="text-xs text-slate-300">PM2.5: {route.avgPm25}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Thermometer size={12} className="text-slate-500" />
                    <span className="text-xs text-slate-300">{route.avgTemperature}°C avg</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-slate-500" />
                    <span className="text-xs text-slate-300">{route.hotspotCount} hotspot{route.hotspotCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <ProgressBar label="Air" value={route.airScore} />
                  <ProgressBar label="Heat" value={route.heatScore} color="#f97316" />
                  <ProgressBar label="Shade" value={route.shadeScore} color="#06b6d4" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Comparison table */}
        <div className="glass-card p-5 mb-8">
          <h2 className="font-semibold text-slate-100 mb-4">Route Comparison Table</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-xs text-slate-500 font-semibold pb-3 pr-4">Route</th>
                  <th className="text-right text-xs text-slate-500 font-semibold pb-3 pr-4">Time</th>
                  <th className="text-right text-xs text-slate-500 font-semibold pb-3 pr-4">Distance</th>
                  <th className="text-right text-xs text-slate-500 font-semibold pb-3 pr-4">Air Score</th>
                  <th className="text-right text-xs text-slate-500 font-semibold pb-3 pr-4">Heat Score</th>
                  <th className="text-right text-xs text-slate-500 font-semibold pb-3 pr-4">Exposure</th>
                  <th className="text-left text-xs text-slate-500 font-semibold pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route) => {
                  const isRec = route.id === result.recommendedRouteId;
                  return (
                    <tr
                      key={route.id}
                      className={`border-b border-slate-800/40 cursor-pointer transition-colors ${isRec ? 'bg-eco-500/5' : 'hover:bg-slate-800/30'}`}
                      onClick={() => onSelectRoute(route.id)}
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: route.color }} />
                          <span className="font-medium text-slate-200">{route.name.split('–')[0].trim()}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right text-slate-300">{formatDuration(route.totalDurationSeconds)}</td>
                      <td className="py-3 pr-4 text-right text-slate-300">{formatDistance(route.totalDistanceMeters)}</td>
                      <td className="py-3 pr-4 text-right">
                        <ExposureBadge level={route.airScore < 30 ? 'low' : route.airScore < 55 ? 'moderate' : route.airScore < 75 ? 'elevated' : 'high'} size="sm" />
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <ExposureBadge level={route.heatScore < 30 ? 'low' : route.heatScore < 55 ? 'moderate' : route.heatScore < 75 ? 'elevated' : 'high'} size="sm" />
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <span className="font-bold" style={{ color: exposureColor(route.exposureLevel) }}>
                          {route.overallExposureScore}
                        </span>
                      </td>
                      <td className="py-3">
                        {isRec ? (
                          <span className="text-xs badge-low px-2 py-0.5 rounded-full font-semibold">Recommended</span>
                        ) : route.label === 'fastest' ? (
                          <span className="text-xs text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-full">Fastest</span>
                        ) : (
                          <span className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full">Balanced</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Bar chart */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-slate-100 mb-4 text-sm">Exposure Score Comparison</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Air Score" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Heat Score" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Exposure" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar chart */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-slate-100 mb-4 text-sm">Multi-factor Analysis</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                {routes.map(r => (
                  <Radar
                    key={r.id}
                    name={r.name.split('–')[0].trim()}
                    dataKey={r.name.split('–')[0].trim()}
                    stroke={r.color}
                    fill={r.color}
                    fillOpacity={0.1}
                  />
                ))}
                <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
