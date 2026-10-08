import React from 'react';
import type { ExposureLevel } from '../../types';
import { exposureBgClass, exposureLabel, exposureColor } from '../../lib/scoring';

/* ─── ExposureBadge ─────────────────────────────────────── */
interface ExposureBadgeProps {
  level: ExposureLevel;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const ExposureBadge: React.FC<ExposureBadgeProps> = ({ level, size = 'md', showDot = true }) => {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${exposureBgClass(level)} ${sizeClass}`}
      style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em' }}>
      {showDot && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: exposureColor(level), boxShadow: `0 0 5px ${exposureColor(level)}` }}
        />
      )}
      {exposureLabel(level)}
    </span>
  );
};

/* ─── ScoreRing ─────────────────────────────────────────── */
interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 80,
  strokeWidth = 7,
  label,
  sublabel,
}) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score < 30 ? '#00C982' : score < 55 ? '#F4C542' : score < 75 ? '#FF8A3D' : '#FF5A5F';
  const trackColor = score < 30 ? 'rgba(0,201,130,0.1)' : score < 55 ? 'rgba(244,197,66,0.1)' : score < 75 ? 'rgba(255,138,61,0.1)' : 'rgba(255,90,95,0.1)';

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        {/* Glow (wider, lower opacity) */}
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth + 3}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          opacity={0.15}
        />
        {/* Main arc */}
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="score-ring"
          style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ fontSize: size < 64 ? 14 : 20, fontWeight: 800, color, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
          {score}
        </span>
        {label && <span style={{ fontSize: 9, color: '#81938D', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 2, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>}
      </div>
      {sublabel && (
        <div className="absolute" style={{ bottom: -20, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: '#516860', whiteSpace: 'nowrap' }}>
          {sublabel}
        </div>
      )}
    </div>
  );
};

/* ─── MetricCard ────────────────────────────────────────── */
interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  sublabel?: string;
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label, value, unit, icon, trend, sublabel, color = '#00C982',
}) => (
  <div style={{
    background: '#172622',
    border: '1.5px solid #29423B',
    borderRadius: 12,
    padding: '14px 16px',
    boxShadow: '0 4px 0 rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.3)',
    cursor: 'default',
    transition: 'transform 0.2s, box-shadow 0.2s',
  }}
  className="card-hover"
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#516860', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
      {icon && <span style={{ color: '#3a5a50' }}>{icon}</span>}
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{ fontSize: 26, fontWeight: 800, color, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{value}</span>
      {unit && <span style={{ fontSize: 12, color: '#81938D', fontWeight: 500 }}>{unit}</span>}
    </div>
    {sublabel && <p style={{ fontSize: 11, color: '#81938D', marginTop: 5 }}>{sublabel}</p>}
    {trend && (
      <div style={{
        fontSize: 11, fontWeight: 600, marginTop: 5,
        color: trend === 'up' ? '#FF5A5F' : trend === 'down' ? '#00C982' : '#81938D',
      }}>
        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
      </div>
    )}
  </div>
);

/* ─── ProgressBar ───────────────────────────────────────── */
interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  label?: string;
  showValue?: boolean;
  animate?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value, max = 100, color, height = 7, label, showValue = false, animate = true,
}) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const barColor = color || (pct < 30 ? '#00C982' : pct < 55 ? '#F4C542' : pct < 75 ? '#FF8A3D' : '#FF5A5F');
  return (
    <div style={{ width: '100%' }}>
      {(label || showValue) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          {label && <span style={{ fontSize: 11, color: '#81938D', fontWeight: 500 }}>{label}</span>}
          {showValue && <span style={{ fontSize: 11, fontWeight: 700, color: barColor }}>{value}</span>}
        </div>
      )}
      <div style={{ width: '100%', borderRadius: 6, overflow: 'hidden', height, background: '#0d1714', border: '1px solid #1E332E', boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.4)' }}>
        <div
          style={{
            height: '100%', borderRadius: 6,
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
            transition: animate ? 'width 1.2s cubic-bezier(0.4,0,0.2,1)' : 'none',
            boxShadow: `0 0 8px ${barColor}60`,
          }}
        />
      </div>
    </div>
  );
};

/* ─── LoadingSpinner ────────────────────────────────────── */
interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 24, color = '#00C982', label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="10" stroke={`${color}25`} strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
    {label && <span style={{ fontSize: 12, color: '#81938D', fontWeight: 500 }}>{label}</span>}
  </div>
);

/* ─── PulseIndicator ────────────────────────────────────── */
interface PulseIndicatorProps {
  color?: string;
  label?: string;
}

export const PulseIndicator: React.FC<PulseIndicatorProps> = ({ color = '#00C982', label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
    <div style={{ position: 'relative', width: 8, height: 8 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: color, opacity: 0.4,
        animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
      }} />
    </div>
    {label && <span style={{ fontSize: 11, color: '#81938D', fontWeight: 500 }}>{label}</span>}
  </div>
);

/* ─── SectionHeader ─────────────────────────────────────── */
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, icon, action }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {icon && <span style={{ color: '#00C982' }}>{icon}</span>}
      <div>
        <h3 style={{ fontWeight: 700, color: '#F4F7F5', fontSize: 13, margin: 0 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 11, color: '#81938D', marginTop: 2 }}>{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);
