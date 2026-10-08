import React from 'react';
import type { RouteSegment } from '../../types';
import { ExposureBadge, ProgressBar, SectionHeader } from '../shared';
import { exposureColor, formatDistance, formatDuration } from '../../lib/scoring';
import { X, MapPin, Wind, Thermometer, TreePine, AlertTriangle, Factory } from 'lucide-react';

interface SegmentDetailProps {
  segment: RouteSegment;
  onClose: () => void;
}

export const SegmentDetail: React.FC<SegmentDetailProps> = ({ segment, onClose }) => {
  return (
    <div className="glass-card p-4 border-slate-700/60 fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={12} className="text-slate-500" />
            <span className="text-xs text-slate-500">{segment.streetName || 'Route Segment'}</span>
          </div>
          <div className="flex items-center gap-2">
            <ExposureBadge level={segment.exposureLevel} size="md" />
            {segment.isHotspot && (
              <span className="text-xs badge-high px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <AlertTriangle size={10} />
                Hotspot
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-dark-600 rounded-lg p-2.5">
          <div className="text-xs text-slate-500 mb-0.5">Distance</div>
          <div className="text-sm font-bold text-slate-200">{formatDistance(segment.distanceMeters)}</div>
        </div>
        <div className="bg-dark-600 rounded-lg p-2.5">
          <div className="text-xs text-slate-500 mb-0.5">Duration</div>
          <div className="text-sm font-bold text-slate-200">{formatDuration(segment.durationSeconds)}</div>
        </div>
      </div>

      {/* Environmental metrics */}
      <div className="space-y-3 mb-4">
        <SectionHeader title="Environmental Data" icon={<Wind size={12} />} />

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind size={12} className="text-slate-500" />
              <span className="text-xs text-slate-400">PM2.5</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: exposureColor(segment.exposureLevel) }}>
                {segment.pm25} µg/m³
              </span>
            </div>
          </div>
          <ProgressBar value={segment.pm25} max={150} />

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Wind size={12} className="text-slate-500" />
              <span className="text-xs text-slate-400">PM10</span>
            </div>
            <span className="text-sm font-semibold text-slate-300">{segment.pm10} µg/m³</span>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Thermometer size={12} className="text-orange-400" />
              <span className="text-xs text-slate-400">Temperature</span>
            </div>
            <span className="text-sm font-semibold text-slate-300">{segment.temperature}°C</span>
          </div>

          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2">
              <Thermometer size={12} className="text-red-400" />
              <span className="text-xs text-slate-400">Feels Like</span>
            </div>
            <span className="text-sm font-semibold text-slate-300">{segment.heatIndex}°C</span>
          </div>

          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2">
              <TreePine size={12} className="text-eco-400" />
              <span className="text-xs text-slate-400">Shade Coverage</span>
            </div>
            <span className="text-sm font-semibold text-eco-400">{segment.shadeScore}%</span>
          </div>
        </div>
      </div>

      {/* Exposure scores */}
      <div className="space-y-2 mb-4">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Exposure Scores</span>
        <ProgressBar label="Air Exposure" value={segment.airExposureScore} showValue />
        <ProgressBar label="Heat Exposure" value={segment.heatExposureScore} color="#f97316" showValue />
        <ProgressBar
          label="Overall Exposure"
          value={segment.overallExposureScore}
          color={exposureColor(segment.exposureLevel)}
          showValue
        />
      </div>

      {/* Hotspot reason */}
      {segment.isHotspot && segment.hotspotReason && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-red-400 mb-1">High Exposure Reason</p>
              <p className="text-xs text-slate-300">{segment.hotspotReason}</p>
              {segment.pollutionSource && (
                <div className="flex items-center gap-1 mt-1.5">
                  <Factory size={10} className="text-slate-500" />
                  <span className="text-xs text-slate-500">Source: {segment.pollutionSource}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
