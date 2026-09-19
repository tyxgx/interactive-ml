# Accuracy vs F1 Score

Accuracy is the simplest classification metric: the fraction of all predictions that were correct, regardless of class. It is calculated as (correct predictions) divided by (total predictions).

Accuracy becomes misleading when classes are imbalanced. If 95% of examples belong to one class, a model that always predicts that class scores 95% accuracy while being completely useless for the minority class.

The F1 score fixes this by combining precision and recall into a single number: the harmonic mean of the two, F1 = 2 * (precision * recall) / (precision + recall). Because it is a harmonic mean rather than a simple average, F1 stays low if either precision or recall is low, so a model cannot hide a weakness in one by being strong in the other.

In this app, when there are more than two classes, precision, recall, and F1 are computed with "weighted" averaging: each class's score is weighted by how many true examples of that class exist, so the overall number reflects performance across all classes rather than just the largest one.

Rule of thumb: use accuracy for a quick, high-level check on balanced datasets, and use F1 (or look at precision and recall separately) whenever classes are imbalanced or the cost of false positives and false negatives differs.
