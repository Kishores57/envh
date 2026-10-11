import React from 'react';
import type { SavedRoute } from '../types';
import { getSavedRoutes } from '../lib/aws';
import { ExposureBadge } from '../components/shared';
import { Clock, MapPin, Navigation, Trash2, Compass } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [routes, setRoutes] = React.useState<SavedRoute[]>(() => getSavedRoutes());

  const deleteRoute = (routeId: string) => {
    const updated = routes.filter(r => r.routeId !== routeId);
    setRoutes(updated);
    localStorage.setItem('eco_saved_routes', JSON.stringify(updated));
  };

  return (
    <div style={{ height: '100%', paddingTop: 64, overflowY: 'auto', background: 'var(--bg-app)', padding: '64px 24px 32px' }}>
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif', margin: '0 0 4px' }}>
            Analysis & Trip History
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Your previously analyzed environmental routes and exposure scores
          </p>
        </div>

        {routes.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
            padding: '48px 24px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-card)',
          }}>
            <Compass size={44} color="#38BDF8" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              No Saved Routes Yet
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320, margin: '0 auto' }}>
              Calculate and save eco routes from the Navigator console to monitor your historical commute exposure.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {routes.map(r => (
              <div
                key={r.routeId}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 14,
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  boxShadow: 'var(--shadow-card)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <MapPin size={13} color="#22C55E" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.origin}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>→</span>
                    <Navigation size={13} color="#38BDF8" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.destination}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ExposureBadge
                      level={r.exposureScore < 30 ? 'low' : r.exposureScore < 55 ? 'moderate' : r.exposureScore < 75 ? 'elevated' : 'high'}
                      size="sm"
                    />
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'capitalize', fontWeight: 600 }}>{r.travelMode}</span>
                    {r.label && <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{r.label}</span>}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0, paddingRight: 8 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                    {r.exposureScore}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>score</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-muted)', flexShrink: 0 }}>
                  <Clock size={12} />
                  <span>{new Date(r.savedAt).toLocaleDateString()}</span>
                </div>

                <button
                  onClick={() => deleteRoute(r.routeId)}
                  aria-label="Delete saved route"
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = '#EF4444';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.1)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
