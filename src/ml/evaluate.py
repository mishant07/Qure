"""Evaluate: collect all classical metrics, pick best per F1, save comparison
Run: python src/ml/evaluate.py --dataset heart
"""
import argparse, json, pathlib
from src.utils.config import RESULTS_METRICS, MODELS_CLASSICAL, RESULTS_COMPARISON

parser = argparse.ArgumentParser()
parser.add_argument("--dataset", required=True, choices=["heart","diabetes"])
args = parser.parse_args()

models = ["logistic_regression","svm","random_forest"]
results = {}
for m in models:
    p = RESULTS_METRICS/f"{m}_{args.dataset}.json"
    if p.exists():
        results[m] = json.loads(p.read_text())

if not results:
    raise SystemExit(f"No metrics found for {args.dataset}. Run src/ml/*.py first.")

best = max(results, key=lambda k: results[k]["f1"])
print(f"Best classical for {args.dataset}: {best} F1={results[best]['f1']:.3f} Recall={results[best]['recall']:.3f}")
print(results)

# Save best
best_path = MODELS_CLASSICAL/f"best_classical_{args.dataset}.json"
best_path.write_text(json.dumps({"best": best, "results": results}, indent=2))
print(f"Saved {best_path}")

# Also legacy path for old scaffold
legacy = pathlib.Path("backend/models")
if legacy.exists():
    legacy.mkdir(parents=True, exist_ok=True)
    legacy.joinpath(f"best_classical_{args.dataset}.json").write_text(json.dumps({"best": best, "results": results}, indent=2))

# Comparison folder
RESULTS_COMPARISON.mkdir(parents=True, exist_ok=True)
import json as js
with open(RESULTS_COMPARISON/f"classical_{args.dataset}.json","w") as f:
    js.dump(results, f, indent=2)
