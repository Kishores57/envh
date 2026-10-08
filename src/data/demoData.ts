/**
 * EcoRoute AI – Demo Data Engine
 * Deterministic, polished demo data for the Home→College scenario.
 * Works completely offline – no external APIs required.
 */

import type {
  RouteAnalysisResult,
  Route,
  RouteSegment,
  DepartureTimeOption,
  EnvironmentalConditions,
  PollutionTimeSeriesPoint,
} from '../types';

// ─── Demo Coordinates (Bengaluru: Home→RVCE) ─────────────────────────────────

export const DEMO_ORIGIN = 'Rajajinagar, Bengaluru';
export const DEMO_DESTINATION = 'RV College of Engineering, Bengaluru';

export const DEMO_ORIGIN_COORDS = { lat: 12.9914, lng: 77.5502 };
export const DEMO_DEST_COORDS   = { lat: 12.9232, lng: 77.4988 };

// ─── Helper ───────────────────────────────────────────────────────────────────

function seg(
  id: string,
  index: number,
  coords: [number, number][],
  dist: number,
  dur: number,
  street: string,
  type: RouteSegment['segmentType'],
  pm25: number,
  temp: number,
  shade: number,
  green: number,
  isHotspot: boolean,
  reason?: string,
  pollSource?: string,
): RouteSegment {
  const airExp = Math.min(100, (pm25 / 120) * 100);
  const heatExp = Math.min(100, Math.max(0, ((temp - 24) / 16) * 100));
  const shadeBonus = shade * 0.1;
  const overall = Math.round(airExp * 0.55 + heatExp * 0.35 - shadeBonus);
  const level = overall < 30 ? 'low' : overall < 55 ? 'moderate' : overall < 75 ? 'elevated' : 'high';
  return {
    id, index,
    coordinates: coords.map(([lat, lng]) => ({ lat, lng })),
    distanceMeters: dist, durationSeconds: dur,
    streetName: street, segmentType: type,
    pm25, pm10: Math.round(pm25 * 1.6),
    temperature: temp, heatIndex: Math.round(temp + (temp * 0.1)),
    shadeScore: shade, greenScore: green,
    airExposureScore: Math.round(airExp),
    heatExposureScore: Math.round(heatExp),
    overallExposureScore: Math.max(0, overall),
    exposureLevel: level as RouteSegment['exposureLevel'],
    isHotspot, hotspotReason: reason, pollutionSource: pollSource,
  };
}

// ─── Route A: Fastest (High Pollution) ───────────────────────────────────────

const routeASegments: RouteSegment[] = [
  seg('a1', 0, [[12.9914,77.5502],[12.9890,77.5480]], 320, 180, 'Rajajinagar Main Rd', 'arterial', 68, 34, 15, 10, false),
  seg('a2', 1, [[12.9890,77.5480],[12.9860,77.5430]], 500, 240, 'Magadi Rd Corridor', 'highway', 92, 36, 5, 5, true, 'Heavy traffic corridor – peak vehicle emissions', 'Vehicle exhaust'),
  seg('a3', 2, [[12.9860,77.5430],[12.9820,77.5380]], 420, 200, 'Chord Rd', 'arterial', 85, 35, 10, 8, true, 'Busy intersection near industrial area', 'Traffic & industrial'),
  seg('a4', 3, [[12.9820,77.5380],[12.9760,77.5280]], 580, 280, 'Outer Ring Rd', 'highway', 78, 35, 8, 12, false),
  seg('a5', 4, [[12.9760,77.5280],[12.9650,77.5120]], 700, 340, 'Mysuru Rd Flyover', 'highway', 72, 34, 5, 10, false),
  seg('a6', 5, [[12.9650,77.5120],[12.9500,77.5020]], 480, 230, 'NICE Rd approach', 'highway', 60, 33, 12, 15, false),
  seg('a7', 6, [[12.9500,77.5020],[12.9350,77.4990]], 380, 180, 'RV Campus Rd', 'residential', 45, 31, 30, 35, false),
  seg('a8', 7, [[12.9350,77.4990],[12.9232,77.4988]], 220, 110, 'RV College Gate', 'school_zone', 38, 30, 40, 45, false),
];

const ROUTE_A: Route = {
  id: 'route-a',
  name: 'Route A – Magadi Road',
  label: 'fastest',
  color: '#ef4444',
  coordinates: routeASegments.flatMap(s => s.coordinates),
  segments: routeASegments,
  totalDistanceMeters: 3600,
  totalDurationSeconds: 1080, // 18 min
  airScore: 78,
  heatScore: 74,
  shadeScore: 12,
  overallExposureScore: 78,
  exposureLevel: 'high',
  avgPm25: 74,
  avgTemperature: 34,
  maxPm25Segment: routeASegments[1],
  hotspotCount: 2,
  isRecommended: false,
  isOnlyRoute: false,
  recommendationReason: [],
  weights: { time: 0.60, air: 0.20, heat: 0.15, shade: 0.05 },
};

// ─── Route B: Recommended (Low Pollution) ─────────────────────────────────────

const routeBSegments: RouteSegment[] = [
  seg('b1', 0, [[12.9914,77.5502],[12.9930,77.5450]], 280, 210, 'Rajajinagar 4th Block', 'residential', 38, 30, 55, 60, false),
  seg('b2', 1, [[12.9930,77.5450],[12.9900,77.5380]], 350, 290, 'BEL Rd – Green Corridor', 'residential', 28, 29, 70, 75, false),
  seg('b3', 2, [[12.9900,77.5380],[12.9840,77.5280]], 420, 350, 'Malleswaram Stretch', 'residential', 32, 29, 65, 70, false),
  seg('b4', 3, [[12.9840,77.5280],[12.9750,77.5150]], 500, 400, 'Kuvempu Rd Park Zone', 'park', 22, 28, 85, 90, false),
  seg('b5', 4, [[12.9750,77.5150],[12.9620,77.5050]], 480, 380, 'Chord Rd Service Lane', 'residential', 35, 29, 55, 50, false),
  seg('b6', 5, [[12.9620,77.5050],[12.9450,77.4980]], 400, 320, 'Nayandanahalli Rd', 'residential', 40, 30, 40, 35, false),
  seg('b7', 6, [[12.9450,77.4980],[12.9300,77.4970]], 320, 260, 'RV Campus approach', 'residential', 30, 28, 50, 55, false),
  seg('b8', 7, [[12.9300,77.4970],[12.9232,77.4988]], 250, 200, 'RV College Gate', 'school_zone', 25, 27, 60, 65, false),
];

const ROUTE_B: Route = {
  id: 'route-b',
  name: 'Route B – Green Corridor',
  label: 'recommended',
  color: '#22c55e',
  coordinates: routeBSegments.flatMap(s => s.coordinates),
  segments: routeBSegments,
  totalDistanceMeters: 3000,
  totalDurationSeconds: 1320, // 22 min
  airScore: 31,
  heatScore: 28,
  shadeScore: 62,
  overallExposureScore: 31,
  exposureLevel: 'low',
  avgPm25: 31,
  avgTemperature: 29,
  maxPm25Segment: routeBSegments[0],
  hotspotCount: 0,
  isRecommended: true,
  isOnlyRoute: false,
  recommendationReason: [
    'Lowest estimated PM2.5 exposure (avg 31 µg/m³ vs 74 µg/m³ on fastest route)',
    'Avoids high-traffic Magadi Rd corridor',
    'Passes through Kuvempu Rd park zone with 85% shade coverage',
    'Lower heat exposure due to tree-lined residential streets',
    'Only 4 extra minutes vs fastest route',
  ],
  weights: { time: 0.15, air: 0.60, heat: 0.15, shade: 0.10 },
};

// ─── Route C: Balanced ────────────────────────────────────────────────────────

const routeCSegments: RouteSegment[] = [
  seg('c1', 0, [[12.9914,77.5502],[12.9895,77.5470]], 300, 220, 'Rajajinagar Circle', 'residential', 52, 32, 30, 25, false),
  seg('c2', 1, [[12.9895,77.5470],[12.9855,77.5400]], 380, 270, 'Chord Rd West', 'arterial', 65, 33, 20, 18, true, 'Moderate traffic corridor', 'Traffic'),
  seg('c3', 2, [[12.9855,77.5400],[12.9790,77.5300]], 450, 310, 'Vijayanagar Rd', 'arterial', 58, 32, 25, 22, false),
  seg('c4', 3, [[12.9790,77.5300],[12.9680,77.5160]], 520, 350, 'Subramanya Nagar', 'residential', 40, 30, 45, 48, false),
  seg('c5', 4, [[12.9680,77.5160],[12.9500,77.5050]], 460, 300, 'Banashankari Rd', 'residential', 35, 29, 40, 42, false),
  seg('c6', 5, [[12.9500,77.5050],[12.9350,77.4985]], 350, 240, 'RV Campus Road', 'residential', 30, 28, 50, 55, false),
  seg('c7', 6, [[12.9350,77.4985],[12.9232,77.4988]], 240, 170, 'RV College Gate', 'school_zone', 26, 27, 60, 62, false),
];

const ROUTE_C: Route = {
  id: 'route-c',
  name: 'Route C – Vijayanagar',
  label: 'balanced',
  color: '#f59e0b',
  coordinates: routeCSegments.flatMap(s => s.coordinates),
  segments: routeCSegments,
  totalDistanceMeters: 2700,
  totalDurationSeconds: 1200, // 20 min
  airScore: 46,
  heatScore: 42,
  shadeScore: 38,
  overallExposureScore: 46,
  exposureLevel: 'moderate',
  avgPm25: 44,
  avgTemperature: 30,
  maxPm25Segment: routeCSegments[1],
  hotspotCount: 1,
  isRecommended: false,
  isOnlyRoute: false,
  recommendationReason: [],
  weights: { time: 0.30, air: 0.30, heat: 0.25, shade: 0.15 },
};

// ─── Environmental Conditions ─────────────────────────────────────────────────

const DEMO_ENV_CONDITIONS: EnvironmentalConditions = {
  airQuality: {
    pm25: 68,
    pm10: 112,
    aqi: 142,
    o3: 38,
    no2: 42,
    co: 0.8,
    source: 'demo',
    timestamp: new Date().toISOString(),
  },
  weather: {
    temperature: 33,
    feelsLike: 36,
    humidity: 58,
    windSpeed: 12,
    windDirection: 225,
    uvIndex: 8,
    heatIndex: 38,
    source: 'demo',
    timestamp: new Date().toISOString(),
  },
  aqiCategory: 'Unhealthy for Sensitive Groups',
  aqiColor: '#f97316',
  overallRisk: 'elevated',
};

// ─── Departure Time Options ───────────────────────────────────────────────────

function makeDepartureOptions(baseHour: number): DepartureTimeOption[] {
  const now = new Date();
  now.setHours(baseHour, 0, 0, 0);

  const options = [
    { label: 'Now (3:00 PM)',   offset: 0,   exp: 72, pm25: 68, temp: 34 },
    { label: '+30 min (3:30)', offset: 30,  exp: 61, pm25: 58, temp: 34 },
    { label: '+1 hr (4:00)',   offset: 60,  exp: 48, pm25: 45, temp: 33 },
    { label: '+2 hr (5:00)',   offset: 120, exp: 55, pm25: 50, temp: 32 },
  ];

  return options.map((o, i) => {
    const t = new Date(now.getTime() + o.offset * 60000);
    return {
      label: o.label,
      offsetMinutes: o.offset,
      departureTime: t.toISOString(),
      exposureScore: o.exp,
      pm25: o.pm25,
      temperature: o.temp,
      recommendation: i === 2 ? 'Recommended — estimated 33% lower exposure' : undefined,
      isBest: i === 2,
    };
  });
}

// ─── Full Demo Analysis Result ────────────────────────────────────────────────

export function getDemoAnalysisResult(_priority: string = 'cleanest'): RouteAnalysisResult {
  const routes = [ROUTE_A, ROUTE_B, ROUTE_C];
  const depOptions = makeDepartureOptions(15);

  return {
    routes,
    recommendedRouteId: 'route-b',
    isOnlyPracticalRoute: false,
    onlyRouteAnalysis: {
      hotspotSegments: [routeASegments[1], routeASegments[2]],
      mainContributors: ['Heavy vehicle traffic on Magadi Rd', 'Diesel emissions from KSRTC bus depot', 'Construction dust near Chord Rd junction'],
      bestDepartureTime: depOptions[2],
      exposureReductionPercent: 33,
      practicalSuggestions: [
        'Wear an N95 or equivalent mask through the 500m traffic corridor',
        'Keep windows closed and use cabin air filtration if driving',
        'Hydrate well – high heat and pollution compound each other',
        'If walking, use shaded footpaths along BEL Rd extension',
        'Avoid the 8–9 AM peak hour if commuting to school',
      ],
    },
    departureTimeOptions: depOptions,
    environmentalConditions: DEMO_ENV_CONDITIONS,
    analysisTimestamp: new Date().toISOString(),
    dataSource: 'demo',
  };
}

// ─── Only-Route Demo (single route scenario) ──────────────────────────────────

export function getOnlyRouteDemoResult(): RouteAnalysisResult {
  const onlyRoute: Route = {
    ...ROUTE_A,
    id: 'only-route',
    name: 'Only Practical Route – Magadi Rd',
    label: 'fastest',
    isOnlyRoute: true,
    isRecommended: true,
    recommendationReason: ['This is the only practical route available'],
  };

  const depOptions = makeDepartureOptions(8); // 8 AM scenario

  return {
    routes: [onlyRoute],
    recommendedRouteId: 'only-route',
    isOnlyPracticalRoute: true,
    onlyRouteAnalysis: {
      hotspotSegments: [routeASegments[1], routeASegments[2]],
      mainContributors: ['Heavy vehicle traffic on Magadi Rd', 'Diesel bus depot emissions', 'Construction dust near Chord Rd'],
      bestDepartureTime: { ...depOptions[2], label: '+35 min (8:35 AM)', exposureScore: 44, pm25: 40 },
      exposureReductionPercent: 35,
      practicalSuggestions: [
        'Wear an N95 mask through the 500m traffic corridor on Magadi Rd',
        'Keep vehicle windows closed and enable cabin air recirculation',
        'Avoid standing at intersections during prolonged red lights',
        'Hydrate before and during travel – heat amplifies pollution effects',
        'Consider cycling the last 1km via the green corridor near RV campus',
      ],
    },
    departureTimeOptions: depOptions,
    environmentalConditions: {
      ...DEMO_ENV_CONDITIONS,
      airQuality: { ...DEMO_ENV_CONDITIONS.airQuality, pm25: 82, aqi: 175 },
      overallRisk: 'high',
    },
    analysisTimestamp: new Date().toISOString(),
    dataSource: 'demo',
  };
}

// ─── Pollution Time Series ────────────────────────────────────────────────────

export const DEMO_POLLUTION_TIMESERIES: PollutionTimeSeriesPoint[] = [
  { hour: '6 AM',  pm25: 55, pm10: 90,  aqi: 110 },
  { hour: '7 AM',  pm25: 72, pm10: 118, aqi: 148 },
  { hour: '8 AM',  pm25: 88, pm10: 142, aqi: 182 },
  { hour: '9 AM',  pm25: 82, pm10: 132, aqi: 170 },
  { hour: '10 AM', pm25: 68, pm10: 110, aqi: 142 },
  { hour: '11 AM', pm25: 60, pm10: 98,  aqi: 124 },
  { hour: '12 PM', pm25: 62, pm10: 100, aqi: 128 },
  { hour: '1 PM',  pm25: 65, pm10: 106, aqi: 134 },
  { hour: '2 PM',  pm25: 70, pm10: 114, aqi: 144 },
  { hour: '3 PM',  pm25: 68, pm10: 110, aqi: 140 },
  { hour: '4 PM',  pm25: 48, pm10: 78,  aqi: 98,  predicted: true },
  { hour: '5 PM',  pm25: 75, pm10: 122, aqi: 154, predicted: true },
  { hour: '6 PM',  pm25: 80, pm10: 130, aqi: 165, predicted: true },
  { hour: '7 PM',  pm25: 62, pm10: 100, aqi: 128, predicted: true },
  { hour: '8 PM',  pm25: 45, pm10: 72,  aqi: 92,  predicted: true },
];

// ─── AWS Architecture Data ────────────────────────────────────────────────────

export const DEMO_AWS_SERVICES = [
  { name: 'Amazon S3',         service: 'S3',          status: 'active',   detail: 's3://ecoroute-ai-data' },
  { name: 'AWS Lambda',        service: 'Lambda',      status: 'active',   detail: 'routeAnalysis, exposureAnalysis, hotspotAnalysis' },
  { name: 'API Gateway',       service: 'APIGateway',  status: 'active',   detail: 'POST /analyze-route, /exposure, /hotspots' },
  { name: 'Amazon DynamoDB',   service: 'DynamoDB',    status: 'active',   detail: 'UserPreferences, SavedRoutes, AnalysisHistory' },
  { name: 'Amazon SageMaker',  service: 'SageMaker',   status: 'fallback', detail: 'PM2.5 regression model – endpoint deploying' },
  { name: 'Amazon CloudWatch', service: 'CloudWatch',  status: 'active',   detail: 'Lambda metrics, API errors, execution monitoring' },
] as const;
