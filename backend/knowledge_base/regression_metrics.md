# R², RMSE, and MAE Explained

When the target variable is continuous (a number, not a category), this is a regression problem, and it needs different metrics than classification. This app reports three: R², RMSE, and MAE.

R² (the coefficient of determination) measures how much of the variance in the target variable the model explains, on a scale where 1.0 means perfect predictions and 0.0 means the model does no better than always predicting the average value of the target. R² can even go negative if the model performs worse than that naive average-guessing baseline. R² is unitless, which makes it easy to compare across different datasets.

RMSE (root mean squared error) measures the typical size of prediction errors, in the same units as the target variable. It squares each error before averaging, which means large errors are penalized disproportionately more than small ones — a single wildly wrong prediction will inflate RMSE more than several small ones. Lower is better, and 0 would mean perfect predictions.

MAE (mean absolute error) also measures typical error size in the target's original units, but by averaging the absolute value of each error rather than squaring it. This makes MAE more robust to outliers than RMSE, since one huge miss does not dominate the score.

Comparing RMSE and MAE for the same model can be informative: if RMSE is much larger than MAE, it suggests the model has a few large errors mixed in with many small ones, rather than uniformly moderate errors.
