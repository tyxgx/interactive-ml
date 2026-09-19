"""Writes the built-in datasets' list and preview info as static JSON.

The frontend serves these instantly, so the dataset picker works while the in-browser
Python engine is still booting. Run via `npm run sync:backend` in ../frontend.
"""

import json
import sys
from pathlib import Path

from datasets import BUILTIN_DATASETS, get_dataset
from schema import build_dataset_info

out = {"list": [], "info": {}}
for name, spec in BUILTIN_DATASETS.items():
    df = get_dataset(name)
    out["list"].append(
        {"name": name, "default_target": spec["default_target"], "columns": list(df.columns)}
    )
    out["info"][name] = build_dataset_info(df, spec["default_target"])

target = Path(sys.argv[1])
target.write_text(json.dumps(out, separators=(",", ":"), allow_nan=False) + "\n", encoding="utf-8")
print(f"export_static_datasets: {len(out['list'])} datasets -> {target}")
