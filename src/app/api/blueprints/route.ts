import { generateBlueprintWithMiniMax, getMiniMaxModelName } from "@/lib/ai/minimax-provider";
import type { BlueprintRequest, BlueprintResponse } from "@/lib/blueprint-types";
import mockBlueprint from "@/lib/mock-blueprint.json";
import { NextResponse } from "next/server";

const SUPPORTED_DECK_TYPES = new Set(["report", "sales", "pitch"]);

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<BlueprintRequest>;
    const validationError = validateBlueprintRequest(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const blueprintRequest = createBlueprintRequest(payload);
    const deckType = blueprintRequest.deckType;
    const aiResponse = await tryGenerateAiBlueprint(blueprintRequest);

    const response: BlueprintResponse = aiResponse
      ? {
          ...aiResponse,
          intake: {
            deckType,
            sourceCount: countSources(payload),
            generatedAt: new Date().toISOString(),
            provider: "minimax",
            model: getMiniMaxModelName(),
          },
        }
      : createMockBlueprintResponse(payload, deckType);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Blueprint generation failed", error);

    return NextResponse.json({ error: "Unable to generate blueprint." }, { status: 500 });
  }
}

function createMockBlueprintResponse(payload: Partial<BlueprintRequest>, deckType: string): BlueprintResponse {
  return {
    blueprint: mockBlueprint,
    status: "mock",
    intake: {
      deckType,
      sourceCount: countSources(payload),
      generatedAt: new Date().toISOString(),
      fallbackReason: process.env.MINIMAX_API_KEY ? "MiniMax unavailable or invalid response" : "MiniMax API key not configured",
    },
  };
}

async function tryGenerateAiBlueprint(blueprintRequest: BlueprintRequest) {
  try {
    return await generateBlueprintWithMiniMax(blueprintRequest);
  } catch (error) {
    console.error("MiniMax blueprint generation failed", error);

    return null;
  }
}

function createBlueprintRequest(payload: Partial<BlueprintRequest>): BlueprintRequest {
  return {
    deckType: payload.deckType ?? "report",
    audienceRole: payload.audienceRole ?? "Executive",
    communicationStyle: payload.communicationStyle ?? "Analytical",
    problem: payload.problem ?? "",
    materials: payload.materials ?? "",
    beforeState: payload.beforeState ?? "",
    afterState: payload.afterState ?? "",
    uploadedMaterials: payload.uploadedMaterials ?? [],
  };
}

function validateBlueprintRequest(payload: Partial<BlueprintRequest>) {
  if (!payload.deckType || !SUPPORTED_DECK_TYPES.has(payload.deckType)) {
    return "Choose a supported deck type.";
  }

  if (!payload.audienceRole || !payload.communicationStyle) {
    return "Audience role and communication style are required.";
  }

  return null;
}

function countSources(payload: Partial<BlueprintRequest>) {
  return (payload.materials?.trim() ? 1 : 0) + (payload.uploadedMaterials?.length ?? 0);
}
