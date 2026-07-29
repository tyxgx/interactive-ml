# Pipeline Stage: Predict

The predict stage takes the model that was just trained and uses it to generate predictions on the held-out test set, and runs after the train stage.

Concretely, this stage calls the trained model's predict method on X_test_t, the preprocessed test features. It is important that this uses the test set (data the model never saw during fitting) rather than the training set — predicting on training data would tell you nothing about how the model generalizes, since the model already adjusted itself to fit that exact data.

The stage's summary reports how many predictions were generated (which should match the number of rows in the test set) and a small sample of the first few predictions, so you can sanity-check that the output looks reasonable (for example, that classification predictions are valid class labels, or that regression predictions are in a plausible numeric range for the target).

The predictions produced here are stored on the session and consumed directly by the next stage, evaluate, which compares them against the true test labels (y_test) to compute performance metrics. Predict itself does not compute any accuracy or error metrics — it only produces the raw predicted values.
