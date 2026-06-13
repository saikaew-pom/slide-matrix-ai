import { NextResponse } from "next/server";
import { extractImageTextWithMiniMax } from "@/lib/ai/minimax-vision-extractor";

const MAX_EXTRACTED_CHARACTERS = 12000;
const PDF_TEXT_COMMAND_PATTERN = /\(([^()]*)\)\s*Tj|\[((?:.|\n)*?)\]\s*TJ/g;
const PDF_ARRAY_TEXT_PATTERN = /\(([^()]*)\)/g;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    return NextResponse.json(await extractTextFromMaterial(file));
  } catch (error) {
    console.error("Material extraction failed", error);

    return NextResponse.json({ error: "Unable to extract material." }, { status: 500 });
  }
}

async function extractTextFromMaterial(file: File) {
  if (file.type === "text/plain" || file.type === "text/csv" || file.name.toLowerCase().endsWith(".txt")) {
    return {
      status: "extracted",
      extractedText: (await file.text()).slice(0, MAX_EXTRACTED_CHARACTERS),
    };
  }

  if (file.name.toLowerCase().endsWith(".csv")) {
    return {
      status: "extracted",
      extractedText: (await file.text()).slice(0, MAX_EXTRACTED_CHARACTERS),
    };
  }

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const extractedText = extractPdfText(await file.arrayBuffer());

    if (extractedText) {
      return {
        status: "extracted",
        extractedText: extractedText.slice(0, MAX_EXTRACTED_CHARACTERS),
      };
    }

    return {
      status: "pending",
      extractedText: `PDF uploaded: ${file.name}. No selectable text was found yet; OCR document extraction can run next.`,
    };
  }

  if (file.type.startsWith("image/")) {
    const arrayBuffer = await file.arrayBuffer();
    const mimeType = file.type || "image/png";
    const dataUrl = `data:${mimeType};base64,${Buffer.from(arrayBuffer).toString("base64")}`;
    const extractedText = await extractImageTextWithMiniMax({
      dataUrl,
      fileName: file.name,
      mimeType,
    });

    if (extractedText) {
      return {
        status: "extracted",
        extractedText: extractedText.slice(0, MAX_EXTRACTED_CHARACTERS),
      };
    }

    return {
      status: "pending",
      extractedText: `Screenshot uploaded: ${file.name}. Add MINIMAX_API_KEY to enable screenshot OCR with MiniMax vision.`,
    };
  }

  return {
    status: "unsupported",
    extractedText: `Unsupported file type: ${file.name}.`,
  };
}

function extractPdfText(arrayBuffer: ArrayBuffer) {
  const pdfSource = Buffer.from(arrayBuffer).toString("latin1");
  const textParts: string[] = [];

  for (const match of pdfSource.matchAll(PDF_TEXT_COMMAND_PATTERN)) {
    if (match[1]) {
      textParts.push(decodePdfText(match[1]));
      continue;
    }

    if (match[2]) {
      for (const arrayMatch of match[2].matchAll(PDF_ARRAY_TEXT_PATTERN)) {
        textParts.push(decodePdfText(arrayMatch[1]));
      }
    }
  }

  return textParts
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodePdfText(value: string) {
  return value
    .replace(/\\([nrtbf()\\])/g, (_, escaped: string) => {
      const replacements: Record<string, string> = {
        b: "\b",
        f: "\f",
        n: "\n",
        r: "\r",
        t: "\t",
        "(": "(",
        ")": ")",
        "\\": "\\",
      };

      return replacements[escaped] ?? escaped;
    })
    .replace(/\\([0-7]{1,3})/g, (_, octal: string) => String.fromCharCode(Number.parseInt(octal, 8)));
}
