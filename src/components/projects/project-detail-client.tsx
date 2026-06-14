"use client";

import type { Blueprint, BlueprintRequest } from "@/lib/blueprint-types";
import Link from "next/link";
import { useEffect, useState } from "react";

type ProjectDetail = {
  id: string;
  title: string;
  deck_type: string;
  audience_role: string;
  communication_style: string;
  key_message: string;
  request_payload: BlueprintRequest;
  blueprint: Blueprint;
  created_at: string;
  updated_at: string;
};

type ProjectDetailResponse = {
  project?: ProjectDetail;
  mode?: "local-dev";
  error?: string;
};

export function ProjectDetailClient({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [mode, setMode] = useState<ProjectDetailResponse["mode"]>();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [exportMessage, setExportMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProject() {
      setStatus("loading");
      setError("");

      try {
        const response = await fetch(`/api/projects/${projectId}`, { cache: "no-store" });
        const payload = (await response.json()) as ProjectDetailResponse;

        if (!response.ok || !payload.project) {
          throw new Error(payload.error ?? "Could not load this project.");
        }

        if (!isMounted) {
          return;
        }

        setProject(payload.project);
        setMode(payload.mode);
        setStatus("ready");
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setStatus("error");
        setError(loadError instanceof Error ? loadError.message : "Could not load this project.");
      }
    }

    void loadProject();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-white p-7">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--clay)]">Loading</p>
        <p className="mt-3 text-sm text-[var(--muted)]">Opening the saved blueprint.</p>
      </div>
    );
  }

  if (status === "error" || !project) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-white p-7">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--clay)]">Unavailable</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold">This project could not be opened.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">{error}</p>
        <Link
          href="/projects"
          className="mt-6 inline-flex rounded-full bg-[var(--clay)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a14a26]"
        >
          Back to saved projects
        </Link>
      </div>
    );
  }

  const blueprint = project.blueprint;

  async function handleCopyMarkdown() {
    if (!project) {
      return;
    }

    setExportMessage("");

    try {
      await copyTextToClipboard(buildProjectMarkdown(project));
      setExportMessage("Copied blueprint markdown to clipboard.");
    } catch {
      setExportMessage("Clipboard copy failed. Try Export Markdown instead.");
    }
  }

  function handleDownloadMarkdown() {
    if (!project) {
      return;
    }

    const markdown = buildProjectMarkdown(project);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${slugifyFilename(project.title)}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setExportMessage("Markdown export downloaded.");
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-2xl bg-[var(--foreground)] p-5 text-[#f4efe6]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#9a8c78]">Key Message</p>
              {mode === "local-dev" ? (
                <span className="rounded-full border border-[#51483e] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#dccab7]">
                  Local dev
                </span>
              ) : null}
            </div>
            <p className="mt-3 font-serif text-2xl font-semibold leading-tight">{project.key_message}</p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a8997f]">Brief</p>
            <dl className="mt-4 space-y-3 text-sm">
              <DetailRow label="Deck" value={project.deck_type} />
              <DetailRow label="Audience" value={project.audience_role} />
              <DetailRow label="Style" value={project.communication_style} />
              <DetailRow label="Saved" value={formatDate(project.updated_at)} />
            </dl>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[#fcfaf5] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a8997f]">Framework</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold">{blueprint.framework.name}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{blueprint.framework.reason}</p>
          </div>
        </aside>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_18px_55px_-44px_rgba(34,30,26,0.7)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--clay)]">
                Saved blueprint
              </p>
              <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight sm:text-5xl">{project.title}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[#f4efe6] transition hover:bg-[#3a352f]"
              >
                Copy all
              </button>
              <button
                type="button"
                onClick={handleDownloadMarkdown}
                className="rounded-full bg-[var(--clay)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a14a26]"
              >
                Export Markdown
              </button>
              <Link
                href="/projects"
                className="rounded-full border border-[var(--border)] bg-[#fbf8f2] px-4 py-2 text-sm font-semibold text-[#54493e] transition hover:border-[var(--clay)] hover:text-[var(--clay)]"
              >
                Back
              </Link>
            </div>
          </div>

          {exportMessage ? (
            <div className="mt-5 rounded-xl border border-[#dce0cb] bg-[var(--sage)] px-4 py-3 text-sm font-semibold text-[var(--sage-ink)]">
              {exportMessage}
            </div>
          ) : null}

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {blueprint.deckQualityChecks.map((check) => (
              <div key={check.label} className="rounded-xl border border-[#dce0cb] bg-[var(--sage)] p-4">
                <p className="text-sm font-semibold text-[var(--sage-ink)]">{check.label}</p>
                <p className="mt-2 text-xs leading-5 text-[#5f6b4e]">{check.message}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <BriefBlock label="Problem" value={project.request_payload.problem} />
            <BriefBlock label="Outcome" value={project.request_payload.afterState} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--clay)]">Slides</p>
          <h2 className="mt-2 font-serif text-4xl font-semibold">Slide-by-slide blueprint</h2>
        </div>

        {blueprint.slides.map((slide) => (
          <article
            key={slide.slideNumber}
            className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[0_16px_45px_-38px_rgba(34,30,26,0.7)]"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-serif text-4xl font-semibold text-[#e2c9b6]">
                {String(slide.slideNumber).padStart(2, "0")}
              </span>
              <span className="rounded-full bg-[#f3e2d6] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#a14a26]">
                {slide.frameworkStep}
              </span>
            </div>

            <h3 className="mt-4 font-serif text-2xl font-semibold leading-tight">{slide.assertionTitle}</h3>

            <div className="mt-5 grid gap-5 md:grid-cols-[1fr_280px]">
              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#a8997f]">Slide Body</p>
                <ul className="space-y-2">
                  {slide.bodyBullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3 text-sm leading-6 text-[#3a352f]">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--clay)]" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <InfoBadge label="Data" value={slide.dataVisualization.chartType ?? "N/A"} tone="green" />
                <InfoBadge label="Layout" value={slide.layoutRecommendation} tone="warm" />
              </div>
            </div>

            <details className="mt-5 rounded-xl border border-[var(--border)] bg-[#fbf8f2] p-3">
              <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.14em] text-[#a8997f]">
                Speaker Notes
              </summary>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{slide.speakerNotes}</p>
            </details>
          </article>
        ))}
      </section>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--border)] pb-2 last:border-0 last:pb-0">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="text-right font-semibold text-[#3a352f]">{value || "Not provided"}</dd>
    </div>
  );
}

function BriefBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[#fbf8f2] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a8997f]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[#3a352f]">{value || "Not provided"}</p>
    </div>
  );
}

function InfoBadge({ label, value, tone }: { label: string; value: string; tone: "green" | "warm" }) {
  const classes =
    tone === "green"
      ? "border-[#dce0cb] bg-[var(--sage)] text-[var(--sage-ink)]"
      : "border-[var(--border)] bg-[#f4eee0] text-[#54493e]";

  return (
    <span className={`block rounded-lg border px-3 py-2 text-xs font-semibold ${classes}`}>
      <span className="mr-2 font-mono text-[9px] uppercase tracking-[0.08em] opacity-70">{label}</span>
      {value}
    </span>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Saved";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function buildProjectMarkdown(project: ProjectDetail) {
  const blueprint = project.blueprint;
  const request = project.request_payload;
  const lines = [
    `# ${project.title}`,
    "",
    `**Deck type:** ${project.deck_type}`,
    `**Audience:** ${project.audience_role}`,
    `**Style:** ${project.communication_style}`,
    `**Saved:** ${formatDate(project.updated_at)}`,
    "",
    "## Key message",
    project.key_message,
    "",
    "## Brief",
    `**Problem:** ${request.problem || "Not provided"}`,
    `**Before state:** ${request.beforeState || "Not provided"}`,
    `**After state:** ${request.afterState || "Not provided"}`,
    `**Pasted materials:** ${request.materials || "Not provided"}`,
    "",
    "## Framework",
    `**${blueprint.framework.name}**`,
    blueprint.framework.reason,
    "",
    "## Quality checks",
    ...blueprint.deckQualityChecks.map((check) => `- **${check.label}:** ${check.message}`),
    "",
    "## Slide-by-slide blueprint",
    "",
    ...blueprint.slides.flatMap((slide) => [
      `### Slide ${slide.slideNumber}: ${slide.assertionTitle}`,
      "",
      `**Framework step:** ${slide.frameworkStep}`,
      "",
      "**Slide body:**",
      ...slide.bodyBullets.map((bullet) => `- ${bullet}`),
      "",
      `**Data visualization:** ${slide.dataVisualization.chartType ?? "N/A"} - ${slide.dataVisualization.reason}`,
      `**Layout:** ${slide.layoutRecommendation}`,
      "",
      `**Speaker notes:** ${slide.speakerNotes}`,
      "",
      ...buildVisualPromptMarkdown(project, slide),
      "",
    ]),
  ];

  return `${lines.join("\n").trim()}\n`;
}

function buildVisualPromptMarkdown(project: ProjectDetail, slide: Blueprint["slides"][number]) {
  const existingVisualPrompt = String(slide.visualPrompt ?? "").trim();
  const prompt = existingVisualPrompt || buildFallbackVisualPrompt(project, slide);

  return [
    "**AI-generated visual prompts:**",
    "",
    `**5W1H visual context:** Who = ${project.audience_role} buyer or stakeholder; What = ${slide.assertionTitle}; Where = ${inferVisualSetting(project.deck_type)}; When = current business decision moment; Why = ${project.key_message}; How = ${slide.layoutRecommendation}.`,
    "",
    "**Prompt framework:** Quality, subject, front detail, styling, action, background, lighting.",
    "",
    `**7-element prompt:** ${prompt}`,
    "",
    "**Usage note:** Use this for an image, mockup, or concept visual only when it clarifies the slide better than a chart or simple diagram.",
  ];
}

function buildFallbackVisualPrompt(project: ProjectDetail, slide: Blueprint["slides"][number]) {
  const chartContext = slide.dataVisualization.chartType
    ? `with a subtle ${slide.dataVisualization.chartType.toLowerCase()} visual motif`
    : "with a clean strategic visual motif";

  return [
    "Ultra-realistic, editorial business presentation visual",
    `${project.audience_role.toLowerCase()} stakeholder reviewing ${project.deck_type} strategy`,
    "focused, confident expression",
    "modern professional styling with neutral tones and one clay-colored highlight",
    `actively evaluating the insight: ${slide.assertionTitle}`,
    `${inferVisualSetting(project.deck_type)} ${chartContext}`,
    "soft directional light, premium SaaS-style composition, high clarity, no text overlays",
  ].join(", ");
}

function inferVisualSetting(deckType: string) {
  if (deckType === "sales") {
    return "a polished client meeting room";
  }

  if (deckType === "pitch") {
    return "a high-energy startup pitch room";
  }

  return "an executive boardroom";
}

async function copyTextToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const copied = document.execCommand("copy");

      if (!copied) {
        throw new Error("Copy command failed.");
      }
    } finally {
      textarea.remove();
    }
  }
}

function slugifyFilename(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || "slidematrix-blueprint";
}
