from sklearn.base import clone
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.svm import SVC, SVR
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor

MODEL_REGISTRY = {
    "classification": {
        "logistic_regression": LogisticRegression(max_iter=1000),
        "decision_tree": DecisionTreeClassifier(random_state=42),
        "random_forest": RandomForestClassifier(random_state=42),
        "knn": KNeighborsClassifier(),
        "svm": SVC(random_state=42),
    },
    "regression": {
        "linear_regression": LinearRegression(),
        "decision_tree": DecisionTreeRegressor(random_state=42),
        "random_forest": RandomForestRegressor(random_state=42),
        "knn": KNeighborsRegressor(),
        "svm": SVR(),
    },
}


def get_model(problem_type: str, algorithm: str):
    return clone(MODEL_REGISTRY[problem_type][algorithm])
