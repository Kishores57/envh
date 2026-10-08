import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wind, LayoutDashboard, Map, BarChart3, Clock, Zap } from 'lucide-react';
import { PulseIndicator } from './shared';

const NAV_ITEMS = [
  { path: '/',         label: 'Navigate', icon: LayoutDashboard },
  { path: '/routes',   label: 'Routes',   icon: Map },
  { path: '/insights', label: 'Insights', icon: BarChart3 },
  { path: '/history',  label: 'History',  icon: Clock },
];

export const Navbar: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <header style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 1000,
      height: '56px',
      background: 'rgba(7, 17, 15, 0.97)',
      borderBottom: '1.5px solid #29423B',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 0,
      boxShadow: '0 4px 0 rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.4)',
      backdropFilter: 'blur(20px)',
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 28, textDecoration: 'none', flexShrink: 0 }}>
        <div style={{
          width: 34, height: 34,
          borderRadius: 10,
          background: 'linear-gradient(145deg, #00C982, #00a06a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 3px 0 #006b47, 0 6px 20px rgba(0, 201, 130, 0.3)',
          border: '1px solid rgba(0, 201, 130, 0.4)',
          flexShrink: 0,
        }}>
          <Wind size={16} color="#07110F" strokeWidth={2.5} />
        </div>
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 16, color: '#F4F7F5', letterSpacing: '-0.02em' }}>
            EcoRoute <span style={{ background: 'linear-gradient(135deg, #00C982, #16D99A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
          </div>
          <div style={{ fontSize: 9, color: '#516860', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 1 }}>
            Navigate Smarter. Breathe Better.
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = pathname === path;
          return (
            <Link
              key={path}
              to={path}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
                letterSpacing: '0.01em',
                transition: 'all 0.15s ease',
                ...(active ? {
                  background: 'rgba(0, 201, 130, 0.08)',
                  color: '#00C982',
                  border: '1.5px solid rgba(0, 201, 130, 0.2)',
                  boxShadow: '0 2px 8px rgba(0, 201, 130, 0.08)',
                } : {
                  color: '#81938D',
                  border: '1.5px solid transparent',
                }),
              }}
            >
              <Icon size={13} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <PulseIndicator color="#00C982" label="Live data" />
        <Link
          to="/demo"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px',
            borderRadius: 9,
            background: 'linear-gradient(145deg, #00C982, #009e68)',
            color: '#07110F',
            fontSize: 12,
            fontWeight: 700,
            textDecoration: 'none',
            letterSpacing: '0.02em',
            boxShadow: '0 3px 0 #006b47, 0 6px 16px rgba(0, 201, 130, 0.25)',
            transition: 'transform 0.12s, box-shadow 0.12s',
          }}
          onMouseOver={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 0 #006b47, 0 8px 24px rgba(0, 201, 130, 0.35)';
          }}
          onMouseOut={e => {
            (e.currentTarget as HTMLElement).style.transform = '';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 3px 0 #006b47, 0 6px 16px rgba(0, 201, 130, 0.25)';
          }}
        >
          <Zap size={13} />
          Demo Mode
        </Link>
        <span style={{
          fontSize: 10, color: '#516860', fontWeight: 700,
          border: '1px solid #1E332E', padding: '3px 7px', borderRadius: 5,
          fontFamily: 'Space Mono, monospace',
        }}>
          v1.0.0
        </span>
      </div>
    </header>
  );
};
