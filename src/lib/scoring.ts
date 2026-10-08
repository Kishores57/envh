/**
 * Environmental Scoring Engine
 * Deterministic, explainable scoring — no LLM math.
 */

import type {
  Route,
  RouteSegment,
  RoutePriority,
  PriorityWeights,
  ExposureLevel,
} from '../types';
import { PRIORITY_WEIGHTS } from '../types';

// ─── Normalization helpers ────────────────────────────────────────────────────

/** Normalize PM2.5 to 0–100 exposure score (WHO guideline: 15 µg/m³ annual, 25 daily) */
export function normalizePm25(pm25: number): number {
  // 0 → 0, 25 → 30, 65 → 70, 120+ → 100
  if (pm25 <= 0) return 0;
  if (pm25 >= 150) return 100;
  return Math.round((pm25 / 150) * 100);
}

/** Normalize temperature to heat exposure score */
export function normalizeTemperature(temp: number): number {
  // Below 22°C → low; 22–28 → building; 28–40 → high; 40+ → max
  if (temp <= 22) return 0;
  if (temp >= 42) return 100;
  return Math.round(((temp - 22) / 20) * 100);
}

/** Shade/green bonus (0–100 shade → 0–10 point reduction) */
export function shadeBonus(shadeScore: number): number {
  return Math.round(shadeScore * 0.1);
}

// ─── Segment Scoring ──────────────────────────────────────────────────────────

export function scoreSegment(segment: Partial<RouteSegment> & {
  pm25: number; temperature: number; shadeScore: number; durationSeconds: number;
}): { air: number; heat: number; shade: number; overall: number; level: ExposureLevel } {
  const air = normalizePm25(segment.pm25);
  const heat = normalizeTemperature(segment.temperature);
  const bonus = shadeBonus(segment.shadeScore);
  const overall = Math.max(0, Math.round(air * 0.55 + heat * 0.35 - bonus));
  const level: ExposureLevel =
    overall < 30 ? 'low' :
    overall < 55 ? 'moderate' :
    overall < 75 ? 'elevated' : 'high';
  return { air, heat, shade: bonus, overall, level };
}

// ─── Route Score Calculation ──────────────────────────────────────────────────

export function calculateRouteScore(
  route: Route,
  priority: RoutePriority,
): number {
  const weights: PriorityWeights = PRIORITY_WEIGHTS[priority];

  // Normalize time: 0 min → 0, 60 min → 100
  const timeScore = Math.min(100, Math.round((route.totalDurationSeconds / 3600) * 100));

  const composite =
    weights.time  * timeScore +
    weights.air   * route.airScore +
    weights.heat  * route.heatScore +
    weights.shade * (100 - route.shadeScore); // less shade = higher penalty

  return Math.round(composite);
}

// ─── AQI Category ────────────────────────────────────────────────────────────

export function getAqiCategory(aqi: number): { label: string; color: string; level: ExposureLevel } {
  if (aqi <= 50)  return { label: 'Good',                          color: '#22c55e', level: 'low' };
  if (aqi <= 100) return { label: 'Moderate',                      color: '#eab308', level: 'moderate' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive Groups', color: '#f97316', level: 'elevated' };
  if (aqi <= 200) return { label: 'Unhealthy',                     color: '#ef4444', level: 'high' };
  if (aqi <= 300) return { label: 'Very Unhealthy',                color: '#a855f7', level: 'high' };
  return             { label: 'Hazardous',                         color: '#7f1d1d', level: 'high' };
}

// ─── Exposure Level Colors ────────────────────────────────────────────────────

export function exposureColor(level: ExposureLevel): string {
  switch (level) {
    case 'low':      return '#22c55e';
    case 'moderate': return '#eab308';
    case 'elevated': return '#f97316';
    case 'high':     return '#ef4444';
  }
}

export function exposureBgClass(level: ExposureLevel): string {
  switch (level) {
    case 'low':      return 'badge-low';
    case 'moderate': return 'badge-moderate';
    case 'elevated': return 'badge-elevated';
    case 'high':     return 'badge-high';
  }
}

export function exposureLabel(level: ExposureLevel): string {
  switch (level) {
    case 'low':      return 'Low';
    case 'moderate': return 'Moderate';
    case 'elevated': return 'Elevated';
    case 'high':     return 'High';
  }
}

// ─── Score to color for map polylines ────────────────────────────────────────

export function scoreToMapColor(score: number): string {
  if (score < 30) return '#22c55e';
  if (score < 55) return '#eab308';
  if (score < 75) return '#f97316';
  return '#ef4444';
}

// ─── Compute exposure reduction ───────────────────────────────────────────────

export function computeReduction(
  recommended: Route,
  comparison: Route,
): { percent: number; timeDiffMin: number } {
  const pct = Math.round(
    ((comparison.overallExposureScore - recommended.overallExposureScore) /
      comparison.overallExposureScore) * 100,
  );
  const timeDiff = Math.round(
    (recommended.totalDurationSeconds - comparison.totalDurationSeconds) / 60,
  );
  return { percent: Math.max(0, pct), timeDiffMin: timeDiff };
}

// ─── Generate explanation from computed values ────────────────────────────────

export function generateExplanation(
  recommended: Route,
  alternatives: Route[],
): string[] {
  const lines: string[] = [];
  const fastest = alternatives.find(r => r.label === 'fastest' && r.id !== recommended.id);
  if (fastest) {
    const expRed = Math.round(
      ((fastest.overallExposureScore - recommended.overallExposureScore) /
        fastest.overallExposureScore) * 100,
    );
    const timeDiff = Math.round(
      (recommended.totalDurationSeconds - fastest.totalDurationSeconds) / 60,
    );
    if (expRed > 0)   lines.push(`${expRed}% lower estimated environmental exposure vs fastest route`);
    if (timeDiff > 0) lines.push(`Only ${timeDiff} extra minute${timeDiff > 1 ? 's' : ''} compared to fastest route`);
    const pm25Diff = Math.round(fastest.avgPm25 - recommended.avgPm25);
    if (pm25Diff > 0) lines.push(`Avg PM2.5 reduced from ${fastest.avgPm25} to ${recommended.avgPm25} µg/m³`);
  }
  if (recommended.shadeScore > 40) lines.push(`Higher shade coverage (${recommended.shadeScore}%) reduces heat exposure`);
  if (recommended.hotspotCount === 0) lines.push('No high-exposure hotspot segments on this route');
  return lines;
}

// ─── Format time ─────────────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}min` : `${h}h`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
