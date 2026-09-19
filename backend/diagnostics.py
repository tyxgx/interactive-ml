"""Model diagnostics that go beyond a single metric: curves and importances."""

import numpy as np
from sklearn.inspection import permutation_importance
from sklearn.metrics import (
    auc,
    average_precision_score,
    precision_recall_curve,
    roc_curve,
)
from sklearn.model_selection import learning_curve
from sklearn.preprocessing import label_binarize

MAX_CURVE_POINTS = 100
MAX_SCATTER_POINTS = 400


def _r(values, digits=4):
    return [round(float(v), digits) for v in np.asarray(values).ravel()]


def _thin(x, y, limit=MAX_CURVE_POINTS):
    """Evenly thin a curve so the JSON payload stays small."""
    if len(x) <= limit:
        return x, y
    idx = np.unique(np.linspace(0, len(x) - 1, limit).astype(int))
    return np.asarray(x)[idx], np.asarray(y)[idx]


def scoring_for(problem_type: str) -> str:
    return "accuracy" if problem_type == "classification" else "r2"


def learning_curve_data(model, X, y, problem_type: str) -> dict:
    scoring = scoring_for(problem_type)
    sizes, train_scores, val_scores = learning_curve(
        model,
        X,
        y,
        cv=3,
        train_sizes=np.linspace(0.2, 1.0, 5),
        scoring=scoring,
        shuffle=True,
        random_state=42,
        n_jobs=1,
    )
    return {
        "scoring": scoring,
        "train_sizes": [int(s) for s in sizes],
        "train_mean": _r(train_scores.mean(axis=1)),
        "train_std": _r(train_scores.std(axis=1)),
        "val_mean": _r(val_scores.mean(axis=1)),
        "val_std": _r(val_scores.std(axis=1)),
    }


def _scores(model, X):
    if hasattr(model, "predict_proba"):
        return model.predict_proba(X)
    return model.decision_function(X)


def roc_pr_data(model, X_test, y_test) -> dict:
    """ROC and precision-recall curves. One-vs-rest when there are 3+ classes."""
    classes = list(model.classes_)
    scores = _scores(model, X_test)
    y_test = np.asarray(y_test)

    if len(classes) == 2:
        targets = [(classes[1], (y_test == classes[1]).astype(int), scores if scores.ndim == 1 else scores[:, 1])]
    else:
        y_bin = label_binarize(y_test, classes=classes)
        targets = [(cls, y_bin[:, i], scores[:, i]) for i, cls in enumerate(classes)]

    curves = []
    for label, truth, score in targets:
        if truth.sum() == 0 or truth.sum() == len(truth):
            continue  # a curve needs both outcomes present in the test set
        fpr, tpr, _ = roc_curve(truth, score)
        precision, recall, _ = precision_recall_curve(truth, score)
        fpr_t, tpr_t = _thin(fpr, tpr)
        rec_t, prec_t = _thin(recall, precision)
        curves.append(
            {
                "label": str(label),
                "fpr": _r(fpr_t),
                "tpr": _r(tpr_t),
                "auc": round(float(auc(fpr, tpr)), 4),
                "recall": _r(rec_t),
                "precision": _r(prec_t),
                "average_precision": round(float(average_precision_score(truth, score)), 4),
            }
        )
    return {"curves": curves, "multiclass": len(classes) > 2}


def residuals_data(y_test, predictions) -> dict:
    actual = np.asarray(y_test, dtype=float)
    predicted = np.asarray(predictions, dtype=float)
    residuals = actual - predicted
    idx = np.arange(len(actual))
    if len(idx) > MAX_SCATTER_POINTS:
        idx = np.random.RandomState(42).choice(len(actual), MAX_SCATTER_POINTS, replace=False)
    return {
        "actual": _r(actual[idx]),
        "predicted": _r(predicted[idx]),
        "residuals": _r(residuals[idx]),
        "mean_residual": round(float(residuals.mean()), 4),
        "std_residual": round(float(residuals.std()), 4),
        "sampled": len(idx) < len(actual),
    }


def _clean_feature_name(name: str) -> str:
    for prefix in ("numeric__", "categorical__"):
        if name.startswith(prefix):
            return name[len(prefix):]
    return name


def permutation_importance_data(
    model, X_test, y_test, feature_names, problem_type: str, top_n: int = 15
) -> dict:
    """Score drop when one feature is shuffled. Works for every algorithm."""
    result = permutation_importance(
        model,
        X_test,
        y_test,
        scoring=scoring_for(problem_type),
        n_repeats=3,
        random_state=42,
        n_jobs=1,
    )
    order = np.argsort(result.importances_mean)[::-1][:top_n]
    return {
        "scoring": scoring_for(problem_type),
        "features": [
            {
                "feature": _clean_feature_name(str(feature_names[i])),
                "importance": round(float(result.importances_mean[i]), 4),
                "std": round(float(result.importances_std[i]), 4),
            }
            for i in order
        ],
    }
