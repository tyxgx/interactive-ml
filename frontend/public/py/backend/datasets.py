from functools import lru_cache
from pathlib import Path

import pandas as pd
from sklearn.datasets import (
    load_breast_cancer,
    load_diabetes,
    load_iris,
    load_wine,
)

from uploads import get_upload

TARGET_COLUMN = "target"


def _load_iris() -> pd.DataFrame:
    return load_iris(as_frame=True).frame


def _load_wine() -> pd.DataFrame:
    return load_wine(as_frame=True).frame


def _load_breast_cancer() -> pd.DataFrame:
    return load_breast_cancer(as_frame=True).frame


def _load_diabetes() -> pd.DataFrame:
    return load_diabetes(as_frame=True).frame


CALIFORNIA_CSV = Path(__file__).parent / "data" / "california_housing.csv.gz"


def _load_california_housing() -> pd.DataFrame:
    # Bundled copy of sklearn's fetch_california_housing (already renamed to `target`).
    # No runtime download, so it also works in the browser (Pyodide has no TLS).
    return pd.read_csv(CALIFORNIA_CSV)


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


@lru_cache(maxsize=None)
def _load_builtin(name: str) -> pd.DataFrame:
    return BUILTIN_DATASETS[name]["loader"]()


def get_dataset(name: str) -> pd.DataFrame:
    if name.startswith("upload:"):
        upload_id = name[len("upload:") :]
        df = get_upload(upload_id)
        if df is None:
            raise ValueError(f"Unknown upload: {upload_id}")
        return df

    if name not in BUILTIN_DATASETS:
        raise ValueError(f"Unknown dataset: {name}")

    return _load_builtin(name).copy()
