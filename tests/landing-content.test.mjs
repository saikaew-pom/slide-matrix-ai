import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("landing content defines the V1 product promise and three deck modes", async () => {
  const raw = await readFile(new URL("../src/lib/landing-content.json", import.meta.url), "utf8");
  const content = JSON.parse(raw);

  assert.equal(content.brand.name, "SlideMatrixAI");
  assert.match(content.hero.headline, /presentation blueprints/i);
  assert.match(content.hero.subheadline, /PDFs, CSVs, or screenshots/i);
  assert.deepEqual(
    content.deckModes.map((mode) => mode.id),
    ["report", "sales", "pitch"],
  );
  assert.equal(content.supportedFiles.length, 5);
  assert.ok(content.workflowSteps.includes("Add materials"));
});

test("landing page renders hero CTA labels from the shared content", async () => {
  const source = await readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8");

  assert.match(source, /content\.hero\.primaryCta/);
  assert.match(source, /content\.hero\.secondaryCta/);
});

test("guided generator content defines the intake workflow", async () => {
  const raw = await readFile(new URL("../src/lib/generator-content.json", import.meta.url), "utf8");
  const content = JSON.parse(raw);

  assert.deepEqual(
    content.steps.map((step) => step.id),
    ["type", "audience", "problem", "materials", "outcome", "generate"],
  );
  assert.deepEqual(
    content.deckTypes.map((type) => type.id),
    ["report", "sales", "pitch"],
  );
  assert.equal(content.audienceRoles.length, 4);
  assert.equal(content.communicationStyles.length, 4);
  assert.deepEqual(content.fileTypes, ["PDF", "CSV", "TXT", "PNG", "JPG"]);
});

test("mock blueprint output has the workspace data needed for slide cards", async () => {
  const raw = await readFile(new URL("../src/lib/mock-blueprint.json", import.meta.url), "utf8");
  const blueprint = JSON.parse(raw);

  assert.match(blueprint.keyMessage, /revenue/i);
  assert.equal(blueprint.presentationType, "report");
  assert.equal(blueprint.framework.name, "SCQA + Minto Pyramid");
  assert.ok(blueprint.deckQualityChecks.length >= 4);
  assert.ok(blueprint.slides.length >= 3);
  assert.ok(blueprint.slides.every((slide) => slide.assertionTitle && slide.bodyBullets.length <= 3));
});

test("guided generator can render mock blueprint results", async () => {
  const source = await readFile(new URL("../src/components/generator/guided-generator.tsx", import.meta.url), "utf8");

  assert.match(source, /BlueprintResponse/);
  assert.match(source, /setBlueprint/);
  assert.match(source, /SlideBlueprintWorkspace/);
});

test("guided generator exposes a client-side file intake contract", async () => {
  const source = await readFile(new URL("../src/components/generator/guided-generator.tsx", import.meta.url), "utf8");

  assert.match(source, /ACCEPTED_FILE_TYPES/);
  assert.match(source, /accept=\{ACCEPTED_FILE_TYPES\}/);
  assert.match(source, /type="file"/);
  assert.match(source, /multiple/);
  assert.match(source, /uploadedMaterials/);
  assert.match(source, /formatFileSize/);
  assert.match(source, /removeMaterial/);
});

test("blueprint generation uses a typed internal API contract", async () => {
  const routeSource = await readFile(new URL("../src/app/api/blueprints/route.ts", import.meta.url), "utf8");
  const typeSource = await readFile(new URL("../src/lib/blueprint-types.ts", import.meta.url), "utf8");
  const generatorSource = await readFile(
    new URL("../src/components/generator/guided-generator.tsx", import.meta.url),
    "utf8",
  );

  assert.match(typeSource, /export type BlueprintRequest/);
  assert.match(typeSource, /export type BlueprintResponse/);
  assert.match(routeSource, /export async function POST/);
  assert.match(routeSource, /NextResponse\.json/);
  assert.match(routeSource, /mockBlueprint/);
  assert.match(generatorSource, /fetch\("\/api\/blueprints"/);
  assert.match(generatorSource, /method: "POST"/);
  assert.match(generatorSource, /isGenerating/);
  assert.match(generatorSource, /generationError/);
});

test("blueprint route is ready for MiniMax with mock fallback", async () => {
  const routeSource = await readFile(new URL("../src/app/api/blueprints/route.ts", import.meta.url), "utf8");
  const providerSource = await readFile(new URL("../src/lib/ai/minimax-provider.ts", import.meta.url), "utf8");
  const promptSource = await readFile(new URL("../src/lib/ai/blueprint-prompt.ts", import.meta.url), "utf8");
  const envExample = await readFile(new URL("../.env.example", import.meta.url), "utf8");

  assert.match(providerSource, /MINIMAX_API_KEY/);
  assert.match(providerSource, /MINIMAX_MODEL/);
  assert.match(providerSource, /https:\/\/api\.minimax\.io\/v1\/chat\/completions/);
  assert.match(providerSource, /Authorization.*Bearer/);
  assert.match(providerSource, /parseMiniMaxBlueprint/);
  assert.match(promptSource, /buildBlueprintPrompt/);
  assert.match(promptSource, /JSON/);
  assert.match(routeSource, /generateBlueprintWithMiniMax/);
  assert.match(routeSource, /createMockBlueprintResponse/);
  assert.match(envExample, /MINIMAX_API_KEY=/);
  assert.match(envExample, /MINIMAX_MODEL=MiniMax-M3/);
});

test("MiniMax blueprint output is validated before the UI receives it", async () => {
  const routeSource = await readFile(new URL("../src/app/api/blueprints/route.ts", import.meta.url), "utf8");
  const providerSource = await readFile(new URL("../src/lib/ai/minimax-provider.ts", import.meta.url), "utf8");
  const validatorSource = await readFile(new URL("../src/lib/ai/blueprint-validator.ts", import.meta.url), "utf8");

  assert.match(validatorSource, /export function validateBlueprint/);
  assert.match(validatorSource, /\.slice\(0, 3\)/);
  assert.match(validatorSource, /presentationType/);
  assert.match(validatorSource, /slides/);
  assert.match(providerSource, /validateBlueprint/);
  assert.match(providerSource, /extractJsonObject/);
  assert.match(providerSource, /Invalid MiniMax blueprint schema/);
  assert.match(routeSource, /tryGenerateAiBlueprint/);
  assert.match(routeSource, /fallbackReason/);
});

test("file intake is ready for signed Cloudinary uploads with local fallback", async () => {
  const routeSource = await readFile(
    new URL("../src/app/api/uploads/cloudinary-signature/route.ts", import.meta.url),
    "utf8",
  );
  const uploadSource = await readFile(new URL("../src/lib/uploads/cloudinary-client.ts", import.meta.url), "utf8");
  const typeSource = await readFile(new URL("../src/lib/blueprint-types.ts", import.meta.url), "utf8");
  const generatorSource = await readFile(
    new URL("../src/components/generator/guided-generator.tsx", import.meta.url),
    "utf8",
  );
  const envExample = await readFile(new URL("../.env.example", import.meta.url), "utf8");

  assert.match(routeSource, /CLOUDINARY_CLOUD_NAME/);
  assert.match(routeSource, /CLOUDINARY_API_KEY/);
  assert.match(routeSource, /CLOUDINARY_API_SECRET/);
  assert.match(routeSource, /createHash\("sha1"\)/);
  assert.match(routeSource, /resourceType = "auto" as const/);
  assert.match(uploadSource, /uploadMaterialFile/);
  assert.match(uploadSource, /api\.cloudinary\.com\/v1_1/);
  assert.match(uploadSource, /FormData/);
  assert.match(uploadSource, /mode === "local"/);
  assert.match(typeSource, /url\?: string/);
  assert.match(typeSource, /publicId\?: string/);
  assert.match(typeSource, /provider\?: "cloudinary" \| "local"/);
  assert.match(generatorSource, /status: "uploading"/);
  assert.match(generatorSource, /uploadMaterialFile/);
  assert.match(generatorSource, /status: "failed"/);
  assert.match(envExample, /CLOUDINARY_CLOUD_NAME=/);
  assert.match(envExample, /CLOUDINARY_API_SECRET=/);
});

test("file intake extracts source text and carries it into the AI prompt", async () => {
  const routeSource = await readFile(new URL("../src/app/api/uploads/extract/route.ts", import.meta.url), "utf8");
  const extractorSource = await readFile(new URL("../src/lib/uploads/material-extractor.ts", import.meta.url), "utf8");
  const uploadSource = await readFile(new URL("../src/lib/uploads/cloudinary-client.ts", import.meta.url), "utf8");
  const typeSource = await readFile(new URL("../src/lib/blueprint-types.ts", import.meta.url), "utf8");
  const promptSource = await readFile(new URL("../src/lib/ai/blueprint-prompt.ts", import.meta.url), "utf8");
  const generatorSource = await readFile(
    new URL("../src/components/generator/guided-generator.tsx", import.meta.url),
    "utf8",
  );

  assert.match(routeSource, /export async function POST/);
  assert.match(routeSource, /formData/);
  assert.match(routeSource, /extractTextFromMaterial/);
  assert.match(routeSource, /text\/csv/);
  assert.match(routeSource, /application\/pdf/);
  assert.match(routeSource, /image\//);
  assert.match(extractorSource, /extractMaterialFile/);
  assert.match(extractorSource, /\/api\/uploads\/extract/);
  assert.match(uploadSource, /extractionStatus/);
  assert.match(uploadSource, /extractedText/);
  assert.match(typeSource, /extractedText\?: string/);
  assert.match(typeSource, /extractionStatus\?: "extracted" \| "pending" \| "unsupported" \| "failed"/);
  assert.match(promptSource, /Extracted source text/);
  assert.match(promptSource, /extractedText/);
  assert.match(generatorSource, /extractionStatus/);
});

test("material extraction supports PDFs and MiniMax screenshot OCR", async () => {
  const routeSource = await readFile(new URL("../src/app/api/uploads/extract/route.ts", import.meta.url), "utf8");
  const minimaxVisionSource = await readFile(
    new URL("../src/lib/ai/minimax-vision-extractor.ts", import.meta.url),
    "utf8",
  );
  const envExample = await readFile(new URL("../.env.example", import.meta.url), "utf8");

  assert.match(routeSource, /extractPdfText/);
  assert.match(routeSource, /extractImageTextWithMiniMax/);
  assert.match(routeSource, /arrayBuffer/);
  assert.match(routeSource, /data:\$\{mimeType\};base64/);
  assert.match(minimaxVisionSource, /image_url/);
  assert.match(minimaxVisionSource, /MINIMAX_API_KEY/);
  assert.match(minimaxVisionSource, /MiniMax-M3/);
  assert.match(envExample, /MINIMAX_MODEL=MiniMax-M3/);
});

test("Supabase foundation supports auth and project persistence", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const browserClientSource = await readFile(new URL("../src/lib/supabase/browser.ts", import.meta.url), "utf8");
  const serverClientSource = await readFile(new URL("../src/lib/supabase/server.ts", import.meta.url), "utf8");
  const projectsRouteSource = await readFile(new URL("../src/app/api/projects/route.ts", import.meta.url), "utf8");
  const authRouteSource = await readFile(new URL("../src/app/auth/callback/route.ts", import.meta.url), "utf8");
  const schemaSource = await readFile(
    new URL("../supabase/migrations/0001_initial_slidematrixai.sql", import.meta.url),
    "utf8",
  );
  const generatorSource = await readFile(
    new URL("../src/components/generator/guided-generator.tsx", import.meta.url),
    "utf8",
  );
  const envExample = await readFile(new URL("../.env.example", import.meta.url), "utf8");

  assert.ok(packageJson.dependencies["@supabase/supabase-js"]);
  assert.ok(packageJson.dependencies["@supabase/ssr"]);
  assert.match(browserClientSource, /createBrowserClient/);
  assert.match(serverClientSource, /createServerClient/);
  assert.match(serverClientSource, /await cookies\(\)/);
  assert.match(projectsRouteSource, /auth\.getUser/);
  assert.match(projectsRouteSource, /\.from\("projects"\)/);
  assert.match(projectsRouteSource, /\.insert/);
  assert.match(authRouteSource, /exchangeCodeForSession/);
  assert.match(generatorSource, /createSupabaseBrowserClient/);
  assert.match(generatorSource, /signInWithOtp/);
  assert.match(generatorSource, /emailRedirectTo/);
  assert.match(schemaSource, /create table public\.projects/);
  assert.match(schemaSource, /create table public\.project_materials/);
  assert.match(schemaSource, /alter table public\.projects enable row level security/);
  assert.match(schemaSource, /auth\.uid\(\) = user_id/);
  assert.match(generatorSource, /saveBlueprint/);
  assert.match(generatorSource, /\/api\/projects/);
  assert.match(envExample, /NEXT_PUBLIC_SUPABASE_URL=/);
  assert.match(envExample, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=/);
});

test("Supabase live setup is documented and locally verifiable", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const setupGuide = await readFile(new URL("../docs/supabase-live-setup.md", import.meta.url), "utf8");
  const envLocalExample = await readFile(new URL("../.env.local.example", import.meta.url), "utf8");
  const verifyScript = await readFile(new URL("../scripts/check-supabase-env.mjs", import.meta.url), "utf8");
  const schemaSource = await readFile(
    new URL("../supabase/migrations/0001_initial_slidematrixai.sql", import.meta.url),
    "utf8",
  );

  assert.equal(packageJson.scripts["check:supabase"], "node scripts/check-supabase-env.mjs");
  assert.match(setupGuide, /Project URL/);
  assert.match(setupGuide, /Publishable key/);
  assert.match(setupGuide, /SQL Editor/);
  assert.match(setupGuide, /npm run check:supabase/);
  assert.match(envLocalExample, /NEXT_PUBLIC_SUPABASE_URL=/);
  assert.match(envLocalExample, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=/);
  assert.match(verifyScript, /checkSupabaseEnvironment/);
  assert.match(verifyScript, /auth\/v1\/settings/);
  assert.match(verifyScript, /checkSupabaseTable/);
  assert.match(verifyScript, /\/rest\/v1\/projects/);
  assert.match(verifyScript, /\/rest\/v1\/project_materials/);
  assert.match(verifyScript, /Database migration looks reachable/);
  assert.match(schemaSource, /auth\.uid\(\) is not null and auth\.uid\(\) = user_id/);
});

test("local development can save projects without email auth when explicitly enabled", async () => {
  const projectsRouteSource = await readFile(new URL("../src/app/api/projects/route.ts", import.meta.url), "utf8");
  const devStoreSource = await readFile(new URL("../src/lib/dev-project-store.ts", import.meta.url), "utf8");
  const envExample = await readFile(new URL("../.env.example", import.meta.url), "utf8");
  const envLocalExample = await readFile(new URL("../.env.local.example", import.meta.url), "utf8");

  assert.match(projectsRouteSource, /runtime = "nodejs"/);
  assert.match(projectsRouteSource, /dynamic = "force-dynamic"/);
  assert.match(projectsRouteSource, /Cache-Control/);
  assert.match(projectsRouteSource, /isLocalDevAuthEnabled/);
  assert.match(projectsRouteSource, /saveDevProject/);
  assert.match(projectsRouteSource, /listDevProjects/);
  assert.match(devStoreSource, /SLIDEMATRIX_ENABLE_DEV_AUTH/);
  assert.match(devStoreSource, /localhost/);
  assert.match(devStoreSource, /data\/dev-projects\.json/);
  assert.match(envExample, /SLIDEMATRIX_ENABLE_DEV_AUTH=false/);
  assert.match(envLocalExample, /SLIDEMATRIX_ENABLE_DEV_AUTH=true/);
});

test("saved projects page lists persisted blueprints from the project API", async () => {
  const homeSource = await readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8");
  const pageSource = await readFile(new URL("../src/app/projects/page.tsx", import.meta.url), "utf8");
  const clientSource = await readFile(
    new URL("../src/components/projects/saved-projects-client.tsx", import.meta.url),
    "utf8",
  );

  assert.match(homeSource, /href="\/projects"/);
  assert.match(pageSource, /Saved Projects/);
  assert.match(pageSource, /SavedProjectsClient/);
  assert.match(clientSource, /"use client"/);
  assert.match(clientSource, /fetch\("\/api\/projects"/);
  assert.match(clientSource, /ProjectSummary/);
  assert.match(clientSource, /local-dev/);
  assert.match(clientSource, /project\.title/);
  assert.match(clientSource, /project\.key_message/);
  assert.match(clientSource, /project\.deck_type/);
});

test("saved project detail page opens a full blueprint by project id", async () => {
  const listClientSource = await readFile(
    new URL("../src/components/projects/saved-projects-client.tsx", import.meta.url),
    "utf8",
  );
  const detailPageSource = await readFile(new URL("../src/app/projects/[id]/page.tsx", import.meta.url), "utf8");
  const detailClientSource = await readFile(
    new URL("../src/components/projects/project-detail-client.tsx", import.meta.url),
    "utf8",
  );
  const detailRouteSource = await readFile(new URL("../src/app/api/projects/[id]/route.ts", import.meta.url), "utf8");
  const devStoreSource = await readFile(new URL("../src/lib/dev-project-store.ts", import.meta.url), "utf8");

  assert.match(listClientSource, /href=\{`\/projects\/\$\{project\.id\}`\}/);
  assert.match(detailPageSource, /ProjectDetailClient/);
  assert.match(detailPageSource, /await params/);
  assert.match(detailClientSource, /"use client"/);
  assert.match(detailClientSource, /fetch\(`\/api\/projects\/\$\{projectId\}`/);
  assert.match(detailClientSource, /blueprint\.slides/);
  assert.match(detailClientSource, /slide\.assertionTitle/);
  assert.match(detailClientSource, /deckQualityChecks/);
  assert.match(detailRouteSource, /export async function GET/);
  assert.match(detailRouteSource, /getDevProject/);
  assert.match(detailRouteSource, /request_payload,blueprint/);
  assert.match(detailRouteSource, /maybeSingle/);
  assert.match(devStoreSource, /export async function getDevProject/);
});

test("saved project detail page can copy or export a markdown blueprint", async () => {
  const detailClientSource = await readFile(
    new URL("../src/components/projects/project-detail-client.tsx", import.meta.url),
    "utf8",
  );

  assert.match(detailClientSource, /buildProjectMarkdown/);
  assert.match(detailClientSource, /handleCopyMarkdown/);
  assert.match(detailClientSource, /navigator\.clipboard\.writeText/);
  assert.match(detailClientSource, /document\.execCommand\("copy"\)/);
  assert.match(detailClientSource, /handleDownloadMarkdown/);
  assert.match(detailClientSource, /new Blob/);
  assert.match(detailClientSource, /URL\.createObjectURL/);
  assert.match(detailClientSource, /download = `\$\{slugifyFilename\(project\.title\)\}\.md`/);
  assert.match(detailClientSource, /Copy all/);
  assert.match(detailClientSource, /Export Markdown/);
  assert.match(detailClientSource, /Slide-by-slide blueprint/);
  assert.match(detailClientSource, /Speaker notes/);
});
