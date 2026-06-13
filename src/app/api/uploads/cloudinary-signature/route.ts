import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

const DEFAULT_UPLOAD_FOLDER = "slidematrixai/materials";

type SignatureRequest = {
  fileName?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SignatureRequest;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const folder = process.env.CLOUDINARY_UPLOAD_FOLDER ?? DEFAULT_UPLOAD_FOLDER;
    const timestamp = Math.round(Date.now() / 1000);
    const resourceType = "auto" as const;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({
        mode: "local",
        folder,
        resourceType,
        fallbackReason: "Cloudinary environment variables are not configured.",
      });
    }

    const signature = signCloudinaryUpload({ folder, timestamp }, apiSecret);

    return NextResponse.json({
      mode: "cloudinary",
      cloudName,
      apiKey,
      folder,
      resourceType,
      timestamp,
      signature,
      fileName: payload.fileName ?? null,
    });
  } catch (error) {
    console.error("Cloudinary signature creation failed", error);

    return NextResponse.json({ error: "Unable to prepare upload." }, { status: 500 });
  }
}

function signCloudinaryUpload(params: Record<string, string | number>, apiSecret: string) {
  const serializedParams = Object.entries(params)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1")
    .update(`${serializedParams}${apiSecret}`)
    .digest("hex");
}
