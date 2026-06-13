import type { BlueprintRequest } from "@/lib/blueprint-types";

const DECK_FRAMEWORKS: Record<string, string> = {
  report: "SCQA + Minto Pyramid",
  sales: "5M Mission Flow",
  pitch: "10-Slide Pitch Structure",
};

export function buildBlueprintPrompt(request: BlueprintRequest) {
  const materialSummary = request.uploadedMaterials.length
    ? request.uploadedMaterials
        .map((material) => {
          const extractedText = material.extractedText
            ? `\n  Extracted source text: ${material.extractedText}`
            : "";

          return `- ${material.name} (${material.kind}, ${material.size} bytes, ${material.extractionStatus ?? "not extracted"})${extractedText}`;
        })
        .join("\n")
    : "- No uploaded files";

  return `You are SlideMatrixAI, an expert presentation strategist.

Create a concise, executive-quality presentation blueprint.

Presentation context:
- Deck type: ${request.deckType}
- Recommended framework: ${DECK_FRAMEWORKS[request.deckType] ?? "Best-fit presentation framework"}
- Audience role: ${request.audienceRole}
- Communication style: ${request.communicationStyle}
- Problem to solve: ${request.problem || "Not provided"}
- Before state: ${request.beforeState || "Not provided"}
- After state: ${request.afterState || "Not provided"}

Pasted source material:
${request.materials || "No pasted source material"}

Uploaded material inventory:
${materialSummary}

Return only valid JSON matching this schema:
{
  "keyMessage": "One clear recommendation or narrative thesis",
  "presentationType": "report | sales | pitch",
  "framework": {
    "name": "Framework name",
    "reason": "Why this framework fits"
  },
  "audienceStrategy": {
    "role": "Audience role",
    "communicationStyle": "Communication style",
    "currentBelief": "What they believe now",
    "desiredBelief": "What they should believe after the deck",
    "desiredAction": "The specific action requested"
  },
  "deckQualityChecks": [
    { "label": "Check name", "status": "pass", "message": "Short rationale" }
  ],
  "slides": [
    {
      "slideNumber": 1,
      "frameworkStep": "Framework step",
      "assertionTitle": "Insight-led slide title",
      "bodyBullets": ["Maximum three bullets"],
      "dataVisualization": {
        "chartType": "Chart or visual type",
        "reason": "Why this visual fits",
        "visualCoding": "Color or encoding guidance"
      },
      "layoutRecommendation": "Specific layout direction",
      "visualPrompt": null,
      "speakerNotes": "Short speaker note",
      "slideQualityChecks": [
        { "label": "Check name", "status": "pass", "message": "Short rationale" }
      ]
    }
  ]
}

Rules:
- Create 3 to 6 slides.
- Every slide title must be an assertion, not a topic.
- Each slide must have no more than 3 body bullets.
- Do not include markdown fences or explanatory text outside JSON.`;
}
