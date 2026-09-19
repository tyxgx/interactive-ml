"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

// Values below are real outputs from running logistic regression on iris.
const stages = [
  {
    name: "Load",
    blurb:
      "Choose a built-in dataset or upload a CSV. Column types are detected as soon as it loads.",
    output: [
      ["dataset", "iris"],
      ["rows", "150"],
      ["problem_type", "classification"],
    ],
  },
  {
    name: "Split",
    blurb: "An 80/20 train and test split, stratified for classification so classes stay balanced.",
    output: [
      ["train_rows", "120"],
      ["test_rows", "30"],
      ["stratified", "true"],
      ["random_state", "42"],
    ],
  },
  {
    name: "Preprocess",
    blurb: "Imputers, scalers and encoders are fitted on the training rows only.",
    output: [
      ["train_shape", "120, 4"],
      ["test_shape", "30, 4"],
      ["fitted_on", "train only (prevents data leakage)"],
    ],
  },
  {
    name: "Train",
    blurb: "Pick an algorithm and see the exact hyperparameters it was fitted with.",
    output: [
      ["algorithm", "logistic_regression"],
      ["C", "1"],
      ["solver", "lbfgs"],
      ["max_iter", "1000"],
    ],
  },
  {
    name: "Predict",
    blurb: "Every test row side by side: the actual label next to what the model predicted.",
    output: [
      ["rows_predicted", "30"],
      ["columns", "actual, predicted"],
    ],
  },
  {
    name: "Evaluate",
    blurb: "Accuracy, precision, recall and F1, plus a confusion matrix and feature importances.",
    output: [
      ["accuracy", "0.9333"],
      ["precision (weighted)", "0.9333"],
      ["recall (weighted)", "0.9333"],
      ["f1 (weighted)", "0.9333"],
    ],
  },
];

export default function PipelineTabs() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const stage = stages[active];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div role="tablist" aria-label="Pipeline stages" className="flex flex-col gap-1.5">
        {stages.map((s, i) => (
          <button
            key={s.name}
            role="tab"
            type="button"
            aria-selected={active === i}
            onClick={() => setActive(i)}
            className={`group flex items-center gap-4 rounded-lg border px-4 py-3.5 text-left transition-[background-color,border-color,transform] duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              active === i
                ? "border-primary/50 bg-primary-soft"
                : "border-transparent hover:bg-surface-sunken"
            }`}
          >
            <span
              className={`font-mono text-sm font-semibold transition-colors ${
                active === i ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-lg font-semibold tracking-tight">{s.name}</span>
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-surface-raised p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage.name}
            role="tabpanel"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="max-w-[46ch] text-base leading-relaxed text-muted-foreground">
              {stage.blurb}
            </p>
            <dl className="mt-6 rounded-md border border-border bg-surface-sunken p-4 font-mono text-sm">
              {stage.output.map(([key, value]) => (
                <div key={key} className="flex flex-wrap gap-x-3 py-1">
                  <dt className="text-muted-foreground">{key}:</dt>
                  <dd className="font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
