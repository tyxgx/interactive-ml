# Pipeline Stage: Split

The split stage is the first modeling step in this app's pipeline, run after a dataset is loaded. It takes the full feature matrix (X) and target column (y) and divides them into a training set and a test set.

Specifically, this app uses an 80/20 split (80% of rows for training, 20% held out for testing) with a fixed random_state of 42, so the split is reproducible across runs of the same session. For classification problems, the split is stratified by the target column, meaning each class appears in the train and test sets in roughly the same proportion as in the full dataset.

The split stage's output summary reports how many rows ended up in train versus test, the test_size fraction, whether stratification was used, and the random_state value.

This stage exists as its own explicit step, before any preprocessing or model fitting, specifically so that no later step can accidentally use information from the test set while preparing the training data — this ordering is what prevents data leakage. Every other stage in the pipeline (preprocess, train, predict, evaluate, tune, compare) depends on this split having already happened.
