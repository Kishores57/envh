import React from 'react';
import type { RouteAnalysisResult } from '../../types';
import { ScoreRing, ExposureBadge, ProgressBar, SectionHeader } from '../shared';
import { formatDuration, formatDistance, computeReduction, exposureColor } from '../../lib/scoring';
import {
  Clock, Navigation, Leaf, Thermometer, CheckCircle2, AlertTriangle,
  TrendingDown, Wind, Info,
} from 'lucide-react';

interface RouteRecommendationProps {
  result: RouteAnalysisResult;
  selectedRouteId: string | null;
  onSelectRoute: (id: string) => void;
}

export const RouteRecommendation: React.FC<RouteRecommendationProps> = ({
  result,
  selectedRouteId,
  onSelectRoute,
}) => {
  const { routes, recommendedRouteId } = result;
  const recommended = routes.find(r => r.id === recommendedRouteId);
  const fastest = routes.find(r => r.label === 'fastest' && r.id !== recommendedRouteId);

  if (!recommended) return null;

  const reduction = fastest ? computeReduction(recommended, fastest) : null;

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">

      {/* Recommended Banner */}
      <div className="glass-card p-4 border-eco-500/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-eco-500/5 to-teal-500/5 pointer-events-none" />
        <div className="flex items-start gap-3 relative">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={14} className="text-eco-400" />
              <span className="text-xs font-bold text-eco-400 uppercase tracking-wider">Recommended</span>
            </div>
            <h3 className="font-semibold text-slate-100 text-sm mb-2">{recommended.name}</h3>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-slate-500" />
                <span className="text-sm font-semibold text-slate-200">{formatDuration(recommended.totalDurationSeconds)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Navigation size={12} className="text-slate-500" />
                <span className="text-sm text-slate-400">{formatDistance(recommended.totalDistanceMeters)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wind size={12} className="text-slate-500" />
                <span className="text-sm text-slate-400">PM2.5: {recommended.avgPm25} µg/m³</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Thermometer size={12} className="text-slate-500" />
                <span className="text-sm text-slate-400">{recommended.avgTemperature}°C avg</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <ExposureBadge level={recommended.exposureLevel} />
              {reduction && reduction.percent > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-eco-400 font-semibold">
                  <TrendingDown size={11} />
                  {reduction.percent}% less exposure
                </span>
              )}
            </div>
          </div>

          <ScoreRing score={recommended.overallExposureScore} size={72} />
        </div>

        {/* Reduction callout */}
        {reduction && reduction.percent > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <p className="text-xs text-slate-300">
              <span className="text-eco-400 font-semibold">{reduction.percent}% lower</span> estimated environmental
              exposure with only <span className="text-eco-400 font-semibold">{Math.abs(reduction.timeDiffMin)} extra minute{Math.abs(reduction.timeDiffMin) !== 1 ? 's' : ''}</span>
            </p>
          </div>
        )}
      </div>

      {/* Why this route? */}
      {recommended.recommendationReason.length > 0 && (
        <div className="glass-card-light p-4">
          <SectionHeader
            title="Why this route?"
            icon={<Info size={14} />}
          />
          <ul className="space-y-2">
            {recommended.recommendationReason.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <CheckCircle2 size={12} className="text-eco-400 mt-0.5 flex-shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Route Score Breakdown */}
      <div className="glass-card-light p-4">
        <SectionHeader title="Score Breakdown" icon={<Leaf size={14} />} />
        <div className="space-y-3">
          <ProgressBar label="Air Exposure" value={recommended.airScore} showValue />
          <ProgressBar label="Heat Exposure" value={recommended.heatScore} color="#f97316" showValue />
          <ProgressBar label="Shade Coverage" value={recommended.shadeScore} color="#06b6d4" showValue />
        </div>
      </div>

      {/* All Routes */}
      <div className="glass-card-light p-4">
        <SectionHeader title="All Routes" />
        <div className="space-y-2">
          {routes.map(route => {
            const isSelected = selectedRouteId === route.id;
            const isRec = route.id === recommendedRouteId;
            return (
              <button
                key={route.id}
                onClick={() => onSelectRoute(route.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 border ${
                  isSelected
                    ? 'border-opacity-50 bg-opacity-10'
                    : 'border-slate-700/40 hover:border-slate-600/60 hover:bg-slate-800/40'
                }`}
                style={isSelected ? {
                  borderColor: `${route.color}60`,
                  background: `${route.color}10`,
                } : {}}
              >
                {/* Color dot */}
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: route.color, boxShadow: `0 0 6px ${route.color}80` }} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold text-slate-200 truncate">{route.name}</span>
                    {isRec && <span className="text-[10px] bg-eco-500/20 text-eco-400 px-1.5 py-0.5 rounded-full font-bold">Best</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{formatDuration(route.totalDurationSeconds)}</span>
                    <span>·</span>
                    <ExposureBadge level={route.exposureLevel} size="sm" />
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold" style={{ color: exposureColor(route.exposureLevel) }}>
                    {route.overallExposureScore}
                  </div>
                  <div className="text-xs text-slate-500">score</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Only Route Warning */}
      {result.isOnlyPracticalRoute && result.onlyRouteAnalysis && (
        <div className="glass-card p-4 border-orange-500/30">
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle size={14} className="text-orange-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-orange-400 mb-1">Only Practical Route</p>
              <p className="text-xs text-slate-300">
                This is the only practical route. The highest estimated exposure occurs near the{' '}
                <span className="text-orange-300">traffic corridor</span>.
              </p>
            </div>
          </div>
          {result.onlyRouteAnalysis.bestDepartureTime && (
            <div className="bg-eco-500/10 border border-eco-500/20 rounded-lg p-2.5">
              <p className="text-xs text-eco-400 font-semibold mb-1">Better departure time available</p>
              <p className="text-xs text-slate-300">
                Leaving{' '}
                <span className="font-semibold text-eco-300">{result.onlyRouteAnalysis.bestDepartureTime.label}</span>
                {' '}could reduce estimated exposure by{' '}
                <span className="font-semibold text-eco-300">{result.onlyRouteAnalysis.exposureReductionPercent}%</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
