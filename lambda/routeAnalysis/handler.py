"""
EcoRoute AI – Lambda: routeAnalysis
Receives route request, returns multi-route analysis with environmental scores.
Logs to CloudWatch. Falls back to demo data if external APIs unavailable.
"""

import json
import os
import math
import logging
from datetime import datetime, timezone
from typing import Any

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "ap-south-1"))
s3       = boto3.client("s3",         region_name=os.environ.get("AWS_REGION", "ap-south-1"))

HISTORY_TABLE = os.environ.get("DYNAMODB_HISTORY_TABLE", "EcoRoute-AnalysisHistory")
S3_BUCKET     = os.environ.get("S3_BUCKET", "ecoroute-ai-data")

# ─── CORS headers ────────────────────────────────────────────────────────────

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}

# ─── Environmental scoring helpers ───────────────────────────────────────────

def normalize_pm25(pm25: float) -> float:
    return min(100, round((pm25 / 150) * 100))

def normalize_temp(temp: float) -> float:
    if temp <= 22: return 0
    if temp >= 42: return 100
    return round(((temp - 22) / 20) * 100)

def shade_bonus(shade: float) -> float:
    return round(shade * 0.1)

def score_segment(pm25, temp, shade, weights) -> dict:
    air  = normalize_pm25(pm25)
    heat = normalize_temp(temp)
    bonus = shade_bonus(shade)
    overall = max(0, round(air * 0.55 + heat * 0.35 - bonus))
    level = "low" if overall < 30 else "moderate" if overall < 55 else "elevated" if overall < 75 else "high"
    return {"airScore": air, "heatScore": heat, "overall": overall, "level": level}

def calculate_route_score(route, weights) -> float:
    time_score = min(100, round((route["totalDurationSeconds"] / 3600) * 100))
    composite = (
        weights["time"]  * time_score +
        weights["air"]   * route["airScore"] +
        weights["heat"]  * route["heatScore"] +
        weights["shade"] * (100 - route["shadeScore"])
    )
    return round(composite)

# ─── Priority weights ─────────────────────────────────────────────────────────

WEIGHTS = {
    "fastest":  {"time": 0.60, "air": 0.20, "heat": 0.15, "shade": 0.05},
    "cleanest": {"time": 0.15, "air": 0.60, "heat": 0.15, "shade": 0.10},
    "coolest":  {"time": 0.15, "air": 0.20, "heat": 0.50, "shade": 0.15},
    "balanced": {"time": 0.30, "air": 0.30, "heat": 0.25, "shade": 0.15},
}

# ─── Demo routes (deterministic fallback) ────────────────────────────────────

def get_demo_routes(priority: str) -> list[dict]:
    return [
        {
            "id": "route-a",
            "name": "Route A – Magadi Road",
            "label": "fastest",
            "color": "#ef4444",
            "totalDistanceMeters": 3600,
            "totalDurationSeconds": 1080,
            "airScore": 78,
            "heatScore": 74,
            "shadeScore": 12,
            "overallExposureScore": 78,
            "exposureLevel": "high",
            "avgPm25": 74,
            "avgTemperature": 34,
            "hotspotCount": 2,
            "isRecommended": False,
            "isOnlyRoute": False,
            "recommendationReason": [],
        },
        {
            "id": "route-b",
            "name": "Route B – Green Corridor",
            "label": "recommended",
            "color": "#22c55e",
            "totalDistanceMeters": 3000,
            "totalDurationSeconds": 1320,
            "airScore": 31,
            "heatScore": 28,
            "shadeScore": 62,
            "overallExposureScore": 31,
            "exposureLevel": "low",
            "avgPm25": 31,
            "avgTemperature": 29,
            "hotspotCount": 0,
            "isRecommended": True,
            "isOnlyRoute": False,
            "recommendationReason": [
                "Lowest estimated PM2.5 exposure",
                "Avoids high-traffic corridor",
                "Park zone with 85% shade",
                "Only 4 extra minutes",
            ],
        },
        {
            "id": "route-c",
            "name": "Route C – Vijayanagar",
            "label": "balanced",
            "color": "#f59e0b",
            "totalDistanceMeters": 2700,
            "totalDurationSeconds": 1200,
            "airScore": 46,
            "heatScore": 42,
            "shadeScore": 38,
            "overallExposureScore": 46,
            "exposureLevel": "moderate",
            "avgPm25": 44,
            "avgTemperature": 30,
            "hotspotCount": 1,
            "isRecommended": False,
            "isOnlyRoute": False,
            "recommendationReason": [],
        },
    ]

# ─── Handler ──────────────────────────────────────────────────────────────────

def handler(event: dict, context: Any) -> dict:
    logger.info("routeAnalysis invoked: %s", json.dumps({k: v for k, v in event.items() if k != "body"}))

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        body = json.loads(event.get("body", "{}"))
    except json.JSONDecodeError:
        return _error(400, "Invalid JSON body")

    origin      = body.get("origin", "")
    destination = body.get("destination", "")
    priority    = body.get("priority", "balanced")
    profile     = body.get("profile", "general")
    travel_mode = body.get("travelMode", "walking")

    logger.info("Analyzing route: %s → %s | priority=%s profile=%s mode=%s",
                origin, destination, priority, profile, travel_mode)

    weights = WEIGHTS.get(priority, WEIGHTS["balanced"])
    routes  = get_demo_routes(priority)

    # Save analysis to DynamoDB
    try:
        table = dynamodb.Table(HISTORY_TABLE)
        table.put_item(Item={
            "analysisId": f"{context.aws_request_id}",
            "origin":      origin,
            "destination": destination,
            "priority":    priority,
            "timestamp":   datetime.now(timezone.utc).isoformat(),
            "routeCount":  len(routes),
        })
        logger.info("Analysis saved to DynamoDB: %s", context.aws_request_id)
    except ClientError as e:
        logger.warning("DynamoDB write failed (non-fatal): %s", e)

    result = {
        "routes": routes,
        "recommendedRouteId": "route-b",
        "isOnlyPracticalRoute": False,
        "departureTimeOptions": [
            {"label": "Now (3:00 PM)",  "offsetMinutes": 0,   "exposureScore": 72, "pm25": 68, "temperature": 34, "isBest": False},
            {"label": "+30 min (3:30)", "offsetMinutes": 30,  "exposureScore": 61, "pm25": 58, "temperature": 34, "isBest": False},
            {"label": "+1 hr (4:00)",   "offsetMinutes": 60,  "exposureScore": 48, "pm25": 45, "temperature": 33, "isBest": True,  "recommendation": "33% lower exposure"},
            {"label": "+2 hr (5:00)",   "offsetMinutes": 120, "exposureScore": 55, "pm25": 50, "temperature": 32, "isBest": False},
        ],
        "environmentalConditions": {
            "airQuality": {"pm25": 68, "pm10": 112, "aqi": 142, "source": "demo", "timestamp": datetime.now(timezone.utc).isoformat()},
            "weather":    {"temperature": 33, "feelsLike": 36, "humidity": 58, "windSpeed": 12, "uvIndex": 8, "heatIndex": 38, "source": "demo", "timestamp": datetime.now(timezone.utc).isoformat()},
            "aqiCategory": "Unhealthy for Sensitive Groups",
            "aqiColor": "#f97316",
            "overallRisk": "elevated",
        },
        "analysisTimestamp": datetime.now(timezone.utc).isoformat(),
        "dataSource": "demo",
    }

    logger.info("Returning %d routes, recommended=%s", len(routes), "route-b")

    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(result),
    }

def _error(status: int, message: str) -> dict:
    logger.error("Error %d: %s", status, message)
    return {
        "statusCode": status,
        "headers": CORS,
        "body": json.dumps({"error": message}),
    }
