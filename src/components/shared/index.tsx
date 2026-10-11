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
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-sm px-3.5 py-1.5' : 'text-xs px-2.5 py-1';
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${exposureBgClass(level)} ${sizeClass}`}
      style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em', transition: 'all 0.15s ease' }}
    >
      {showDot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
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
  const color = score < 30 ? '#22C55E' : score < 55 ? '#FACC15' : score < 75 ? '#F97316' : '#EF4444';

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--bg-inset)"
          strokeWidth={strokeWidth}
        />
        {/* Glow */}
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth + 2}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          opacity={0.16}
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
        {label && (
          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 3, textAlign: 'center', lineHeight: 1 }}>
            {label}
          </span>
        )}
      </div>
      {sublabel && (
        <div className="absolute" style={{ bottom: -20, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
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
  label, value, unit, icon, trend, sublabel, color = '#38BDF8',
}) => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1.5px solid var(--border-color)',
    borderRadius: 14,
    padding: '14px 16px',
    boxShadow: 'var(--shadow-card)',
    cursor: 'default',
    transition: 'all 0.2s ease',
  }}
  className="weather-card"
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
      {icon && <span style={{ color: 'var(--text-muted)' }}>{icon}</span>}
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
      <span style={{ fontSize: 26, fontWeight: 800, color, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{value}</span>
      {unit && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{unit}</span>}
    </div>
    {sublabel && <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 5, fontWeight: 500 }}>{sublabel}</p>}
    {trend && (
      <div style={{
        fontSize: 11, fontWeight: 700, marginTop: 5,
        color: trend === 'up' ? '#EF4444' : trend === 'down' ? '#22C55E' : 'var(--text-muted)',
      }}>
        {trend === 'up' ? '↑ Rising' : trend === 'down' ? '↓ Improving' : '→ Stable'}
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
  const barColor = color || (pct < 30 ? '#22C55E' : pct < 55 ? '#FACC15' : pct < 75 ? '#F97316' : '#EF4444');
  return (
    <div style={{ width: '100%' }}>
      {(label || showValue) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          {label && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>}
          {showValue && <span style={{ fontSize: 11, fontWeight: 700, color: barColor }}>{value}</span>}
        </div>
      )}
      <div style={{ width: '100%', borderRadius: 6, overflow: 'hidden', height, background: 'var(--bg-inset)', border: '1px solid var(--border-color)' }}>
        <div
          style={{
            height: '100%', borderRadius: 6,
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${barColor}dd, ${barColor})`,
            transition: animate ? 'width 1.2s cubic-bezier(0.4,0,0.2,1)' : 'none',
            boxShadow: `0 0 8px ${barColor}50`,
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

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 24, color = '#38BDF8', label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="10" stroke={`${color}30`} strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
    {label && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>}
  </div>
);

/* ─── PulseIndicator ────────────────────────────────────── */
interface PulseIndicatorProps {
  color?: string;
  label?: string;
}

export const PulseIndicator: React.FC<PulseIndicatorProps> = ({ color = '#22C55E', label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
    <div style={{ position: 'relative', width: 8, height: 8 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: color, opacity: 0.45,
        animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
      }} />
    </div>
    {label && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>}
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
      {icon && <span style={{ color: 'var(--sky-blue)' }}>{icon}</span>}
      <div>
        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13, margin: 0 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);
