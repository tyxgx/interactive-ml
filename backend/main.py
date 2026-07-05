from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from datasets import get_dataset
from schema import detect_schema
from pipeline_state import create_session, get_session, require_keys

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

STAGE_REQUIREMENTS = {
    "preprocess": "dataset",
    "split": "preprocessed_data",
    "train": "split",
    "predict": "model",
    "evaluate": "predictions",
}


class StartRequest(BaseModel):
    dataset: str


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


@app.get("/dataset/{name}")
def dataset(name: str):
    target_column = "target"
    df = get_dataset(name)
    rows = df.head(10).to_dict(orient="records")
    schema = detect_schema(df, target_column)
    return {"rows": rows, "schema": schema}


@app.post("/pipeline/start")
def pipeline_start(body: StartRequest):
    session_id = create_session()
    session = get_session(session_id)

    target_column = "target"
    df = get_dataset(body.dataset)
    schema = detect_schema(df, target_column)

    session["dataset"] = df
    session["schema"] = schema
    session["X"] = df.drop(columns=[target_column])
    session["y"] = df[target_column]

    summary = {
        "rows": len(df),
        "columns": len(df.columns),
        "problem_type": schema["problem_type"],
    }
    return stage_response(session_id, "start", "done", summary)


def run_stage(session_id: str, stage: str):
    session = get_session(session_id)
    if session is None:
        return stage_response(
            session_id,
            stage,
            "failed",
            {"error": "session not found", "required_stage": None},
        )

    required_key = STAGE_REQUIREMENTS[stage]
    missing = require_keys(session, [required_key])
    if missing:
        return stage_response(
            session_id,
            stage,
            "failed",
            {"error": f"missing prerequisite: {missing}", "required_stage": missing},
        )

    return stage_response(session_id, stage, "done", {"note": "not_implemented"})


@app.post("/pipeline/{session_id}/preprocess")
def preprocess(session_id: str):
    return run_stage(session_id, "preprocess")


@app.post("/pipeline/{session_id}/split")
def split(session_id: str):
    return run_stage(session_id, "split")


@app.post("/pipeline/{session_id}/train")
def train(session_id: str):
    return run_stage(session_id, "train")


@app.post("/pipeline/{session_id}/predict")
def predict(session_id: str):
    return run_stage(session_id, "predict")


@app.post("/pipeline/{session_id}/evaluate")
def evaluate(session_id: str):
    return run_stage(session_id, "evaluate")
