# Cross-Validation

Cross-validation is a technique for getting a more reliable estimate of how well a model will perform, by testing it on multiple different splits of the data rather than just one.

In k-fold cross-validation, the training data is divided into k equally sized parts ("folds"). The model is trained k separate times: each time, one fold is held out as a validation set and the remaining k-1 folds are used for training. This produces k performance scores, which are then averaged to give a single, more stable estimate.

This matters because a single train/test split can be lucky or unlucky — by chance, the held-out portion might be unusually easy or unusually hard, giving a misleading picture of real performance. Averaging over several different splits smooths out that noise.

This app uses 5-fold cross-validation (cv=5) during the hyperparameter tuning stage, via scikit-learn's GridSearchCV. For every candidate combination of hyperparameters, the model is fit and evaluated 5 times on different folds of the training data, and the average score across those 5 folds is used to decide which combination is "best." Only after the best combination is chosen is the final model refit and evaluated once on the held-out test set, which the cross-validation process never touched — keeping the test set a fair, untouched final check.
