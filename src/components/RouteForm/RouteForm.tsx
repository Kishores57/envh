import React from 'react';
import type { RouteRequest, TravelMode, UserProfile, RoutePriority } from '../../types';
import {
  MapPin, Navigation, Clock, User, Target, Zap, Footprints, Bike, Car,
  GraduationCap, HardHat, BookOpen, ChevronRight, School,
} from 'lucide-react';
import { LoadingSpinner } from '../shared';

interface RouteFormProps {
  request: RouteRequest;
  onChange: (partial: Partial<RouteRequest>) => void;
  onSubmit: () => void;
  isAnalyzing: boolean;
}

const TRAVEL_MODES: { value: TravelMode; label: string; icon: React.ReactNode }[] = [
  { value: 'walking', label: 'Walking',  icon: <Footprints size={14} /> },
  { value: 'cycling', label: 'Cycling',  icon: <Bike size={14} /> },
  { value: 'driving', label: 'Driving',  icon: <Car size={14} /> },
];

const PROFILES: { value: UserProfile; label: string; icon: React.ReactNode }[] = [
  { value: 'student',        label: 'Student',       icon: <GraduationCap size={14} /> },
  { value: 'outdoor_worker', label: 'Outdoor Worker', icon: <HardHat size={14} /> },
  { value: 'cyclist',        label: 'Cyclist',       icon: <Bike size={14} /> },
  { value: 'general',        label: 'General',       icon: <User size={14} /> },
];

const PRIORITIES: { value: RoutePriority; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
  { value: 'fastest',  label: 'Fastest',  icon: <Zap size={14} />,         desc: 'Time first',    color: '#3b82f6' },
  { value: 'cleanest', label: 'Cleanest', icon: <BookOpen size={14} />,     desc: 'Air first',     color: '#22c55e' },
  { value: 'coolest',  label: 'Coolest',  icon: <Target size={14} />,       desc: 'Heat first',    color: '#06b6d4' },
  { value: 'balanced', label: 'Balanced', icon: <Navigation size={14} />,   desc: 'All balanced',  color: '#f59e0b' },
];

export const RouteForm: React.FC<RouteFormProps> = ({ request, onChange, onSubmit, isAnalyzing }) => {
  const inputClass = `
    w-full bg-dark-600 border border-slate-700/60 rounded-xl px-3 py-2.5 text-sm text-slate-100
    placeholder-slate-500 focus:outline-none focus:border-eco-500/60 focus:bg-dark-500
    transition-all duration-200
  `;

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">

      {/* Origin */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">From</label>
        <div className="relative">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-eco-400" />
          <input
            type="text"
            placeholder="Starting location"
            value={request.origin}
            onChange={e => onChange({ origin: e.target.value })}
            className={`${inputClass} pl-8`}
          />
        </div>
      </div>

      {/* Destination */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">To</label>
        <div className="relative">
          <Navigation size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
          <input
            type="text"
            placeholder="Destination"
            value={request.destination}
            onChange={e => onChange({ destination: e.target.value })}
            className={`${inputClass} pl-8`}
          />
        </div>
      </div>

      {/* Departure time */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Departure Time</label>
        <div className="relative">
          <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="datetime-local"
            value={request.departureTime.slice(0, 16)}
            onChange={e => onChange({ departureTime: new Date(e.target.value).toISOString() })}
            className={`${inputClass} pl-8 [color-scheme:dark]`}
          />
        </div>
      </div>

      {/* Travel mode */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Travel Mode</label>
        <div className="grid grid-cols-3 gap-2">
          {TRAVEL_MODES.map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => onChange({ travelMode: value })}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
                request.travelMode === value
                  ? 'bg-eco-500/15 border-eco-500/40 text-eco-400'
                  : 'bg-dark-600 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* User Profile */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Profile</label>
        <div className="grid grid-cols-2 gap-2">
          {PROFILES.map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => onChange({ profile: value })}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 border ${
                request.profile === value
                  ? 'bg-eco-500/15 border-eco-500/40 text-eco-400'
                  : 'bg-dark-600 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</label>
        <div className="grid grid-cols-2 gap-2">
          {PRIORITIES.map(({ value, label, icon, desc, color }) => (
            <button
              key={value}
              onClick={() => onChange({ priority: value })}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 border text-left ${
                request.priority === value
                  ? 'border-opacity-40 text-slate-100'
                  : 'bg-dark-600 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
              }`}
              style={request.priority === value ? {
                background: `${color}18`,
                borderColor: `${color}50`,
                color,
              } : {}}
            >
              <span style={request.priority === value ? { color } : {}}>{icon}</span>
              <div>
                <div>{label}</div>
                <div className="text-slate-500 font-normal">{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* School Mode */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-600 border border-slate-700/50">
        <School size={16} className="text-yellow-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-300">School Safety Mode</p>
          <p className="text-xs text-slate-500">Enhanced analysis for school/college routes</p>
        </div>
        <button
          onClick={() => onChange({ isSchoolMode: !request.isSchoolMode })}
          className={`relative w-9 h-5 rounded-full transition-all duration-200 ${request.isSchoolMode ? 'bg-eco-500' : 'bg-slate-700'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${request.isSchoolMode ? 'left-4' : 'left-0.5'}`} />
        </button>
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={isAnalyzing || !request.origin || !request.destination}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 mt-2 ${
          isAnalyzing || !request.origin || !request.destination
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-eco-600 to-teal-600 text-white hover:from-eco-500 hover:to-teal-500 glow-eco'
        }`}
      >
        {isAnalyzing ? (
          <><LoadingSpinner size={16} color="#fff" /><span>Analyzing route...</span></>
        ) : (
          <><ChevronRight size={16} /><span>Analyze Route</span></>
        )}
      </button>
    </div>
  );
};
