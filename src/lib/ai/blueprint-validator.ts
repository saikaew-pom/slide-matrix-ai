import type { Blueprint } from "@/lib/blueprint-types";

const PRESENTATION_TYPES = new Set(["report", "sales", "pitch"]);

type JsonRecord = Record<string, unknown>;

export function validateBlueprint(value: unknown): Blueprint | null {
  if (!isRecord(value)) return null;

  const slides = asArray(value.slides)
    .map(normalizeSlide)
    .filter((slide): slide is Blueprint["slides"][number] => Boolean(slide));

  if (!isNonEmptyString(value.keyMessage) || !slides.length) {
    return null;
  }

  const presentationType = isNonEmptyString(value.presentationType) && PRESENTATION_TYPES.has(value.presentationType)
    ? value.presentationType
    : "report";
  const framework = normalizeFramework(value.framework);
  const audienceStrategy = normalizeAudienceStrategy(value.audienceStrategy);
  const deckQualityChecks = normalizeChecks(value.deckQualityChecks);

  return {
    keyMessage: value.keyMessage,
    presentationType,
    framework,
    audienceStrategy,
    deckQualityChecks,
    slides,
  } as Blueprint;
}

function normalizeSlide(value: unknown): Blueprint["slides"][number] | null {
  if (!isRecord(value) || !isNonEmptyString(value.assertionTitle)) {
    return null;
  }

  const bodyBullets = asArray(value.bodyBullets)
    .filter(isNonEmptyString)
    .slice(0, 3);

  return {
    slideNumber: typeof value.slideNumber === "number" ? value.slideNumber : 1,
    frameworkStep: asString(value.frameworkStep, "Narrative Step"),
    assertionTitle: value.assertionTitle,
    bodyBullets,
    dataVisualization: normalizeDataVisualization(value.dataVisualization),
    layoutRecommendation: asString(value.layoutRecommendation, "Single-message layout with supporting evidence"),
    visualPrompt: isNonEmptyString(value.visualPrompt) ? value.visualPrompt : null,
    speakerNotes: asString(value.speakerNotes, ""),
    slideQualityChecks: normalizeChecks(value.slideQualityChecks),
  } as Blueprint["slides"][number];
}

function normalizeFramework(value: unknown) {
  if (!isRecord(value)) {
    return { name: "Best-fit presentation framework", reason: "Selected from the request context." };
  }

  return {
    name: asString(value.name, "Best-fit presentation framework"),
    reason: asString(value.reason, "Selected from the request context."),
  };
}

function normalizeAudienceStrategy(value: unknown) {
  if (!isRecord(value)) {
    return {
      role: "Audience",
      communicationStyle: "Clear",
      currentBelief: "",
      desiredBelief: "",
      desiredAction: "",
    };
  }

  return {
    role: asString(value.role, "Audience"),
    communicationStyle: asString(value.communicationStyle, "Clear"),
    currentBelief: asString(value.currentBelief, ""),
    desiredBelief: asString(value.desiredBelief, ""),
    desiredAction: asString(value.desiredAction, ""),
  };
}

function normalizeDataVisualization(value: unknown) {
  if (!isRecord(value)) {
    return {
      chartType: "Evidence visual",
      reason: "Supports the slide assertion.",
      visualCoding: "Use restrained contrast to highlight the main takeaway.",
    };
  }

  return {
    chartType: asString(value.chartType, "Evidence visual"),
    reason: asString(value.reason, "Supports the slide assertion."),
    visualCoding: asString(value.visualCoding, "Use restrained contrast to highlight the main takeaway."),
  };
}

function normalizeChecks(value: unknown) {
  return asArray(value)
    .filter(isRecord)
    .map((check) => ({
      label: asString(check.label, "Quality check"),
      status: check.status === "fail" ? "fail" : "pass",
      message: asString(check.message, ""),
    }));
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function asString(value: unknown, fallback: string) {
  return isNonEmptyString(value) ? value : fallback;
}
