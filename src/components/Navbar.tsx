import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wind, LayoutDashboard, Map, BarChart3, Clock, Zap } from 'lucide-react';
import { PulseIndicator } from './shared';

const NAV_ITEMS = [
  { path: '/',        label: 'Dashboard', icon: LayoutDashboard },
  { path: '/routes',  label: 'Routes',    icon: Map },
  { path: '/insights',label: 'Insights',  icon: BarChart3 },
  { path: '/history', label: 'History',   icon: Clock },
];

export const Navbar: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 glass-card border-b border-slate-800/60 border-x-0 border-t-0 rounded-none flex items-center px-6">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 mr-8">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-eco-500 to-teal-500 flex items-center justify-center glow-eco">
          <Wind size={16} className="text-white" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-display font-bold text-base text-gradient">EcoRoute AI</span>
          <span className="text-[10px] text-slate-500 -mt-0.5">Navigate Smarter. Breathe Better.</span>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex items-center gap-1 flex-1">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-eco-500/10 text-eco-400 border border-eco-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon size={14} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <PulseIndicator color="#22c55e" label="Environmental data" />
        <Link
          to="/demo"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-eco-600 to-teal-600 text-white text-sm font-semibold hover:from-eco-500 hover:to-teal-500 transition-all duration-200"
        >
          <Zap size={14} />
          Demo Mode
        </Link>
        <span className="text-xs text-slate-600 border border-slate-700/50 px-2 py-1 rounded">
          v1.0.0
        </span>
      </div>
    </header>
  );
};
