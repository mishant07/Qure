# Benchmark Report — 5-Disease Hybrid Quantum ML Demo

Generated: hybrid_benchmark.py

## Heart Disease (UCI Cleveland)
| Model | Acc | Prec | Recall | F1 | ROC-AUC | Train(s) |
|---|---|---|---|---|---|---|
| classical_best | 0.869 | 0.812 | 0.929 | 0.867 | 0.937 | 0.0 |
| vqc | 0.902 | 0.867 | 0.929 | 0.897 | 0.946 | 51.9 |

> **Interpretation:** VQC outperforms classical — valid quantum assist (ΔF1=+0.030)

## Diabetes (Pima)
| Model | Acc | Prec | Recall | F1 | ROC-AUC | Train(s) |
|---|---|---|---|---|---|---|
| classical_best | 0.708 | 0.574 | 0.648 | 0.609 | 0.811 | 0.0 |
| vqc | 0.701 | 0.580 | 0.537 | 0.558 | 0.731 | 86.5 |

> **Interpretation:** Classical outperforms VQC on this split — honest result, report as is (do not force win) (ΔF1=-0.051)

## Breast Cancer (UCI WDBC)
| Model | Acc | Prec | Recall | F1 | ROC-AUC | Train(s) |
|---|---|---|---|---|---|---|
| classical_best | 0.982 | 0.976 | 0.976 | 0.976 | 0.998 | 0.0 |
| vqc | 0.842 | 0.800 | 0.762 | 0.780 | 0.938 | 44.7 |

> **Interpretation:** Classical outperforms VQC on this split — honest result, report as is (do not force win) (ΔF1=-0.196)

## Liver Disease (UCI ILPD)
| Model | Acc | Prec | Recall | F1 | ROC-AUC | Train(s) |
|---|---|---|---|---|---|---|
| classical_best | 0.726 | 0.932 | 0.663 | 0.775 | 0.833 | 0.0 |
| vqc | 0.684 | 0.705 | 0.952 | 0.810 | 0.421 | 46.4 |

> **Interpretation:** VQC outperforms classical — valid quantum assist (ΔF1=+0.036)

## Parkinsons (UCI Oxford)
| Model | Acc | Prec | Recall | F1 | ROC-AUC | Train(s) |
|---|---|---|---|---|---|---|
| classical_best | 0.769 | 0.955 | 0.724 | 0.824 | 0.931 | 0.0 |
| vqc | 0.718 | 0.737 | 0.966 | 0.836 | 0.510 | 36.7 |

> **Interpretation:** VQC outperforms classical — valid quantum assist (ΔF1=+0.012)
