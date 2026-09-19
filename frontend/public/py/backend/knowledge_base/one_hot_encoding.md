# One-Hot Encoding

One-hot encoding is a way to convert categorical (non-numeric) columns, like "city" or "color", into a numeric form that machine learning models can actually use, since most algorithms only accept numbers as input.

Instead of assigning an arbitrary number to each category (which would falsely imply an order or distance between categories, e.g. "Paris = 1, Tokyo = 2, London = 3" wrongly suggesting Tokyo is "between" the other two), one-hot encoding creates a separate binary (0 or 1) column for every possible category. Only one of these columns is "hot" (set to 1) for any given row, and the rest are 0.

For example, a "color" column with values red, green, and blue becomes three new columns: is_red, is_green, is_blue. A row with color "green" gets is_red=0, is_green=1, is_blue=0.

This app's preprocessing pipeline applies one-hot encoding automatically to any column detected as categorical (non-numeric dtype), separately from the numeric scaling pipeline applied to numeric columns, and combines both back together using a ColumnTransformer. The encoder is configured to handle unknown categories gracefully (any category seen at prediction time that never appeared in training is encoded as all zeros) rather than crashing, which matters for user-uploaded CSVs that might have categories the training split never saw.
