"""
Generate benchmark report + frontend JSON from saved metrics
python qml/hybrid_benchmark.py --out docs/benchmark_report.md
"""
import pathlib, json, glob

ROOT = pathlib.Path(__file__).parent.parent
out_md = ROOT/"docs/benchmark_report.md"
out_json = ROOT/"frontend/src/data/benchmark.json"
out_json.parent.mkdir(parents=True, exist_ok=True)

def load_metrics(dataset):
    res = {}
    # try new layout first, then legacy
    for base in [ROOT/f"models/classical/best_classical_{dataset}.json", ROOT/f"backend/models/best_classical_{dataset}.json", ROOT/f"results/comparison/classical_{dataset}.json"]:
        if base.exists():
            try:
                j=json.loads(base.read_text())
                if "best" in j:
                    best = j["best"]
                    res["classical_best"] = {"model": best, **j["results"][best]}
                    res["classical_all"] = j["results"]
                else:
                    # classical_{dataset}.json is just results dict
                    best = max(j, key=lambda k: j[k].get("f1",0))
                    res["classical_best"] = {"model": best, **j[best]}
                    res["classical_all"] = j
                break
            except: pass
    # also load individual metrics if best not found
    for m in ["logistic_regression","svm","random_forest"]:
        pp = ROOT/f"results/metrics/{m}_{dataset}.json"
        if pp.exists() and "classical_all" not in res:
            if "classical_all" not in res:
                res["classical_all"] = {}
            res["classical_all"][m] = json.loads(pp.read_text())
    if "classical_best" not in res and "classical_all" in res:
        best = max(res["classical_all"], key=lambda k: res["classical_all"][k].get("f1",0))
        res["classical_best"] = {"model": best, **res["classical_all"][best]}
    # vqc
    for pv in [ROOT/f"models/quantum/vqc_{dataset}/metrics.json", ROOT/f"results/metrics/vqc_{dataset}.json", ROOT/f"backend/models/vqc_{dataset}/metrics.json"]:
        if pv.exists():
            res["vqc"] = json.loads(pv.read_text()); break
    # qsvm
    for pq in [ROOT/f"models/quantum/qsvm_{dataset}.json", ROOT/f"results/metrics/qsvm_{dataset}.json", ROOT/f"backend/models/qsvm_{dataset}.json"]:
        if pq.exists():
            res["qsvm"] = json.loads(pq.read_text()); break
    return res

heart = load_metrics("heart")
diab = load_metrics("diabetes")

# Markdown
lines = ["# Benchmark Report — Heart + Diabetes Dual Demo", "", f"Generated: hybrid_benchmark.py", ""]
for name, data in [("Heart Disease (UCI Cleveland)", heart), ("Diabetes (Pima)", diab)]:
    lines.append(f"## {name}")
    if not data:
        lines.append("_No metrics yet — run train scripts first_\n")
        continue
    # table
    lines.append("| Model | Acc | Prec | Recall | F1 | ROC-AUC | Train(s) |")
    lines.append("|---|---|---|---|---|---|---|")
    for k,v in data.items():
        if k=="classical_all": continue
        lines.append(f"| {k} | {v.get('accuracy',0):.3f} | {v.get('precision',0):.3f} | {v.get('recall',0):.3f} | {v.get('f1',0):.3f} | {v.get('roc_auc',0):.3f} | {v.get('train_time_s',0):.1f} |")
    lines.append("")
    # honesty note
    if "vqc" in data and "classical_best" in data:
        diff = data["vqc"]["f1"] - data["classical_best"]["f1"]
        note = "VQC slightly outperforms classical — valid quantum assist" if diff>0 else "Classical outperforms VQC on this split — honest result, report as is (do not force win)"
        lines.append(f"> **Interpretation:** {note} (ΔF1={diff:+.3f})\n")

out_md.write_text("\n".join(lines))
print(f"Wrote {out_md}")

# JSON for frontend
combo = {"heart": heart, "diabetes": diab}
out_json.write_text(json.dumps(combo, indent=2))
print(f"Wrote {out_json}")
print("\n".join(lines[:60]))
