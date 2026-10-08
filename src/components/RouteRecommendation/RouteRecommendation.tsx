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

const routeColorMap: Record<string, string> = {
  route_a: '#FF8A3D',
  route_b: '#00C982',
  route_c: '#F4C542',
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
  const recColor = routeColorMap[recommended.id] || recommended.color;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', overflowY: 'auto', paddingBottom: 8 }}>

      {/* ─── RECOMMENDED CARD ─── */}
      <div style={{
        background: '#101C1A',
        border: `2px solid ${recColor}50`,
        borderRadius: 16,
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 4px 0 rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${recColor}15 inset`,
      }}
      className="slide-in-right"
      >
        {/* Accent top edge */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${recColor}, ${recColor}80)`,
        }} />
        {/* Subtle glow bg */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: `radial-gradient(ellipse at top left, ${recColor}08 0%, transparent 60%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, position: 'relative' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                background: recColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle2 size={11} color="#07110F" strokeWidth={3} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, color: recColor, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Recommended
              </span>
            </div>

            <h3 style={{ fontWeight: 700, color: '#F4F7F5', fontSize: 14, marginBottom: 10, lineHeight: 1.3 }}>
              {recommended.name}
            </h3>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={11} color="#81938D" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#F4F7F5' }}>{formatDuration(recommended.totalDurationSeconds)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Navigation size={11} color="#81938D" />
                <span style={{ fontSize: 12, color: '#B8CEC7' }}>{formatDistance(recommended.totalDistanceMeters)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Wind size={11} color="#81938D" />
                <span style={{ fontSize: 12, color: '#FF8A3D', fontWeight: 600 }}>{recommended.avgPm25} µg/m³</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Thermometer size={11} color="#81938D" />
                <span style={{ fontSize: 12, color: '#B8CEC7' }}>{recommended.avgTemperature}°C</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <ExposureBadge level={recommended.exposureLevel} />
              {reduction && reduction.percent > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#00C982', fontWeight: 700 }}>
                  <TrendingDown size={11} />
                  {reduction.percent}% less
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
            borderTop: '1px solid #1E332E',
          }}>
            <div style={{
              background: 'rgba(0, 201, 130, 0.06)',
              border: '1px solid rgba(0, 201, 130, 0.15)',
              borderRadius: 9, padding: '9px 12px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(0,201,130,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TrendingDown size={14} color="#00C982" />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#00C982' }}>
                  {reduction.percent}% lower estimated exposure
                </div>
                <div style={{ fontSize: 11, color: '#81938D', marginTop: 2 }}>
                  with only {Math.abs(reduction.timeDiffMin)} extra min{Math.abs(reduction.timeDiffMin) !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── WHY THIS ROUTE ─── */}
      {recommended.recommendationReason.length > 0 && (
        <div style={{
          background: '#101C1A', border: '1.5px solid #29423B',
          borderRadius: 12, padding: '14px',
          boxShadow: '0 4px 0 rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.3)',
        }}>
          <SectionHeader title="Why this route?" icon={<Info size={13} />} />
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {recommended.recommendationReason.map((reason, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#B8CEC7', lineHeight: 1.5 }}>
                <CheckCircle2 size={12} color="#00C982" style={{ flexShrink: 0, marginTop: 2 }} />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ─── SCORE BREAKDOWN ─── */}
      <div style={{
        background: '#101C1A', border: '1.5px solid #29423B',
        borderRadius: 12, padding: '14px',
        boxShadow: '0 4px 0 rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.3)',
      }}>
        <SectionHeader title="Score Breakdown" icon={<Leaf size={13} />} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ProgressBar label="Air Exposure" value={recommended.airScore} showValue />
          <ProgressBar label="Heat Exposure" value={recommended.heatScore} color="#FF8A3D" showValue />
          <ProgressBar label="Shade Coverage" value={recommended.shadeScore} color="#00BFA6" showValue />
        </div>
      </div>

      {/* ─── ALL ROUTES ─── */}
      <div style={{
        background: '#101C1A', border: '1.5px solid #29423B',
        borderRadius: 12, padding: '14px',
        boxShadow: '0 4px 0 rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.3)',
      }}>
        <SectionHeader title="All Routes" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {routes.map(route => {
            const isSelected = selectedRouteId === route.id;
            const isRec = route.id === recommendedRouteId;
            const rColor = routeColorMap[route.id] || route.color;
            return (
              <button
                key={route.id}
                onClick={() => onSelectRoute(route.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: isSelected ? `1.5px solid ${rColor}50` : '1.5px solid #1E332E',
                  background: isSelected ? `${rColor}0d` : '#172622',
                  boxShadow: isSelected
                    ? `0 2px 0 rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 ${rColor}10`
                    : '0 2px 0 rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  textAlign: 'left',
                }}
              >
                {/* Color dot with glow */}
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: rColor,
                  boxShadow: isSelected ? `0 0 8px ${rColor}` : `0 0 4px ${rColor}60`,
                }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#F4F7F5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {route.name}
                    </span>
                    {isRec && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: '0.06em',
                        background: 'rgba(0,201,130,0.12)', color: '#00C982',
                        padding: '1px 6px', borderRadius: 4,
                        border: '1px solid rgba(0,201,130,0.25)',
                      }}>BEST</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#81938D' }}>
                    <span>{formatDuration(route.totalDurationSeconds)}</span>
                    <span>·</span>
                    <ExposureBadge level={route.exposureLevel} size="sm" />
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: exposureColor(route.exposureLevel), fontFamily: 'Outfit, sans-serif' }}>
                    {route.overallExposureScore}
                  </div>
                  <div style={{ fontSize: 9, color: '#516860', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>score</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── ONLY ROUTE WARNING ─── */}
      {result.isOnlyPracticalRoute && result.onlyRouteAnalysis && (
        <div style={{
          background: '#101C1A',
          border: '1.5px solid rgba(255, 138, 61, 0.35)',
          borderLeft: '4px solid #FF8A3D',
          borderRadius: 12, padding: '14px',
          boxShadow: '0 4px 0 rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
            <AlertTriangle size={16} color="#FF8A3D" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#FF8A3D', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>
                Only Practical Route
              </p>
              <p style={{ fontSize: 12, color: '#B8CEC7', lineHeight: 1.5 }}>
                Highest exposure near the <span style={{ color: '#FF8A3D', fontWeight: 600 }}>traffic corridor</span>.
              </p>
            </div>
          </div>
          {result.onlyRouteAnalysis.bestDepartureTime && (
            <div style={{
              background: 'rgba(0,201,130,0.06)',
              border: '1px solid rgba(0,201,130,0.15)',
              borderRadius: 9, padding: '10px 12px',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#00C982', marginBottom: 4 }}>Better departure available</p>
              <p style={{ fontSize: 12, color: '#B8CEC7', lineHeight: 1.5 }}>
                Leave <span style={{ fontWeight: 700, color: '#16D99A' }}>{result.onlyRouteAnalysis.bestDepartureTime.label}</span> to reduce exposure by{' '}
                <span style={{ fontWeight: 700, color: '#16D99A' }}>{result.onlyRouteAnalysis.exposureReductionPercent}%</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
