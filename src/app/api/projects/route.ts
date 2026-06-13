import type { Blueprint, BlueprintRequest } from "@/lib/blueprint-types";
import { isLocalDevAuthEnabled, listDevProjects, saveDevProject } from "@/lib/dev-project-store";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

type SaveProjectPayload = {
  title?: string;
  request: BlueprintRequest;
  blueprint: Blueprint;
};

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    if (isLocalDevAuthEnabled(request)) {
      return NextResponse.json({ projects: await listDevProjects(), mode: "local-dev" }, { headers: NO_STORE_HEADERS });
    }

    return NextResponse.json({ error: "Sign in to view saved projects." }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id,title,deck_type,audience_role,communication_style,key_message,created_at,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ projects: data ?? [] }, { headers: NO_STORE_HEADERS });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const payload = (await request.json().catch(() => null)) as SaveProjectPayload | null;
  const validationError = validateSavePayload(payload);

  if (validationError || !payload) {
    return NextResponse.json({ error: validationError ?? "Invalid project payload." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    if (isLocalDevAuthEnabled(request)) {
      return NextResponse.json({ project: await saveDevProject(payload), mode: "local-dev" });
    }

    return NextResponse.json({ error: "Sign in to save this project." }, { status: 401 });
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      title: createProjectTitle(payload),
      deck_type: payload.request.deckType,
      audience_role: payload.request.audienceRole,
      communication_style: payload.request.communicationStyle,
      key_message: payload.blueprint.keyMessage,
      request_payload: payload.request,
      blueprint: payload.blueprint,
    })
    .select("id,title,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const materialRows = payload.request.uploadedMaterials.map((material) => ({
    project_id: project.id,
    user_id: user.id,
    name: material.name,
    kind: material.kind,
    size: material.size,
    provider: material.provider ?? null,
    url: material.url ?? null,
    public_id: material.publicId ?? null,
    extraction_status: material.extractionStatus ?? null,
    extracted_text: material.extractedText ?? null,
  }));

  if (materialRows.length) {
    const { error: materialError } = await supabase.from("project_materials").insert(materialRows);

    if (materialError) {
      return NextResponse.json({ error: materialError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ project });
}

function validateSavePayload(payload: SaveProjectPayload | null) {
  if (!payload?.request || !payload.blueprint) {
    return "Project request and blueprint are required.";
  }

  if (!payload.request.deckType || !payload.request.audienceRole || !payload.request.communicationStyle) {
    return "Deck type, audience role, and communication style are required.";
  }

  if (!payload.blueprint.keyMessage || !Array.isArray(payload.blueprint.slides)) {
    return "A generated blueprint is required.";
  }

  return "";
}

function createProjectTitle(payload: SaveProjectPayload) {
  const explicitTitle = payload.title?.trim();

  if (explicitTitle) {
    return explicitTitle.slice(0, 120);
  }

  const problemTitle = payload.request.problem.trim();

  if (problemTitle) {
    return problemTitle.slice(0, 120);
  }

  return `${payload.request.deckType} deck - ${new Date().toISOString().slice(0, 10)}`;
}
