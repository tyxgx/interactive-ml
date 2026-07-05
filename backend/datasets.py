import pandas as pd
from sklearn.datasets import load_iris


def get_dataset(name: str) -> pd.DataFrame:
    if name == "iris":
        data = load_iris(as_frame=True)
        return data.frame

    raise ValueError(f"Unknown dataset: {name}")
