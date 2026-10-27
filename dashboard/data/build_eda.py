from pathlib import Path
import json

import pandas as pd
from scipy import stats as sst

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "raw" / "paddydataset.csv"
CLEAN = ROOT / "raw" / "paddydataset_cleaned.csv"
OUT = ROOT.parent / "frontend" / "public" / "data" / "eda.json"

WINDOWS = [
    {
        "key": "d1_d30",
        "label": "D1–30",
        "rain": "30drain",
        "irrigation": "30dai",
        "min": "min_temp_d1_d30",
        "max": "max_temp_d1_d30",
        "humidity": "relative_humidity_d1_d30",
        "wind": "inst_wind_speed_d1_d30",
    },
    {
        "key": "d31_d60",
        "label": "D31–60",
        "rain": "30_50drain",
        "irrigation": "30_50dai",
        "min": "min_temp_d31_d60",
        "max": "max_temp_d31_d60",
        "humidity": "relative_humidity_d31_d60",
        "wind": "inst_wind_speed_d31_d60",
    },
    {
        "key": "d61_d90",
        "label": "D61–90",
        "rain": "51_70drain",
        "irrigation": "51_70ai",
        "min": "min_temp_d61_d90",
        "max": "max_temp_d61_d90",
        "humidity": "relative_humidity_d61_d90",
        "wind": "inst_wind_speed_d61_d90",
    },
    {
        "key": "d91_d120",
        "label": "D91–120",
        "rain": "71_105drain",
        "irrigation": "71_105dai",
        "min": "min_temp_d91_d120",
        "max": "max_temp_d91_d120",
        "humidity": "relative_humidity_d91_d120",
        "wind": "inst_wind_speed_d91_d120",
    },
]


def tidy(raw: pd.DataFrame) -> pd.DataFrame:
    frame = raw.copy()
    frame.columns = (
        frame.columns.str.strip()
        .str.replace(r"\s*\(.*?\)", "", regex=True)
        .str.replace(" ", "_")
        .str.lower()
    )
    return frame


def stats(series: pd.Series) -> dict:
    return {
        "min": round(float(series.min()), 2),
        "q1": round(float(series.quantile(0.25)), 2),
        "median": round(float(series.median()), 2),
        "q3": round(float(series.quantile(0.75)), 2),
        "max": round(float(series.max()), 2),
        "mean": round(float(series.mean()), 2),
        "std": round(float(series.std()), 2),
    }


def anova(frame: pd.DataFrame, group: str, value: str) -> dict:
    groups = [subset[value].to_numpy() for _, subset in frame.groupby(group)]
    f_stat, p_value = sst.f_oneway(*groups)
    grand = float(frame[value].mean())
    ss_between = sum(len(values) * (float(values.mean()) - grand) ** 2 for values in groups)
    ss_total = float(((frame[value] - grand) ** 2).sum())
    return {
        "f": round(float(f_stat), 3),
        "p": round(float(p_value), 6),
        "etaSquared": round(ss_between / ss_total, 4) if ss_total else 0.0,
        "groups": len(groups),
    }


def weather(frame: pd.DataFrame) -> list[dict]:
    result = []
    for window in WINDOWS:
        result.append(
            {
                "key": window["key"],
                "label": window["label"],
                "rain": round(float(frame[window["rain"]].mean()), 1),
                "irrigation": round(float(frame[window["irrigation"]].mean()), 1),
                "minTemp": round(float(frame[window["min"]].mean()), 1),
                "maxTemp": round(float(frame[window["max"]].mean()), 1),
                "humidity": round(float(frame[window["humidity"]].mean()), 1),
                "wind": round(float(frame[window["wind"]].mean()), 1),
            }
        )
    return result


def main() -> None:
    raw = tidy(pd.read_csv(RAW))
    clean = pd.read_csv(CLEAN)

    duplicates = int(raw.duplicated().sum())
    deduped = raw.drop_duplicates().reset_index(drop=True)
    if len(deduped) != len(clean):
        raise SystemExit(f"row mismatch: deduped raw {len(deduped)} vs cleaned {len(clean)}")

    engineered = int(clean.shape[1] - raw.shape[1])
    clean["yield_per_ha"] = clean["paddy_yield"] / clean["hectares"]

    blocks = sorted(clean["agriblock"].unique().tolist())
    varieties = sorted(clean["variety"].unique().tolist())
    soils = sorted(clean["soil_types"].unique().tolist())
    nurseries = sorted(clean["nursery"].unique().tolist())

    weather_by_block = {}
    for block in blocks:
        subset = clean.loc[clean["agriblock"] == block]
        weather_by_block[block] = weather(subset)

    clean["rain_total"] = clean[["30drain", "30_50drain", "51_70drain", "71_105drain"]].sum(axis=1)
    clean["humidity_mean"] = clean[
        [
            "relative_humidity_d1_d30",
            "relative_humidity_d31_d60",
            "relative_humidity_d61_d90",
            "relative_humidity_d91_d120",
        ]
    ].mean(axis=1)
    clean["wind_mean"] = clean[
        [
            "inst_wind_speed_d1_d30",
            "inst_wind_speed_d31_d60",
            "inst_wind_speed_d61_d90",
            "inst_wind_speed_d91_d120",
        ]
    ].mean(axis=1)
    clean["temp_range_mean"] = clean[
        ["temp_range_d1_d30", "temp_range_d31_d60", "temp_range_d61_d90", "temp_range_d91_d120"]
    ].mean(axis=1)

    block_index = {name: index for index, name in enumerate(blocks)}
    variety_index = {name: index for index, name in enumerate(varieties)}
    soil_index = {name: index for index, name in enumerate(soils)}
    nursery_index = {name: index for index, name in enumerate(nurseries)}

    rows = []
    export_columns = [
        "hectares",
        "paddy_yield",
        "seedrate",
        "dap_20days",
        "urea_40days",
        "potassh_50days",
        "micronutrients_70days",
        "pest_60day",
        "30drain",
        "rain_total",
        "humidity_mean",
        "wind_mean",
        "temp_range_mean",
        "agriblock",
        "variety",
        "soil_types",
        "nursery",
    ]
    for values in clean[export_columns].itertuples(index=False, name=None):
        (
            hectares,
            paddy_yield,
            seedrate,
            dap,
            urea,
            potash,
            micronutrients,
            pest,
            rain_first,
            rain_total,
            humidity,
            wind,
            temp_range,
            block,
            variety,
            soil,
            nursery,
        ) = values
        rows.append(
            [
                int(hectares),
                int(paddy_yield),
                int(seedrate),
                int(dap),
                int(urea),
                round(float(potash), 1),
                int(micronutrients),
                int(pest),
                round(float(rain_first), 1),
                round(float(rain_total), 1),
                round(float(humidity), 1),
                round(float(wind), 1),
                round(float(temp_range), 1),
                block_index[block],
                variety_index[variety],
                soil_index[soil],
                nursery_index[nursery],
            ]
        )

    wind_window = clean["inst_wind_speed_d61_d90"]
    wind_low = int((wind_window == 4).sum())
    wind_blocks = clean.loc[wind_window == 4, "agriblock"].value_counts().to_dict()
    size_means = clean.groupby("hectares")["yield_per_ha"].mean()

    payload = {
        "meta": {
            "title": "Paddy yield, 120 days",
            "source": "UCI Machine Learning Repository — Paddy Dataset",
            "doi": "https://doi.org/10.24432/C55W3J",
            "license": "CC BY 4.0",
            "creator": "Muthukumaran Subramaniyan",
            "rowsRaw": int(len(raw)),
            "rowsClean": int(len(clean)),
            "duplicates": duplicates,
            "columns": int(raw.shape[1]),
            "engineered": engineered,
            "blocks": blocks,
            "varieties": varieties,
            "soils": soils,
            "nurseries": nurseries,
            "yield": stats(clean["paddy_yield"]),
            "yieldPerHa": stats(clean["yield_per_ha"]),
            "hectares": stats(clean["hectares"]),
            "columnsList": [
                "hectares",
                "yield",
                "seedrate",
                "dap_20days",
                "urea_40days",
                "potassh_50days",
                "micronutrients_70days",
                "pest_60day",
                "rain_d1",
                "rain_total",
                "humidity_mean",
                "wind_mean",
                "temp_range_mean",
                "block",
                "variety",
                "soil",
                "nursery",
            ],
        },
        "weather": {
            "overall": weather(clean),
            "byBlock": weather_by_block,
        },
        "audit": {
            "windLow": {
                "value": 4,
                "window": "D61–90",
                "count": wind_low,
                "share": round(wind_low / len(clean) * 100, 1),
                "blocks": wind_blocks,
                "values": sorted(wind_window.unique().tolist()),
                "max": float(wind_window.max()),
            },
            "rainFirstWindow": {
                "min": float(clean["30drain"].min()),
                "max": float(clean["30drain"].max()),
            },
            "hectaresYieldCorrelation": round(float(clean["hectares"].corr(clean["paddy_yield"])), 3),
            "hectaresYieldPerHaCorrelation": round(
                float(clean["hectares"].corr(clean["yield_per_ha"])), 3
            ),
            "perHectareSpread": {
                "min": round(float(clean.groupby("variety")["yield_per_ha"].mean().min()), 1),
                "max": round(float(clean.groupby("variety")["yield_per_ha"].mean().max()), 1),
            },
            "perHectareSizeSpread": {
                "min": round(float(size_means.min()), 1),
                "max": round(float(size_means.max()), 1),
            },
        },
        "analysis": {
            "varietyPerHa": anova(clean, "variety", "yield_per_ha"),
            "sizePerHa": anova(clean, "hectares", "yield_per_ha"),
        },
        "rows": rows,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {OUT} ({OUT.stat().st_size / 1024:.0f} KB)")
    print(f"rows {len(rows)} · duplicates {duplicates} · columns {raw.shape[1]}")
    print(f"hectares/yield r = {payload['audit']['hectaresYieldCorrelation']}")
    print(f"hectares/yield-per-ha eta^2 = {payload['analysis']['sizePerHa']['etaSquared']}")


if __name__ == "__main__":
    main()
