import pytest

from conftest import run_pipeline


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_datasets_list(client, offline_datasets):
    names = [d["name"] for d in client.get("/datasets").json()]
    assert {"iris", "wine", "breast_cancer", "diabetes"} <= set(names)


def test_algorithms_by_problem_type(client):
    assert "logistic_regression" in client.get("/algorithms/classification").json()
    assert "linear_regression" in client.get("/algorithms/regression").json()
    assert client.get("/algorithms/nonsense").status_code == 404


def test_split_is_stratified_80_20(client):
    started = client.post(
        "/pipeline/start", json={"dataset": "iris", "target_column": "target"}
    ).json()
    sid = started["session_id"]
    summary = client.post(f"/pipeline/{sid}/split").json()["summary"]
    assert summary["train_rows"] == 120
    assert summary["test_rows"] == 30
    assert summary["stratified"] is True


def test_stage_order_is_enforced(client):
    sid = client.post(
        "/pipeline/start", json={"dataset": "iris", "target_column": "target"}
    ).json()["session_id"]
    response = client.post(f"/pipeline/{sid}/preprocess").json()
    assert response["status"] == "failed"
    assert response["summary"]["required_stage"] == "split"


def test_unknown_session_fails_cleanly(client):
    response = client.post("/pipeline/does-not-exist/split").json()
    assert response["status"] == "failed"
    assert "session not found" in response["summary"]["error"]


def test_start_with_unknown_dataset_fails(client):
    response = client.post(
        "/pipeline/start", json={"dataset": "nope", "target_column": "target"}
    ).json()
    assert response["status"] == "failed"


def test_preprocessing_is_fitted_on_train_only(client):
    sid = client.post(
        "/pipeline/start", json={"dataset": "iris", "target_column": "target"}
    ).json()["session_id"]
    client.post(f"/pipeline/{sid}/split")
    summary = client.post(f"/pipeline/{sid}/preprocess").json()["summary"]
    assert "train only" in summary["fitted_on"]


@pytest.mark.parametrize(
    "dataset,problem_type",
    [("iris", "classification"), ("diabetes", "regression")],
)
def test_every_algorithm_trains_predicts_evaluates(client, dataset, problem_type):
    sid, detected = run_pipeline(client, dataset)
    assert detected == problem_type
    for algorithm in client.get(f"/algorithms/{problem_type}").json():
        train = client.post(f"/pipeline/{sid}/train", json={"algorithm": algorithm}).json()
        assert train["status"] == "done", (algorithm, train)
        assert client.post(f"/pipeline/{sid}/predict").json()["status"] == "done"
        evaluation = client.post(f"/pipeline/{sid}/evaluate").json()
        assert evaluation["status"] == "done", (algorithm, evaluation)


def test_classification_metrics_in_range(client):
    sid, _ = run_pipeline(client, "iris")
    client.post(f"/pipeline/{sid}/train", json={"algorithm": "logistic_regression"})
    client.post(f"/pipeline/{sid}/predict")
    metrics = client.post(f"/pipeline/{sid}/evaluate").json()["summary"]
    assert 0.8 <= metrics["accuracy"] <= 1.0


def test_compare_ranks_best_first(client):
    sid, _ = run_pipeline(client, "iris")
    results = client.post(f"/pipeline/{sid}/compare").json()["summary"]["results"]
    scores = [r["metrics"]["accuracy"] for r in results]
    assert scores == sorted(scores, reverse=True)
    assert len(results) == len(client.get("/algorithms/classification").json())


def test_compare_subsamples_large_training_sets(client, monkeypatch):
    import main

    monkeypatch.setattr(main, "MAX_COMPARE_TRAIN_ROWS", 50)
    sid, _ = run_pipeline(client, "iris")
    summary = client.post(f"/pipeline/{sid}/compare").json()["summary"]
    assert "50-row sample" in summary["note"]


def test_tune_returns_best_params(client):
    sid, _ = run_pipeline(client, "iris")
    summary = client.post(
        f"/pipeline/{sid}/tune", json={"algorithm": "decision_tree"}
    ).json()["summary"]
    assert summary["cv_folds"] == 5
    assert summary["best_params"]


def test_decision_boundary_only_for_classification(client):
    sid, _ = run_pipeline(client, "iris")
    cols = ["sepal length (cm)", "sepal width (cm)"]
    client.post(f"/pipeline/{sid}/train", json={"algorithm": "knn"})
    ok = client.post(
        f"/pipeline/{sid}/decision-boundary",
        json={"feature_x": cols[0], "feature_y": cols[1]},
    ).json()
    assert ok["status"] == "done"

    reg_sid, _ = run_pipeline(client, "diabetes")
    client.post(f"/pipeline/{reg_sid}/train", json={"algorithm": "linear_regression"})
    bad = client.post(
        f"/pipeline/{reg_sid}/decision-boundary",
        json={"feature_x": "age", "feature_y": "bmi"},
    ).json()
    assert bad["status"] == "failed"


def test_compare_stream_emits_start_results_done(client):
    import json

    sid, _ = run_pipeline(client, "iris")
    with client.stream("POST", f"/pipeline/{sid}/compare/stream") as response:
        events = [json.loads(line) for line in response.iter_lines() if line]
    assert events[0]["type"] == "start"
    assert events[-1]["type"] == "done"
    results = [e["row"] for e in events if e["type"] == "result"]
    assert len(results) == events[0]["total"] == 6
    assert {r["algorithm"] for r in results} == set(events[0]["algorithms"])
    # cheap algorithms come first
    assert events[0]["algorithms"][0] == "logistic_regression"
    assert events[0]["algorithms"][-1] == "neural_network"


def test_compare_stream_reports_missing_prerequisite(client):
    import json

    sid = client.post(
        "/pipeline/start", json={"dataset": "iris", "target_column": "target"}
    ).json()["session_id"]
    with client.stream("POST", f"/pipeline/{sid}/compare/stream") as response:
        events = [json.loads(line) for line in response.iter_lines() if line]
    assert events[0]["type"] == "error"
    assert events[0]["required_stage"] == "preprocessed_data"
