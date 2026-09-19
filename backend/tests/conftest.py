import pytest
from fastapi.testclient import TestClient

import datasets
import main


@pytest.fixture(scope="session")
def client():
    return TestClient(main.app)


def run_pipeline(client, dataset, target="target"):
    """Start a session and run split + preprocess. Returns (session_id, problem_type)."""
    started = client.post(
        "/pipeline/start", json={"dataset": dataset, "target_column": target}
    ).json()
    assert started["status"] == "done", started
    sid = started["session_id"]
    assert client.post(f"/pipeline/{sid}/split").json()["status"] == "done"
    assert client.post(f"/pipeline/{sid}/preprocess").json()["status"] == "done"
    return sid, started["summary"]["schema"]["problem_type"]


@pytest.fixture
def offline_datasets(monkeypatch):
    """Drop datasets that download from the network so tests stay offline."""
    trimmed = {
        k: v for k, v in datasets.BUILTIN_DATASETS.items() if k != "california_housing"
    }
    monkeypatch.setattr(main, "BUILTIN_DATASETS", trimmed)
