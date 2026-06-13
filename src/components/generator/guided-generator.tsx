"use client";

import type { Blueprint, BlueprintRequest, BlueprintResponse } from "@/lib/blueprint-types";
import generatorContent from "@/lib/generator-content.json";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { uploadMaterialFile } from "@/lib/uploads/cloudinary-client";
import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";

const initialDeckType = generatorContent.deckTypes[0].id;
const ACCEPTED_FILE_TYPES = ".pdf,.csv,.txt,.png,.jpg,.jpeg,application/pdf,text/csv,text/plain,image/png,image/jpeg";

type UploadedMaterial = {
  id: string;
  name: string;
  kind: string;
  size: number;
  status: "uploading" | "ready" | "failed";
  provider?: "cloudinary" | "local";
  url?: string;
  publicId?: string;
  extractedText?: string;
  extractionStatus?: "extracted" | "pending" | "unsupported" | "failed";
  error?: string;
};

export function GuidedGenerator() {
  const [deckType, setDeckType] = useState(initialDeckType);
  const [audienceRole, setAudienceRole] = useState(generatorContent.audienceRoles[0]);
  const [communicationStyle, setCommunicationStyle] = useState(generatorContent.communicationStyles[0]);
  const [problem, setProblem] = useState("");
  const [materials, setMaterials] = useState("");
  const [beforeState, setBeforeState] = useState("");
  const [afterState, setAfterState] = useState("");
  const [uploadedMaterials, setUploadedMaterials] = useState<UploadedMaterial[]>([]);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [latestRequest, setLatestRequest] = useState<BlueprintRequest | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authStatus, setAuthStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [authMessage, setAuthMessage] = useState("");

  const activeDeck = useMemo(
    () => generatorContent.deckTypes.find((type) => type.id === deckType) ?? generatorContent.deckTypes[0],
    [deckType],
  );
  const hasMaterial = Boolean(materials.trim() || uploadedMaterials.length);

  function handleMaterialUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (!files.length) {
      return;
    }

    const stagedMaterials = files.map((file) => ({
      id: localMaterialId(file),
      name: file.name,
      kind: readableFileKind(file),
      size: file.size,
      status: "uploading" as const,
      provider: undefined,
    }));

    setUploadedMaterials((currentMaterials) => {
      const existingIds = new Set(currentMaterials.map((material) => material.id));
      return [
        ...currentMaterials,
        ...stagedMaterials.filter((material) => !existingIds.has(material.id)),
      ];
    });

    files.forEach((file) => {
      uploadMaterialFile(file)
        .then((uploadedMaterial) => {
          setUploadedMaterials((currentMaterials) =>
            currentMaterials.map((material) =>
              material.id === localMaterialId(file)
                ? {
                    ...material,
                    ...uploadedMaterial,
                    status: "ready",
                  }
                : material,
            ),
          );
        })
        .catch((error) => {
          setUploadedMaterials((currentMaterials) =>
            currentMaterials.map((material) =>
              material.id === localMaterialId(file)
                ? {
                    ...material,
                    status: "failed",
                    error: error instanceof Error ? error.message : "Upload failed.",
                  }
                : material,
            ),
          );
        });
    });

    event.target.value = "";
  }

  function removeMaterial(id: string) {
    setUploadedMaterials((currentMaterials) => currentMaterials.filter((material) => material.id !== id));
  }

  async function generateBlueprint() {
    const payload: BlueprintRequest = {
      deckType,
      audienceRole,
      communicationStyle,
      problem,
      materials,
      beforeState,
      afterState,
      uploadedMaterials: uploadedMaterials
        .filter((material) => material.status === "ready")
        .map(({ name, kind, size, url, publicId, provider, extractedText, extractionStatus }) => ({
          name,
          kind,
          size,
          url,
          publicId,
          provider,
          extractedText,
          extractionStatus,
        })),
    };

    setIsGenerating(true);
    setGenerationError("");

    try {
      const response = await fetch("/api/blueprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorBody?.error ?? "Unable to generate blueprint.");
      }

      const data = (await response.json()) as BlueprintResponse;
      setLatestRequest(payload);
      setBlueprint(data.blueprint);
      setSaveStatus("idle");
      setSaveMessage("");
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "Unable to generate blueprint.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function requestMagicLink() {
    setAuthStatus("sending");
    setAuthMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/#generator")}`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      setAuthStatus("sent");
      setAuthMessage("Check your email for the sign-in link.");
    } catch (error) {
      setAuthStatus("failed");
      setAuthMessage(error instanceof Error ? error.message : "Unable to send sign-in link.");
    }
  }

  async function saveBlueprint() {
    if (!blueprint || !latestRequest) {
      return;
    }

    setSaveStatus("saving");
    setSaveMessage("");

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: latestRequest,
          blueprint,
          title: latestRequest.problem,
        }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string; project?: { title?: string } } | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to save project.");
      }

      setSaveStatus("saved");
      setSaveMessage(`Saved${data?.project?.title ? `: ${data.project.title}` : ""}`);
    } catch (error) {
      setSaveStatus("failed");
      setSaveMessage(error instanceof Error ? error.message : "Unable to save project.");
    }
  }

  const completionCount = [
    deckType,
    audienceRole,
    communicationStyle,
    problem.trim(),
    hasMaterial,
    beforeState.trim(),
    afterState.trim(),
  ].filter(Boolean).length;
  const completionPct = Math.round((completionCount / 7) * 100);

  return (
    <section
      aria-labelledby="generator-title"
      className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_24px_70px_-54px_rgba(34,30,26,0.7)] sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--clay)]">
            Guided Generator
          </p>
          <h2 id="generator-title" className="mt-2 font-serif text-3xl font-semibold leading-tight">
            Build your presentation brief
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            One workflow routes your inputs into the right presentation engine.
          </p>
        </div>
        <div className="min-w-32 rounded-xl border border-[var(--border)] bg-[#fbf8f2] p-3 text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#a8997f]">Ready</p>
          <p className="mt-1 font-serif text-2xl font-semibold text-[var(--clay)]">{completionPct}%</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        <ol className="space-y-2">
          {generatorContent.steps.map((step, index) => (
            <li key={step.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[#fcfaf5] px-3 py-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f3e2d6] font-mono text-xs font-semibold text-[#a14a26]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-sm font-semibold text-[#54493e]">{step.label}</span>
            </li>
          ))}
        </ol>

        <div className="space-y-6">
          <div className="grid gap-3 rounded-xl border border-[var(--border)] bg-[#fcfaf5] p-4 md:grid-cols-[1fr_auto] md:items-end">
            <label className="block">
              <span className="font-serif text-lg font-semibold">Save projects with Supabase</span>
              <input
                type="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                placeholder="you@company.com"
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#b3a795] focus:border-[var(--clay)]"
              />
            </label>
            <button
              type="button"
              onClick={requestMagicLink}
              disabled={authStatus === "sending"}
              className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[#54493e] transition hover:border-[var(--clay)] hover:text-[var(--clay)] disabled:cursor-not-allowed disabled:opacity-65"
            >
              {authStatus === "sending" ? "Sending..." : "Send magic link"}
            </button>
            {authMessage ? (
              <p className={`text-sm font-semibold ${authStatus === "failed" ? "text-[#a14a26]" : "text-[#5f6b4e]"}`}>
                {authMessage}
              </p>
            ) : null}
          </div>

          <fieldset>
            <legend className="mb-3 font-serif text-xl font-semibold">What are you creating?</legend>
            <div className="grid gap-3 md:grid-cols-3">
              {generatorContent.deckTypes.map((type) => {
                const selected = type.id === deckType;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setDeckType(type.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-[var(--clay)] bg-[#fffaf6] shadow-[0_16px_38px_-28px_rgba(159,74,32,0.9)]"
                        : "border-[var(--border)] bg-[#fcfaf5] hover:border-[var(--clay)]"
                    }`}
                    aria-pressed={selected}
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#a8997f]">
                      {type.framework}
                    </span>
                    <span className="mt-2 block font-serif text-xl font-semibold">{type.label}</span>
                    <span className="mt-2 block text-sm leading-5 text-[var(--muted)]">{type.description}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-5 md:grid-cols-2">
            <ChoiceGroup
              label="Who is in the room?"
              options={generatorContent.audienceRoles}
              value={audienceRole}
              onChange={setAudienceRole}
            />
            <ChoiceGroup
              label="How do they prefer information?"
              options={generatorContent.communicationStyles}
              value={communicationStyle}
              onChange={setCommunicationStyle}
            />
          </div>

          <label className="block">
            <span className="font-serif text-xl font-semibold">What problem should the deck solve?</span>
            <textarea
              value={problem}
              onChange={(event) => setProblem(event.target.value)}
              placeholder={generatorContent.placeholders.problem}
              rows={3}
              className="mt-3 w-full resize-y rounded-2xl border border-[var(--border)] bg-[#fcfaf5] px-4 py-3 text-sm leading-6 text-[var(--foreground)] outline-none transition placeholder:text-[#b3a795] focus:border-[var(--clay)]"
            />
          </label>

          <div className="rounded-2xl border border-dashed border-[#dbcbb3] bg-[#fbf8f2] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-serif text-xl font-semibold">Add your material</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Upload screenshots, PDFs, spreadsheets, or notes. You can also paste source context below.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {generatorContent.fileTypes.map((fileType) => (
                  <span key={fileType} className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-[#8a7e6e]">
                    {fileType}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[260px_1fr]">
              <label
                htmlFor="material-upload"
                className="flex min-h-36 cursor-pointer flex-col justify-between rounded-xl border border-dashed border-[#cdbb9d] bg-white p-4 transition hover:border-[var(--clay)]"
              >
                <span>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[#a8997f]">
                    File intake
                  </span>
                  <span className="mt-2 block font-serif text-2xl font-semibold">Choose files</span>
                  <span className="mt-2 block text-sm leading-5 text-[var(--muted)]">
                    PDF, CSV, TXT, PNG, JPG
                  </span>
                </span>
                <span className="mt-4 inline-flex w-fit rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[#f4efe6]">
                  Browse
                </span>
                <input
                  id="material-upload"
                  type="file"
                  multiple
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={handleMaterialUpload}
                  className="sr-only"
                />
              </label>

              <div className="rounded-xl border border-[var(--border)] bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a8997f]">
                    Uploaded Materials
                  </p>
                  <p className="text-xs font-semibold text-[var(--muted)]">{uploadedMaterials.length} selected</p>
                </div>

                {uploadedMaterials.length ? (
                  <ul className="mt-3 space-y-2">
                    {uploadedMaterials.map((material) => (
                      <li
                        key={material.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[#fcfaf5] px-3 py-2"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-[#3a352f]">{material.name}</span>
                          <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-[#8a7e6e]">
                            {material.kind} / {formatFileSize(material.size)} / {material.provider ?? material.status}
                          </span>
                          {material.extractionStatus ? (
                            <span className="mt-1 block text-xs font-semibold text-[#5f6b4e]">
                              Extraction: {material.extractionStatus}
                            </span>
                          ) : null}
                          {material.error ? (
                            <span className="mt-1 block text-xs font-semibold text-[#a14a26]">{material.error}</span>
                          ) : null}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeMaterial(material.id)}
                          aria-label={`Remove ${material.name}`}
                          className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[#54493e] transition hover:border-[var(--clay)] hover:text-[var(--clay)]"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-3 rounded-lg border border-[var(--border)] bg-[#fcfaf5] px-3 py-5 text-sm text-[var(--muted)]">
                    No files selected yet.
                  </div>
                )}
              </div>
            </div>

            <textarea
              value={materials}
              onChange={(event) => setMaterials(event.target.value)}
              placeholder={generatorContent.placeholders.materials}
              rows={4}
              className="mt-4 w-full resize-y rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm leading-6 text-[var(--foreground)] outline-none transition placeholder:text-[#b3a795] focus:border-[var(--clay)]"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="font-serif text-lg font-semibold">Before state</span>
              <textarea
                value={beforeState}
                onChange={(event) => setBeforeState(event.target.value)}
                placeholder={generatorContent.placeholders.before}
                rows={3}
                className="mt-2 w-full resize-y rounded-xl border border-[var(--border)] bg-[#fcfaf5] px-4 py-3 text-sm leading-6 outline-none placeholder:text-[#b3a795] focus:border-[var(--clay)]"
              />
            </label>
            <label className="block">
              <span className="font-serif text-lg font-semibold">After state</span>
              <textarea
                value={afterState}
                onChange={(event) => setAfterState(event.target.value)}
                placeholder={generatorContent.placeholders.after}
                rows={3}
                className="mt-2 w-full resize-y rounded-xl border border-[var(--border)] bg-[#fcfaf5] px-4 py-3 text-sm leading-6 outline-none placeholder:text-[#b3a795] focus:border-[var(--clay)]"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[var(--foreground)] p-4 text-[#f4efe6]">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#9a8c78]">Selected engine</p>
              <p className="mt-1 font-serif text-2xl font-semibold">{activeDeck.framework}</p>
            </div>
            <button
              type="button"
              onClick={generateBlueprint}
              disabled={isGenerating}
              className="rounded-full bg-[var(--clay)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_-20px_rgba(159,74,32,0.9)] transition disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isGenerating ? "Generating..." : "Generate blueprint preview"}
            </button>
          </div>
          {generationError ? (
            <div className="rounded-xl border border-[#e4b9a2] bg-[#fff7f3] px-4 py-3 text-sm font-semibold text-[#a14a26]">
              {generationError}
            </div>
          ) : null}
        </div>
      </div>
      {blueprint ? (
        <SlideBlueprintWorkspace
          blueprint={blueprint}
          onSave={saveBlueprint}
          saveStatus={saveStatus}
          saveMessage={saveMessage}
        />
      ) : null}
    </section>
  );
}

type ChoiceGroupProps = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

function ChoiceGroup({ label, options, value, onChange }: ChoiceGroupProps) {
  return (
    <fieldset>
      <legend className="mb-3 font-serif text-xl font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option === value;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              aria-pressed={selected}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                selected
                  ? "border-[var(--foreground)] bg-[var(--foreground)] text-[#f4efe6]"
                  : "border-[var(--border)] bg-white text-[#54493e] hover:border-[var(--clay)] hover:text-[var(--clay)]"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function SlideBlueprintWorkspace({
  blueprint,
  onSave,
  saveStatus,
  saveMessage,
}: {
  blueprint: Blueprint;
  onSave: () => void;
  saveStatus: "idle" | "saving" | "saved" | "failed";
  saveMessage: string;
}) {
  return (
    <div className="mt-8 grid gap-5 border-t border-[var(--border)] pt-6 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-4">
        <div className="rounded-2xl bg-[var(--foreground)] p-5 text-[#f4efe6]">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#9a8c78]">Key Message</p>
          <p className="mt-3 font-serif text-2xl font-semibold leading-tight">{blueprint.keyMessage}</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[#fcfaf5] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a8997f]">Framework</p>
          <h3 className="mt-2 font-serif text-2xl font-semibold">{blueprint.framework.name}</h3>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{blueprint.framework.reason}</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a8997f]">Quality Checks</p>
          <div className="mt-4 space-y-2">
            {blueprint.deckQualityChecks.map((check) => (
              <div key={check.label} className="rounded-xl border border-[#dce0cb] bg-[var(--sage)] p-3">
                <p className="text-sm font-semibold text-[var(--sage-ink)]">{check.label}</p>
                <p className="mt-1 text-xs leading-5 text-[#5f6b4e]">{check.message}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--clay)]">Mock Result</p>
            <h3 className="mt-2 font-serif text-3xl font-semibold">Slide-by-slide blueprint</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={saveStatus === "saving"}
              className="rounded-full bg-[var(--clay)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-65"
            >
              {saveStatus === "saving" ? "Saving..." : "Save blueprint"}
            </button>
            <button className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[#54493e]">
              Copy all
            </button>
            <button className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[#f4efe6]">
              Export Markdown
            </button>
          </div>
        </div>
        {saveMessage ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
              saveStatus === "failed"
                ? "border-[#e4b9a2] bg-[#fff7f3] text-[#a14a26]"
                : "border-[#dce0cb] bg-[var(--sage)] text-[var(--sage-ink)]"
            }`}
          >
            {saveMessage}
          </div>
        ) : null}

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

            <h4 className="mt-4 font-serif text-2xl font-semibold leading-tight">{slide.assertionTitle}</h4>

            <div className="mt-5 grid gap-5 md:grid-cols-[1fr_270px]">
              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#a8997f]">
                  Slide Body
                </p>
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
      </div>
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

function readableFileKind(file: File) {
  if (file.type === "application/pdf") return "PDF";
  if (file.type === "text/csv") return "CSV";
  if (file.type === "text/plain") return "TXT";
  if (file.type === "image/png") return "PNG";
  if (file.type === "image/jpeg") return "JPG";

  return file.name.split(".").pop()?.toUpperCase() ?? "FILE";
}

function localMaterialId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
