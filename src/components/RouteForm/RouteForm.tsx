import React from 'react';
import type { RouteRequest, TravelMode, UserProfile, RoutePriority } from '../../types';
import {
  MapPin, Navigation, Clock, User, Zap, Footprints, Bike, Car,
  GraduationCap, HardHat, BookOpen, Target, School, Wind,
} from 'lucide-react';
import { LoadingSpinner } from '../shared';

interface RouteFormProps {
  request: RouteRequest;
  onChange: (partial: Partial<RouteRequest>) => void;
  onSubmit: () => void;
  isAnalyzing: boolean;
}

const TRAVEL_MODES: { value: TravelMode; label: string; icon: React.ReactNode }[] = [
  { value: 'walking', label: 'Walk',  icon: <Footprints size={14} /> },
  { value: 'cycling', label: 'Bike',  icon: <Bike size={14} /> },
  { value: 'driving', label: 'Drive', icon: <Car size={14} /> },
];

const PROFILES: { value: UserProfile; label: string; icon: React.ReactNode }[] = [
  { value: 'student',        label: 'Student',  icon: <GraduationCap size={13} /> },
  { value: 'outdoor_worker', label: 'Worker',   icon: <HardHat size={13} /> },
  { value: 'cyclist',        label: 'Cyclist',  icon: <Bike size={13} /> },
  { value: 'general',        label: 'General',  icon: <User size={13} /> },
];

const PRIORITIES: { value: RoutePriority; label: string; icon: React.ReactNode; desc: string; color: string; glow: string }[] = [
  { value: 'fastest',  label: 'Fastest',  icon: <Zap size={13} />,       desc: 'Time first',   color: '#3b82f6', glow: '59,130,246' },
  { value: 'cleanest', label: 'Cleanest', icon: <Wind size={13} />,      desc: 'Air first',    color: '#00C982', glow: '0,201,130' },
  { value: 'coolest',  label: 'Coolest',  icon: <Target size={13} />,    desc: 'Heat first',   color: '#00BFA6', glow: '0,191,166' },
  { value: 'balanced', label: 'Balanced', icon: <BookOpen size={13} />,  desc: 'All balanced', color: '#F4C542', glow: '244,197,66' },
];

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#516860', marginBottom: 8 }}>
    {children}
  </div>
);

export const RouteForm: React.FC<RouteFormProps> = ({ request, onChange, onSubmit, isAnalyzing }) => {
  const canAnalyze = !isAnalyzing && !!request.origin && !!request.destination;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '2px 0', height: '100%', overflowY: 'auto' }}>

      {/* FROM */}
      <div>
        <SectionLabel>From</SectionLabel>
        <div style={{ position: 'relative' }}>
          <MapPin size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#00C982' }} />
          <input
            type="text"
            placeholder="Starting location..."
            value={request.origin}
            onChange={e => onChange({ origin: e.target.value })}
            className="eco-input"
          />
        </div>
      </div>

      {/* TO */}
      <div>
        <SectionLabel>To</SectionLabel>
        <div style={{ position: 'relative' }}>
          <Navigation size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#F4C542' }} />
          <input
            type="text"
            placeholder="Destination..."
            value={request.destination}
            onChange={e => onChange({ destination: e.target.value })}
            className="eco-input"
          />
        </div>
      </div>

      {/* WHEN */}
      <div>
        <SectionLabel>Departure Time</SectionLabel>
        <div style={{ position: 'relative' }}>
          <Clock size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#81938D' }} />
          <input
            type="datetime-local"
            value={request.departureTime.slice(0, 16)}
            onChange={e => onChange({ departureTime: new Date(e.target.value).toISOString() })}
            className="eco-input"
          />
        </div>
      </div>

      <hr className="eco-divider" />

      {/* TRAVEL MODE */}
      <div>
        <SectionLabel>Travel Mode</SectionLabel>
        <div className="segment-control">
          {TRAVEL_MODES.map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => onChange({ travelMode: value })}
              className={`segment-btn${request.travelMode === value ? ' active' : ''}`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* PROFILE */}
      <div>
        <SectionLabel>Profile</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {PROFILES.map(({ value, label, icon }) => {
            const active = request.profile === value;
            return (
              <button
                key={value}
                onClick={() => onChange({ profile: value })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 10px',
                  borderRadius: 9,
                  fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  ...(active ? {
                    background: 'rgba(0, 201, 130, 0.1)',
                    color: '#00C982',
                    border: '1.5px solid rgba(0, 201, 130, 0.3)',
                    boxShadow: '0 2px 0 rgba(0,0,0,0.2), inset 0 1px 0 rgba(0, 201, 130, 0.08)',
                  } : {
                    background: '#0d1714',
                    color: '#81938D',
                    border: '1.5px solid #1E332E',
                    boxShadow: '0 2px 0 rgba(0,0,0,0.2)',
                  }),
                }}
              >
                {icon}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* PRIORITY / OPTIMIZE */}
      <div>
        <SectionLabel>Optimize For</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {PRIORITIES.map(({ value, label, icon, desc, color, glow }) => {
            const active = request.priority === value;
            return (
              <button
                key={value}
                onClick={() => onChange({ priority: value })}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '9px 10px',
                  borderRadius: 9,
                  fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  ...(active ? {
                    background: `rgba(${glow}, 0.1)`,
                    color: color,
                    border: `1.5px solid rgba(${glow}, 0.3)`,
                    boxShadow: `0 2px 0 rgba(0,0,0,0.2), 0 4px 12px rgba(${glow}, 0.08)`,
                  } : {
                    background: '#0d1714',
                    color: '#81938D',
                    border: '1.5px solid #1E332E',
                    boxShadow: '0 2px 0 rgba(0,0,0,0.2)',
                  }),
                }}
              >
                <span style={active ? { color } : {}}>{icon}</span>
                <div>
                  <div>{label}</div>
                  <div style={{ fontSize: 10, fontWeight: 400, color: active ? `rgba(${glow}, 0.7)` : '#516860', marginTop: 1 }}>{desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SCHOOL MODE */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        background: '#0d1714',
        border: '1.5px solid #1E332E',
        borderRadius: 10,
        boxShadow: '0 2px 0 rgba(0,0,0,0.2)',
      }}>
        <School size={15} style={{ color: '#F4C542', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#B8CEC7' }}>School Mode</div>
          <div style={{ fontSize: 10, color: '#516860', marginTop: 1 }}>Enhanced analysis for school routes</div>
        </div>
        <button
          onClick={() => onChange({ isSchoolMode: !request.isSchoolMode })}
          style={{
            position: 'relative', width: 36, height: 20, borderRadius: 10,
            background: request.isSchoolMode ? '#00C982' : '#1E332E',
            border: 'none', cursor: 'pointer',
            transition: 'background 0.2s',
            boxShadow: request.isSchoolMode ? '0 0 12px rgba(0,201,130,0.3)' : 'none',
          }}
        >
          <span style={{
            position: 'absolute', top: 2,
            left: request.isSchoolMode ? 18 : 2,
            width: 16, height: 16, borderRadius: '50%',
            background: '#F4F7F5',
            transition: 'left 0.2s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }} />
        </button>
      </div>

      {/* ANALYZE BUTTON */}
      <button
        onClick={onSubmit}
        disabled={!canAnalyze}
        className="btn-primary"
        style={{ width: '100%', padding: '13px 20px', fontSize: 13, marginTop: 4 }}
      >
        {isAnalyzing ? (
          <>
            <LoadingSpinner size={15} color="#07110F" />
            <span>Analyzing route...</span>
          </>
        ) : (
          <>
            <Wind size={15} />
            <span>Analyze Route</span>
          </>
        )}
      </button>
    </div>
  );
};
