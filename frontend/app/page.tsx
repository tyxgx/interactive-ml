import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  GitCompareArrows,
  MessageSquareText,
  ScanSearch,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import BoundaryPlayground from "@/components/landing/BoundaryPlayground";
import PipelineTabs from "@/components/landing/PipelineTabs";
import Reveal from "@/components/landing/Reveal";
import { algorithms } from "@/lib/algorithms";

export const metadata: Metadata = {
  title: "Interactive ML | Watch a model learn, one stage at a time",
  description:
    "A hands-on scikit-learn pipeline where every step is open: split, preprocess, train, evaluate. Compare algorithms and see decision boundaries.",
};

const REPO_URL = "https://github.com/tyxgx/interactive-ml";

const primaryCta =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-[transform,background-color] duration-150 hover:bg-primary-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";
const secondaryCta =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-border-strong bg-surface-raised px-5 py-2.5 text-sm font-semibold text-foreground transition-[transform,background-color] duration-150 hover:bg-surface-sunken active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

// Real results: logistic regression comparison on iris, 80/20 split.
const comparison = [
  ["Support Vector Machine", "0.9667"],
  ["Logistic Regression", "0.9333"],
  ["Decision Tree", "0.9333"],
  ["K-Nearest Neighbors", "0.9333"],
  ["Random Forest", "0.9000"],
];

const datasets = [
  ["iris", "classification"],
  ["wine", "classification"],
  ["breast_cancer", "classification"],
  ["diabetes", "regression"],
  ["california_housing", "regression"],
];

const guarantees = [
  {
    title: "No data leakage",
    body: "The split happens first. Preprocessing is fitted on training rows and only applied to the test set.",
  },
  {
    title: "One path for every dataset",
    body: "Built-in or uploaded, each dataset gets a schema that drives preprocessing and algorithm choice.",
  },
  {
    title: "A fair comparison",
    body: "Every algorithm trains on the same split and is scored on the same test rows.",
  },
];

const gridBackground = {
  backgroundImage:
    "radial-gradient(60% 50% at 75% 0%, color-mix(in srgb, var(--color-primary) 16%, transparent), transparent 70%), linear-gradient(to right, color-mix(in srgb, var(--color-border) 55%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--color-border) 55%, transparent) 1px, transparent 1px)",
  backgroundSize: "auto, 56px 56px, 56px 56px",
  maskImage: "linear-gradient(to bottom, black 55%, transparent)",
} as const;

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" strokeWidth={2} />
            <span className="font-mono text-sm font-semibold tracking-tight">Interactive ML</span>
          </Link>
          <div className="flex items-center gap-2">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
            >
              GitHub
            </a>
            <Link href="/explore" className={`${primaryCta} !px-4 !py-2`}>
              Open the app
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* hero */}
        <section className="relative isolate overflow-hidden">
          <div aria-hidden className="absolute inset-0 -z-10" style={gridBackground} />
          <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)] items-center gap-12 px-4 pb-16 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:pb-20 lg:pt-16">
            <Reveal>
              <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tighter sm:text-5xl lg:text-6xl">
                Watch a model learn, one stage at a time.
              </h1>
              <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
                A hands-on scikit-learn pipeline where every step is open: split, preprocess,
                train, evaluate. Break it, compare it, understand it.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link href="/explore" className={primaryCta}>
                  Open the app <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
                <a href={REPO_URL} target="_blank" rel="noreferrer" className={secondaryCta}>
                  View source
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <BoundaryPlayground />
            </Reveal>
          </div>
        </section>

        {/* pipeline */}
        <section className="border-y border-border bg-surface-raised">
          <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 md:py-28">
            <Reveal>
              <h2 className="text-balance text-3xl font-semibold tracking-tighter sm:text-4xl md:text-5xl">
                Six stages, all inspectable.
              </h2>
              <p className="mt-4 max-w-[56ch] text-base leading-relaxed text-muted-foreground">
                Run one stage at a time and read what it produced, or run the whole pipeline in a
                click.
              </p>
            </Reveal>
            <Reveal delay={0.08} className="mt-12">
              <PipelineTabs />
            </Reveal>
          </div>
        </section>

        {/* bento */}
        <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 md:py-28">
          <Reveal>
            <h2 className="text-balance text-3xl font-semibold tracking-tighter sm:text-4xl md:text-5xl">
              Everything a real workflow needs.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-4 md:grid-cols-6">
            <Reveal className="md:col-span-4">
              <article className="h-full rounded-lg border border-border bg-surface-raised p-6 sm:p-8">
                <GitCompareArrows className="h-6 w-6 text-primary" strokeWidth={1.75} />
                <h3 className="mt-5 text-xl font-semibold tracking-tight">Compare every algorithm</h3>
                <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
                  One click ranks all algorithms on the same split. This is a real run on iris.
                </p>
                <table className="mt-6 w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="pb-2 font-medium">Algorithm</th>
                      <th className="pb-2 text-right font-medium">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {comparison.map(([name, score], i) => (
                      <tr key={name} className={i === 0 ? "text-primary" : "text-foreground"}>
                        <td className="py-1.5 font-sans font-medium">{name}</td>
                        <td className="py-1.5 text-right font-semibold">{score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            </Reveal>

            <Reveal delay={0.06} className="md:col-span-2">
              <article
                className="flex h-full flex-col justify-between rounded-lg border border-border p-6 sm:p-8"
                style={{
                  background:
                    "linear-gradient(160deg, color-mix(in srgb, var(--color-primary) 22%, var(--color-surface-raised)), var(--color-surface-raised) 70%)",
                }}
              >
                <ScanSearch className="h-6 w-6 text-primary" strokeWidth={1.75} />
                <div className="mt-10">
                  <h3 className="text-xl font-semibold tracking-tight">Decision boundaries</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Pick any two features and see where the trained model draws its lines.
                  </p>
                </div>
              </article>
            </Reveal>

            <Reveal className="md:col-span-2">
              <article className="flex h-full flex-col justify-between rounded-lg border border-border bg-surface-raised p-6 sm:p-8">
                <SlidersHorizontal className="h-6 w-6 text-accent" strokeWidth={1.75} />
                <div className="mt-10">
                  <p className="font-mono text-4xl font-semibold tracking-tighter">5-fold</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight">Grid search tuning</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Cross-validated, with the best parameters and score shown.
                  </p>
                </div>
              </article>
            </Reveal>

            <Reveal delay={0.06} className="md:col-span-2">
              <article
                className="flex h-full flex-col justify-between rounded-lg border border-dashed border-border-strong p-6 sm:p-8"
                style={{
                  backgroundImage:
                    "radial-gradient(color-mix(in srgb, var(--color-foreground) 14%, transparent) 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                }}
              >
                <Upload className="h-6 w-6 text-primary" strokeWidth={1.75} />
                <div className="mt-10">
                  <h3 className="text-xl font-semibold tracking-tight">Bring your own CSV</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Numeric and categorical columns are detected and handled for you.
                  </p>
                </div>
              </article>
            </Reveal>

            <Reveal delay={0.12} className="md:col-span-2">
              <article className="flex h-full flex-col rounded-lg border border-border bg-accent-soft p-6 sm:p-8">
                <MessageSquareText className="h-6 w-6 text-accent" strokeWidth={1.75} />
                <h3 className="mt-5 text-xl font-semibold tracking-tight">Ask the assistant</h3>
                <p className="mt-3 text-sm font-medium">What is overfitting?</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Overfitting happens when a model learns the training data too well, including its
                  noise and quirks, rather than the underlying pattern.
                </p>
              </article>
            </Reveal>
          </div>
        </section>

        {/* under the hood */}
        <section className="border-y border-border bg-surface-raised">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)] gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
            <Reveal>
              <h2 className="text-balance text-3xl font-semibold tracking-tighter sm:text-4xl md:text-5xl">
                Correct where it counts.
              </h2>
              <div className="mt-10 flex flex-col gap-7">
                {guarantees.map((g) => (
                  <div key={g.title} className="border-l-2 border-primary pl-5">
                    <h3 className="text-lg font-semibold tracking-tight">{g.title}</h3>
                    <p className="mt-1.5 max-w-[48ch] text-sm leading-relaxed text-muted-foreground">
                      {g.body}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="overflow-hidden rounded-lg border border-border bg-surface-sunken">
                <div className="border-b border-border px-4 py-2.5 font-mono text-xs text-muted-foreground">
                  backend/main.py
                </div>
                <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-7 text-foreground">
                  <code>
{`X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

preprocessor = build_preprocessor(X_train)
X_train_t = preprocessor.fit_transform(X_train)
X_test_t = preprocessor.transform(X_test)`}
                  </code>
                </pre>
                <p className="border-t border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                  The test set is only ever transformed, never fitted on.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* algorithms and datasets */}
        <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 md:py-28">
          <Reveal>
            <h2 className="text-balance text-3xl font-semibold tracking-tighter sm:text-4xl md:text-5xl">
              Seven algorithms. Five datasets. Or yours.
            </h2>
          </Reveal>
          <Reveal delay={0.08} className="mt-10">
            <ul className="flex flex-wrap gap-2.5">
              {algorithms.map((a) => (
                <li
                  key={a.id}
                  className="rounded-md border border-border bg-surface-raised px-4 py-2 text-sm font-medium"
                >
                  {a.name}
                </li>
              ))}
            </ul>
            <ul className="mt-6 flex flex-wrap gap-2.5">
              {datasets.map(([name, kind]) => (
                <li
                  key={name}
                  className="flex items-baseline gap-2 rounded-md border border-border bg-surface-sunken px-4 py-2"
                >
                  <span className="font-mono text-sm font-medium">{name}</span>
                  <span className="text-xs text-muted-foreground">{kind}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* final cta */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6">
          <Reveal>
            <div
              className="relative overflow-hidden rounded-lg border border-border px-6 py-16 text-center sm:px-12 sm:py-20"
              style={{
                background:
                  "radial-gradient(70% 120% at 50% 0%, color-mix(in srgb, var(--color-primary) 30%, var(--color-surface-raised)), var(--color-surface-raised) 75%)",
              }}
            >
              <h2 className="mx-auto max-w-[20ch] text-balance text-3xl font-semibold tracking-tighter sm:text-5xl">
                Run your first pipeline in under a minute.
              </h2>
              <div className="mt-9 flex justify-center">
                <Link href="/explore" className={primaryCta}>
                  Open the app <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">
                No sign-up needed. The backend sleeps when idle, so the first load can take a few
                seconds.
              </p>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <span>Built with Next.js, FastAPI and scikit-learn.</span>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
          >
            github.com/tyxgx/interactive-ml
          </a>
        </div>
      </footer>
    </div>
  );
}
