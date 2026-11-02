from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from catboost import CatBoostRegressor
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupKFold
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

# Selected by a like-for-like grouped benchmark. Grouping exact input profiles keeps
# duplicate observations out of the validation fold and gives an honest estimate for
# predictions on combinations the model has not seen during training.
CATBOOST_PARAMS = {
    "loss_function": "RMSE",
    "eval_metric": "MAE",
    "iterations": 300,
    "depth": 4,
    "learning_rate": 0.03,
    "l2_leaf_reg": 8.0,
    "random_strength": 0.2,
    "random_seed": RANDOM_STATE,
    "allow_writing_files": False,
    "thread_count": 4,
    "verbose": False,
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


def make_gradient_boosting_baseline() -> Pipeline:
    return Pipeline(
        steps=[
            ("preprocessor", make_preprocessor()),
            (
                "model",
                GradientBoostingRegressor(
                    n_estimators=200,
                    learning_rate=0.03,
                    max_depth=2,
                    min_samples_leaf=5,
                    subsample=0.8,
                    random_state=RANDOM_STATE,
                ),
            ),
        ]
    )


def make_final_model() -> CatBoostRegressor:
    return CatBoostRegressor(**CATBOOST_PARAMS)


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


def grouped_sklearn_predictions(
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


def grouped_catboost_predictions(
    features: pd.DataFrame,
    target: pd.Series,
    groups: pd.Series,
) -> np.ndarray:
    predictions = np.full(len(features), np.nan, dtype=float)
    splitter = GroupKFold(n_splits=OUTER_SPLITS)

    for fold, (train_index, test_index) in enumerate(
        splitter.split(features, target, groups), start=1
    ):
        model = make_final_model()
        model.fit(
            features.iloc[train_index],
            target.iloc[train_index],
            cat_features=CATEGORICAL_FEATURES,
            verbose=False,
        )
        predictions[test_index] = model.predict(features.iloc[test_index])
        print(f"  fold {fold}/{OUTER_SPLITS} complete")

    if np.isnan(predictions).any():
        raise RuntimeError("Some rows did not receive an out-of-fold prediction")
    return predictions


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


def metric_block(
    features: pd.DataFrame,
    target: pd.Series,
    predictions: np.ndarray,
) -> dict:
    return {
        "row_level": regression_metrics(target.to_numpy(), predictions),
        "profile_level": profile_metrics(features, target.to_numpy(), predictions),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the Paddy Atlas yield models")
    parser.add_argument("--data", type=Path, default=DATA_PATH)
    parser.add_argument("--artifacts", type=Path, default=ARTIFACT_DIR)
    args = parser.parse_args()

    features, target, groups, frame = build_training_data(args.data)
    args.artifacts.mkdir(parents=True, exist_ok=True)

    print(f"rows={len(features)} profiles={groups.nunique()} features={len(FEATURES)}")
    print("Evaluating compact ridge baseline...")
    ridge_predictions = grouped_sklearn_predictions(
        make_compact_model(), features, target, groups
    )

    print("Evaluating previous gradient-boosting baseline...")
    gradient_predictions = grouped_sklearn_predictions(
        make_gradient_boosting_baseline(), features, target, groups
    )

    print("Evaluating CatBoost production model...")
    catboost_predictions = grouped_catboost_predictions(features, target, groups)

    print("Refitting CatBoost on all rows...")
    final_model = make_final_model()
    final_model.fit(
        features,
        target,
        cat_features=CATEGORICAL_FEATURES,
        verbose=False,
    )

    residuals = np.abs(target.to_numpy() - catboost_predictions)
    residual_q90 = float(np.quantile(residuals, 0.90))
    group_means = (
        pd.DataFrame({"profile": groups, "target": target})
        .groupby("profile", sort=False)["target"]
        .transform("mean")
        .to_numpy()
    )

    candidate_metrics = {
        "compact_ridge": metric_block(features, target, ridge_predictions),
        "gradient_boosting_baseline": metric_block(
            features, target, gradient_predictions
        ),
        "accurate_catboost": metric_block(features, target, catboost_predictions),
    }
    candidate_metrics["accurate_catboost"].update(
        {
            "interval_90_half_width_kg_per_ha": round(residual_q90, 1),
            "interval_90_coverage": round(float(np.mean(residuals <= residual_q90)), 4),
        }
    )

    comparison = sorted(
        (
            {
                "model": name,
                "row_mae_kg_per_ha": values["row_level"]["mae_kg_per_ha"],
                "profile_mae_kg_per_ha": values["profile_level"]["mae_kg_per_ha"],
            }
            for name, values in candidate_metrics.items()
        ),
        key=lambda item: item["row_mae_kg_per_ha"],
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

    feature_importance = sorted(
        (
            {"feature": name, "importance": round(float(value), 4)}
            for name, value in zip(FEATURES, final_model.get_feature_importance())
        ),
        key=lambda item: item["importance"],
        reverse=True,
    )

    trained_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    metrics = {
        "trained_at": trained_at,
        "target": TARGET,
        "features": FEATURES,
        "validation": {
            "method": "5-fold GroupKFold by exact feature profile",
            "splits": OUTER_SPLITS,
            "reason": "Identical deployable input profiles never cross train/test folds.",
        },
        "data": data_summary,
        **candidate_metrics,
        "model_selection": {
            "selected": "accurate_catboost",
            "selection_metric": "lowest grouped-CV row MAE",
            "comparison": comparison,
        },
        "final_model": {
            "type": "CatBoostRegressor",
            "parameters": CATBOOST_PARAMS,
            "feature_importance": feature_importance,
        },
    }
    schema = build_schema(frame)

    bundle = {
        "pipeline": final_model,
        "model_type": "CatBoostRegressor",
        "features": FEATURES,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "schema": schema,
        "metrics": metrics,
        "interval_90_half_width_kg_per_ha": round(residual_q90, 1),
        "trained_at": trained_at,
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
