// ─── Route & Navigation Types ────────────────────────────────────────────────

export type TravelMode = 'walking' | 'cycling' | 'driving';

export type UserProfile = 'student' | 'outdoor_worker' | 'cyclist' | 'general';

export type RoutePriority = 'fastest' | 'cleanest' | 'coolest' | 'balanced';

export type ExposureLevel = 'low' | 'moderate' | 'elevated' | 'high';

export interface Coordinates {
  lat: number;
  lng: number;
}

// ─── Environmental Data Types ─────────────────────────────────────────────────

export interface AirQualityData {
  pm25: number;        // µg/m³
  pm10: number;        // µg/m³
  aqi: number;         // 0–500
  o3?: number;         // ppb
  no2?: number;        // ppb
  co?: number;         // ppm
  source: 'live' | 'demo' | 'predicted';
  timestamp: string;
}

export interface WeatherData {
  temperature: number;    // °C
  feelsLike: number;      // °C
  humidity: number;       // %
  windSpeed: number;      // km/h
  windDirection: number;  // degrees
  uvIndex: number;
  heatIndex: number;
  source: 'live' | 'demo' | 'predicted';
  timestamp: string;
}

// ─── Route Segment ────────────────────────────────────────────────────────────

export interface RouteSegment {
  id: string;
  index: number;
  coordinates: Coordinates[];
  distanceMeters: number;
  durationSeconds: number;
  streetName?: string;
  segmentType: 'residential' | 'arterial' | 'highway' | 'park' | 'school_zone';

  // Environmental
  pm25: number;
  pm10: number;
  temperature: number;
  heatIndex: number;
  shadeScore: number;       // 0–100, higher = more shade
  greenScore: number;       // 0–100

  // Derived
  airExposureScore: number; // 0–100
  heatExposureScore: number;
  overallExposureScore: number;
  exposureLevel: ExposureLevel;

  // Hotspot
  isHotspot: boolean;
  hotspotReason?: string;
  pollutionSource?: string;
}

// ─── Full Route ───────────────────────────────────────────────────────────────

export interface Route {
  id: string;
  name: string;
  label: 'fastest' | 'recommended' | 'balanced' | 'alternative';
  color: string;

  // Geometry
  coordinates: Coordinates[];
  segments: RouteSegment[];

  // Timing
  totalDistanceMeters: number;
  totalDurationSeconds: number;

  // Environmental scores (0–100, lower is better)
  airScore: number;
  heatScore: number;
  shadeScore: number;
  overallExposureScore: number;
  exposureLevel: ExposureLevel;

  // Breakdown
  avgPm25: number;
  avgTemperature: number;
  maxPm25Segment?: RouteSegment;
  hotspotCount: number;

  // Metadata
  isRecommended: boolean;
  isOnlyRoute: boolean;
  recommendationReason: string[];

  // Priority weights applied
  weights: PriorityWeights;
}

// ─── Priority & Weights ───────────────────────────────────────────────────────

export interface PriorityWeights {
  time: number;
  air: number;
  heat: number;
  shade: number;
}

export const PRIORITY_WEIGHTS: Record<RoutePriority, PriorityWeights> = {
  fastest:  { time: 0.60, air: 0.20, heat: 0.15, shade: 0.05 },
  cleanest: { time: 0.15, air: 0.60, heat: 0.15, shade: 0.10 },
  coolest:  { time: 0.15, air: 0.20, heat: 0.50, shade: 0.15 },
  balanced: { time: 0.30, air: 0.30, heat: 0.25, shade: 0.15 },
};

// ─── Route Request / Response ─────────────────────────────────────────────────

export interface RouteRequest {
  origin: string;
  originCoords?: Coordinates;
  destination: string;
  destinationCoords?: Coordinates;
  departureTime: string;   // ISO timestamp
  travelMode: TravelMode;
  profile: UserProfile;
  priority: RoutePriority;
  isSchoolMode?: boolean;
}

export interface RouteAnalysisResult {
  routes: Route[];
  recommendedRouteId: string;
  isOnlyPracticalRoute: boolean;
  onlyRouteAnalysis?: OnlyRouteAnalysis;
  departureTimeOptions: DepartureTimeOption[];
  environmentalConditions: EnvironmentalConditions;
  analysisTimestamp: string;
  dataSource: 'live' | 'demo' | 'mixed';
}

// ─── Only-Route Scenario ──────────────────────────────────────────────────────

export interface OnlyRouteAnalysis {
  hotspotSegments: RouteSegment[];
  mainContributors: string[];
  bestDepartureTime: DepartureTimeOption;
  exposureReductionPercent: number;
  practicalSuggestions: string[];
}

// ─── Departure Time Analysis ──────────────────────────────────────────────────

export interface DepartureTimeOption {
  label: string;
  offsetMinutes: number;
  departureTime: string;
  exposureScore: number;
  pm25: number;
  temperature: number;
  recommendation?: string;
  isBest: boolean;
}

// ─── Environmental Conditions ─────────────────────────────────────────────────

export interface EnvironmentalConditions {
  airQuality: AirQualityData;
  weather: WeatherData;
  aqiCategory: string;
  aqiColor: string;
  overallRisk: ExposureLevel;
}

// ─── User Preferences (DynamoDB) ─────────────────────────────────────────────

export interface UserPreferences {
  userId: string;
  profile: UserProfile;
  travelMode: TravelMode;
  preferredPriority: RoutePriority;
  homeAddress?: string;
  workAddress?: string;
  schoolAddress?: string;
  savedRoutes?: SavedRoute[];
  updatedAt: string;
}

export interface SavedRoute {
  routeId: string;
  origin: string;
  destination: string;
  exposureScore: number;
  travelMode: TravelMode;
  savedAt: string;
  label?: string;
}

// ─── AWS Status ───────────────────────────────────────────────────────────────

export interface AWSServiceStatus {
  name: string;
  service: 'S3' | 'Lambda' | 'DynamoDB' | 'SageMaker' | 'CloudWatch' | 'APIGateway';
  status: 'active' | 'fallback' | 'disabled';
  lastPing?: string;
  detail?: string;
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export interface AppState {
  request: RouteRequest;
  result: RouteAnalysisResult | null;
  selectedRouteId: string | null;
  selectedSegmentId: string | null;
  isAnalyzing: boolean;
  activeView: 'dashboard' | 'routes' | 'insights' | 'history' | 'demo';
  isDemoMode: boolean;
  awsStatus: AWSServiceStatus[];
}

// ─── Chart Data ───────────────────────────────────────────────────────────────

export interface PollutionTimeSeriesPoint {
  hour: string;
  pm25: number;
  pm10: number;
  aqi: number;
  predicted?: boolean;
}

export interface RouteComparisonData {
  route: string;
  time: number;
  airScore: number;
  heatScore: number;
  exposureScore: number;
  color: string;
}
