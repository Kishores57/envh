import React from 'react';
import type { SavedRoute } from '../types';
import { getSavedRoutes } from '../lib/aws';
import { ExposureBadge } from '../components/shared';
import { Clock, MapPin, Navigation, Trash2, BookOpen } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [routes, setRoutes] = React.useState<SavedRoute[]>(() => getSavedRoutes());

  const deleteRoute = (routeId: string) => {
    const updated = routes.filter(r => r.routeId !== routeId);
    setRoutes(updated);
    localStorage.setItem('eco_saved_routes', JSON.stringify(updated));
  };

  return (
    <div className="h-full pt-14 overflow-y-auto bg-dark-900 px-6 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-slate-100 mb-1">Analysis History</h1>
          <p className="text-sm text-slate-500">Your previously analyzed routes</p>
        </div>

        {routes.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <BookOpen size={40} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 mb-2">No saved routes yet</p>
            <p className="text-sm text-slate-600">Analyze a route and save it to see it here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {routes.map(r => (
              <div key={r.routeId} className="glass-card p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <MapPin size={12} className="text-eco-400 flex-shrink-0" />
                    <span className="text-xs text-slate-400 truncate">{r.origin}</span>
                    <span className="text-slate-600">→</span>
                    <Navigation size={12} className="text-blue-400 flex-shrink-0" />
                    <span className="text-xs text-slate-400 truncate">{r.destination}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ExposureBadge
                      level={r.exposureScore < 30 ? 'low' : r.exposureScore < 55 ? 'moderate' : r.exposureScore < 75 ? 'elevated' : 'high'}
                      size="sm"
                    />
                    <span className="text-xs text-slate-500 capitalize">{r.travelMode}</span>
                    {r.label && <span className="text-xs text-slate-500">{r.label}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 mr-3">
                  <div className="text-lg font-bold text-slate-200">{r.exposureScore}</div>
                  <div className="text-xs text-slate-500">score</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 flex-shrink-0">
                  <Clock size={11} />
                  {new Date(r.savedAt).toLocaleDateString()}
                </div>
                <button
                  onClick={() => deleteRoute(r.routeId)}
                  className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
