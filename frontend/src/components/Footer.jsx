// Apple-dense footer: parchment canvas, hairline top, dense link columns in
// 12px fine print, micro-legal bottom bar. The one place density wins.
const COLUMNS = [
  {
    title: 'Platform',
    links: [
      { label: 'Overview', href: '/' },
      { label: 'The journey', href: '/#story' },
      { label: 'How it works', href: '/#how' },
      { label: 'Benchmarks', href: '/#benchmark' },
    ],
  },
  {
    title: 'Detection',
    links: [
      { label: 'Run a prediction', href: '/detect' },
      { label: 'Heart disease', href: '/detect?dataset=heart' },
      { label: 'Diabetes', href: '/detect?dataset=diabetes' },
      { label: 'Breast cancer', href: '/detect?dataset=breast_cancer' },
    ],
  },
  {
    title: 'Datasets',
    links: [
      { label: 'UCI Cleveland heart', href: 'https://archive.ics.uci.edu/dataset/45/heart+disease' },
      { label: 'Pima Indians diabetes', href: 'https://www.kaggle.com/datasets/uciml/pima-indians-diabetes-database' },
      { label: 'WDBC breast cancer', href: 'https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic' },
      { label: 'ILPD liver', href: 'https://archive.ics.uci.edu/dataset/225/ilpd+indian+liver+patient' },
      { label: 'Parkinsons', href: 'https://archive.ics.uci.edu/dataset/174/parkinsons' },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'SIH26139 problem statement', href: 'https://www.sih.gov.in' },
      { label: 'Qiskit', href: 'https://qiskit.org' },
      { label: 'PennyLane', href: 'https://pennylane.ai' },
      { label: 'FastAPI', href: 'https://fastapi.tiangolo.com' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-hairline bg-parchment">
      <div className="mx-auto max-w-[980px] px-5 py-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-caption-strong mb-3 text-ink">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith('/') ? (
                      <a href={l.href} className="text-fine-print text-ink-muted-80 hover:underline">
                        {l.label}
                      </a>
                    ) : (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-fine-print text-ink-muted-80 hover:underline"
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
          <p className="text-micro-legal text-ink-muted-48">
            Smart India Hackathon 2026 problem statement SIH26139 (MedTech). Research demonstration on
            public UCI datasets: not a medical device and not a substitute for professional diagnosis.
          </p>
          <p className="text-micro-legal mt-2 text-ink-muted-48">
            Copyright © 2026 Team Egreen Quanta. Quantum results use a demo offset on classical
            inference; explain rankings are heuristic, SHAP pending.
          </p>
        </div>
      </div>
    </footer>
  )
}