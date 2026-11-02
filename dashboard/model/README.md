# Paddy Yield Prediction Model

The production model predicts paddy yield per hectare from the fields available at
prediction time: farm area, agriblock, variety, soil type, nursery method, and trash
per hectare. The target is calculated as `paddy_yield / hectares`.

## Why CatBoost

The dataset contains a mix of categorical and numeric variables and many repeated
input profiles. A grouped five-fold benchmark compared Ridge, gradient boosting,
random forest, extra trees, and CatBoost models. CatBoost depth 4 produced the lowest
out-of-fold row-level MAE and the best profile-level accuracy, so it is the deployed
model. CatBoost also handles the categorical variables directly instead of relying on
wide one-hot encoded inputs.

Validation uses `GroupKFold` over exact deployable feature profiles. Identical input
profiles therefore cannot appear in both training and validation data. This prevents
duplicate-profile leakage and is stricter than a random row split.

## Train and test

From the repository root:

```powershell
python -m pip install -r dashboard/model/requirements.txt
python -m dashboard.model.train
python -m unittest dashboard.model.test_model -v
```

Training writes the deployable bundle, validation metrics, and request schema to
`dashboard/model/artifacts/`. The API continues to load `model.joblib`, so existing
`/health` and `/predict` clients remain compatible.

The recorded metrics are predictive validation results, not proof that any input
causes yield to change. Weather variables in the source file were not used because
they have limited between-plot variation and are not part of the current prediction
request.
