# Precision vs Recall

Precision and recall are two ways of measuring how good a classification model is at finding the positive class, and they answer different questions.

Precision asks: "Of everything the model labeled positive, how much was actually positive?" It is calculated as true positives divided by (true positives + false positives). High precision means few false alarms.

Recall asks: "Of everything that was actually positive, how much did the model catch?" It is calculated as true positives divided by (true positives + false negatives). High recall means few missed cases.

These two metrics trade off against each other. A model that predicts "positive" for almost everything will have high recall (it catches every real positive) but low precision (it also flags many negatives incorrectly). A model that only predicts "positive" when extremely confident will have high precision but may miss many real positives, lowering recall.

Which one matters more depends on the cost of each type of mistake. In medical screening, missing a disease (low recall) is often worse than a false alarm, so recall is prioritized. In spam filtering, wrongly blocking a real email (low precision) is often worse than letting some spam through.
