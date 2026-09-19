import numpy as np
import pandas as pd


def build_grid(
    X_train: pd.DataFrame, feature_x: str, feature_y: str, resolution: int = 60
):
    x_min, x_max = float(X_train[feature_x].min()), float(X_train[feature_x].max())
    y_min, y_max = float(X_train[feature_y].min()), float(X_train[feature_y].max())

    x_pad = (x_max - x_min) * 0.05 or 1.0
    y_pad = (y_max - y_min) * 0.05 or 1.0
    x_min, x_max = x_min - x_pad, x_max + x_pad
    y_min, y_max = y_min - y_pad, y_max + y_pad

    xx, yy = np.meshgrid(
        np.linspace(x_min, x_max, resolution),
        np.linspace(y_min, y_max, resolution),
    )

    data = {}
    for column in X_train.columns:
        if column == feature_x:
            data[column] = xx.ravel()
        elif column == feature_y:
            data[column] = yy.ravel()
        elif pd.api.types.is_numeric_dtype(X_train[column]):
            data[column] = np.full(resolution * resolution, X_train[column].median())
        else:
            data[column] = np.full(
                resolution * resolution, X_train[column].mode().iloc[0]
            )

    grid_df = pd.DataFrame(data, columns=X_train.columns)
    return grid_df, (x_min, x_max), (y_min, y_max)


def predict_grid(model, preprocessor, grid_df: pd.DataFrame, resolution: int):
    transformed = preprocessor.transform(grid_df)
    predictions = model.predict(transformed)
    return np.asarray(predictions).reshape(resolution, resolution)
