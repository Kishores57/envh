"""
EcoRoute AI – SageMaker Training Script
Trains a lightweight XGBoost model to predict PM2.5 given:
  - hour of day
  - day of week
  - historical PM2.5 (lagged)
  - temperature
  - is_weekday

Model artifacts are saved to S3 for deployment as a SageMaker endpoint.
"""

import argparse
import json
import logging
import os
import pickle
from datetime import datetime, timezone

import numpy as np

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def generate_training_data(n_samples: int = 5000):
    """
    Generate synthetic but realistic training data.
    In production, replace this with CPCB / OpenAQ historical data from S3.
    """
    np.random.seed(42)
    hours      = np.random.randint(0, 24, n_samples)
    days       = np.random.randint(0, 7, n_samples)
    is_weekday = (days < 5).astype(float)
    temps      = 22 + 12 * np.sin(np.pi * hours / 24) + np.random.normal(0, 2, n_samples)

    # PM2.5 pattern: high in morning rush (8-10) and evening rush (17-20)
    pm25_base = (
        30 +
        20 * np.exp(-((hours - 8.5) ** 2) / 4) +   # morning peak
        18 * np.exp(-((hours - 18.5) ** 2) / 4) +   # evening peak
        10 * is_weekday +                              # weekday penalty
        0.3 * temps +                                  # temperature correlation
        np.random.normal(0, 8, n_samples)              # noise
    )
    pm25 = np.clip(pm25_base, 5, 180)

    X = np.column_stack([hours, days, is_weekday, temps, np.roll(pm25, 1)])
    y = pm25
    return X, y


def train(args):
    logger.info("Starting PM2.5 forecast model training")

    X, y = generate_training_data()
    split = int(len(X) * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    # Use XGBoost if available, else simple linear regression fallback
    try:
        import xgboost as xgb
        model = xgb.XGBRegressor(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
        )
        model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=50)
        model_type = "xgboost"
    except ImportError:
        logger.warning("XGBoost not available, using sklearn RandomForest")
        from sklearn.ensemble import RandomForestRegressor
        model = RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42)
        model.fit(X_train, y_train)
        model_type = "random_forest"

    # Evaluate
    y_pred = model.predict(X_test)
    rmse = float(np.sqrt(np.mean((y_pred - y_test) ** 2)))
    mae  = float(np.mean(np.abs(y_pred - y_test)))
    logger.info("Model evaluation: RMSE=%.2f MAE=%.2f type=%s", rmse, mae, model_type)

    # Save model
    model_dir = args.model_dir
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(model, f)

    # Save metadata
    meta = {
        "model_type": model_type,
        "features":   ["hour", "day_of_week", "is_weekday", "temperature", "pm25_lag1"],
        "target":     "pm25",
        "rmse":       rmse,
        "mae":        mae,
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }
    with open(os.path.join(model_dir, "metadata.json"), "w") as f:
        json.dump(meta, f, indent=2)

    logger.info("Model saved to %s", model_path)
    return rmse, mae


def predict(hour: int, day: int, temp: float, pm25_lag: float) -> float:
    """Standalone predict function used by Lambda inference wrapper."""
    model_path = os.environ.get("MODEL_PATH", "/opt/ml/model/model.pkl")
    if not os.path.exists(model_path):
        # Fallback formula if model not available
        morning_rush = 20 * np.exp(-((hour - 8.5) ** 2) / 4)
        evening_rush = 18 * np.exp(-((hour - 18.5) ** 2) / 4)
        is_weekday = float(day < 5)
        return float(np.clip(30 + morning_rush + evening_rush + 10 * is_weekday + 0.3 * temp, 5, 180))

    with open(model_path, "rb") as f:
        model = pickle.load(f)
    features = np.array([[hour, day, float(day < 5), temp, pm25_lag]])
    return float(model.predict(features)[0])


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model-dir", type=str, default=os.environ.get("SM_MODEL_DIR", "/opt/ml/model"))
    args = parser.parse_args()
    rmse, mae = train(args)
    print(f"Training complete | RMSE={rmse:.2f} | MAE={mae:.2f}")
