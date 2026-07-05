import pandas as pd
from sklearn.datasets import (
    load_breast_cancer,
    load_diabetes,
    load_iris,
    load_wine,
    fetch_california_housing,
)

TARGET_COLUMN = "target"


def _load_iris() -> pd.DataFrame:
    return load_iris(as_frame=True).frame


def _load_wine() -> pd.DataFrame:
    return load_wine(as_frame=True).frame


def _load_breast_cancer() -> pd.DataFrame:
    return load_breast_cancer(as_frame=True).frame


def _load_diabetes() -> pd.DataFrame:
    return load_diabetes(as_frame=True).frame


def _load_california_housing() -> pd.DataFrame:
    frame = fetch_california_housing(as_frame=True).frame
    return frame.rename(columns={"MedHouseVal": TARGET_COLUMN})


BUILTIN_DATASETS = {
    "iris": {"loader": _load_iris, "default_target": TARGET_COLUMN},
    "wine": {"loader": _load_wine, "default_target": TARGET_COLUMN},
    "breast_cancer": {"loader": _load_breast_cancer, "default_target": TARGET_COLUMN},
    "diabetes": {"loader": _load_diabetes, "default_target": TARGET_COLUMN},
    "california_housing": {
        "loader": _load_california_housing,
        "default_target": TARGET_COLUMN,
    },
}


def get_dataset(name: str) -> pd.DataFrame:
    if name not in BUILTIN_DATASETS:
        raise ValueError(f"Unknown dataset: {name}")

    return BUILTIN_DATASETS[name]["loader"]()
