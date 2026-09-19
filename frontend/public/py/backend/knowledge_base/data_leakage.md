# Data Leakage

Data leakage happens when information from outside the training data — often from the test set, or from the future — accidentally influences how a model is trained, making its evaluation look better than it really is.

A very common form of leakage happens during preprocessing. If you compute statistics like the mean and standard deviation (for scaling) or the most frequent category (for imputing missing values) using the entire dataset, including the test set, then the model's training process has indirectly "seen" information about the test set before it was ever evaluated on it. This inflates test performance in a way that will not hold up in production, where truly new data has no such statistics baked in.

The correct approach, and the one this app follows, is: split the data into train and test sets first, then fit any preprocessing step (imputers, scalers, one-hot encoders) only on the training set. The test set is only ever transformed using the statistics learned from training data, never used to compute them. This is why the preprocessing stage in this app reports "fitted_on: train only (prevents data leakage)" — it is a deliberate safeguard, not an implementation detail.

Other common leakage sources include: accidentally including the target variable (or a proxy for it) as a feature, and using future information that would not actually be available at prediction time in a real deployment.
