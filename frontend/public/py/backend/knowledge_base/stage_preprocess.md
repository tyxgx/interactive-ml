# Pipeline Stage: Preprocess

The preprocess stage transforms the raw train and test features into a numeric form that machine learning models can consume, and it runs after the split stage.

Under the hood, this app builds a scikit-learn ColumnTransformer that inspects the training data's column types automatically. Numeric columns are routed through a pipeline that fills in any missing values with the column's median (SimpleImputer with a "median" strategy), then scales them to zero mean and unit variance (StandardScaler). Categorical (non-numeric) columns are routed through a separate pipeline that fills missing values with the most frequent category, then one-hot encodes them into binary columns.

The critical detail is exactly when this transformer is "fit": it is fit only on the training data (fit_transform on X_train), and the test data is only ever transformed using those already-learned statistics (transform on X_test, never fit). This is what the summary's "fitted_on: train only (prevents data leakage)" message refers to — it is a deliberate safeguard against data leakage, not an implementation detail.

The preprocess stage's output reports the resulting shape of the transformed train and test sets (rows x columns), which typically has more columns than the original data if any categorical columns were one-hot encoded into multiple binary columns.
