import React from 'react';
import type { RouteSegment } from '../../types';
import { ExposureBadge, ProgressBar } from '../shared';
import { exposureColor, formatDistance, formatDuration } from '../../lib/scoring';
import { X, MapPin, Wind, Thermometer, TreePine, AlertTriangle, Factory, Droplets } from 'lucide-react';

interface SegmentDetailProps {
  segment: RouteSegment;
  onClose: () => void;
}

const DataRow: React.FC<{ icon: React.ReactNode; label: string; value: string; valueColor?: string }> = ({ icon, label, value, valueColor }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
      <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
    </div>
    <span style={{ fontSize: 12, fontWeight: 700, color: valueColor || 'var(--text-primary)', fontFamily: 'Space Mono, monospace' }}>
      {value}
    </span>
  </div>
);

export const SegmentDetail: React.FC<SegmentDetailProps> = ({ segment, onClose }) => {
  return (
    <div style={{
      background: 'var(--bg-floating)',
      border: '1.5px solid var(--border-color)',
      borderRadius: 16,
      padding: '16px',
      boxShadow: 'var(--shadow-elevated)',
      backdropFilter: 'blur(16px)',
      animation: 'slideInUp 0.3s ease forwards',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <MapPin size={12} color="#38BDF8" />
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600 }}>{segment.streetName || 'Road Segment'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <ExposureBadge level={segment.exposureLevel} size="md" />
            {segment.isHotspot && (
              <span style={{
                fontSize: 9.5, fontWeight: 800, letterSpacing: '0.06em',
                background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444',
                padding: '2px 8px', borderRadius: 6,
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase',
              }}>
                <AlertTriangle size={10} />
                Hotspot
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close segment detail"
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--bg-subtle)', border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Distance', value: formatDistance(segment.distanceMeters) },
          { label: 'Duration', value: formatDuration(segment.durationSeconds) },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 10, padding: '8px 10px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Space Mono, monospace' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Environmental data */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
          Atmospheric & Sensor Data
        </div>
        <div>
          <DataRow icon={<Wind size={13} />} label="PM2.5 Concentration" value={`${segment.pm25} µg/m³`} valueColor="#F97316" />
          <DataRow icon={<Droplets size={13} />} label="PM10 Coarse Dust" value={`${segment.pm10} µg/m³`} />
          <DataRow icon={<Thermometer size={13} />} label="Air Temperature" value={`${segment.temperature}°C`} />
          <DataRow icon={<TreePine size={13} />} label="Tree Canopy & Shade" value={`${segment.shadeScore}%`} valueColor="#22C55E" />
        </div>
      </div>

      {/* Exposure bars */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
          Exposure Breakdown
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <ProgressBar label="Particulate Air Exposure" value={segment.airExposureScore} showValue />
          <ProgressBar label="Thermal Heat Load" value={segment.heatExposureScore} color="#F97316" showValue />
          <ProgressBar label="Composite Risk Score" value={segment.overallExposureScore} color={exposureColor(segment.exposureLevel)} showValue />
        </div>
      </div>

      {/* Hotspot reason */}
      {segment.isHotspot && segment.hotspotReason && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderLeft: '4px solid #EF4444',
          borderRadius: 10, padding: '10px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <AlertTriangle size={13} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#EF4444', marginBottom: 2 }}>High Emission Corridor</p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{segment.hotspotReason}</p>
              {segment.pollutionSource && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                  <Factory size={11} color="var(--text-muted)" />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Source: {segment.pollutionSource}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
