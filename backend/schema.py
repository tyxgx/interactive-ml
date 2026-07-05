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
