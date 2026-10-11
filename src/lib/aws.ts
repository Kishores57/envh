/**
 * AWS Services Layer
 * Wraps S3, DynamoDB, Lambda calls with graceful fallback to demo mode.
 */

import type { UserPreferences, SavedRoute, RouteRequest, RouteAnalysisResult } from '../types';
import { getDemoAnalysisResult } from '../data/demoData';

// ─── Config from environment variables ───────────────────────────────────────

const AWS_REGION     = import.meta.env.VITE_AWS_REGION       || 'ap-south-1';
const API_GW_BASE    = import.meta.env.VITE_API_GW_URL        || '';
const S3_BUCKET      = import.meta.env.VITE_S3_BUCKET         || 'ecoroute-ai-data';
const USER_ID        = import.meta.env.VITE_DEMO_USER_ID       || 'demo-user-001';

let _awsAvailable: boolean | null = null;

async function checkAwsAvailability(): Promise<boolean> {
  if (_awsAvailable !== null) return _awsAvailable;
  if (!API_GW_BASE) { _awsAvailable = false; return false; }
  try {
    const res = await fetch(`${API_GW_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    _awsAvailable = res.ok;
  } catch {
    _awsAvailable = false;
  }
  return _awsAvailable;
}

// ─── Route Analysis ───────────────────────────────────────────────────────────

import { calculateRealRoutes, searchPlaces } from './openSourceApi';

export async function analyzeRoute(req: RouteRequest): Promise<RouteAnalysisResult> {
  const awsOk = await checkAwsAvailability();

  // 1. Try AWS Lambda if available AND verify it returned valid geometry
  if (awsOk) {
    try {
      const res = await fetch(`${API_GW_BASE}/analyze-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.routes?.length > 0 && data.routes[0].coordinates?.length > 0) {
          return data;
        }
      }
    } catch (err) {
      console.warn('[EcoRoute] Lambda call failed, falling back to real routing API:', err);
    }
  }

  // 2. Compute dynamic route using OpenStreetMap Nominatim + OSRM + Open-Meteo
  let result: RouteAnalysisResult | null = null;
  try {
    let originCoords = req.originCoords;
    let destCoords = req.destinationCoords;

    if (!originCoords && req.origin) {
      const results = await searchPlaces(req.origin);
      if (results.length > 0) {
        originCoords = { lat: results[0].lat, lng: results[0].lng };
      }
    }

    if (!destCoords && req.destination) {
      const results = await searchPlaces(req.destination);
      if (results.length > 0) {
        destCoords = { lat: results[0].lat, lng: results[0].lng };
      }
    }

    if (originCoords && destCoords) {
      result = await calculateRealRoutes(
        originCoords,
        destCoords,
        req.origin || 'Origin',
        req.destination || 'Destination',
        req.travelMode || 'walking',
        req.priority || 'cleanest'
      );
    }
  } catch (err) {
    console.warn('[EcoRoute] Real routing API error, falling back to demo data:', err);
  }

  // 3. Fallback to rich demo data if no coordinates could be determined
  if (!result) {
    await simulateDelay(600);
    result = getDemoAnalysisResult(req.priority);
  }

  // 4. Record telemetry into AWS DynamoDB & CloudWatch via API Gateway asynchronously
  if (awsOk && API_GW_BASE) {
    fetch(`${API_GW_BASE}/analyze-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: req.origin || 'Origin',
        destination: req.destination || 'Destination',
        priority: req.priority || 'cleanest',
        profile: req.profile || 'general',
        travelMode: req.travelMode || 'walking',
        routeCount: result.routes.length,
        recommendedRouteId: result.recommendedRouteId,
      }),
      signal: AbortSignal.timeout(3000),
    }).catch(() => {});
  }

  return result;
}

// ─── User Preferences (DynamoDB via API) ─────────────────────────────────────

export async function getUserPreferences(): Promise<UserPreferences | null> {
  const awsOk = await checkAwsAvailability();
  if (awsOk) {
    try {
      const res = await fetch(`${API_GW_BASE}/preferences/${USER_ID}`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return await res.json();
    } catch {}
  }
  // Return default preferences
  return {
    userId: USER_ID,
    profile: 'student',
    travelMode: 'walking',
    preferredPriority: 'cleanest',
    savedRoutes: [],
    updatedAt: new Date().toISOString(),
  };
}

export async function saveUserPreferences(prefs: Partial<UserPreferences>): Promise<void> {
  const awsOk = await checkAwsAvailability();
  if (awsOk) {
    try {
      await fetch(`${API_GW_BASE}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, ...prefs }),
        signal: AbortSignal.timeout(3000),
      });
    } catch {}
  }
  // Store locally as fallback
  localStorage.setItem('eco_prefs', JSON.stringify({ ...prefs, updatedAt: new Date().toISOString() }));
}

// ─── Save Route (DynamoDB) ────────────────────────────────────────────────────

export async function saveRoute(route: SavedRoute): Promise<void> {
  const awsOk = await checkAwsAvailability();
  if (awsOk) {
    try {
      await fetch(`${API_GW_BASE}/routes/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, ...route }),
        signal: AbortSignal.timeout(3000),
      });
      return;
    } catch {}
  }
  // LocalStorage fallback
  const existing = JSON.parse(localStorage.getItem('eco_saved_routes') || '[]') as SavedRoute[];
  existing.unshift(route);
  localStorage.setItem('eco_saved_routes', JSON.stringify(existing.slice(0, 20)));
}

export function getSavedRoutes(): SavedRoute[] {
  return JSON.parse(localStorage.getItem('eco_saved_routes') || '[]');
}

// ─── S3 Demo Data ─────────────────────────────────────────────────────────────

export function getS3DataPath(key: string): string {
  return `s3://${S3_BUCKET}/${key}`;
}

export const S3_PATHS = {
  raw:       `s3://${S3_BUCKET}/raw/`,
  processed: `s3://${S3_BUCKET}/processed/`,
  models:    `s3://${S3_BUCKET}/models/`,
  demo:      `s3://${S3_BUCKET}/demo/`,
};

// ─── Utility ──────────────────────────────────────────────────────────────────

function simulateDelay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

export { AWS_REGION, API_GW_BASE, S3_BUCKET };
