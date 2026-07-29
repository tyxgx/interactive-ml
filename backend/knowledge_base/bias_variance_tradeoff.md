# Bias-Variance Tradeoff

The bias-variance tradeoff is a fundamental idea explaining why models can fail in two opposite ways, and why improving one kind of failure often makes the other one worse.

Bias is error from a model being too simple to capture the real pattern in the data. A high-bias model makes strong, rigid assumptions — for example, fitting a straight line (linear regression) to data that actually follows a curve. High-bias models tend to underfit: they perform poorly on both training and test data, because they are not flexible enough to represent the true relationship.

Variance is error from a model being too sensitive to the specific training data it happened to see. A high-variance model can represent very complex patterns, but some of what it "learns" is just noise or randomness specific to that training set. High-variance models tend to overfit: they perform very well on training data but much worse on test data, because what they learned does not generalize.

Total error can be thought of as bias error plus variance error (plus some irreducible noise). Simple models (like shallow decision trees or linear models) tend to have high bias, low variance. Complex models (like deep decision trees, large random forests, or neural networks with many parameters) tend to have low bias, high variance. Techniques like limiting model complexity, gathering more data, regularization, and cross-validation are all, in different ways, attempts to find a good balance point on this tradeoff rather than pushing to either extreme.
