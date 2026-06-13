import { extractMaterialFile } from "@/lib/uploads/material-extractor";

export type MaterialUploadResult = {
  id: string;
  name: string;
  kind: string;
  size: number;
  provider: "cloudinary" | "local";
  url?: string;
  publicId?: string;
  extractedText?: string;
  extractionStatus?: "extracted" | "pending" | "unsupported" | "failed";
};

type SignatureResponse =
  | {
      mode: "local";
      folder: string;
      resourceType: "auto";
      fallbackReason: string;
    }
  | {
      mode: "cloudinary";
      cloudName: string;
      apiKey: string;
      folder: string;
      resourceType: "auto";
      timestamp: number;
      signature: string;
    };

type CloudinaryUploadResponse = {
  public_id?: string;
  secure_url?: string;
  resource_type?: string;
};

export async function uploadMaterialFile(file: File): Promise<MaterialUploadResult> {
  const extraction = await extractMaterialFile(file);
  const signatureResponse = await fetch("/api/uploads/cloudinary-signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: file.name, size: file.size, type: file.type }),
  });

  if (!signatureResponse.ok) {
    throw new Error("Unable to prepare file upload.");
  }

  const signature = (await signatureResponse.json()) as SignatureResponse;

  if (signature.mode === "local") {
    return {
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      kind: readableFileKind(file),
      size: file.size,
      provider: "local",
      ...extraction,
    };
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("signature", signature.signature);
  formData.append("folder", signature.folder);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/${signature.resourceType}/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!uploadResponse.ok) {
    throw new Error("Cloudinary upload failed.");
  }

  const uploaded = (await uploadResponse.json()) as CloudinaryUploadResponse;

  return {
    id: uploaded.public_id ?? `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    kind: readableFileKind(file),
    size: file.size,
    provider: "cloudinary",
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
    ...extraction,
  };
}

function readableFileKind(file: File) {
  if (file.type === "application/pdf") return "PDF";
  if (file.type === "text/csv") return "CSV";
  if (file.type === "text/plain") return "TXT";
  if (file.type === "image/png") return "PNG";
  if (file.type === "image/jpeg") return "JPG";

  return file.name.split(".").pop()?.toUpperCase() ?? "FILE";
}
