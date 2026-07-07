export type Algorithm = {
  id: string;
  name: string;
  description: string;
};

export const algorithms: Algorithm[] = [
  {
    id: "linear_regression",
    name: "Linear Regression",
    description:
      "Fits a linear relationship between input features and a continuous target variable.",
  },
  {
    id: "logistic_regression",
    name: "Logistic Regression",
    description:
      "Predicts categorical outcomes by modeling the probability of class membership.",
  },
  {
    id: "decision_tree",
    name: "Decision Tree",
    description:
      "Splits data into branches based on feature values to reach a prediction.",
  },
  {
    id: "random_forest",
    name: "Random Forest",
    description:
      "Combines multiple decision trees to improve prediction accuracy and reduce overfitting.",
  },
  {
    id: "knn",
    name: "K-Nearest Neighbors",
    description:
      "Classifies data points based on the majority label among their nearest neighbors.",
  },
  {
    id: "svm",
    name: "Support Vector Machine",
    description:
      "Finds the optimal boundary that separates classes with the maximum margin.",
  },
];
