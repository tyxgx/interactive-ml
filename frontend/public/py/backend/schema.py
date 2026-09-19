import pandas as pd
from pandas.api.types import is_numeric_dtype


def detect_schema(df: pd.DataFrame, target_column: str) -> dict:
    columns = []
    for column in df.columns:
        column_type = "numeric" if is_numeric_dtype(df[column]) else "categorical"
        columns.append({"name": column, "type": column_type})

    target = df[target_column]
    target_is_numeric = is_numeric_dtype(target)
    target_unique_count = target.nunique()

    if not target_is_numeric or target_unique_count <= 20:
        problem_type = "classification"
    else:
        problem_type = "regression"

    return {"columns": columns, "problem_type": problem_type}


def build_dataset_info(df: pd.DataFrame, target_column: str) -> dict:
    schema = detect_schema(df, target_column)
    numeric_columns = [c["name"] for c in schema["columns"] if c["type"] == "numeric"]
    categorical_columns = [
        c["name"] for c in schema["columns"] if c["type"] == "categorical"
    ]

    missing_counts = df.isna().sum()
    missing_values = {
        column: int(count) for column, count in missing_counts.items() if count > 0
    }

    return {
        "rows": df.head(10).to_dict(orient="records"),
        "shape": {"rows": len(df), "columns": len(df.columns)},
        "schema": schema,
        "missing_values": missing_values,
        "numeric_columns": numeric_columns,
        "categorical_columns": categorical_columns,
    }
