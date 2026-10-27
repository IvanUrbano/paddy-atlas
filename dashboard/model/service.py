from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

import joblib
import pandas as pd
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .data import CATEGORICAL_FEATURES, FEATURES, MODEL_PATH, TARGET

app = FastAPI(
    title="Paddy Atlas Yield Service",
    description="Predict paddy yield per hectare from observed field conditions.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class PredictionRequest(BaseModel):
    hectares: int = Field(..., ge=1, le=6)
    trash: float = Field(..., gt=0, description="Total trash input, in the dataset's units")
    agriblock: str
    variety: str
    soil_types: str
    nursery: str

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "hectares": 4,
                    "trash": 360,
                    "agriblock": "Cuddalore",
                    "variety": "CO_43",
                    "soil_types": "clay",
                    "nursery": "dry",
                }
            ]
        }
    }


class PredictionResponse(BaseModel):
    yield_per_ha_kg: float
    total_yield_kg: float
    interval_90_kg_per_ha: list[float]
    extrapolation: bool
    warnings: list[str] = Field(default_factory=list)
    model_trained_at: str


def model_path() -> Path:
    return Path(os.environ.get("PADDY_MODEL_PATH", str(MODEL_PATH)))


@lru_cache(maxsize=1)
def load_bundle() -> dict:
    path = model_path()
    if not path.exists():
        raise FileNotFoundError(
            f"Model artifact not found at {path}. "
            "Run: python -m dashboard.model.train"
        )
    return joblib.load(path)


def unavailable(message: str) -> HTTPException:
    return HTTPException(
        status_code=503,
        detail=f"{message} Run: python -m dashboard.model.train",
    )


@app.get("/health")
def health() -> dict:
    try:
        bundle = load_bundle()
    except FileNotFoundError as exc:
        raise unavailable(str(exc)) from exc
    return {
        "status": "ok",
        "target": TARGET,
        "model_trained_at": bundle["trained_at"],
        "features": bundle["features"],
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest) -> PredictionResponse:
    try:
        bundle = load_bundle()
    except FileNotFoundError as exc:
        raise unavailable(str(exc)) from exc

    schema = bundle["schema"]
    values = payload.model_dump()
    warnings: list[str] = []

    for name in CATEGORICAL_FEATURES:
        allowed = schema["categorical"][name]
        value = values[name]
        if value not in allowed:
            raise HTTPException(
                status_code=422,
                detail=f"Unknown {name}={value!r}. Allowed values: {allowed}",
            )

    trash_per_ha = payload.trash / payload.hectares
    bounds = schema["numeric"]["trash_per_ha"]
    extrapolation = not (bounds["min"] <= trash_per_ha <= bounds["max"])
    if extrapolation:
        warnings.append(
            "trash_per_ha is outside the training range "
            f"[{bounds['min']}, {bounds['max']}]; the prediction is an extrapolation."
        )

    row = pd.DataFrame(
        [
            {
                "hectares": payload.hectares,
                "trash_per_ha": trash_per_ha,
                "agriblock": payload.agriblock,
                "variety": payload.variety,
                "soil_types": payload.soil_types,
                "nursery": payload.nursery,
            }
        ],
        columns=FEATURES,
    )

    prediction = float(bundle["pipeline"].predict(row)[0])
    half_width = float(bundle["interval_90_half_width_kg_per_ha"])
    lower = max(0.0, prediction - half_width)

    return PredictionResponse(
        yield_per_ha_kg=round(prediction, 1),
        total_yield_kg=round(prediction * payload.hectares, 1),
        interval_90_kg_per_ha=[round(lower, 1), round(prediction + half_width, 1)],
        extrapolation=extrapolation,
        warnings=warnings,
        model_trained_at=bundle["trained_at"],
    )


if __name__ == "__main__":
    uvicorn.run("dashboard.model.service:app", host="127.0.0.1", port=8000, reload=False)
