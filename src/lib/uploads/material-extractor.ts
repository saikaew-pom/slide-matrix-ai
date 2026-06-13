export type MaterialExtractionResult = {
  extractedText?: string;
  extractionStatus: "extracted" | "pending" | "unsupported" | "failed";
};

type MaterialExtractionResponse = {
  extractedText?: string;
  status?: MaterialExtractionResult["extractionStatus"];
  error?: string;
};

export async function extractMaterialFile(file: File): Promise<MaterialExtractionResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/uploads/extract", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    return {
      extractionStatus: "failed",
      extractedText: "Extraction failed.",
    };
  }

  const result = (await response.json()) as MaterialExtractionResponse;

  return {
    extractionStatus: result.status ?? "failed",
    extractedText: result.extractedText ?? result.error,
  };
}
