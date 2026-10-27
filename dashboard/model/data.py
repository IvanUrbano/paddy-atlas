from __future__ import annotations

from pathlib import Path

import pandas as pd

MODEL_DIR = Path(__file__).resolve().parent
DASHBOARD_DIR = MODEL_DIR.parent
DATA_PATH = DASHBOARD_DIR / "data" / "raw" / "paddydataset_cleaned.csv"
ARTIFACT_DIR = MODEL_DIR / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "model.joblib"
METRICS_PATH = ARTIFACT_DIR / "metrics.json"
SCHEMA_PATH = ARTIFACT_DIR / "schema.json"

SOURCE_TARGET = "paddy_yield"
TARGET = "yield_per_ha"

NUMERIC_FEATURES = ["trash_per_ha"]
CATEGORICAL_FEATURES = ["hectares", "agriblock", "variety", "soil_types", "nursery"]
FEATURES = CATEGORICAL_FEATURES + NUMERIC_FEATURES

REQUIRED_COLUMNS = {
    "hectares",
    "trash",
    "agriblock",
    "variety",
    "soil_types",
    "nursery",
    SOURCE_TARGET,
}


def load_frame(path: Path = DATA_PATH) -> pd.DataFrame:
    frame = pd.read_csv(path)
    missing = REQUIRED_COLUMNS.difference(frame.columns)
    if missing:
        raise ValueError(f"Missing required columns: {sorted(missing)}")
    if frame[list(REQUIRED_COLUMNS)].isna().any().any():
        raise ValueError("Required columns contain missing values")
    if (frame["hectares"] <= 0).any():
        raise ValueError("hectares must be positive")

    frame = frame.copy()
    frame[TARGET] = frame[SOURCE_TARGET] / frame["hectares"]
    frame["trash_per_ha"] = frame["trash"] / frame["hectares"]
    return frame


def build_features(frame: pd.DataFrame) -> pd.DataFrame:
    """Return predictors only. Target columns are never included."""
    return frame[FEATURES].copy()


def build_training_data(
    path: Path = DATA_PATH,
) -> tuple[pd.DataFrame, pd.Series, pd.Series, pd.DataFrame]:
    frame = load_frame(path)
    features = build_features(frame)
    target = frame[TARGET].astype(float)
    groups = row_signature(features)
    return features, target, groups, frame


def row_signature(features: pd.DataFrame) -> pd.Series:
    """Group identical feature profiles so CV cannot leak duplicates."""
    return features[FEATURES].astype(str).agg("|".join, axis=1)
