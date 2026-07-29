from sklearn.base import clone
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.neural_network import MLPClassifier, MLPRegressor
from sklearn.svm import SVC, SVR
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor

MODEL_REGISTRY = {
    "classification": {
        "logistic_regression": LogisticRegression(max_iter=1000),
        "decision_tree": DecisionTreeClassifier(random_state=42),
        "random_forest": RandomForestClassifier(random_state=42),
        "knn": KNeighborsClassifier(),
        "svm": SVC(random_state=42),
        "neural_network": MLPClassifier(
            hidden_layer_sizes=(64, 32), max_iter=500, random_state=42
        ),
    },
    "regression": {
        "linear_regression": LinearRegression(),
        "decision_tree": DecisionTreeRegressor(random_state=42),
        "random_forest": RandomForestRegressor(random_state=42),
        "knn": KNeighborsRegressor(),
        "svm": SVR(),
        "neural_network": MLPRegressor(
            hidden_layer_sizes=(64, 32), max_iter=500, random_state=42
        ),
    },
}


def get_model(problem_type: str, algorithm: str):
    return clone(MODEL_REGISTRY[problem_type][algorithm])


PARAM_GRIDS = {
    "classification": {
        "logistic_regression": {"C": [0.1, 1, 10]},
        "decision_tree": {"max_depth": [3, 5, 10], "min_samples_split": [2, 5]},
        "random_forest": {"n_estimators": [50, 100], "max_depth": [5, 10]},
        "knn": {"n_neighbors": [3, 5, 7]},
        "svm": {"C": [0.1, 1, 10], "kernel": ["linear", "rbf"]},
        "neural_network": {"alpha": [0.0001, 0.001, 0.01]},
    },
    "regression": {
        "linear_regression": {"fit_intercept": [True, False]},
        "decision_tree": {"max_depth": [3, 5, 10], "min_samples_split": [2, 5]},
        "random_forest": {"n_estimators": [50, 100], "max_depth": [5, 10]},
        "knn": {"n_neighbors": [3, 5, 7]},
        "svm": {"C": [0.1, 1, 10], "kernel": ["linear", "rbf"]},
        "neural_network": {"alpha": [0.0001, 0.001, 0.01]},
    },
}


def get_param_grid(problem_type: str, algorithm: str) -> dict:
    return PARAM_GRIDS[problem_type][algorithm]
