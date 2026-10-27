from __future__ import annotations

import unittest

from sklearn.model_selection import GroupKFold

from .data import (
    FEATURES,
    MODEL_PATH,
    SOURCE_TARGET,
    TARGET,
    build_features,
    build_training_data,
)


class FeatureTests(unittest.TestCase):
    def test_features_exclude_target_and_source_totals(self) -> None:
        self.assertNotIn(TARGET, FEATURES)
        self.assertNotIn(SOURCE_TARGET, FEATURES)
        self.assertNotIn("trash", FEATURES)

    def test_build_features_has_only_model_columns(self) -> None:
        _, _, _, frame = build_training_data()
        features = build_features(frame)
        self.assertEqual(list(features.columns), FEATURES)
        self.assertEqual(len(features), len(frame))

    def test_grouped_cv_never_shares_a_profile(self) -> None:
        features, target, groups, _ = build_training_data()
        splitter = GroupKFold(n_splits=5)
        for train_index, test_index in splitter.split(features, target, groups):
            train_groups = set(groups.iloc[train_index])
            test_groups = set(groups.iloc[test_index])
            self.assertTrue(train_groups.isdisjoint(test_groups))


@unittest.skipUnless(MODEL_PATH.exists(), "train the model before running service tests")
class ServiceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from fastapi.testclient import TestClient

        from .service import app

        cls.client = TestClient(app)

    def test_health(self) -> None:
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_predict(self) -> None:
        response = self.client.post(
            "/predict",
            json={
                "hectares": 4,
                "trash": 360,
                "agriblock": "Cuddalore",
                "variety": "CO_43",
                "soil_types": "clay",
                "nursery": "dry",
            },
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertGreater(body["yield_per_ha_kg"], 0)
        self.assertGreater(body["total_yield_kg"], 0)
        lower, upper = body["interval_90_kg_per_ha"]
        self.assertLessEqual(lower, body["yield_per_ha_kg"])
        self.assertLessEqual(body["yield_per_ha_kg"], upper)
        self.assertFalse(body["extrapolation"])

    def test_rejects_unknown_category(self) -> None:
        response = self.client.post(
            "/predict",
            json={
                "hectares": 4,
                "trash": 360,
                "agriblock": "Unknown",
                "variety": "CO_43",
                "soil_types": "clay",
                "nursery": "dry",
            },
        )
        self.assertEqual(response.status_code, 422)

    def test_flags_extrapolation(self) -> None:
        response = self.client.post(
            "/predict",
            json={
                "hectares": 1,
                "trash": 1000,
                "agriblock": "Cuddalore",
                "variety": "CO_43",
                "soil_types": "clay",
                "nursery": "dry",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["extrapolation"])


if __name__ == "__main__":
    unittest.main()
