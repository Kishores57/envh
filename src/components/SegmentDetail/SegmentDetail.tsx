import React from 'react';
import type { RouteSegment } from '../../types';
import { ExposureBadge, ProgressBar } from '../shared';
import { exposureColor, formatDistance, formatDuration } from '../../lib/scoring';
import { X, MapPin, Wind, Thermometer, TreePine, AlertTriangle, Factory } from 'lucide-react';

interface SegmentDetailProps {
  segment: RouteSegment;
  onClose: () => void;
}

const DataRow: React.FC<{ icon: React.ReactNode; label: string; value: string; valueColor?: string }> = ({ icon, label, value, valueColor }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{ color: '#3a5a50' }}>{icon}</span>
      <span style={{ fontSize: 11, color: '#81938D', fontWeight: 500 }}>{label}</span>
    </div>
    <span style={{ fontSize: 12, fontWeight: 700, color: valueColor || '#F4F7F5', fontFamily: 'Space Mono, monospace' }}>
      {value}
    </span>
  </div>
);

export const SegmentDetail: React.FC<SegmentDetailProps> = ({ segment, onClose }) => {
  return (
    <div style={{
      background: '#101C1A',
      border: '1.5px solid #29423B',
      borderRadius: 14,
      padding: '16px',
      boxShadow: '0 4px 0 rgba(0,0,0,0.35), 0 12px 40px rgba(0,0,0,0.6)',
      animation: 'slideInUp 0.35s ease forwards',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <MapPin size={11} color="#81938D" />
            <span style={{ fontSize: 11, color: '#81938D', fontWeight: 500 }}>{segment.streetName || 'Route Segment'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <ExposureBadge level={segment.exposureLevel} size="md" />
            {segment.isHotspot && (
              <span style={{
                fontSize: 9, fontWeight: 800, letterSpacing: '0.06em',
                background: 'rgba(255, 90, 95, 0.12)', color: '#FF5A5F',
                padding: '2px 7px', borderRadius: 5,
                border: '1px solid rgba(255, 90, 95, 0.25)',
                display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase',
              }}>
                <AlertTriangle size={9} />
                Hotspot
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 28, height: 28, borderRadius: 7,
            background: '#172622', border: '1px solid #29423B',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#81938D',
            boxShadow: '0 2px 0 rgba(0,0,0,0.25)',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#1E332E'; (e.currentTarget as HTMLElement).style.color = '#F4F7F5'; }}
          onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = '#172622'; (e.currentTarget as HTMLElement).style.color = '#81938D'; }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 14 }}>
        {[
          { label: 'Distance', value: formatDistance(segment.distanceMeters) },
          { label: 'Duration', value: formatDuration(segment.durationSeconds) },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: '#0d1714', border: '1px solid #1E332E',
            borderRadius: 9, padding: '8px 10px',
            boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontSize: 9, color: '#516860', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F4F7F5', fontFamily: 'Space Mono, monospace' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Environmental data */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#516860', marginBottom: 8 }}>
          Environmental Data
        </div>
        <div style={{ borderTop: '1px solid #1E332E' }}>
          <DataRow icon={<Wind size={12} />} label="PM2.5" value={`${segment.pm25} µg/m³`} valueColor="#FF8A3D" />
          <DataRow icon={<Wind size={12} />} label="PM10" value={`${segment.pm10} µg/m³`} />
          <DataRow icon={<Thermometer size={12} />} label="Temperature" value={`${segment.temperature}°C`} />
          <DataRow icon={<Thermometer size={12} />} label="Feels Like" value={`${segment.heatIndex}°C`} />
          <DataRow icon={<TreePine size={12} />} label="Shade Coverage" value={`${segment.shadeScore}%`} valueColor="#00C982" />
        </div>
      </div>

      {/* Exposure bars */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#516860', marginBottom: 8 }}>
          Exposure Scores
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <ProgressBar label="Air Exposure" value={segment.airExposureScore} showValue />
          <ProgressBar label="Heat Exposure" value={segment.heatExposureScore} color="#FF8A3D" showValue />
          <ProgressBar label="Overall" value={segment.overallExposureScore} color={exposureColor(segment.exposureLevel)} showValue />
        </div>
      </div>

      {/* Hotspot reason */}
      {segment.isHotspot && segment.hotspotReason && (
        <div style={{
          background: 'rgba(255, 90, 95, 0.06)',
          border: '1px solid rgba(255, 90, 95, 0.2)',
          borderLeft: '3px solid #FF5A5F',
          borderRadius: 9, padding: '10px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <AlertTriangle size={12} color="#FF5A5F" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#FF5A5F', marginBottom: 3, letterSpacing: '0.02em' }}>High Exposure Reason</p>
              <p style={{ fontSize: 11, color: '#B8CEC7', lineHeight: 1.5 }}>{segment.hotspotReason}</p>
              {segment.pollutionSource && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                  <Factory size={10} color="#516860" />
                  <span style={{ fontSize: 10, color: '#516860', fontWeight: 500 }}>Source: {segment.pollutionSource}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
