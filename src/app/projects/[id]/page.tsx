import { ProjectDetailClient } from "@/components/projects/project-detail-client";
import content from "@/lib/landing-content.json";
import Link from "next/link";

type ProjectDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--border)] bg-[rgba(244,239,230,0.9)] px-5 py-3 backdrop-blur-xl sm:px-8 lg:px-11">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3" aria-label="SlideMatrixAI home">
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
          </Link>

          <nav className="flex items-center gap-4 text-sm font-semibold text-[var(--muted)]">
            <Link className="transition hover:text-[var(--foreground)]" href="/projects">
              Saved
            </Link>
            <Link
              href="/#generator"
              className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-[#54493e] shadow-[0_12px_26px_-22px_rgba(34,30,26,0.7)] transition hover:border-[var(--clay)] hover:text-[var(--clay)]"
            >
              New blueprint
            </Link>
          </nav>
        </div>
      </header>

      <div className="h-[3px] bg-[var(--border)]">
        <div className="h-full w-[72%] bg-gradient-to-r from-[var(--clay)] to-[var(--amber)]" />
      </div>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-11 lg:py-14">
        <ProjectDetailClient projectId={id} />
      </section>
    </main>
  );
}
