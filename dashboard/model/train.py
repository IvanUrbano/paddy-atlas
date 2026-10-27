from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GridSearchCV, GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from .data import (
    ARTIFACT_DIR,
    CATEGORICAL_FEATURES,
    DATA_PATH,
    FEATURES,
    METRICS_PATH,
    MODEL_PATH,
    NUMERIC_FEATURES,
    SCHEMA_PATH,
    TARGET,
    build_training_data,
    row_signature,
)

RANDOM_STATE = 42
OUTER_SPLITS = 5
INNER_SPLITS = 4

FINAL_PARAM_GRID = {
    "model__n_estimators": [200, 300],
    "model__learning_rate": [0.03, 0.05],
}


def make_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("numeric", StandardScaler(), NUMERIC_FEATURES),
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES,
            ),
        ]
    )


def make_compact_model() -> Pipeline:
    return Pipeline(
        steps=[
            ("preprocessor", make_preprocessor()),
            ("model", Ridge(alpha=10.0)),
        ]
    )


def make_final_model() -> Pipeline:
    return Pipeline(
        steps=[
            ("preprocessor", make_preprocessor()),
            (
                "model",
                GradientBoostingRegressor(
                    n_estimators=300,
                    learning_rate=0.03,
                    max_depth=2,
                    min_samples_leaf=5,
                    subsample=0.8,
                    random_state=RANDOM_STATE,
                ),
            ),
        ]
    )


def regression_metrics(actual: np.ndarray, predicted: np.ndarray) -> dict[str, float]:
    actual = np.asarray(actual, dtype=float)
    predicted = np.asarray(predicted, dtype=float)
    return {
        "r2": round(float(r2_score(actual, predicted)), 4),
        "rmse_kg_per_ha": round(float(mean_squared_error(actual, predicted) ** 0.5), 1),
        "mae_kg_per_ha": round(float(mean_absolute_error(actual, predicted)), 1),
        "mape_pct": round(float(np.mean(np.abs((actual - predicted) / actual)) * 100), 2),
    }


def profile_metrics(
    features: pd.DataFrame, actual: np.ndarray, predicted: np.ndarray
) -> dict[str, float]:
    frame = pd.DataFrame(
        {
            "profile": row_signature(features).to_numpy(),
            "actual": np.asarray(actual, dtype=float),
            "predicted": np.asarray(predicted, dtype=float),
        }
    )
    grouped = frame.groupby("profile", sort=False).agg(
        actual=("actual", "mean"),
        predicted=("predicted", "mean"),
    )
    return {
        **regression_metrics(grouped["actual"].to_numpy(), grouped["predicted"].to_numpy()),
        "profiles": int(len(grouped)),
    }


def grouped_predictions(
    estimator: Pipeline,
    features: pd.DataFrame,
    target: pd.Series,
    groups: pd.Series,
) -> np.ndarray:
    predictions = np.full(len(features), np.nan, dtype=float)
    splitter = GroupKFold(n_splits=OUTER_SPLITS)

    for fold, (train_index, test_index) in enumerate(
        splitter.split(features, target, groups), start=1
    ):
        model = clone(estimator)
        model.fit(features.iloc[train_index], target.iloc[train_index])
        predictions[test_index] = model.predict(features.iloc[test_index])
        print(f"  fold {fold}/{OUTER_SPLITS} complete")

    if np.isnan(predictions).any():
        raise RuntimeError("Some rows did not receive an out-of-fold prediction")
    return predictions


def nested_predictions(
    features: pd.DataFrame,
    target: pd.Series,
    groups: pd.Series,
) -> tuple[np.ndarray, list[dict[str, float]]]:
    predictions = np.full(len(features), np.nan, dtype=float)
    outer = GroupKFold(n_splits=OUTER_SPLITS)
    inner = GroupKFold(n_splits=INNER_SPLITS)
    selected: list[dict[str, float]] = []

    for fold, (train_index, test_index) in enumerate(
        outer.split(features, target, groups), start=1
    ):
        search = GridSearchCV(
            estimator=make_final_model(),
            param_grid=FINAL_PARAM_GRID,
            scoring="neg_mean_absolute_error",
            cv=inner,
            n_jobs=1,
            refit=True,
            error_score="raise",
        )
        search.fit(
            features.iloc[train_index],
            target.iloc[train_index],
            groups=groups.iloc[train_index],
        )
        predictions[test_index] = search.predict(features.iloc[test_index])
        selected.append(
            {
                "fold": fold,
                "n_estimators": int(search.best_params_["model__n_estimators"]),
                "learning_rate": float(search.best_params_["model__learning_rate"]),
                "inner_mae_kg_per_ha": round(float(-search.best_score_), 1),
            }
        )
        print(
            f"  fold {fold}/{OUTER_SPLITS}: "
            f"{search.best_params_['model__n_estimators']} trees, "
            f"lr={search.best_params_['model__learning_rate']}"
        )

    if np.isnan(predictions).any():
        raise RuntimeError("Some rows did not receive an out-of-fold prediction")
    return predictions, selected


def fit_final_model(
    features: pd.DataFrame, target: pd.Series, groups: pd.Series
) -> tuple[Pipeline, dict[str, float]]:
    search = GridSearchCV(
        estimator=make_final_model(),
        param_grid=FINAL_PARAM_GRID,
        scoring="neg_mean_absolute_error",
        cv=GroupKFold(n_splits=OUTER_SPLITS),
        n_jobs=1,
        refit=True,
        error_score="raise",
    )
    search.fit(features, target, groups=groups)
    params = {
        "n_estimators": int(search.best_params_["model__n_estimators"]),
        "learning_rate": float(search.best_params_["model__learning_rate"]),
        "inner_mae_kg_per_ha": round(float(-search.best_score_), 1),
    }
    return search.best_estimator_, params


def build_schema(frame: pd.DataFrame) -> dict:
    return {
        "target": TARGET,
        "features": FEATURES,
        "numeric": {
            name: {
                "min": round(float(frame[name].min()), 2),
                "max": round(float(frame[name].max()), 2),
            }
            for name in NUMERIC_FEATURES
        },
        "categorical": {
            name: sorted(frame[name].dropna().unique().tolist())
            for name in CATEGORICAL_FEATURES
        },
        "raw_inputs": {
            "hectares": {
                "min": round(float(frame["hectares"].min()), 2),
                "max": round(float(frame["hectares"].max()), 2),
            },
            "trash": {
                "min": round(float(frame["trash"].min()), 2),
                "max": round(float(frame["trash"].max()), 2),
            },
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the Paddy Atlas yield models")
    parser.add_argument("--data", type=Path, default=DATA_PATH)
    parser.add_argument("--artifacts", type=Path, default=ARTIFACT_DIR)
    args = parser.parse_args()

    features, target, groups, frame = build_training_data(args.data)
    args.artifacts.mkdir(parents=True, exist_ok=True)

    print(f"rows={len(features)} profiles={groups.nunique()} features={len(FEATURES)}")
    print("Training compact ridge baseline...")
    compact_predictions = grouped_predictions(make_compact_model(), features, target, groups)

    print("Training accurate gradient-boosted model with grouped nested CV...")
    accurate_predictions, selected_folds = nested_predictions(features, target, groups)

    print("Selecting final hyperparameters and refitting on all rows...")
    final_pipeline, selected_params = fit_final_model(features, target, groups)

    residuals = np.abs(target.to_numpy() - accurate_predictions)
    residual_q90 = float(np.quantile(residuals, 0.90))
    group_means = (
        pd.DataFrame({"profile": groups, "target": target})
        .groupby("profile", sort=False)["target"]
        .transform("mean")
        .to_numpy()
    )

    data_summary = {
        "rows": int(len(features)),
        "unique_feature_profiles": int(groups.nunique()),
        "target_mean_kg_per_ha": round(float(target.mean()), 1),
        "target_std_kg_per_ha": round(float(target.std()), 1),
        "within_profile_std_kg_per_ha": round(
            float(
                pd.DataFrame({"profile": groups, "target": target})
                .groupby("profile", sort=False)["target"]
                .std()
                .mean()
            ),
            1,
        ),
        "feature_profile_ceiling_r2": round(float(r2_score(target, group_means)), 4),
    }

    metrics = {
        "trained_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "target": TARGET,
        "features": FEATURES,
        "validation": {
            "method": "GroupKFold by exact feature profile",
            "outer_splits": OUTER_SPLITS,
            "inner_splits": INNER_SPLITS,
        },
        "data": data_summary,
        "compact_ridge": {
            "row_level": regression_metrics(target, compact_predictions),
            "profile_level": profile_metrics(features, target, compact_predictions),
        },
        "accurate_gradient_boosting": {
            "row_level": regression_metrics(target, accurate_predictions),
            "profile_level": profile_metrics(features, target, accurate_predictions),
            "selected_folds": selected_folds,
            "interval_90_half_width_kg_per_ha": round(residual_q90, 1),
            "interval_90_coverage": round(float(np.mean(residuals <= residual_q90)), 4),
        },
        "final_model": selected_params,
    }
    schema = build_schema(frame)

    bundle = {
        "pipeline": final_pipeline,
        "features": FEATURES,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "schema": schema,
        "metrics": metrics,
        "interval_90_half_width_kg_per_ha": round(residual_q90, 1),
        "trained_at": metrics["trained_at"],
    }

    joblib.dump(bundle, args.artifacts / MODEL_PATH.name)
    (args.artifacts / METRICS_PATH.name).write_text(
        json.dumps(metrics, indent=2), encoding="utf-8"
    )
    (args.artifacts / SCHEMA_PATH.name).write_text(
        json.dumps(schema, indent=2), encoding="utf-8"
    )

    print(json.dumps(metrics, indent=2))
    print(f"Saved model bundle to {args.artifacts / MODEL_PATH.name}")


if __name__ == "__main__":
    main()
