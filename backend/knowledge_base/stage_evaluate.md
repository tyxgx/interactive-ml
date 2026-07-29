# Pipeline Stage: Evaluate

The evaluate stage is the final step of the core pipeline. It compares the predictions generated in the predict stage against the true test labels (y_test) and computes performance metrics, so it runs after predict.

For classification problems, this stage computes accuracy, precision, recall, and F1 score (all using "weighted" averaging across classes, see the accuracy vs F1 and precision vs recall topics for what these mean), plus a full confusion matrix showing how predictions broke down by actual versus predicted class.

For regression problems, this stage computes R², RMSE, and MAE (see the R²/RMSE/MAE topic for what each measures), plus a table of actual versus predicted values for the first 20 test points, so you can see specific examples of how close or far off individual predictions were, not just an aggregate score.

This is the stage where you get the honest answer to "how good is this model, really?" — because everything it measures is computed against the test set, which the model never touched during training or preprocessing. The "Compare All Algorithms" feature in this app effectively runs a version of train, predict, and evaluate for every available algorithm on the same train/test split, so the metrics it produces are directly comparable to whatever a single evaluate run for one algorithm reports.
