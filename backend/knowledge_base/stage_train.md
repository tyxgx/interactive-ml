# Pipeline Stage: Train

The train stage fits a chosen algorithm on the preprocessed training data, and runs after the preprocess stage. The user selects which algorithm to use (for example logistic regression, decision tree, random forest, KNN, SVM, or neural network) from the sidebar, and this stage calls that algorithm's fit method on X_train_t (the transformed training features) and y_train (the training targets).

After fitting, this app stores the trained model on the session so later stages (predict, evaluate) can use it, and reports several things in its summary: the algorithm name, the problem type (classification or regression), the model's hyperparameters as actually configured, and how long fitting took.

For models that support it, this stage also surfaces extra insight into what the model learned: tree-based models (decision tree, random forest) report their top feature_importances_, showing which input columns influenced predictions most. Linear and logistic regression report their coefficients in the same way. Neural networks additionally report their training loss curve, showing how the internal error measure decreased over training epochs, plus the network's architecture and how many epochs it actually ran for.

Separately, the "Tune Hyperparameters" action available next to this stage performs a similar fit, but searches over multiple hyperparameter combinations using cross-validation first (see the hyperparameter tuning and cross-validation topics) before fitting the single best combination as the final model.
