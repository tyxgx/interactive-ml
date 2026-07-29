# Confusion Matrix

A confusion matrix is a table that shows how a classification model's predictions compare to the true labels, broken down by class, instead of collapsing everything into a single accuracy number.

Each row represents the actual (true) class, and each column represents the predicted class. The cell where a row and column meet counts how many test examples with that actual class were predicted as that column's class. The diagonal (where the row and column index match) counts correct predictions; everything off the diagonal is a mistake.

For example, in a 3-class problem, the cell at row "class 1", column "class 2" tells you how many examples that were truly class 1 got incorrectly predicted as class 2. A large diagonal relative to the rest of the matrix means the model is doing well overall. A pattern where two specific classes are frequently confused with each other (large numbers in their crossing cells) tells you exactly where the model struggles, which a single accuracy score cannot show.

Confusion matrices are also the raw material that precision, recall, and F1 are computed from. Summing a column gives you everything predicted as that class (used for precision); summing a row gives you everything that actually is that class (used for recall). This app displays the confusion matrix alongside the evaluation metrics for exactly this reason — the matrix explains why the metrics look the way they do.
