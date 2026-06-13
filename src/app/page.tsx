import { GuidedGenerator } from "@/components/generator/guided-generator";
import content from "@/lib/landing-content.json";
import Link from "next/link";

const phaseLabels = ["Brief", "Audience", "Materials", "Blueprint"];

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[rgba(244,239,230,0.86)] px-5 py-3 backdrop-blur-xl sm:px-8 lg:px-11">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <a href="#top" className="flex items-center gap-3" aria-label="SlideMatrixAI home">
            <span className="grid h-9 w-9 grid-cols-2 gap-1 rounded-[10px] bg-[var(--foreground)] p-2">
              <span className="rounded-[2px] bg-[var(--clay)]" />
              <span className="rounded-[2px] bg-[#7e7466]" />
              <span className="rounded-[2px] bg-[#7e7466]" />
              <span className="rounded-[2px] bg-[var(--clay)]" />
            </span>
            <span className="leading-none">
              <span className="block font-serif text-xl font-semibold">
                {content.brand.name.replace("AI", "")}
                <span className="text-[var(--clay)]">AI</span>
              </span>
              <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.22em] text-[#a8997f]">
                {content.brand.tagline}
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-[var(--muted)] md:flex">
            <a className="transition hover:text-[var(--foreground)]" href="#modes">
              Modes
            </a>
            <a className="transition hover:text-[var(--foreground)]" href="#generator">
              Generator
            </a>
            <Link className="transition hover:text-[var(--foreground)]" href="/projects">
              Saved
            </Link>
            <a className="transition hover:text-[var(--foreground)]" href="#example">
              Example
            </a>
          </nav>

          <a
            href="#generator"
            className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[#54493e] shadow-[0_12px_26px_-22px_rgba(34,30,26,0.7)] transition hover:border-[var(--clay)] hover:text-[var(--clay)]"
          >
            Start blueprint
          </a>
        </div>
      </header>

      <div className="h-[3px] bg-[var(--border)]">
        <div className="h-full w-[48%] bg-gradient-to-r from-[var(--clay)] to-[var(--amber)]" />
      </div>

      <section id="top" className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_420px] lg:px-11 lg:py-14">
        <div className="flex min-h-[660px] flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--soft)] p-6 shadow-[0_30px_80px_-60px_rgba(34,30,26,0.55)] sm:p-9 lg:p-11">
          <div>
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-[var(--clay)]">
              {content.hero.eyebrow}
            </p>
            <h1 className="max-w-4xl font-serif text-5xl font-medium leading-[0.98] tracking-normal sm:text-6xl lg:text-7xl">
              {content.hero.headline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              {content.hero.subheadline}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#generator"
                className="rounded-full bg-[var(--clay)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_-18px_rgba(159,74,32,0.9)] transition hover:bg-[#a14a26]"
              >
                {content.hero.primaryCta}
              </a>
              <a
                href="#example"
                className="rounded-full border border-[var(--border)] bg-white px-6 py-3 text-sm font-semibold text-[#54493e] transition hover:border-[var(--clay)] hover:text-[var(--clay)]"
              >
                {content.hero.secondaryCta}
              </a>
            </div>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_290px]">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a8997f]">
                Input
              </p>
              <p className="mt-3 font-serif text-2xl font-semibold leading-tight">
                One guided form routes into three expert engines.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {content.supportedFiles.map((file) => (
                  <span
                    key={file}
                    className="rounded-full border border-[var(--border)] bg-[#fbf8f2] px-3 py-1.5 font-mono text-[10px] font-medium tracking-[0.12em] text-[#8a7e6e]"
                  >
                    {file}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a8997f]">
                Workflow
              </p>
              <div className="mt-4 space-y-3">
                {content.workflowSteps.map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f3e2d6] font-mono text-xs font-semibold text-[#a14a26]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-semibold text-[#54493e]">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[0_20px_55px_-42px_rgba(34,30,26,0.7)]">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a8997f]">
                Live Blueprint
              </p>
              <span className="rounded-full bg-[var(--sage)] px-3 py-1 text-xs font-semibold text-[var(--sage-ink)]">
                Ready
              </span>
            </div>

            <div className="rounded-xl bg-[var(--foreground)] p-5 text-[#f4efe6]">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#9a8c78]">
                Key Message
              </p>
              <p className="mt-3 font-serif text-2xl font-medium leading-tight">
                Approve the focused sales reset now to protect revenue before the gap compounds.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {phaseLabels.map((phase, index) => (
                <div key={phase} className="rounded-xl border border-[var(--border)] bg-[#fbf8f2] p-3">
                  <p className="font-mono text-[10px] text-[#a8997f]">0{index + 1}</p>
                  <p className="mt-1 text-sm font-semibold text-[#54493e]">{phase}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="modes" className="grid gap-3">
            {content.deckModes.map((mode) => (
              <article
                key={mode.id}
                className="rounded-2xl border border-[var(--border)] bg-white p-5 transition hover:border-[var(--clay)] hover:shadow-[0_18px_38px_-28px_rgba(159,74,32,0.7)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a8997f]">
                      {mode.subtitle}
                    </p>
                    <h2 className="mt-2 font-serif text-2xl font-semibold">{mode.label}</h2>
                  </div>
                  <span className="mt-1 h-4 w-4 rounded-full border-2 border-[var(--clay)] bg-[var(--clay)] shadow-[inset_0_0_0_3px_#fff]" />
                </div>
                <p className="mt-3 font-mono text-[11px] text-[var(--clay)]">{mode.framework}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{mode.description}</p>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section id="generator" className="mx-auto max-w-7xl px-5 pb-14 sm:px-8 lg:px-11">
        <GuidedGenerator />
      </section>

      <section id="example" className="mx-auto max-w-7xl px-5 pb-14 sm:px-8 lg:px-11">
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-6">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--clay)]">
              Output
            </p>
            <h2 className="mt-4 font-serif text-4xl font-medium leading-tight">
              Slide cards, not chat sludge.
            </h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {content.qualitySignals.map((signal) => (
                <span
                  key={signal}
                  className="rounded-lg border border-[#dce0cb] bg-[var(--sage)] px-3 py-2 text-xs font-semibold text-[var(--sage-ink)]"
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {content.exampleSlides.map((slide) => (
              <article key={slide.number} className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_16px_45px_-38px_rgba(34,30,26,0.7)]">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-serif text-4xl font-semibold text-[#e2c9b6]">{slide.number}</span>
                  <span className="rounded-full bg-[#f3e2d6] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#a14a26]">
                    {slide.step}
                  </span>
                </div>
                <h3 className="mt-4 max-w-3xl font-serif text-2xl font-semibold leading-tight">
                  {slide.title}
                </h3>
                <div className="mt-5 grid gap-5 md:grid-cols-[1fr_260px]">
                  <ul className="space-y-2">
                    {slide.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3 text-sm leading-6 text-[#3a352f]">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--clay)]" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-2">
                    <span className="block rounded-lg border border-[#dce0cb] bg-[var(--sage)] px-3 py-2 text-xs font-semibold text-[var(--sage-ink)]">
                      Data: {slide.data}
                    </span>
                    <span className="block rounded-lg border border-[var(--border)] bg-[#f4eee0] px-3 py-2 text-xs font-semibold text-[#54493e]">
                      Layout: {slide.layout}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
