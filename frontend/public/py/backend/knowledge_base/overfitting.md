# Overfitting

Overfitting happens when a model learns the training data too well, including its noise and quirks, instead of learning the general pattern that would let it perform well on new, unseen data.

A classic sign of overfitting is a big gap between training performance and test performance: the model scores very high accuracy (or R²) on the data it was trained on, but scores much lower on held-out test data. This gap means the model memorized specifics of the training set rather than learning something transferable.

Overfitting tends to get worse as model complexity increases relative to the amount of training data available. A decision tree allowed to grow without limits, for example, can create a leaf for almost every individual training example, achieving near-perfect training accuracy while generalizing poorly. Similarly, a random forest with too many very deep trees, or a neural network trained for too many epochs on a small dataset, can overfit.

Common ways to reduce overfitting include: using simpler models or constraining model complexity (e.g. limiting tree depth, adding regularization), gathering more training data, using cross-validation to get a more reliable estimate of real-world performance, and always evaluating on a held-out test set that the model never saw during training — which is exactly why this app keeps a separate train/test split.
