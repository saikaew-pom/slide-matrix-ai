import type { Blueprint, BlueprintRequest, BlueprintResponse } from "@/lib/blueprint-types";
import { buildBlueprintPrompt } from "@/lib/ai/blueprint-prompt";
import { validateBlueprint } from "@/lib/ai/blueprint-validator";

const MINIMAX_CHAT_COMPLETIONS_URL = "https://api.minimax.io/v1/chat/completions";
const DEFAULT_MINIMAX_MODEL = "MiniMax-M3";

type MiniMaxChatCompletion = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export async function generateBlueprintWithMiniMax(
  request: BlueprintRequest,
): Promise<Omit<BlueprintResponse, "intake"> | null> {
  const apiKey = process.env.MINIMAX_API_KEY;

  if (!apiKey) {
    return null;
  }

  const model = process.env.MINIMAX_MODEL ?? DEFAULT_MINIMAX_MODEL;
  const response = await fetch(MINIMAX_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: buildBlueprintPrompt(request),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`MiniMax request failed with status ${response.status}`);
  }

  const completion = (await response.json()) as MiniMaxChatCompletion;
  const content = completion.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("MiniMax returned an empty blueprint response.");
  }

  return {
    blueprint: parseMiniMaxBlueprint(content),
    status: "ai",
  };
}

export function parseMiniMaxBlueprint(content: string): Blueprint {
  const parsed = JSON.parse(extractJsonObject(content));
  const blueprint = validateBlueprint(parsed);

  if (!blueprint) {
    throw new Error("Invalid MiniMax blueprint schema.");
  }

  return blueprint;
}

export function getMiniMaxModelName() {
  return process.env.MINIMAX_MODEL ?? DEFAULT_MINIMAX_MODEL;
}

function extractJsonObject(content: string) {
  const cleanedContent = content
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const firstBrace = cleanedContent.indexOf("{");
  const lastBrace = cleanedContent.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("MiniMax response did not include a JSON object.");
  }

  return cleanedContent.slice(firstBrace, lastBrace + 1);
}
