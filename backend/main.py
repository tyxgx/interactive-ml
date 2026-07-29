import io
import os
import time

import numpy as np
import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
)
from sklearn.model_selection import GridSearchCV, train_test_split

from datasets import BUILTIN_DATASETS, get_dataset
from models import MODEL_REGISTRY, get_model, get_param_grid
from preprocessing import build_preprocessor
from schema import build_dataset_info
from pipeline_state import create_session, get_session, require_keys
from uploads import create_upload

app = FastAPI()

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

MAX_UPLOAD_BYTES = 2 * 1024 * 1024
MAX_UPLOAD_ROWS = 5000

STAGE_REQUIREMENTS = {
    "split": ["X", "y"],
    "preprocess": ["split"],
    "train": ["preprocessed_data"],
    "predict": ["model"],
    "evaluate": ["predictions"],
    "compare": ["preprocessed_data"],
    "tune": ["preprocessed_data"],
}


class StartRequest(BaseModel):
    dataset: str
    target_column: str


class TrainRequest(BaseModel):
    algorithm: str


def stage_response(session_id: str, stage: str, status: str, summary: dict):
    return {
        "session_id": session_id,
        "stage": stage,
        "status": status,
        "summary": summary,
    }


@app.get("/")
def read_root():
    return {"status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/datasets")
def list_datasets():
    result = []
    for name, info in BUILTIN_DATASETS.items():
        df = get_dataset(name)
        result.append(
            {
                "name": name,
                "default_target": info["default_target"],
                "columns": list(df.columns),
            }
        )
    return result


@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds 2 MB limit")

    df = pd.read_csv(io.BytesIO(content))

    if len(df) > MAX_UPLOAD_ROWS:
        raise HTTPException(status_code=400, detail="File exceeds 5000 row limit")

    upload_id = create_upload(df)

    return {
        "upload_id": upload_id,
        "columns": list(df.columns),
        "shape": {"rows": len(df), "columns": len(df.columns)},
    }


@app.get("/algorithms/{problem_type}")
def list_algorithms(problem_type: str):
    if problem_type not in MODEL_REGISTRY:
        raise HTTPException(status_code=404, detail="Unknown problem type")
    return list(MODEL_REGISTRY[problem_type].keys())


@app.get("/dataset/{name}")
def dataset(name: str, target_column: str = "target"):
    df = get_dataset(name)
    return build_dataset_info(df, target_column)


@app.post("/pipeline/start")
def pipeline_start(body: StartRequest):
    session_id = create_session()
    session = get_session(session_id)

    try:
        df = get_dataset(body.dataset)
        info = build_dataset_info(df, body.target_column)

        session["dataset"] = df
        session["target_column"] = body.target_column
        session["schema"] = info["schema"]
        session["X"] = df.drop(columns=[body.target_column])
        session["y"] = df[body.target_column]

        return stage_response(session_id, "start", "done", info)
    except Exception as e:
        return stage_response(
            session_id, "start", "failed", {"error": str(e), "required_stage": None}
        )


def load_session_or_fail(session_id: str, stage: str):
    session = get_session(session_id)
    if session is None:
        return None, stage_response(
            session_id,
            stage,
            "failed",
            {"error": "session not found", "required_stage": None},
        )

    missing = require_keys(session, STAGE_REQUIREMENTS[stage])
    if missing:
        return None, stage_response(
            session_id,
            stage,
            "failed",
            {"error": f"missing prerequisite: {missing}", "required_stage": missing},
        )

    return session, None


@app.post("/pipeline/{session_id}/split")
def split(session_id: str):
    stage = "split"
    session, error_response = load_session_or_fail(session_id, stage)
    if error_response:
        return error_response

    try:
        X = session["X"]
        y = session["y"]
        problem_type = session["schema"]["problem_type"]
        stratify = y if problem_type == "classification" else None

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=stratify
        )

        session["split"] = {
            "X_train": X_train,
            "X_test": X_test,
            "y_train": y_train,
            "y_test": y_test,
        }

        summary = {
            "train_rows": len(X_train),
            "test_rows": len(X_test),
            "test_size": 0.2,
            "stratified": stratify is not None,
            "random_state": 42,
        }
        return stage_response(session_id, stage, "done", summary)
    except Exception as e:
        return stage_response(
            session_id, stage, "failed", {"error": str(e), "required_stage": None}
        )


@app.post("/pipeline/{session_id}/preprocess")
def preprocess(session_id: str):
    stage = "preprocess"
    session, error_response = load_session_or_fail(session_id, stage)
    if error_response:
        return error_response

    try:
        split_data = session["split"]
        X_train = split_data["X_train"]
        X_test = split_data["X_test"]

        preprocessor = build_preprocessor(X_train)
        X_train_t = preprocessor.fit_transform(X_train)
        X_test_t = preprocessor.transform(X_test)

        session["preprocessed_data"] = {
            "X_train_t": X_train_t,
            "X_test_t": X_test_t,
        }
        session["preprocessor"] = preprocessor

        summary = {
            "train_shape": list(X_train_t.shape),
            "test_shape": list(X_test_t.shape),
            "fitted_on": "train only (prevents data leakage)",
        }
        return stage_response(session_id, stage, "done", summary)
    except Exception as e:
        return stage_response(
            session_id, stage, "failed", {"error": str(e), "required_stage": None}
        )


def _simple_params(params: dict) -> dict:
    return {
        key: value
        for key, value in params.items()
        if isinstance(value, (str, int, float, bool)) or value is None
    }


def _feature_signal(model, feature_names: list[str]) -> list[dict] | None:
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        pairs = list(zip(feature_names, importances))
        pairs.sort(key=lambda p: abs(p[1]), reverse=True)
        return [
            {"feature": name, "importance": round(float(value), 4)}
            for name, value in pairs[:10]
        ]

    if hasattr(model, "coef_"):
        coef = np.asarray(model.coef_)
        if coef.ndim == 2 and coef.shape[0] > 1:
            # multi-class one-vs-rest: signed coefficients would cancel out
            # across classes, so report mean absolute magnitude instead.
            values = np.abs(coef).mean(axis=0)
        else:
            values = coef.reshape(-1)
        pairs = list(zip(feature_names, values))
        pairs.sort(key=lambda p: abs(p[1]), reverse=True)
        return [
            {"feature": name, "importance": round(float(value), 4)}
            for name, value in pairs[:10]
        ]

    return None


def _loss_curve_summary(model) -> dict | None:
    loss_curve = getattr(model, "loss_curve_", None)
    if loss_curve is None:
        return None

    if len(loss_curve) > 50:
        step = len(loss_curve) / 50
        sampled = [loss_curve[int(i * step)] for i in range(50)]
    else:
        sampled = list(loss_curve)

    architecture = " -> ".join(str(n) for n in model.hidden_layer_sizes) + " hidden units"

    return {
        "loss_curve": [round(float(v), 6) for v in sampled],
        "architecture": architecture,
        "epochs_run": len(loss_curve),
    }


@app.post("/pipeline/{session_id}/train")
def train(session_id: str, body: TrainRequest):
    stage = "train"
    session, error_response = load_session_or_fail(session_id, stage)
    if error_response:
        return error_response

    try:
        problem_type = session["schema"]["problem_type"]
        model = get_model(problem_type, body.algorithm)

        X_train_t = session["preprocessed_data"]["X_train_t"]
        y_train = session["split"]["y_train"]

        start_time = time.perf_counter()
        model.fit(X_train_t, y_train)
        elapsed = time.perf_counter() - start_time

        session["model"] = model
        session["algorithm"] = body.algorithm

        feature_names = list(session["preprocessor"].get_feature_names_out())
        feature_signal = _feature_signal(model, feature_names)

        summary = {
            "algorithm": body.algorithm,
            "problem_type": problem_type,
            "hyperparameters": _simple_params(model.get_params()),
            "training_time_seconds": round(elapsed, 4),
        }
        if feature_signal is not None:
            signal_key = (
                "feature_importances"
                if hasattr(model, "feature_importances_")
                else "coefficients"
            )
            summary[signal_key] = feature_signal

        loss_curve_summary = _loss_curve_summary(model)
        if loss_curve_summary is not None:
            summary.update(loss_curve_summary)

        return stage_response(session_id, stage, "done", summary)
    except Exception as e:
        return stage_response(
            session_id, stage, "failed", {"error": str(e), "required_stage": None}
        )


@app.post("/pipeline/{session_id}/predict")
def predict(session_id: str):
    stage = "predict"
    session, error_response = load_session_or_fail(session_id, stage)
    if error_response:
        return error_response

    try:
        model = session["model"]
        X_test_t = session["preprocessed_data"]["X_test_t"]

        predictions = model.predict(X_test_t)
        session["predictions"] = predictions

        summary = {
            "predictions_generated": len(predictions),
            "sample_predictions": predictions[:5].tolist(),
        }
        return stage_response(session_id, stage, "done", summary)
    except Exception as e:
        return stage_response(
            session_id, stage, "failed", {"error": str(e), "required_stage": None}
        )


def compute_metrics(y_test, predictions, problem_type: str) -> dict:
    if problem_type == "classification":
        return {
            "accuracy": round(accuracy_score(y_test, predictions), 4),
            "precision": round(
                precision_score(
                    y_test, predictions, average="weighted", zero_division=0
                ),
                4,
            ),
            "recall": round(
                recall_score(
                    y_test, predictions, average="weighted", zero_division=0
                ),
                4,
            ),
            "f1": round(
                f1_score(y_test, predictions, average="weighted", zero_division=0),
                4,
            ),
        }

    rmse = mean_squared_error(y_test, predictions) ** 0.5
    return {
        "r2": round(r2_score(y_test, predictions), 4),
        "rmse": round(rmse, 4),
        "mae": round(mean_absolute_error(y_test, predictions), 4),
    }


@app.post("/pipeline/{session_id}/evaluate")
def evaluate(session_id: str):
    stage = "evaluate"
    session, error_response = load_session_or_fail(session_id, stage)
    if error_response:
        return error_response

    try:
        y_test = session["split"]["y_test"]
        predictions = session["predictions"]
        problem_type = session["schema"]["problem_type"]

        metrics = compute_metrics(y_test, predictions, problem_type)

        if problem_type == "classification":
            metrics = {
                **metrics,
                "confusion_matrix": confusion_matrix(y_test, predictions).tolist(),
                "confusion_matrix_labels": sorted(set(y_test.tolist())),
            }
        else:
            y_test_list = y_test.tolist()
            predictions_list = list(predictions)
            metrics = {
                **metrics,
                "actual_vs_predicted": [
                    {"actual": round(float(a), 4), "predicted": round(float(p), 4)}
                    for a, p in zip(y_test_list[:20], predictions_list[:20])
                ],
            }

        session["evaluation"] = metrics
        return stage_response(session_id, stage, "done", metrics)
    except Exception as e:
        return stage_response(
            session_id, stage, "failed", {"error": str(e), "required_stage": None}
        )


@app.post("/pipeline/{session_id}/compare")
def compare(session_id: str):
    stage = "compare"
    session, error_response = load_session_or_fail(session_id, stage)
    if error_response:
        return error_response

    try:
        problem_type = session["schema"]["problem_type"]
        X_train_t = session["preprocessed_data"]["X_train_t"]
        X_test_t = session["preprocessed_data"]["X_test_t"]
        y_train = session["split"]["y_train"]
        y_test = session["split"]["y_test"]

        results = []
        for algorithm in MODEL_REGISTRY[problem_type]:
            model = get_model(problem_type, algorithm)

            start_time = time.perf_counter()
            model.fit(X_train_t, y_train)
            elapsed = time.perf_counter() - start_time

            predictions = model.predict(X_test_t)
            metrics = compute_metrics(y_test, predictions, problem_type)

            results.append(
                {
                    "algorithm": algorithm,
                    "metrics": metrics,
                    "training_time_seconds": round(elapsed, 4),
                }
            )

        rank_key = "accuracy" if problem_type == "classification" else "r2"
        results.sort(key=lambda r: r["metrics"][rank_key], reverse=True)

        summary = {"problem_type": problem_type, "results": results}
        return stage_response(session_id, stage, "done", summary)
    except Exception as e:
        return stage_response(
            session_id, stage, "failed", {"error": str(e), "required_stage": None}
        )


@app.post("/pipeline/{session_id}/tune")
def tune(session_id: str, body: TrainRequest):
    stage = "tune"
    session, error_response = load_session_or_fail(session_id, stage)
    if error_response:
        return error_response

    try:
        problem_type = session["schema"]["problem_type"]
        model = get_model(problem_type, body.algorithm)
        param_grid = get_param_grid(problem_type, body.algorithm)

        X_train_t = session["preprocessed_data"]["X_train_t"]
        y_train = session["split"]["y_train"]

        search = GridSearchCV(model, param_grid, cv=5)
        search.fit(X_train_t, y_train)

        session["model"] = search.best_estimator_
        session["algorithm"] = body.algorithm

        summary = {
            "algorithm": body.algorithm,
            "problem_type": problem_type,
            "best_params": search.best_params_,
            "best_cv_score": round(search.best_score_, 4),
            "cv_folds": 5,
        }
        return stage_response(session_id, stage, "done", summary)
    except Exception as e:
        return stage_response(
            session_id, stage, "failed", {"error": str(e), "required_stage": None}
        )
