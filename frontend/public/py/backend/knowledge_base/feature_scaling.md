# Why We Scale Features

Feature scaling transforms numeric columns so they share a comparable range, typically by subtracting the mean and dividing by the standard deviation (standardization), which is what this app's numeric preprocessing pipeline does using scikit-learn's StandardScaler.

Many algorithms are sensitive to the scale of input features. Consider a dataset with "age" (roughly 0-100) and "income" (roughly 0-200,000). Algorithms that rely on distances between points, like K-Nearest Neighbors or Support Vector Machines, would let income dominate any distance calculation purely because its numbers are bigger, even if age is actually more predictive. Gradient-based models, including logistic regression and neural networks, also tend to converge faster and more reliably when features are on similar scales.

Tree-based models such as decision trees and random forests are a notable exception: they split data based on threshold comparisons on one feature at a time, so the relative scale of different features does not affect how they learn. Scaling is harmless for these models but not necessary.

An important detail, closely related to data leakage, is when scaling statistics are computed. The mean and standard deviation used for scaling must be calculated only from the training data, then applied unchanged to the test data — never recalculated on the test set. This app's preprocessing stage follows this rule automatically.
