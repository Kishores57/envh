import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sun, Moon, CloudSun, Wind, Map, BarChart3, Clock,
  Zap, Menu, X
} from 'lucide-react';
import { PulseIndicator } from './shared';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
  { path: '/',         label: 'Navigate', icon: Map },
  { path: '/routes',   label: 'Routes',   icon: Wind },
  { path: '/insights', label: 'Insights', icon: BarChart3 },
  { path: '/history',  label: 'History',  icon: Clock },
];

export const Navbar: React.FC = () => {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 1000,
      height: '60px',
      background: 'var(--navbar-bg)',
      borderBottom: '1px solid var(--navbar-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      boxShadow: 'var(--shadow-sm)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      transition: 'background-color 0.25s ease, border-color 0.25s ease',
    }}>
      {/* ─── BRAND LOGO ─── */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 24, textDecoration: 'none', flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36,
          borderRadius: 11,
          background: 'linear-gradient(135deg, #38BDF8 0%, #2563EB 50%, #22C55E 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(56, 189, 248, 0.35)',
          flexShrink: 0,
          transition: 'transform 0.2s ease',
        }}
        className="anim-float"
        >
          <CloudSun size={19} color="#FFFFFF" strokeWidth={2.4} />
        </div>
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 17, color: 'var(--text-primary)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 4 }}>
            EcoRoute <span style={{ color: '#38BDF8', fontWeight: 900 }}>AI</span>
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>
            Weather & Air Navigator
          </div>
        </div>
      </Link>

      {/* ─── DESKTOP NAVIGATION ─── */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }} className="hidden md:flex">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = pathname === path;
          return (
            <Link
              key={path}
              to={path}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 13px',
                borderRadius: 9,
                fontSize: 12.5,
                fontWeight: 600,
                textDecoration: 'none',
                letterSpacing: '0.01em',
                transition: 'all 0.15s ease',
                ...(active ? {
                  background: theme === 'dark' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(37, 99, 235, 0.08)',
                  color: theme === 'dark' ? '#38BDF8' : '#2563EB',
                  border: `1.5px solid ${theme === 'dark' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(37, 99, 235, 0.2)'}`,
                  boxShadow: '0 2px 8px rgba(56, 189, 248, 0.12)',
                } : {
                  color: 'var(--text-muted)',
                  border: '1.5px solid transparent',
                }),
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }
              }}
            >
              <Icon size={14} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ─── RIGHT CONTROLS: WEATHER STATUS, THEME TOGGLE, DEMO ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
        
        {/* Live Weather Indicator Pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 20,
          padding: '4px 10px',
          boxShadow: 'var(--shadow-sm)',
        }}
        className="hidden lg:flex"
        >
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            background: 'linear-gradient(135deg, #FACC15, #F97316)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 8px rgba(250, 204, 21, 0.5)',
          }}>
            <Sun size={12} color="#0B1220" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
            28°C
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>•</span>
          <PulseIndicator color="#22C55E" label="Clean Breeze" />
        </div>

        {/* ─── LIGHT / DARK MODE TOGGLE BUTTON ─── */}
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--bg-inset)',
            border: '1.5px solid var(--border-color)',
            borderRadius: 24,
            padding: '4px 10px 4px 6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            color: 'var(--text-primary)',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#38BDF8')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}
        >
          <div style={{
            width: 26, height: 26,
            borderRadius: '50%',
            background: theme === 'dark' ? '#1E293B' : '#FFFFFF',
            border: `1px solid ${theme === 'dark' ? '#334155' : '#E2E8F0'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            transition: 'transform 0.25s ease, background 0.25s ease',
            transform: theme === 'dark' ? 'rotate(0deg)' : 'rotate(180deg)',
          }}>
            {theme === 'dark' ? (
              <Moon size={14} color="#38BDF8" />
            ) : (
              <Sun size={14} color="#FACC15" />
            )}
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
            {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
        </button>

        {/* Demo Mode Button */}
        <Link
          to="/demo"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 700,
            textDecoration: 'none',
            letterSpacing: '0.01em',
            boxShadow: '0 3px 10px rgba(37, 99, 235, 0.35)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 5px 14px rgba(37, 99, 235, 0.45)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = '';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 3px 10px rgba(37, 99, 235, 0.35)';
          }}
        >
          <Zap size={13} color="#FACC15" />
          <span>Demo</span>
        </Link>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 34, height: 34, borderRadius: 8,
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            color: 'var(--text-primary)', cursor: 'pointer',
          }}
          className="flex md:hidden"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* ─── MOBILE DRAWER DROPDOWN ─── */}
      {mobileMenuOpen && (
        <div style={{
          position: 'absolute', top: '60px', left: 0, right: 0,
          background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-elevated)',
          padding: '12px 16px',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}
        className="md:hidden"
        >
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 8,
                fontSize: 13, fontWeight: 600,
                color: pathname === path ? '#38BDF8' : 'var(--text-primary)',
                background: pathname === path ? 'var(--bg-subtle)' : 'transparent',
                textDecoration: 'none',
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
