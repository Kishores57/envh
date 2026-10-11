import { Routes, Route, useLocation } from 'react-router-dom';
import { useState, useCallback } from 'react';
import type { AppState, RouteRequest } from './types';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { RoutesPage } from './pages/RoutesPage';
import { InsightsPage } from './pages/InsightsPage';
import { HistoryPage } from './pages/HistoryPage';
import { DemoPage } from './pages/DemoPage';

const DEFAULT_REQUEST: RouteRequest = {
  origin: '',
  destination: '',
  departureTime: (() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    return d.toISOString();
  })(),
  travelMode: 'walking',
  profile: 'student',
  priority: 'cleanest',
  isSchoolMode: false,
};

const INITIAL_STATE: AppState = {
  request: DEFAULT_REQUEST,
  result: null,
  selectedRouteId: null,
  selectedSegmentId: null,
  isAnalyzing: false,
  activeView: 'dashboard',
  isDemoMode: false,
  awsStatus: [],
};

function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const location = useLocation();
  const isDemo = location.pathname === '/demo';

  const handleStateChange = useCallback((partial: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const handleSelectRoute = useCallback((id: string) => {
    setState(prev => ({ ...prev, selectedRouteId: id }));
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-app)', color: 'var(--text-primary)', transition: 'background-color 0.25s ease' }}>
      {!isDemo && <Navbar />}
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/"        element={<Dashboard state={state} onStateChange={handleStateChange} />} />
          <Route path="/routes"  element={<RoutesPage state={state} onSelectRoute={handleSelectRoute} />} />
          <Route path="/insights" element={<InsightsPage state={state} />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/demo"    element={<DemoPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
