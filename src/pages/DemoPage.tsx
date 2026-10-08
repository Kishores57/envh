import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DEMO_POLLUTION_TIMESERIES, DEMO_AWS_SERVICES } from '../data/demoData';

type DemoStep = 'intro' | 'routes' | 'only-route' | 'prediction' | 'aws' | 'impact';
type CommuteMode = 'walk' | 'bike' | 'car';

const STEPS: { id: DemoStep; label: string; num: string }[] = [
  { id: 'intro', label: 'Overview', num: '01' },
  { id: 'routes', label: 'Route Demo', num: '02' },
  { id: 'only-route', label: 'Only Route', num: '03' },
  { id: 'prediction', label: 'AI Forecaster', num: '04' },
  { id: 'aws', label: 'Cloud Stack', num: '05' },
  { id: 'impact', label: 'Impact', num: '06' },
];

export const DemoPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState<DemoStep>('routes');
  const [selectedRoute, setSelectedRoute] = useState<'A' | 'B' | 'C'>('B');
  const [commuteMode, setCommuteMode] = useState<CommuteMode>('bike');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [layers, setLayers] = useState({ pm25: true, canopy: true, heat: true });
  const [activeHotspot, setActiveHotspot] = useState<'smog' | 'heat' | null>(null);
  const [guidanceActive, setGuidanceActive] = useState(false);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simTick, setSimTick] = useState(0);

  // Commute mode multipliers
  const modeMultiplier = commuteMode === 'walk' ? 3.1 : commuteMode === 'bike' ? 1.0 : 0.64;

  const routeDetails = {
    A: {
      name: 'Route A (Direct Arterial)',
      type: 'Direct Arterial',
      color: '#ff7043',
      time: Math.round(18 * modeMultiplier),
      pm25: '48.6 µg',
      exposure: 79,
      risk: 'High',
      tag: 'FASTEST',
      desc: 'Follows major high-density vehicle arterial with peak exhaust stagnation.',
      shade: '22%',
      temp: '35.6°C',
    },
    B: {
      name: 'Route B (Canopy Greenway)',
      type: 'Canopy Corridor',
      color: '#00C982',
      time: Math.round(22 * modeMultiplier),
      pm25: '12.1 µg',
      exposure: 31,
      risk: 'Low',
      tag: 'RECOMMENDED',
      desc: 'Bypasses Magadi smog corridor via shaded residential greenway and tree canopy.',
      shade: '84%',
      temp: '31.4°C',
    },
    C: {
      name: 'Route C (Suburban Ring)',
      type: 'Suburban Ring',
      color: '#fbc02d',
      time: Math.round(20 * modeMultiplier),
      pm25: '28.4 µg',
      exposure: 54,
      risk: 'Med',
      tag: 'BALANCED',
      desc: 'Circumferential ring road with moderate vehicle flow and periodic tree cover.',
      shade: '48%',
      temp: '33.1°C',
    },
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setSelectedRoute('B');
    }, 900);
  };

  const handleSimulate = () => {
    setSimulationRunning(true);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setSimTick(count);
      if (count >= 5) {
        clearInterval(interval);
        setSimulationRunning(false);
        setSimTick(0);
      }
    }, 600);
  };

  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen flex flex-col overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      {/* ─── 1. TOP HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-low/95 backdrop-blur-md border-b border-outline-variant/60 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
        <div className="h-16 w-full px-5 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 text-decoration-none">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_3px_0_#008a58] transition-transform hover:scale-105">
              <span className="material-symbols-outlined text-[#002b18] text-[22px] font-bold">eco</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-headline font-extrabold text-[20px] text-white tracking-tight">EcoRoute</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 uppercase tracking-wider">
                AI ENGINE
              </span>
            </div>
          </Link>

          {/* Navigation Timeline (Journey steps) */}
          <div className="hidden xl:flex items-center">
            <nav className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-container-lowest border border-outline-variant/50">
              {STEPS.map((s) => {
                const isActive = activeStep === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveStep(s.id)}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-primary text-[#002b18] font-bold shadow-[0_2px_0_#007a4e]'
                        : 'text-on-surface-variant hover:text-white'
                    }`}
                  >
                    {isActive && <span className="w-2 h-2 rounded-full bg-[#002b18] animate-pulse" />}
                    <span>{s.num}. {s.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Telemetry Status Right */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/60 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span className="text-xs font-mono text-on-surface-variant">GRID:</span>
              <span className="text-xs font-mono font-bold text-primary">48 MONITORS</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#ff7043]/15 border border-[#ff7043]/30 text-[#ffab91] text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-[#ff7043]" />
              LIVE SENSORS
            </div>
            <Link
              to="/"
              title="Return to Navigation View"
              className="w-9 h-9 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary hover:bg-surface-container-highest cursor-pointer transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[19px]">account_circle</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTAINER ─── */}
      <main className="w-full pt-16 bg-surface flex flex-col flex-1 min-h-[calc(100vh-4rem)]">
        {/* ─── 2. TELEMETRY SUB-HEADER BANNER ─── */}
        <div className="w-full bg-surface-container-low border-b border-outline-variant/50 px-5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/40">
              <span className="material-symbols-outlined text-primary text-[15px]">sensors</span>
              <span className="text-on-surface-variant">Mesh:</span>
              <span className="text-primary font-bold">10m Hyper-Local</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/40">
              <span className="material-symbols-outlined text-[#4be2c8] text-[15px]">air</span>
              <span className="text-on-surface-variant">Wind:</span>
              <span className="text-[#4be2c8] font-bold">SSE 8.4 km/h</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/40">
              <span className="material-symbols-outlined text-[#ffab91] text-[15px]">thermostat</span>
              <span className="text-on-surface-variant">Ambient:</span>
              <span className="text-[#ffab91] font-bold">28.4°C</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-primary/15 text-primary border border-primary/30 font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">savings</span>
              CLEAN CORRIDOR ACTIVE: -58.4 µg PM2.5
            </span>
          </div>
        </div>

        {/* ─── 3. STEP: ROUTE DEMO (THE HERO 2D APPLICATION) ─── */}
        {activeStep === 'routes' && (
          <div className="relative w-full flex-1 flex flex-col lg:flex-row bg-surface overflow-hidden min-h-[780px]">
            {/* ── LEFT CONTROL PANEL ── */}
            <aside className="w-full lg:w-[380px] xl:w-[400px] shrink-0 p-4 bg-surface-container-low border-r border-outline-variant/60 flex flex-col gap-3.5 z-20 overflow-y-auto max-h-[calc(100vh-6.5rem)]">
              {/* WAYPOINTS */}
              <div className="bg-surface-container rounded-2xl p-3.5 border border-outline-variant/70 shadow-[0_4px_12px_rgba(0,0,0,0.3)] relative">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[15px]">alt_route</span>
                    WAYPOINTS
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-mono font-bold border border-primary/30">
                    08:30 AM PEAK
                  </span>
                </div>
                <div className="flex flex-col gap-2 relative">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40">
                    <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-primary/30">
                      <span className="material-symbols-outlined text-[18px]">home</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-mono text-on-surface-variant uppercase block">ORIGIN</span>
                      <span className="text-xs font-semibold text-white truncate block">Indiranagar 100ft Rd</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40">
                    <div className="w-8 h-8 rounded-xl bg-[#4be2c8]/20 text-[#4be2c8] flex items-center justify-center shrink-0 border border-[#4be2c8]/30">
                      <span className="material-symbols-outlined text-[18px]">school</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-mono text-on-surface-variant uppercase block">CAMPUS</span>
                      <span className="text-xs font-semibold text-white truncate block">IISc Main Gate, Malleshwaram</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#4be2c8]">11.4 km</span>
                  </div>
                </div>
              </div>

              {/* COMMUTE MODE */}
              <div className="bg-surface-container rounded-2xl p-3.5 border border-outline-variant/70 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                <div className="text-[11px] font-mono font-bold tracking-wider uppercase text-on-surface-variant mb-2 flex items-center justify-between">
                  <span>COMMUTE MODE</span>
                  <span className="text-[10px] text-primary">SELECT ACTIVE</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setCommuteMode('walk')}
                    className={`py-2.5 px-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      commuteMode === 'walk'
                        ? 'bg-primary text-[#002b18] border border-primary shadow-[0_3px_0_#007a4e] scale-[1.02]'
                        : 'bg-surface-container-lowest hover:bg-surface-container-high border border-outline-variant/50 text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">directions_walk</span>
                    <span className="text-[11px] font-bold font-mono">WALK</span>
                  </button>
                  <button
                    onClick={() => setCommuteMode('bike')}
                    className={`py-2.5 px-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      commuteMode === 'bike'
                        ? 'bg-primary text-[#002b18] border border-primary shadow-[0_3px_0_#007a4e] scale-[1.02]'
                        : 'bg-surface-container-lowest hover:bg-surface-container-high border border-outline-variant/50 text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px] font-bold">directions_bike</span>
                    <span className="text-[11px] font-bold font-mono">BIKE</span>
                  </button>
                  <button
                    onClick={() => setCommuteMode('car')}
                    className={`py-2.5 px-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      commuteMode === 'car'
                        ? 'bg-primary text-[#002b18] border border-primary shadow-[0_3px_0_#007a4e] scale-[1.02]'
                        : 'bg-surface-container-lowest hover:bg-surface-container-high border border-outline-variant/50 text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">directions_car</span>
                    <span className="text-[11px] font-bold font-mono">CAR</span>
                  </button>
                </div>
              </div>

              {/* SENSORS: WIND & UV */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-surface-container rounded-2xl p-3 border border-outline-variant/70 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-on-surface-variant uppercase font-bold">WIND VECTOR</span>
                    <span className="material-symbols-outlined text-[#4be2c8] text-[16px]">air</span>
                  </div>
                  <div className="my-1.5 flex items-baseline gap-1">
                    <span className="text-xl font-bold font-mono text-white">8.4</span>
                    <span className="text-[10px] font-mono text-on-surface-variant">km/h</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-surface-container-lowest overflow-hidden">
                      <div className="w-3/5 h-full bg-[#4be2c8] rounded-full" />
                    </div>
                    <span className="text-[9px] font-mono text-[#4be2c8] font-bold">FAVORABLE</span>
                  </div>
                </div>

                <div className="bg-surface-container rounded-2xl p-3 border border-outline-variant/70 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-on-surface-variant uppercase font-bold">UV & HEAT</span>
                    <span className="material-symbols-outlined text-[#ffb74d] text-[16px]">wb_sunny</span>
                  </div>
                  <div className="my-1.5 flex items-baseline gap-1">
                    <span className="text-xl font-bold font-mono text-[#ffb74d]">4</span>
                    <span className="text-[10px] font-mono text-on-surface-variant">MODERATE</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-surface-container-lowest overflow-hidden">
                      <div className="w-2/5 h-full bg-[#ffb74d] rounded-full" />
                    </div>
                    <span className="text-[9px] font-mono text-[#ffb74d] font-bold">31.4°C SHADE</span>
                  </div>
                </div>
              </div>

              {/* PROFILE & TARGET */}
              <div className="bg-surface-container rounded-2xl p-3.5 border border-outline-variant/70 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-on-surface-variant">
                    PROFILE & TARGET
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#ff6b6b]/20 text-[#ff6b6b] border border-[#ff6b6b]/40 font-bold">
                    PULMONARY RISK
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/40 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">child_care</span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block">Student</span>
                      <span className="text-[10px] font-mono text-primary block">High VO2 Filter</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#4be2c8] text-[18px]">eco</span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block">Clean Air</span>
                      <span className="text-[10px] font-mono text-[#4be2c8] block">Lowest PM2.5</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ANALYZE BUTTON */}
              <div className="mt-auto pt-2">
                <button
                  id="ctaAnalyze"
                  onClick={handleAnalyze}
                  className="w-full py-3.5 px-4 rounded-2xl bg-primary text-[#002b18] font-bold text-sm tracking-wide shadow-[0_4px_0_#007a4e,0_10px_20px_rgba(0,201,130,0.3)] hover:brightness-105 active:translate-y-1 active:shadow-[0_1px_0_#007a4e] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px] font-bold">
                    {isAnalyzing ? 'sync' : 'neurology'}
                  </span>
                  {isAnalyzing ? 'COMPUTING ENVIRONMENTAL MATRIX...' : 'ANALYZE ROUTE MATRIX →'}
                </button>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                  <span className="text-[10px] font-mono text-on-surface-variant">
                    A* MULTI-OBJECTIVE WEIGHTED ALGORITHM
                  </span>
                </div>
              </div>
            </aside>

            {/* ── CENTER HERO 2D ENVIRONMENTAL MAP ── */}
            <div className="flex-1 relative min-h-[520px] lg:min-h-full bg-[#071311] overflow-hidden" id="mapViewport">
              {/* Background Grid Pattern */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="mapGrid" width="44" height="44" patternUnits="userSpaceOnUse">
                    <path d="M 44 0 L 0 0 0 44" fill="none" stroke="#1d342c" strokeWidth="0.8" />
                  </pattern>
                  <pattern id="mapDots" width="14" height="14" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="0.8" fill="#00C982" opacity="0.35" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#mapGrid)" />
                <rect width="100%" height="100%" fill="url(#mapDots)" />
              </svg>

              {/* Handcrafted Vector Map Layer */}
              <svg className="absolute inset-0 w-full h-full" id="mapCanvas" viewBox="0 0 1000 780" preserveAspectRatio="xMidYMid slice">
                <defs>
                  {/* Clean glowing filter */}
                  <filter id="glowClean" x="-25%" y="-25%" width="150%" height="150%">
                    <feGaussianBlur stdDeviation="7" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  {/* Danger Radial Gradient */}
                  <radialGradient id="dangerRadial" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ff5252" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#d32f2f" stopOpacity="0.4" />
                    <stop offset="90%" stopColor="#7a161d" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#071311" stopOpacity="0" />
                  </radialGradient>
                  {/* Thermal Radial Gradient */}
                  <radialGradient id="thermalRadial" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffb74d" stopOpacity="0.75" />
                    <stop offset="60%" stopColor="#e65100" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#071311" stopOpacity="0" />
                  </radialGradient>
                  {/* Tree Cluster Symbol */}
                  <g id="posterTreeCluster">
                    <circle cx="0" cy="0" r="18" fill="#0f3d30" />
                    <circle cx="-8" cy="-5" r="13" fill="#145442" />
                    <circle cx="9" cy="-3" r="12" fill="#17634f" />
                    <circle cx="1" cy="7" r="11" fill="#1f7a62" />
                    <circle cx="0" cy="0" r="4.5" fill="#00C982" opacity="0.35" />
                  </g>
                </defs>

                {/* 1. Lakes & Water Bodies */}
                <g opacity="0.95">
                  <path d="M 280 190 C 320 170, 380 200, 370 250 C 350 280, 310 295, 270 270 C 235 240, 245 210, 280 190 Z" fill="#0c2b29" stroke="#164d4b" strokeWidth="2.5" />
                  <rect x="270" y="225" width="105" height="20" rx="6" fill="#0a352a" stroke="#4be2c8" strokeWidth="1" />
                  <text x="278" y="239" fill="#4be2c8" fontSize="9" fontFamily="'JetBrains Mono'" fontWeight="bold">SANKEY LAKE</text>

                  <path d="M 750 490 C 820 480, 850 520, 830 580 C 800 620, 740 600, 720 550 C 710 510, 730 495, 750 490 Z" fill="#0c2b29" stroke="#164d4b" strokeWidth="2.5" />
                  <rect x="740" y="535" width="100" height="20" rx="6" fill="#0a352a" stroke="#4be2c8" strokeWidth="1" />
                  <text x="750" y="549" fill="#4be2c8" fontSize="9" fontFamily="'JetBrains Mono'" fontWeight="bold">ULSOOR LAKE</text>
                </g>

                {/* 2. Green Parks & Canopy Zones */}
                {layers.canopy && (
                  <g opacity="0.95">
                    <path d="M 210 110 Q 380 90 420 160 Q 400 320 300 330 Q 190 290 210 110 Z" fill="#0c3227" opacity="0.55" />
                    <use href="#posterTreeCluster" x="250" y="150" />
                    <use href="#posterTreeCluster" x="310" y="130" />
                    <use href="#posterTreeCluster" x="360" y="170" />
                    <use href="#posterTreeCluster" x="280" y="290" />
                    <use href="#posterTreeCluster" x="340" y="270" />

                    <path d="M 520 420 C 580 390, 650 440, 630 520 C 600 580, 510 560, 500 480 Z" fill="#0c3227" opacity="0.55" />
                    <use href="#posterTreeCluster" x="550" y="460" />
                    <use href="#posterTreeCluster" x="590" y="500" />
                  </g>
                )}

                {/* 3. Base Road Grid (Minor Streets) */}
                <g stroke="#16312a" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="120" y1="90" x2="880" y2="90" />
                  <line x1="150" y1="230" x2="900" y2="230" />
                  <line x1="100" y1="370" x2="920" y2="370" />
                  <line x1="80" y1="510" x2="900" y2="510" />
                  <line x1="120" y1="650" x2="900" y2="650" />
                  <line x1="180" y1="60" x2="180" y2="730" />
                  <line x1="340" y1="60" x2="340" y2="730" />
                  <line x1="490" y1="60" x2="490" y2="730" />
                  <line x1="660" y1="60" x2="660" y2="730" />
                  <line x1="820" y1="60" x2="820" y2="730" />
                </g>

                {/* 4. Major Arterial Road Corridors */}
                <g stroke="#264b41" strokeWidth="6.5" fill="none" strokeLinecap="round">
                  <path d="M 140 130 L 360 130 L 520 230 L 880 230" />
                  <path d="M 860 670 L 680 510 L 460 510 L 280 650" />
                  <path d="M 520 730 L 520 410 L 360 270 L 220 270" />
                </g>

                {/* 5. Smog Hotspot (Magadi Road Intersection) */}
                {layers.pm25 && (
                  <g
                    className="cursor-pointer transition-transform hover:scale-105"
                    transform="translate(620, 480)"
                    onClick={() => setActiveHotspot(activeHotspot === 'smog' ? null : 'smog')}
                  >
                    <circle cx="0" cy="0" r={88 + simTick * 5} fill="url(#dangerRadial)" />
                    <circle cx="0" cy="0" r="50" fill="none" stroke="#ff5252" strokeWidth="1.8" strokeDasharray="4 4">
                      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="20s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="0" cy="0" r="16" fill="#d32f2f" stroke="#ffffff" strokeWidth="2" />
                    <text x="0" y="5" fill="#ffffff" fontSize="12" fontFamily="'JetBrains Mono'" fontWeight="bold" textAnchor="middle">!</text>
                    <g transform="translate(22, -28)">
                      <rect width="135" height="26" rx="8" fill="#1e1011" stroke="#ff5252" strokeWidth="1.5" />
                      <circle cx="12" cy="13" r="4.5" fill="#ff5252" />
                      <text x="24" y="17" fill="#ffb4ab" fontSize="10" fontFamily="'JetBrains Mono'" fontWeight="bold">SMOG 88.4 µg</text>
                    </g>
                  </g>
                )}

                {/* 6. Heat Island Hotspot */}
                {layers.heat && (
                  <g
                    className="cursor-pointer transition-transform hover:scale-105"
                    transform="translate(480, 240)"
                    onClick={() => setActiveHotspot(activeHotspot === 'heat' ? null : 'heat')}
                  >
                    <circle cx="0" cy="0" r="70" fill="url(#thermalRadial)" />
                    <circle cx="0" cy="0" r="14" fill="#e65100" stroke="#ffe0b2" strokeWidth="2" />
                    <text x="0" y="4" fill="#ffffff" fontSize="11" fontFamily="'JetBrains Mono'" fontWeight="bold" textAnchor="middle">☀</text>
                    <g transform="translate(-115, -26)">
                      <rect width="105" height="24" rx="8" fill="#1f180e" stroke="#ffb74d" strokeWidth="1.5" />
                      <circle cx="12" cy="12" r="4" fill="#ffa726" />
                      <text x="22" y="16" fill="#ffe082" fontSize="10" fontFamily="'JetBrains Mono'" fontWeight="bold">HEAT 38.2°C</text>
                    </g>
                  </g>
                )}

                {/* 7. Route A (Direct Arterial - Orange/Red) */}
                <g
                  opacity={selectedRoute === 'A' ? 1 : 0.65}
                  className="cursor-pointer"
                  onClick={() => setSelectedRoute('A')}
                >
                  <path
                    d="M 830 630 L 680 500 L 520 400 L 360 260 L 240 140"
                    fill="none"
                    stroke="#ff7043"
                    strokeWidth={selectedRoute === 'A' ? '7' : '4.5'}
                    strokeDasharray="8 6"
                    strokeLinecap="round"
                  >
                    <animate attributeName="stroke-dashoffset" values="28;0" dur="2s" repeatCount="indefinite" />
                  </path>
                  <g transform="translate(540, 420)">
                    <rect width="88" height="24" rx="8" fill="#23130d" stroke="#ff7043" strokeWidth="1.5" />
                    <text x="9" y="16" fill="#ffab91" fontSize="10" fontFamily="'JetBrains Mono'" fontWeight="bold">18m • AQI 79</text>
                  </g>
                </g>

                {/* 8. Route C (Suburban Ring - Yellow) */}
                <g
                  opacity={selectedRoute === 'C' ? 1 : 0.65}
                  className="cursor-pointer"
                  onClick={() => setSelectedRoute('C')}
                >
                  <path
                    d="M 830 630 L 800 480 L 640 360 L 460 320 L 240 140"
                    fill="none"
                    stroke="#fbc02d"
                    strokeWidth={selectedRoute === 'C' ? '7' : '4'}
                    strokeDasharray="5 5"
                    strokeLinecap="round"
                  />
                  <g transform="translate(660, 340)">
                    <rect width="88" height="24" rx="8" fill="#221e0d" stroke="#fbc02d" strokeWidth="1.5" />
                    <text x="9" y="16" fill="#fff59d" fontSize="10" fontFamily="'JetBrains Mono'" fontWeight="bold">20m • AQI 54</text>
                  </g>
                </g>

                {/* 9. Route B (Recommended Canopy Greenway - Emerald Glow) */}
                <g
                  filter="url(#glowClean)"
                  opacity={selectedRoute === 'B' ? 1 : 0.75}
                  className="cursor-pointer"
                  onClick={() => setSelectedRoute('B')}
                >
                  <path
                    d="M 830 630 L 760 520 L 610 520 L 500 440 L 410 310 L 320 220 L 240 140"
                    fill="none"
                    stroke="#003921"
                    strokeWidth={selectedRoute === 'B' ? '18' : '12'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 830 630 L 760 520 L 610 520 L 500 440 L 410 310 L 320 220 L 240 140"
                    fill="none"
                    stroke="#00C982"
                    strokeWidth={selectedRoute === 'B' ? '8' : '5'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M 830 630 L 760 520 L 610 520 L 500 440 L 410 310 L 320 220 L 240 140"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeDasharray="2 20"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.9"
                  >
                    <animate attributeName="stroke-dashoffset" values="88;0" dur="2.2s" repeatCount="indefinite" />
                  </path>
                </g>

                {/* Badges on Route B */}
                <g transform="translate(435, 360)">
                  <rect width="126" height="26" rx="10" fill="#05261d" stroke="#00C982" strokeWidth="1.5" />
                  <circle cx="13" cy="13" r="4" fill="#00C982" />
                  <text x="25" y="17" fill="#a7f3d0" fontSize="10" fontFamily="'JetBrains Mono'" fontWeight="bold">🌿 CLEAN CORRIDOR</text>
                </g>

                <g transform="translate(320, 255)">
                  <rect width="102" height="24" rx="9" fill="#05261d" stroke="#00C982" strokeWidth="1.2" />
                  <text x="12" y="16" fill="#00C982" fontSize="9.5" fontFamily="'JetBrains Mono'" fontWeight="bold">84% CANOPY</text>
                </g>

                {/* 10. Origin Marker (Home - Indiranagar 100ft) */}
                <g transform="translate(830, 630)">
                  <circle cx="0" cy="0" r="26" fill="none" stroke="#00C982" strokeWidth="1.8" opacity="0.6">
                    <animate attributeName="r" values="8;36" dur="2.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="0" cy="0" r="10" fill="#00C982" stroke="#05100e" strokeWidth="3" />
                  <g transform="translate(-75, -46)">
                    <rect width="150" height="34" rx="10" fill="#101c1a" stroke="#00C982" strokeWidth="1.8" />
                    <path d="M 75 34 L 75 42" stroke="#00C982" strokeWidth="2" />
                    <circle cx="16" cy="17" r="5" fill="#00C982" />
                    <text x="28" y="16" fill="#ffffff" fontSize="11" fontFamily="'Inter'" fontWeight="bold">HOME ORIGIN</text>
                    <text x="28" y="27" fill="#8fa39a" fontSize="9" fontFamily="'JetBrains Mono'">Indiranagar 100ft</text>
                  </g>
                </g>

                {/* 11. Destination Marker (Campus - IISc Bangalore) */}
                <g transform="translate(240, 140)">
                  <circle cx="0" cy="0" r="12" fill="#4be2c8" stroke="#05100e" strokeWidth="3" />
                  <circle cx="0" cy="0" r="4.5" fill="#05100e" />
                  <g transform="translate(-70, -46)">
                    <rect width="140" height="34" rx="10" fill="#101c1a" stroke="#4be2c8" strokeWidth="1.8" />
                    <path d="M 70 34 L 70 42" stroke="#4be2c8" strokeWidth="2" />
                    <text x="14" y="21" fill="#4be2c8" fontSize="13">★</text>
                    <text x="30" y="16" fill="#ffffff" fontSize="11" fontFamily="'Inter'" fontWeight="bold">CAMPUS</text>
                    <text x="30" y="27" fill="#4be2c8" fontSize="9" fontFamily="'JetBrains Mono'">IISc Bangalore</text>
                  </g>
                </g>
              </svg>

              {/* Map Layer Controls Top-Left */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 z-10">
                <button
                  onClick={() => setLayers(prev => ({ ...prev, pm25: !prev.pm25 }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    layers.pm25
                      ? 'bg-primary text-[#002b18] shadow-[0_2px_0_#007a4e]'
                      : 'bg-surface-container-low/90 backdrop-blur-md hover:bg-surface-container text-on-surface-variant border border-outline-variant/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">air</span>
                  PM2.5 LIVE
                </button>
                <button
                  onClick={() => setLayers(prev => ({ ...prev, canopy: !prev.canopy }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                    layers.canopy
                      ? 'bg-primary text-[#002b18] font-bold shadow-[0_2px_0_#007a4e]'
                      : 'bg-surface-container-low/90 backdrop-blur-md hover:bg-surface-container text-on-surface-variant border border-outline-variant/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">forest</span>
                  CANOPY
                </button>
                <button
                  onClick={() => setLayers(prev => ({ ...prev, heat: !prev.heat }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                    layers.heat
                      ? 'bg-primary text-[#002b18] font-bold shadow-[0_2px_0_#007a4e]'
                      : 'bg-surface-container-low/90 backdrop-blur-md hover:bg-surface-container text-on-surface-variant border border-outline-variant/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">thermostat</span>
                  HEAT MESH
                </button>
              </div>

              {/* Interactive Hotspot Inspector Dialog */}
              {activeHotspot && (
                <div className="absolute top-16 left-4 bg-surface-container-low/95 backdrop-blur-md p-4 rounded-2xl border-2 border-primary shadow-[0_8px_32px_rgba(0,0,0,0.8)] max-w-sm z-30 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-outline-variant/50">
                    <span className="text-xs font-mono font-bold text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">sensors</span>
                      {activeHotspot === 'smog' ? 'MAGADI ROAD CORRIDOR' : 'CENTRAL JUNCTION HEAT DOME'}
                    </span>
                    <button
                      onClick={() => setActiveHotspot(null)}
                      className="text-on-surface-variant hover:text-white text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-white">
                    {activeHotspot === 'smog' ? (
                      <>
                        <div className="grid grid-cols-2 gap-2 my-2 font-mono">
                          <div className="bg-surface-container p-2 rounded-lg">
                            <span className="text-[10px] text-on-surface-variant block">PM2.5 CONC</span>
                            <span className="text-sm font-bold text-[#ff6b6b]">88.4 µg/m³</span>
                          </div>
                          <div className="bg-surface-container p-2 rounded-lg">
                            <span className="text-[10px] text-on-surface-variant block">SURFACE TEMP</span>
                            <span className="text-sm font-bold text-white">34.2°C</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-1">
                          Severe particulate stagnation from diesel commercial vehicles. Route B detours around this zone to reduce pulmonary exposure by 60%.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2 my-2 font-mono">
                          <div className="bg-surface-container p-2 rounded-lg">
                            <span className="text-[10px] text-on-surface-variant block">SURFACE HEAT</span>
                            <span className="text-sm font-bold text-[#ffb74d]">38.2°C</span>
                          </div>
                          <div className="bg-surface-container p-2 rounded-lg">
                            <span className="text-[10px] text-on-surface-variant block">UV INDEX</span>
                            <span className="text-sm font-bold text-white">7 High</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-1">
                          Unshaded asphalt reflection causing localized thermal pocket. Shaded corridor provides -4.2°C ambient cooling.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Floating Alert Card Bottom-Left */}
              <div className="absolute bottom-4 left-4 bg-surface-container-low/95 backdrop-blur-md p-3.5 rounded-2xl border-2 border-[#ff6b6b] shadow-[0_8px_24px_rgba(0,0,0,0.6)] max-w-xs z-10">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b6b] animate-ping" />
                    <span className="text-[11px] font-mono font-bold text-[#ff6b6b] uppercase">AIR QUALITY ALERT</span>
                  </div>
                  <span className="text-[10px] font-mono text-on-surface-variant">SENSOR #09</span>
                </div>
                <div className="text-xs font-bold text-white mt-1">Magadi Road / MG Intersection</div>
                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-outline-variant/50 text-center font-mono">
                  <div>
                    <span className="text-[9px] text-on-surface-variant block">PM2.5</span>
                    <span className="text-xs font-bold text-[#ff6b6b]">88.4 µg</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-on-surface-variant block">AQI</span>
                    <span className="text-xs font-bold text-[#ff6b6b]">168 POOR</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-on-surface-variant block">FLOW</span>
                    <span className="text-xs font-bold text-white">JAM</span>
                  </div>
                </div>
              </div>

              {/* Floating Zoom Controls Bottom-Right */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                <button
                  title="Zoom In"
                  className="w-10 h-10 rounded-xl bg-surface-container-low/90 backdrop-blur-md text-white border border-outline-variant/60 flex items-center justify-center hover:bg-surface-container active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
                <button
                  title="Zoom Out"
                  className="w-10 h-10 rounded-xl bg-surface-container-low/90 backdrop-blur-md text-white border border-outline-variant/60 flex items-center justify-center hover:bg-surface-container active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">remove</span>
                </button>
                <button
                  title="Locate Route"
                  className="w-10 h-10 rounded-xl bg-surface-container-low/90 backdrop-blur-md text-primary border border-outline-variant/60 flex items-center justify-center hover:bg-surface-container active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">my_location</span>
                </button>
              </div>
            </div>

            {/* ── RIGHT PANEL (RECOMMENDATIONS & COMPARISONS) ── */}
            <aside className="w-full lg:w-[410px] xl:w-[430px] shrink-0 p-4 bg-surface-container-low border-l border-outline-variant/60 flex flex-col justify-between gap-3.5 z-20 overflow-y-auto max-h-[calc(100vh-6.5rem)]">
              <div className="flex flex-col gap-3.5">
                {/* 1. RECOMMENDED ROUTE CARD */}
                <div className="bg-surface-container rounded-2xl p-4 border-2 border-primary shadow-[0_6px_20px_rgba(0,201,130,0.15)] relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-[#002b18] text-xs font-mono font-bold shadow-sm">
                      <span className="material-symbols-outlined text-[15px] font-bold">verified</span>
                      RECOMMENDED
                    </div>
                    <span className="text-[11px] font-mono font-bold text-primary">ROUTE B • ECO-OPTIMAL</span>
                  </div>

                  <div className="flex items-center gap-4 my-3">
                    {/* Semi-circular Exposure Gauge */}
                    <div className="relative w-28 h-20 flex items-center justify-center shrink-0">
                      <svg className="w-28 h-20" viewBox="0 0 100 65">
                        <path d="M 12 55 A 38 38 0 0 1 88 55" fill="none" stroke="#1b2e29" strokeWidth="8" strokeLinecap="round" />
                        <path
                          d="M 12 55 A 38 38 0 0 1 88 55"
                          fill="none"
                          stroke={routeDetails[selectedRoute].color}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray="120"
                          strokeDashoffset={120 - (routeDetails[selectedRoute].exposure / 100) * 120}
                        />
                        <line
                          x1="50"
                          y1="52"
                          x2={selectedRoute === 'B' ? '35' : selectedRoute === 'C' ? '50' : '65'}
                          y2={selectedRoute === 'B' ? '28' : selectedRoute === 'C' ? '24' : '28'}
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <circle cx="50" cy="52" r="4" fill={routeDetails[selectedRoute].color} />
                      </svg>
                      <div className="absolute bottom-0 text-center">
                        <span className="text-xl font-bold font-mono text-primary leading-none block">
                          {routeDetails[selectedRoute].exposure}
                        </span>
                        <span className="text-[9px] font-mono text-on-surface-variant">EXPOSURE</span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-base font-bold text-white block truncate">
                        {routeDetails[selectedRoute].type}
                      </span>
                      <div className="flex items-center gap-1 text-primary text-xs font-bold font-mono mt-0.5">
                        <span className="material-symbols-outlined text-[16px]">trending_down</span>
                        {selectedRoute === 'B' ? '60% LOWER DOSE' : selectedRoute === 'C' ? '25% LOWER DOSE' : 'FASTEST SPEED'}
                      </div>
                      <span className="text-[11px] text-on-surface-variant block mt-1 leading-snug">
                        {routeDetails[selectedRoute].desc}
                      </span>
                    </div>
                  </div>

                  {/* 3 Metrics */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-outline-variant/60">
                    <div className="bg-surface-container-lowest p-2 rounded-xl text-center">
                      <span className="text-[9px] font-mono text-on-surface-variant block">TIME</span>
                      <span className="text-sm font-bold font-mono text-white">{routeDetails[selectedRoute].time} min</span>
                      <span className="text-[9px] font-mono text-[#4be2c8] block">+4m Detour</span>
                    </div>
                    <div className="bg-surface-container-lowest p-2 rounded-xl text-center">
                      <span className="text-[9px] font-mono text-on-surface-variant block">AVG PM2.5</span>
                      <span className="text-sm font-bold font-mono text-primary">{routeDetails[selectedRoute].pm25}</span>
                      <span className="text-[9px] font-mono text-primary block">WHO Standard</span>
                    </div>
                    <div className="bg-surface-container-lowest p-2 rounded-xl text-center">
                      <span className="text-[9px] font-mono text-on-surface-variant block">SHADE</span>
                      <span className="text-sm font-bold font-mono text-white">{routeDetails[selectedRoute].shade}</span>
                      <span className="text-[9px] font-mono text-[#ffb74d] block">{routeDetails[selectedRoute].temp} Cool</span>
                    </div>
                  </div>
                </div>

                {/* 2. COMPARE ROUTE PROPOSALS */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-on-surface-variant">
                    COMPARE ROUTE PROPOSALS
                  </span>

                  {/* Route B */}
                  <div
                    onClick={() => setSelectedRoute('B')}
                    className={`p-3 rounded-2xl cursor-pointer transition-all ${
                      selectedRoute === 'B'
                        ? 'bg-surface-container border-2 border-primary shadow-sm'
                        : 'bg-surface-container-lowest border border-outline-variant/50 hover:border-primary/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_#00C982]" />
                        <span className="text-xs font-bold text-white">Route B (Canopy Greenway)</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-primary bg-primary/20 px-2 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-[11px] font-mono text-on-surface-variant">
                      <div>Time: <strong className="text-white">{Math.round(22 * modeMultiplier)}m</strong></div>
                      <div>PM: <strong className="text-primary font-bold">12.1 µg</strong></div>
                      <div className="text-right">Risk: <strong className="text-primary">Low</strong></div>
                    </div>
                  </div>

                  {/* Route A */}
                  <div
                    onClick={() => setSelectedRoute('A')}
                    className={`p-3 rounded-2xl cursor-pointer transition-all ${
                      selectedRoute === 'A'
                        ? 'bg-surface-container border-2 border-[#ff6b6b] shadow-sm'
                        : 'bg-surface-container-lowest border border-outline-variant/50 hover:border-[#ff6b6b]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#ff6b6b]" />
                        <span className="text-xs font-bold text-white">Route A (Direct Arterial)</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#ff6b6b] bg-[#ff6b6b]/20 px-2 py-0.5 rounded-full">
                        FASTEST
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-[11px] font-mono text-on-surface-variant">
                      <div>Time: <strong className="text-white">{Math.round(18 * modeMultiplier)}m</strong></div>
                      <div>PM: <strong className="text-[#ff6b6b] font-bold">48.6 µg</strong></div>
                      <div className="text-right">Risk: <strong className="text-[#ff6b6b]">High</strong></div>
                    </div>
                  </div>

                  {/* Route C */}
                  <div
                    onClick={() => setSelectedRoute('C')}
                    className={`p-3 rounded-2xl cursor-pointer transition-all ${
                      selectedRoute === 'C'
                        ? 'bg-surface-container border-2 border-[#fbc02d] shadow-sm'
                        : 'bg-surface-container-lowest border border-outline-variant/50 hover:border-[#fbc02d]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#fbc02d]" />
                        <span className="text-xs font-bold text-white">Route C (Suburban Ring)</span>
                      </div>
                      <span className="text-[10px] font-mono text-on-surface-variant">BALANCED</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-[11px] font-mono text-on-surface-variant">
                      <div>Time: <strong className="text-white">{Math.round(20 * modeMultiplier)}m</strong></div>
                      <div>PM: <strong className="text-white">28.4 µg</strong></div>
                      <div className="text-right">Risk: <strong className="text-[#fbc02d]">Med</strong></div>
                    </div>
                  </div>
                </div>

                {/* 3. AVOIDED EXPOSURE TELEMETRY */}
                <div className="bg-surface-container rounded-2xl p-3 border border-outline-variant/60 flex flex-col gap-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-[15px]">masks</span>
                      Inhalation Avoided:
                    </span>
                    <span className="text-primary font-bold">-36.5 µg PM2.5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#4be2c8] text-[15px]">device_thermostat</span>
                      Thermal Relief:
                    </span>
                    <span className="text-[#4be2c8] font-bold">-4.2°C Surface</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-[15px]">park</span>
                      Tree Canopy:
                    </span>
                    <span className="text-primary font-bold">4.8 km / 6.1 km</span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => setGuidanceActive(!guidanceActive)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-primary text-[#002b18] font-bold text-sm tracking-wide shadow-[0_4px_0_#007a4e] hover:brightness-105 active:translate-y-1 active:shadow-[0_1px_0_#007a4e] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px] font-bold">navigation</span>
                  {guidanceActive ? 'LIVE GUIDANCE ENGAGED • TURN-BY-TURN' : 'START LIVE GUIDANCE'}
                </button>
                <button
                  onClick={handleSimulate}
                  className="w-full py-2.5 px-4 rounded-xl bg-surface-container border border-outline-variant/60 text-white hover:bg-surface-container-high font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[#4be2c8] text-[16px]">science</span>
                  {simulationRunning ? 'SIMULATING PM2.5 SHIFT (+60m)...' : 'SIMULATE POLLUTION EVOLUTION'}
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* ─── 4. STEP: OVERVIEW (HERO ILLUSTRATION & PROBLEM) ─── */}
        {activeStep === 'intro' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#071311] relative overflow-hidden">
            <div className="max-w-3xl z-10">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-5 shadow-[0_4px_0_#007a4e,0_10px_25px_rgba(0,201,130,0.3)]">
                <span className="material-symbols-outlined text-[#002b18] text-[32px] font-bold">eco</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-headline font-extrabold text-white tracking-tight mb-3">
                EcoRoute <span className="text-primary">AI</span>
              </h1>
              <p className="text-lg md:text-xl text-on-surface-variant font-mono mb-8">
                Navigate smarter. Breathe better.
              </p>

              {/* Illustrated 2D Map Card */}
              <div className="bg-surface-container-low rounded-3xl p-6 border-2 border-outline-variant shadow-[0_12px_40px_rgba(0,0,0,0.5)] mb-8 text-left relative overflow-hidden">
                <p className="text-lg text-white font-medium mb-2">
                  "Navigation tells us how fast we can get there."
                </p>
                <p className="text-sm text-on-surface-variant mb-6">
                  Standard routing engines treat all streets the same — ignoring air pollution, PM2.5 concentration, and urban heat islands that damage long-term respiratory health.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-[#ff7043] text-[28px] mb-2">air</span>
                    <span className="text-sm font-bold text-white">Air Pollution</span>
                    <span className="text-xs font-mono text-on-surface-variant mt-1">PM2.5 · PM10 · AQI</span>
                  </div>
                  <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-[#ffb74d] text-[28px] mb-2">thermostat</span>
                    <span className="text-sm font-bold text-white">Heat Exposure</span>
                    <span className="text-xs font-mono text-on-surface-variant mt-1">Direct UV · Ambient Temp</span>
                  </div>
                  <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-primary text-[28px] mb-2">park</span>
                    <span className="text-sm font-bold text-white">Canopy Shield</span>
                    <span className="text-xs font-mono text-on-surface-variant mt-1">84% Shaded Greenways</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveStep('routes')}
                className="py-4 px-8 rounded-2xl bg-primary text-[#002b18] font-bold text-base shadow-[0_4px_0_#007a4e,0_12px_24px_rgba(0,201,130,0.3)] hover:brightness-105 active:translate-y-1 active:shadow-[0_1px_0_#007a4e] transition-all cursor-pointer inline-flex items-center gap-2"
              >
                START ROUTE DEMONSTRATION →
              </button>
            </div>
          </div>
        )}

        {/* ─── 5. STEP: ONLY ROUTE SCENARIO ─── */}
        {activeStep === 'only-route' && (
          <div className="flex-1 flex flex-col lg:flex-row bg-[#071311] overflow-hidden min-h-[700px]">
            {/* Map View focused on the single route */}
            <div className="flex-1 relative p-6 flex flex-col justify-center items-center">
              <div className="w-full max-w-2xl bg-surface-container-low rounded-3xl p-6 border-2 border-[#ff6b6b] shadow-[0_8px_32px_rgba(255,107,107,0.2)]">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#ff6b6b] text-[22px]">warning</span>
                    <span className="text-sm font-mono font-bold text-[#ff6b6b]">⚠ ONLY PRACTICAL ROUTE SCENARIO</span>
                  </div>
                  <span className="text-xs font-mono text-on-surface-variant">Magadi Rd Arterial</span>
                </div>
                <p className="text-sm text-white mt-4">
                  When infrastructure geography allows only one viable corridor, EcoRoute AI shifts from <strong>route selection</strong> to <strong>departure timing optimization</strong>.
                </p>

                {/* Departure Time Bars */}
                <div className="mt-6 flex flex-col gap-3 font-mono">
                  <div className="text-xs font-bold text-on-surface-variant uppercase">DEPARTURE TIME EXPOSURE CURVE</div>
                  {[
                    { time: '3:00 PM', exp: 72, width: '95%', color: '#ff6b6b', label: 'Heavy Stagnation' },
                    { time: '3:30 PM', exp: 61, width: '80%', color: '#ff7043', label: 'Moderate Traffic' },
                    { time: '4:00 PM', exp: 48, width: '60%', color: '#00C982', label: 'RECOMMENDED (-35%)' },
                    { time: '4:15 PM', exp: 41, width: '50%', color: '#00C982', label: 'Dispersing Smog' },
                  ].map((bar) => (
                    <div key={bar.time} className="flex items-center gap-3">
                      <span className="w-16 text-xs text-white shrink-0">{bar.time}</span>
                      <div className="flex-1 h-6 bg-surface-container rounded-lg overflow-hidden relative">
                        <div
                          className="h-full rounded-lg transition-all duration-500 flex items-center px-2 text-[10px] font-bold text-[#002b18]"
                          style={{ width: bar.width, backgroundColor: bar.color }}
                        >
                          {bar.label}
                        </div>
                      </div>
                      <span className="w-12 text-right text-xs font-bold" style={{ color: bar.color }}>
                        {bar.exp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar info */}
            <aside className="w-full lg:w-[400px] p-6 bg-surface-container-low border-l border-outline-variant/60 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-primary uppercase block mb-2">DECISION ENGINE</span>
                <h2 className="text-xl font-bold text-white mb-3">Timing Shifts Exposure by 35%</h2>
                <p className="text-xs text-on-surface-variant mb-6">
                  Leaving 35 minutes later allows the atmospheric thermal inversion to break, reducing particulate inhalation from 72 → 48.
                </p>
                <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant space-y-3 text-xs">
                  <div className="font-bold text-white uppercase font-mono">Protective Recommendations:</div>
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-primary text-[18px]">masks</span>
                    Wear certified N95 respirator during Magadi corridor passage
                  </div>
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-primary text-[18px]">directions_car</span>
                    Set vehicle ventilation to cabin recirculation mode
                  </div>
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-primary text-[18px]">timer</span>
                    Schedule departure for 4:00 PM for maximum solar dispersion
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveStep('prediction')}
                className="w-full py-3.5 px-4 rounded-2xl bg-primary text-[#002b18] font-bold text-sm shadow-[0_4px_0_#007a4e] hover:brightness-105 active:translate-y-1 transition-all mt-6 cursor-pointer"
              >
                NEXT: AI FORECASTER →
              </button>
            </aside>
          </div>
        )}

        {/* ─── 6. STEP: AI FORECASTER ─── */}
        {activeStep === 'prediction' && (
          <div className="flex-1 p-6 max-w-5xl mx-auto w-full flex flex-col gap-6">
            <div className="text-center">
              <span className="text-xs font-mono font-bold text-primary uppercase">AWS SAGEMAKER MODEL</span>
              <h2 className="text-2xl font-bold text-white mt-1">Living Environmental Model</h2>
              <p className="text-xs text-on-surface-variant">Forecasts PM2.5 and thermal index with 87% confidence</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PM2.5 Forecast Chart */}
              <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant shadow-md">
                <span className="text-xs font-mono font-bold text-white uppercase block mb-3">PM2.5 Forecast (Today)</span>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={DEMO_POLLUTION_TIMESERIES} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="pm25Grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00C982" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#00C982" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#162522" />
                    <XAxis dataKey="hour" tick={{ fill: '#8fa39a', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#8fa39a', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#101c1a', borderColor: '#283a34', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="pm25" stroke="#00C982" fill="url(#pm25Grad)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Model Specifications */}
              <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant shadow-md flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-primary uppercase block mb-3">Model Architecture</span>
                  <div className="space-y-3 text-xs font-mono">
                    <div className="flex justify-between pb-2 border-b border-outline-variant/40">
                      <span className="text-on-surface-variant">Algorithm:</span>
                      <span className="text-white font-bold">XGBoost Non-linear Regressor</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-outline-variant/40">
                      <span className="text-on-surface-variant">Features:</span>
                      <span className="text-white font-bold">Traffic density, wind, humidity, time</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-outline-variant/40">
                      <span className="text-on-surface-variant">Inference Latency:</span>
                      <span className="text-primary font-bold">14ms Serverless</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-outline-variant/40">
                      <span className="text-on-surface-variant">Confidence Score:</span>
                      <span className="text-primary font-bold">87.4% R²</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveStep('aws')}
                  className="w-full py-3 px-4 rounded-xl bg-primary text-[#002b18] font-bold text-xs shadow-[0_3px_0_#007a4e] mt-4 cursor-pointer"
                >
                  NEXT: CLOUD ARCHITECTURE →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── 7. STEP: CLOUD STACK (AWS) ─── */}
        {activeStep === 'aws' && (
          <div className="flex-1 p-6 max-w-5xl mx-auto w-full flex flex-col gap-6">
            <div className="text-center">
              <span className="text-xs font-mono font-bold text-primary uppercase">AWS CLOUD FOUNDATION</span>
              <h2 className="text-2xl font-bold text-white mt-1">Production AWS Architecture</h2>
              <p className="text-xs text-on-surface-variant">Real cloud microservices powering hyper-local routing</p>
            </div>

            {/* Architecture Node Diagram */}
            <div className="bg-surface-container-low rounded-3xl p-6 border-2 border-outline-variant shadow-lg flex items-center justify-around flex-wrap gap-4 font-mono text-center">
              {[
                { name: 'EcoRoute Client', icon: 'devices', sub: 'React 19 SPA' },
                { name: 'API Gateway', icon: 'api', sub: 'REST /route/analyze' },
                { name: 'AWS Lambda', icon: 'bolt', sub: 'Multi-obj A*' },
                { name: 'SageMaker', icon: 'neurology', sub: 'PM2.5 Regressor' },
                { name: 'DynamoDB', icon: 'database', sub: 'Telemetry Cache' },
              ].map((node, i) => (
                <div key={node.name} className="flex items-center gap-4">
                  <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant w-36 shadow-[0_4px_0_#283a34]">
                    <span className="material-symbols-outlined text-primary text-[28px]">{node.icon}</span>
                    <div className="text-xs font-bold text-white mt-1">{node.name}</div>
                    <div className="text-[10px] text-on-surface-variant">{node.sub}</div>
                  </div>
                  {i < 4 && <span className="text-primary font-bold text-lg hidden sm:inline">→</span>}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {DEMO_AWS_SERVICES.map((svc) => (
                <div key={svc.name} className="bg-surface-container rounded-2xl p-3.5 border border-outline-variant">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono">{svc.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                      {svc.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-2 leading-tight">{svc.detail}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveStep('impact')}
              className="py-3.5 px-6 rounded-2xl bg-primary text-[#002b18] font-bold text-sm shadow-[0_4px_0_#007a4e] hover:brightness-105 active:translate-y-1 transition-all mx-auto cursor-pointer"
            >
              NEXT: IMPACT METRICS →
            </button>
          </div>
        )}

        {/* ─── 8. STEP: IMPACT ─── */}
        {activeStep === 'impact' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#071311]">
            <div className="max-w-2xl">
              <span className="text-xs font-mono font-bold text-primary uppercase tracking-widest block mb-4">
                ENVIRONMENTAL IMPACT
              </span>
              <h1 className="text-4xl md:text-5xl font-headline font-black text-white tracking-tight leading-tight mb-4">
                DON'T JUST FIND<br />THE FASTEST WAY THERE.
              </h1>
              <h2 className="text-2xl md:text-3xl font-headline font-bold text-primary mb-8">
                FIND A BETTER WAY THERE.
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-surface-container-low rounded-2xl p-5 border-2 border-primary shadow-[0_4px_0_#007a4e]">
                  <span className="text-4xl font-black font-mono text-primary block">60%</span>
                  <span className="text-xs font-bold text-white mt-1 block">Lower Exposure</span>
                  <span className="text-[10px] font-mono text-on-surface-variant">vs fastest arterial</span>
                </div>
                <div className="bg-surface-container-low rounded-2xl p-5 border-2 border-[#4be2c8] shadow-[0_4px_0_#164d4b]">
                  <span className="text-4xl font-black font-mono text-[#4be2c8] block">33%</span>
                  <span className="text-xs font-bold text-white mt-1 block">Departure Relief</span>
                  <span className="text-[10px] font-mono text-on-surface-variant">via AI forecast</span>
                </div>
                <div className="bg-surface-container-low rounded-2xl p-5 border-2 border-[#ffb74d] shadow-[0_4px_0_#e65100]">
                  <span className="text-4xl font-black font-mono text-[#ffb74d] block">3</span>
                  <span className="text-xs font-bold text-white mt-1 block">Routes Analyzed</span>
                  <span className="text-[10px] font-mono text-on-surface-variant">live 10m mesh</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setActiveStep('routes')}
                  className="py-3 px-6 rounded-xl bg-surface-container border border-outline-variant text-white font-mono text-xs hover:bg-surface-container-high transition-all cursor-pointer"
                >
                  ↺ REPLAY ROUTE DEMO
                </button>
                <Link
                  to="/"
                  className="py-3 px-6 rounded-xl bg-primary text-[#002b18] font-bold text-xs shadow-[0_3px_0_#007a4e] hover:brightness-105 transition-all text-decoration-none"
                >
                  LAUNCH FULL ENGINE →
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─── 9. FOOTER ─── */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/40 py-4 px-5 text-xs font-mono">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-on-surface-variant">
          <div className="flex items-center gap-2 text-white font-bold">
            <span className="material-symbols-outlined text-primary text-[18px]">eco</span>
            EcoRoute AI <span className="text-on-surface-variant font-normal">| 10m Environmental Navigation & Sensor Telemetry</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-primary">AQI • PM2.5 • Canopy • Heat</span>
            <span>© 2025 EcoRoute Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
