# What Is a Hyperparameter?

A hyperparameter is a setting for a machine learning algorithm that is chosen before training begins, as opposed to a parameter, which is a value the model learns automatically from the data during training.

For example, in linear regression, the coefficients assigned to each feature are parameters — they are learned by fitting the model to data. But in a random forest, the number of trees to build (n_estimators) or the maximum depth each tree is allowed to grow to (max_depth) are hyperparameters — they must be set beforehand, and the training process does not choose them on its own.

Hyperparameters directly affect the trade-off between underfitting and overfitting. A decision tree with a very shallow max_depth might underfit (too simple to capture real patterns), while one with no depth limit might overfit (complex enough to memorize training data). Choosing good hyperparameter values is therefore an important part of building an effective model.

Because there is no formula to compute the "best" hyperparameters directly, they are typically found by trying multiple candidate combinations and measuring which performs best, usually using cross-validation to keep the comparison fair. This app's hyperparameter tuning stage does exactly this: it defines a small grid of candidate values for each algorithm and uses GridSearchCV with 5-fold cross-validation to search through them and pick the combination with the best average score.
