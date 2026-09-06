// Footer — Minimal, paradigm-aware
const COLUMNS = [
  {
    title: 'Platform',
    links: [
      { label: 'Overview', href: '/' },
      { label: 'How it works', href: '/#how' },
      { label: 'Benchmarks', href: '/#benchmark' },
    ],
  },
  {
    title: 'Detection',
    links: [
      { label: 'Run a vector', href: '/detect' },
      { label: 'Heart disease', href: '/detect?disease=musa_heart' },
      { label: 'Diabetes (3-class)', href: '/detect?disease=musa_diabetes' },
      { label: 'Hepatitis C', href: '/detect?disease=musa_hcv' },
    ],
  },
  {
    title: 'Datasets',
    links: [
      { label: 'UCI Cleveland heart (#45)', href: 'https://archive.ics.uci.edu/dataset/45/heart+disease' },
      { label: 'UCI HCV data (#571)', href: 'https://archive.ics.uci.edu/dataset/571/hcv+data' },
      { label: 'Baghdad diabetes cohort (Kaggle)', href: 'https://www.kaggle.com/datasets/tanshihjen/early-stage-diabetes-risk-prediction' },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'SIH26139 problem statement', href: 'https://www.sih.gov.in' },
      { label: 'Musa2609/SIH- (model source)', href: 'https://github.com/Musa2609/SIH-' },
      { label: 'PennyLane', href: 'https://pennylane.ai' },
      { label: 'FastAPI', href: 'https://fastapi.tiangolo.com' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-hairline bg-void/80 backdrop-blur-xl">
      <div className="mx-auto max-w-[980px] px-5 py-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-caption-strong text-quantum tracking-[0.05em] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith('/') ? (
                      <a href={l.href} className="text-fine-print text-muted hover:text-ink hover:underline transition-colors">
                        {l.label}
                      </a>
                    ) : (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-fine-print text-muted hover:text-ink hover:underline transition-colors"
                      >
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-hairline pt-4">
          <p className="text-micro-legal text-quantum">
            Smart India Hackathon 2026 — SIH26139 (MedTech). Research demonstration on
            public UCI datasets: not a medical device and not a substitute for professional diagnosis.
          </p>
          <p className="text-micro-legal mt-2 text-muted">
            Copyright © 2026 Team Egreen Quanta. Models: Musa2609/SIH- (HistGradientBoosting, XGBoost,
            Random Forest + 4-qubit PennyLane VQCs); explain rankings are heuristic, SHAP pending.
          </p>
        </div>
      </div>
    </footer>
  )
}