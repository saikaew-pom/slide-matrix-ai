import { getDevProject, isLocalDevAuthEnabled } from "@/lib/dev-project-store";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503, headers: NO_STORE_HEADERS });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    if (isLocalDevAuthEnabled(request)) {
      const project = await getDevProject(id);

      if (!project) {
        return NextResponse.json({ error: "Project not found." }, { status: 404, headers: NO_STORE_HEADERS });
      }

      return NextResponse.json({ project, mode: "local-dev" }, { headers: NO_STORE_HEADERS });
    }

    return NextResponse.json({ error: "Sign in to view this project." }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id,title,deck_type,audience_role,communication_style,key_message,request_payload,blueprint,created_at,updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: NO_STORE_HEADERS });
  }

  if (!data) {
    return NextResponse.json({ error: "Project not found." }, { status: 404, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json({ project: data }, { headers: NO_STORE_HEADERS });
}
