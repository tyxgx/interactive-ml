# Train/Test Split

A train/test split divides a dataset into two separate parts before any modeling happens: a training set, used to fit the model, and a test set, held back and used only to evaluate how well the model performs on data it has never seen.

The reason this matters is that a model's performance on the exact data it was trained on is not a trustworthy estimate of how it will perform in the real world. A model can always improve its training score by memorizing more detail, but that does not mean it has learned anything generalizable. The test set acts as a stand-in for "new data the model will encounter later," so evaluating on it gives a much more honest signal.

In this app, the split stage divides the data 80/20 (80% train, 20% test) using a fixed random_state of 42, which means the exact same rows end up in train versus test every time the split is run for a given session — this makes results reproducible and, critically, makes algorithm comparisons fair, since every algorithm is trained and tested on identical data.

For classification problems, the split is stratified, meaning the proportion of each class is kept roughly the same in both the train and test sets. This matters because with a plain random split, a class that is rare overall could end up almost entirely in one set, making training or evaluation for that class unreliable.
