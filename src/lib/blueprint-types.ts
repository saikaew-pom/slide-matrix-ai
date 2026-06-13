import mockBlueprint from "@/lib/mock-blueprint.json";

export type Blueprint = typeof mockBlueprint;

export type BlueprintRequestMaterial = {
  name: string;
  kind: string;
  size: number;
  url?: string;
  publicId?: string;
  provider?: "cloudinary" | "local";
  extractedText?: string;
  extractionStatus?: "extracted" | "pending" | "unsupported" | "failed";
};

export type BlueprintRequest = {
  deckType: string;
  audienceRole: string;
  communicationStyle: string;
  problem: string;
  materials: string;
  beforeState: string;
  afterState: string;
  uploadedMaterials: BlueprintRequestMaterial[];
};

export type BlueprintResponse = {
  blueprint: Blueprint;
  status: "mock" | "ai";
  intake: {
    deckType: string;
    sourceCount: number;
    generatedAt: string;
    provider?: "minimax";
    model?: string;
    fallbackReason?: string;
  };
};
