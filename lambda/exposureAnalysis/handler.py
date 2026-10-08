"""
EcoRoute AI – Lambda: exposureAnalysis
Calculates per-segment and route-level environmental exposure scores.
"""

import json
import logging
import math
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger()
logger.setLevel(logging.INFO)

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}

def normalize_pm25(pm25: float) -> float:
    return min(100.0, round((max(0, pm25) / 150) * 100, 1))

def normalize_temp(temp: float) -> float:
    if temp <= 22: return 0.0
    if temp >= 42: return 100.0
    return round(((temp - 22) / 20) * 100, 1)

def exposure_level(score: float) -> str:
    if score < 30: return "low"
    if score < 55: return "moderate"
    if score < 75: return "elevated"
    return "high"

def handler(event: dict, context: Any) -> dict:
    logger.info("exposureAnalysis invoked")

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        body = json.loads(event.get("body", "{}"))
    except json.JSONDecodeError:
        return _error(400, "Invalid JSON body")

    segments = body.get("segments", [])
    if not segments:
        return _error(400, "No segments provided")

    results = []
    for seg in segments:
        pm25  = float(seg.get("pm25", 0))
        temp  = float(seg.get("temperature", 25))
        shade = float(seg.get("shadeScore", 0))

        air   = normalize_pm25(pm25)
        heat  = normalize_temp(temp)
        bonus = round(shade * 0.1, 1)
        overall = max(0, round(air * 0.55 + heat * 0.35 - bonus, 1))

        results.append({
            "segmentId": seg.get("id"),
            "airExposureScore":     air,
            "heatExposureScore":    heat,
            "overallExposureScore": overall,
            "exposureLevel":        exposure_level(overall),
            "isHotspot":            overall > 70,
        })

    # Route-level aggregation
    if results:
        avg_overall = round(sum(r["overallExposureScore"] for r in results) / len(results), 1)
        route_level = exposure_level(avg_overall)
    else:
        avg_overall = 0
        route_level = "low"

    response = {
        "segments":           results,
        "routeExposureScore": avg_overall,
        "routeLevel":         route_level,
        "hotspotCount":       sum(1 for r in results if r["isHotspot"]),
        "timestamp":          datetime.now(timezone.utc).isoformat(),
    }

    logger.info("Exposure calculated: %d segments, route score=%.1f", len(results), avg_overall)
    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(response),
    }

def _error(status: int, message: str) -> dict:
    logger.error("Error %d: %s", status, message)
    return {"statusCode": status, "headers": CORS, "body": json.dumps({"error": message})}
