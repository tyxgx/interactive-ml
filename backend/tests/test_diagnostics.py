import pytest

from conftest import run_pipeline


def _trained(client, dataset, algorithm):
    sid, problem_type = run_pipeline(client, dataset)
    assert client.post(f"/pipeline/{sid}/train", json={"algorithm": algorithm}).json()["status"] == "done"
    return sid, problem_type


def test_diagnostics_require_a_trained_model(client):
    sid, _ = run_pipeline(client, "iris")
    for path in ("learning-curve", "roc", "residuals", "importance"):
        r = client.post(f"/pipeline/{sid}/{path}").json()
        assert r["status"] == "failed", path
        assert r["summary"]["required_stage"] == "model"


def test_learning_curve_shape(client):
    sid, _ = _trained(client, "iris", "logistic_regression")
    s = client.post(f"/pipeline/{sid}/learning-curve").json()["summary"]
    assert s["scoring"] == "accuracy"
    assert len(s["train_sizes"]) == len(s["train_mean"]) == len(s["val_mean"]) == 5
    assert s["train_sizes"] == sorted(s["train_sizes"])
    assert all(0 <= v <= 1 for v in s["val_mean"])


def test_learning_curve_uses_r2_for_regression(client):
    sid, _ = _trained(client, "diabetes", "linear_regression")
    assert client.post(f"/pipeline/{sid}/learning-curve").json()["summary"]["scoring"] == "r2"


@pytest.mark.parametrize("algorithm", ["logistic_regression", "svm", "knn", "neural_network"])
def test_roc_multiclass_one_vs_rest(client, algorithm):
    sid, _ = _trained(client, "iris", algorithm)
    s = client.post(f"/pipeline/{sid}/roc").json()["summary"]
    assert s["multiclass"] is True
    assert len(s["curves"]) == 3
    for curve in s["curves"]:
        assert 0.5 <= curve["auc"] <= 1.0
        assert curve["fpr"][0] == 0 and curve["tpr"][-1] == 1


def test_roc_binary_has_single_curve(client):
    sid, _ = _trained(client, "breast_cancer", "logistic_regression")
    s = client.post(f"/pipeline/{sid}/roc").json()["summary"]
    assert s["multiclass"] is False
    assert len(s["curves"]) == 1
    assert s["curves"][0]["auc"] > 0.9


def test_roc_rejected_for_regression(client):
    sid, _ = _trained(client, "diabetes", "linear_regression")
    r = client.post(f"/pipeline/{sid}/roc").json()
    assert r["status"] == "failed"
    assert "classification" in r["summary"]["error"]


def test_residuals_are_actual_minus_predicted(client):
    sid, _ = _trained(client, "diabetes", "linear_regression")
    s = client.post(f"/pipeline/{sid}/residuals").json()["summary"]
    for a, p, r in zip(s["actual"], s["predicted"], s["residuals"]):
        assert abs((a - p) - r) < 1e-3
    assert abs(s["mean_residual"]) < 20  # linear regression residuals centre near zero


def test_residuals_rejected_for_classification(client):
    sid, _ = _trained(client, "iris", "knn")
    assert client.post(f"/pipeline/{sid}/residuals").json()["status"] == "failed"


@pytest.mark.parametrize("algorithm", ["random_forest", "knn", "svm"])
def test_permutation_importance_works_for_any_algorithm(client, algorithm):
    sid, _ = _trained(client, "iris", algorithm)
    s = client.post(f"/pipeline/{sid}/importance").json()["summary"]
    names = {f["feature"] for f in s["features"]}
    assert names <= {"sepal length (cm)", "sepal width (cm)", "petal length (cm)", "petal width (cm)"}
    scores = [f["importance"] for f in s["features"]]
    assert scores == sorted(scores, reverse=True)
    assert max(scores) > 0
