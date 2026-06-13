"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ProjectSummary = {
  id: string;
  title: string;
  deck_type: string;
  audience_role: string;
  communication_style: string;
  key_message: string;
  created_at: string;
  updated_at: string;
};

type ProjectsResponse = {
  projects?: ProjectSummary[];
  mode?: "local-dev";
  error?: string;
};

const deckTypeLabels: Record<string, string> = {
  report: "Business report",
  sales: "Sales deck",
  pitch: "Startup pitch",
};

export function SavedProjectsClient() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [mode, setMode] = useState<ProjectsResponse["mode"]>();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      setStatus("loading");
      setError("");

      try {
        const response = await fetch("/api/projects", { cache: "no-store" });
        const payload = (await response.json()) as ProjectsResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load saved projects.");
        }

        if (!isMounted) {
          return;
        }

        setProjects(payload.projects ?? []);
        setMode(payload.mode);
        setStatus("ready");
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setStatus("error");
        setError(loadError instanceof Error ? loadError.message : "Could not load saved projects.");
      }
    }

    void loadProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-white p-7">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--clay)]">Loading</p>
        <p className="mt-3 text-sm text-[var(--muted)]">Fetching your saved presentation blueprints.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-white p-7">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--clay)]">Needs sign in</p>
        <h2 className="mt-3 font-serif text-3xl font-semibold">Saved projects are locked.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">{error}</p>
        <Link
          href="/#generator"
          className="mt-6 inline-flex rounded-full bg-[var(--clay)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a14a26]"
        >
          Return to generator
        </Link>
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-white p-7">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--clay)]">No saved work yet</p>
        <h2 className="mt-3 font-serif text-3xl font-semibold">Create a blueprint, then save it here.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Your saved business reports, sales decks, and startup pitches will appear in this workspace.
        </p>
        <Link
          href="/#generator"
          className="mt-6 inline-flex rounded-full bg-[var(--clay)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a14a26]"
        >
          Start a blueprint
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--muted)]">
          {projects.length} saved {projects.length === 1 ? "project" : "projects"}
        </p>
        {mode === "local-dev" ? (
          <span className="rounded-full border border-[#dce0cb] bg-[var(--sage)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--sage-ink)]">
            Local dev
          </span>
        ) : null}
      </div>

      <div className="grid gap-4">
        {projects.map((project) => (
          <article
            key={project.id}
            className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_16px_45px_-38px_rgba(34,30,26,0.7)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a8997f]">
                  {deckTypeLabels[project.deck_type] ?? project.deck_type}
                </p>
                <h2 className="mt-2 font-serif text-2xl font-semibold leading-tight">{project.title}</h2>
              </div>
              <time className="rounded-full border border-[var(--border)] bg-[#fbf8f2] px-3 py-1.5 text-xs font-semibold text-[#54493e]">
                {formatDate(project.updated_at)}
              </time>
            </div>

            <p className="mt-4 max-w-4xl text-base leading-7 text-[#3a352f]">{project.key_message}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-lg border border-[var(--border)] bg-[#fbf8f2] px-3 py-2 text-xs font-semibold text-[#54493e]">
                Audience: {project.audience_role}
              </span>
              <span className="rounded-lg border border-[var(--border)] bg-[#fbf8f2] px-3 py-2 text-xs font-semibold text-[#54493e]">
                Style: {project.communication_style}
              </span>
              <Link
                href={`/projects/${project.id}`}
                className="rounded-lg bg-[var(--foreground)] px-3 py-2 text-xs font-semibold text-[#f4efe6] transition hover:bg-[#3a352f]"
              >
                Open blueprint
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
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
