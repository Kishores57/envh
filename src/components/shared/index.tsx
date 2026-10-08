import React from 'react';
import type { ExposureLevel } from '../../types';
import { exposureBgClass, exposureLabel, exposureColor } from '../../lib/scoring';

interface ExposureBadgeProps {
  level: ExposureLevel;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const ExposureBadge: React.FC<ExposureBadgeProps> = ({ level, size = 'md', showDot = true }) => {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${exposureBgClass(level)} ${sizeClass}`}>
      {showDot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: exposureColor(level) }}
        />
      )}
      {exposureLabel(level)}
    </span>
  );
};

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
  strokeWidth = 6,
  label,
  sublabel,
}) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score < 30 ? '#22c55e' : score < 55 ? '#eab308' : score < 75 ? '#f97316' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="score-ring"
          style={{ transition: 'stroke-dashoffset 1.2s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold" style={{ color }}>{score}</span>
        {label && <span className="text-xs text-slate-400 leading-tight text-center">{label}</span>}
      </div>
      {sublabel && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-slate-500 whitespace-nowrap">
          {sublabel}
        </div>
      )}
    </div>
  );
};

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
  label, value, unit, icon, trend, sublabel, color = '#22c55e',
}) => {
  return (
    <div className="glass-card-light p-4 card-hover">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold" style={{ color }}>{value}</span>
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
      </div>
      {sublabel && <p className="text-xs text-slate-500 mt-1">{sublabel}</p>}
      {trend && (
        <div className={`flex items-center gap-1 mt-1 text-xs ${trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-green-400' : 'text-slate-400'}`}>
          <span>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>
        </div>
      )}
    </div>
  );
};

interface ProgressBarProps {
  value: number;   // 0–100
  max?: number;
  color?: string;
  height?: number;
  label?: string;
  showValue?: boolean;
  animate?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value, max = 100, color, height = 6, label, showValue = false, animate = true,
}) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const barColor = color || (pct < 30 ? '#22c55e' : pct < 55 ? '#eab308' : pct < 75 ? '#f97316' : '#ef4444');
  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-slate-400">{label}</span>}
          {showValue && <span className="text-xs font-semibold text-slate-300">{value}</span>}
        </div>
      )}
      <div className="w-full rounded-full overflow-hidden" style={{ height, background: '#1e293b' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: barColor,
            transition: animate ? 'width 1s ease' : 'none',
            boxShadow: `0 0 8px ${barColor}66`,
          }}
        />
      </div>
    </div>
  );
};

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 24, color = '#22c55e', label }) => (
  <div className="flex flex-col items-center justify-center gap-3">
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="10" stroke={`${color}33`} strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
    {label && <span className="text-sm text-slate-400">{label}</span>}
  </div>
);

interface PulseIndicatorProps {
  color?: string;
  label?: string;
}

export const PulseIndicator: React.FC<PulseIndicatorProps> = ({ color = '#22c55e', label }) => (
  <div className="flex items-center gap-2">
    <div className="relative w-2 h-2">
      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      <div className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ background: color }} />
    </div>
    {label && <span className="text-xs text-slate-400">{label}</span>}
  </div>
);

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, icon, action }) => (
  <div className="flex items-start justify-between mb-4">
    <div className="flex items-center gap-2">
      {icon && <span className="text-eco-400">{icon}</span>}
      <div>
        <h3 className="font-semibold text-slate-100">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);
