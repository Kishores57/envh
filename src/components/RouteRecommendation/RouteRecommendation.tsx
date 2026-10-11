import React from 'react';
import type { RouteAnalysisResult } from '../../types';
import { ScoreRing, ExposureBadge, ProgressBar, SectionHeader } from '../shared';
import { formatDuration, formatDistance, computeReduction, exposureColor } from '../../lib/scoring';
import {
  Clock, Navigation, Leaf, Thermometer, CheckCircle2,
  TrendingDown, Wind, CloudSun
} from 'lucide-react';

interface RouteRecommendationProps {
  result: RouteAnalysisResult;
  selectedRouteId: string | null;
  onSelectRoute: (id: string) => void;
}

const routeColorMap: Record<string, string> = {
  'route-a': '#EF4444',
  'route-b': '#22C55E',
  'route-c': '#38BDF8',
};

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
  const recColor = routeColorMap[recommended.id] || recommended.color || '#22C55E';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', overflowY: 'auto', paddingBottom: 8 }}>

      {/* ─── RECOMMENDED CARD ─── */}
      <div style={{
        background: 'var(--bg-card)',
        border: `2px solid ${recColor}45`,
        borderRadius: 16,
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
      }}>
        {/* Accent top edge */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${recColor}, #38BDF8)`,
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, position: 'relative' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: recColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 8px ${recColor}60`,
              }}>
                <CheckCircle2 size={11} color="#FFFFFF" strokeWidth={3} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, color: recColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Eco Route Recommended
              </span>
            </div>

            <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 14.5, marginBottom: 10, lineHeight: 1.3 }}>
              {recommended.name}
            </h3>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={12} color="var(--text-muted)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{formatDuration(recommended.totalDurationSeconds)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Navigation size={12} color="var(--text-muted)" />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{formatDistance(recommended.totalDistanceMeters)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Wind size={12} color="#F97316" />
                <span style={{ fontSize: 12, color: '#F97316', fontWeight: 700 }}>{recommended.avgPm25} µg/m³</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Thermometer size={12} color="#38BDF8" />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{recommended.avgTemperature}°C</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <ExposureBadge level={recommended.exposureLevel} />
              {reduction && reduction.percent > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#22C55E', fontWeight: 800 }}>
                  <TrendingDown size={12} />
                  {reduction.percent}% cleaner air
                </span>
              )}
            </div>
          </div>

          {/* Score ring */}
          <div style={{ flexShrink: 0 }}>
            <ScoreRing score={recommended.overallExposureScore} size={72} label="EXPOSURE" />
          </div>
        </div>

        {/* Reduction callout */}
        {reduction && reduction.percent > 0 && (
          <div style={{
            marginTop: 12, paddingTop: 12,
            borderTop: '1px solid var(--border-color)',
          }}>
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: 10, padding: '9px 12px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(34, 197, 94, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TrendingDown size={14} color="#22C55E" />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#22C55E' }}>
                  {reduction.percent}% lower estimated exposure
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  with only {Math.abs(reduction.timeDiffMin)} extra min{Math.abs(reduction.timeDiffMin) !== 1 ? 's' : ''} travel time
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── WHY THIS ROUTE ─── */}
      {recommended.recommendationReason.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 14, padding: '14px',
          boxShadow: 'var(--shadow-card)',
        }}>
          <SectionHeader title="Why this route?" icon={<CloudSun size={14} />} />
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {recommended.recommendationReason.map((reason, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <CheckCircle2 size={13} color="#22C55E" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ─── SCORE BREAKDOWN ─── */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: 14, padding: '14px',
        boxShadow: 'var(--shadow-card)',
      }}>
        <SectionHeader title="Score Breakdown" icon={<Leaf size={14} />} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ProgressBar label="Air Pollution Risk" value={recommended.airScore} showValue />
          <ProgressBar label="Thermal Heat Index" value={recommended.heatScore} color="#F97316" showValue />
          <ProgressBar label="Tree Canopy & Shade" value={recommended.shadeScore} color="#22C55E" showValue />
        </div>
      </div>

      {/* ─── ALL ROUTES ALTERNATIVES ─── */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: 14, padding: '14px',
        boxShadow: 'var(--shadow-card)',
      }}>
        <SectionHeader title="Alternative Paths" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {routes.map(route => {
            const isSelected = selectedRouteId === route.id;
            const isRec = route.id === recommendedRouteId;
            const rColor = routeColorMap[route.id] || route.color || '#38BDF8';
            return (
              <button
                key={route.id}
                onClick={() => onSelectRoute(route.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: isSelected ? `1.5px solid ${rColor}` : '1px solid var(--border-color)',
                  background: isSelected ? 'var(--bg-subtle)' : 'transparent',
                  boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
              >
                {/* Color dot */}
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: rColor,
                  boxShadow: isSelected ? `0 0 8px ${rColor}` : 'none',
                }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {route.name}
                    </span>
                    {isRec && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: '0.06em',
                        background: 'rgba(34,197,94,0.15)', color: '#22C55E',
                        padding: '1px 6px', borderRadius: 4,
                      }}>ECO</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>{formatDuration(route.totalDurationSeconds)}</span>
                    <span>·</span>
                    <ExposureBadge level={route.exposureLevel} size="sm" />
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: exposureColor(route.exposureLevel), fontFamily: 'Outfit, sans-serif' }}>
                    {route.overallExposureScore}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>score</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
