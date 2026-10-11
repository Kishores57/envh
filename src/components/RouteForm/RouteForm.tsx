import React, { useState, useRef } from 'react';
import type { RouteRequest, TravelMode, UserProfile, RoutePriority, Coordinates } from '../../types';
import {
  MapPin, Navigation, Clock, User, Zap, Footprints, Bike, Car,
  GraduationCap, HardHat, BookOpen, Target, Wind,
  Crosshair, X, Loader2, Sparkles, SunMedium
} from 'lucide-react';
import { LoadingSpinner } from '../shared';
import { searchPlaces, reverseGeocode } from '../../lib/openSourceApi';
import { DEMO_ORIGIN, DEMO_DESTINATION, DEMO_ORIGIN_COORDS, DEMO_DEST_COORDS } from '../../data/demoData';

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

const PRIORITIES: { value: RoutePriority; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
  { value: 'cleanest', label: 'Cleanest', icon: <Wind size={13} />,      desc: 'Air first',    color: '#22C55E' },
  { value: 'fastest',  label: 'Fastest',  icon: <Zap size={13} />,       desc: 'Time first',   color: '#2563EB' },
  { value: 'coolest',  label: 'Coolest',  icon: <Target size={13} />,    desc: 'Heat first',   color: '#38BDF8' },
  { value: 'balanced', label: 'Balanced', icon: <BookOpen size={13} />,  desc: 'All balanced', color: '#FACC15' },
];

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 7 }}>
    {children}
  </div>
);

export const RouteForm: React.FC<RouteFormProps> = ({ request, onChange, onSubmit, isAnalyzing }) => {
  const [originSuggestions, setOriginSuggestions] = useState<Array<{ name: string; display_name: string; lat: number; lng: number }>>([]);
  const [destSuggestions, setDestSuggestions] = useState<Array<{ name: string; display_name: string; lat: number; lng: number }>>([]);
  const [loadingOriginSearch, setLoadingOriginSearch] = useState(false);
  const [loadingDestSearch, setLoadingDestSearch] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const originDebounceRef = useRef<any>(null);
  const destDebounceRef = useRef<any>(null);

  // Search origin places via Nominatim
  const handleOriginChange = (val: string) => {
    onChange({ origin: val });
    if (originDebounceRef.current) clearTimeout(originDebounceRef.current);
    if (val.trim().length < 3) {
      setOriginSuggestions([]);
      return;
    }
    setLoadingOriginSearch(true);
    originDebounceRef.current = setTimeout(async () => {
      const places = await searchPlaces(val);
      setOriginSuggestions(places);
      setLoadingOriginSearch(false);
    }, 320);
  };

  // Search destination places via Nominatim
  const handleDestChange = (val: string) => {
    onChange({ destination: val });
    if (destDebounceRef.current) clearTimeout(destDebounceRef.current);
    if (val.trim().length < 3) {
      setDestSuggestions([]);
      return;
    }
    setLoadingDestSearch(true);
    destDebounceRef.current = setTimeout(async () => {
      const places = await searchPlaces(val);
      setDestSuggestions(places);
      setLoadingDestSearch(false);
    }, 320);
  };

  // Use current GPS location for origin
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const coords: Coordinates = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const address = await reverseGeocode(coords.lat, coords.lng);
        onChange({ origin: address, originCoords: coords });
        setIsLocating(false);
        setOriginSuggestions([]);
      },
      err => {
        console.warn('Geolocation failed:', err);
        setIsLocating(false);
        alert('Could not retrieve current location.');
      },
      { timeout: 8000 }
    );
  };

  // Quick preset loader
  const handleLoadPreset = () => {
    onChange({
      origin: DEMO_ORIGIN,
      originCoords: DEMO_ORIGIN_COORDS,
      destination: DEMO_DESTINATION,
      destinationCoords: DEMO_DEST_COORDS,
    });
    setOriginSuggestions([]);
    setDestSuggestions([]);
  };

  const canAnalyze = !isAnalyzing && !!request.origin && !!request.destination;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '2px 0', height: '100%', overflowY: 'auto' }}>

      {/* QUICK PRESET BUTTON */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleLoadPreset}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 11px', borderRadius: 8,
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            color: 'var(--ocean-blue)', fontSize: 10.5, fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.15s ease',
            boxShadow: 'var(--shadow-sm)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--sky-blue)';
            (e.currentTarget as HTMLElement).style.color = 'var(--sky-blue)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)';
            (e.currentTarget as HTMLElement).style.color = 'var(--ocean-blue)';
          }}
        >
          <Sparkles size={12} color="#38BDF8" />
          <span>Demo Route (Bengaluru)</span>
        </button>
      </div>

      {/* FROM (ORIGIN) */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <SectionLabel>From (Origin)</SectionLabel>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'transparent', border: 'none',
              color: 'var(--sky-blue)', fontSize: 10.5, fontWeight: 700,
              cursor: 'pointer', padding: 0,
            }}
          >
            {isLocating ? <Loader2 size={11} className="spin-slow" /> : <Crosshair size={11} />}
            <span>{isLocating ? 'Locating...' : 'Use GPS'}</span>
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <MapPin size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#22C55E' }} />
          <input
            type="text"
            placeholder="Search starting location or click map..."
            value={request.origin}
            onChange={e => handleOriginChange(e.target.value)}
            className="eco-input"
            style={{ paddingRight: (request.origin || loadingOriginSearch) ? 32 : 12 }}
          />
          {loadingOriginSearch && (
            <Loader2 size={12} className="spin-slow" style={{ position: 'absolute', right: request.origin ? 28 : 10, top: '50%', transform: 'translateY(-50%)', color: '#38BDF8' }} />
          )}
          {request.origin && (
            <button
              type="button"
              onClick={() => { onChange({ origin: '', originCoords: undefined }); setOriginSuggestions([]); }}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Origin Autocomplete Suggestions */}
        {originSuggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1100,
            background: 'var(--bg-panel)', border: '1.5px solid var(--border-color)', borderRadius: 10,
            boxShadow: 'var(--shadow-elevated)', marginTop: 4, overflow: 'hidden',
          }}>
            {originSuggestions.map((place, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onChange({ origin: place.name, originCoords: { lat: place.lat, lng: place.lng } });
                  setOriginSuggestions([]);
                }}
                style={{
                  padding: '9px 12px', borderBottom: idx < originSuggestions.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  cursor: 'pointer', fontSize: 11.5, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <MapPin size={12} color="#22C55E" style={{ flexShrink: 0 }} />
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <div style={{ fontWeight: 600 }}>{place.name}</div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>{place.display_name}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TO (DESTINATION) */}
      <div style={{ position: 'relative' }}>
        <SectionLabel>To (Destination)</SectionLabel>
        <div style={{ position: 'relative' }}>
          <Navigation size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#FACC15' }} />
          <input
            type="text"
            placeholder="Search destination or click map..."
            value={request.destination}
            onChange={e => handleDestChange(e.target.value)}
            className="eco-input"
            style={{ paddingRight: (request.destination || loadingDestSearch) ? 32 : 12 }}
          />
          {loadingDestSearch && (
            <Loader2 size={12} className="spin-slow" style={{ position: 'absolute', right: request.destination ? 28 : 10, top: '50%', transform: 'translateY(-50%)', color: '#FACC15' }} />
          )}
          {request.destination && (
            <button
              type="button"
              onClick={() => { onChange({ destination: '', destinationCoords: undefined }); setDestSuggestions([]); }}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Destination Autocomplete Suggestions */}
        {destSuggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1100,
            background: 'var(--bg-panel)', border: '1.5px solid var(--border-color)', borderRadius: 10,
            boxShadow: 'var(--shadow-elevated)', marginTop: 4, overflow: 'hidden',
          }}>
            {destSuggestions.map((place, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onChange({ destination: place.name, destinationCoords: { lat: place.lat, lng: place.lng } });
                  setDestSuggestions([]);
                }}
                style={{
                  padding: '9px 12px', borderBottom: idx < destSuggestions.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  cursor: 'pointer', fontSize: 11.5, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Navigation size={12} color="#FACC15" style={{ flexShrink: 0 }} />
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <div style={{ fontWeight: 600 }}>{place.name}</div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>{place.display_name}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WHEN */}
      <div>
        <SectionLabel>Departure Time</SectionLabel>
        <div style={{ position: 'relative' }}>
          <Clock size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="datetime-local"
            value={request.departureTime ? request.departureTime.slice(0, 16) : ''}
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
              type="button"
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
        <SectionLabel>Commuter Profile</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {PROFILES.map(({ value, label, icon }) => {
            const active = request.profile === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ profile: value })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 10px',
                  borderRadius: 9,
                  fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: active ? 'var(--bg-card)' : 'var(--bg-inset)',
                  color: active ? '#2563EB' : 'var(--text-muted)',
                  border: `1.5px solid ${active ? '#38BDF8' : 'var(--border-color)'}`,
                  boxShadow: active ? '0 2px 8px rgba(56, 189, 248, 0.15)' : 'none',
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
        <SectionLabel>Optimize Route</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {PRIORITIES.map(({ value, label, icon, desc, color }) => {
            const active = request.priority === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ priority: value })}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '9px 10px',
                  borderRadius: 9,
                  fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  background: active ? 'var(--bg-card)' : 'var(--bg-inset)',
                  color: active ? color : 'var(--text-muted)',
                  border: `1.5px solid ${active ? color : 'var(--border-color)'}`,
                  boxShadow: active ? `0 2px 10px ${color}25` : 'none',
                }}
              >
                <span style={active ? { color } : {}}>{icon}</span>
                <div>
                  <div>{label}</div>
                  <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)', marginTop: 1 }}>{desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SCHOOL & RESIDENTIAL SAFE MODE */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'rgba(250, 204, 21, 0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <SunMedium size={16} color="#FACC15" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>School & Safe Zone Mode</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>Prioritizes low particulate green streets</div>
        </div>
        <button
          type="button"
          onClick={() => onChange({ isSchoolMode: !request.isSchoolMode })}
          style={{
            position: 'relative', width: 38, height: 22, borderRadius: 12,
            background: request.isSchoolMode ? '#22C55E' : 'var(--bg-inset)',
            border: '1px solid var(--border-color)', cursor: 'pointer',
            transition: 'background 0.2s',
            boxShadow: request.isSchoolMode ? '0 0 10px rgba(34, 197, 94, 0.4)' : 'none',
          }}
        >
          <span style={{
            position: 'absolute', top: 2,
            left: request.isSchoolMode ? 18 : 2,
            width: 16, height: 16, borderRadius: '50%',
            background: '#FFFFFF',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          }} />
        </button>
      </div>

      {/* ANALYZE BUTTON */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canAnalyze}
        className="btn-weather-primary"
        style={{ width: '100%', padding: '13px 20px', fontSize: 13.5, marginTop: 4 }}
      >
        {isAnalyzing ? (
          <>
            <LoadingSpinner size={16} color="#FFFFFF" />
            <span>Calculating Weather Route...</span>
          </>
        ) : (
          <>
            <Wind size={16} />
            <span>Calculate Eco Route</span>
          </>
        )}
      </button>
    </div>
  );
};
