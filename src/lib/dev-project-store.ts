import type { Blueprint, BlueprintRequest } from "@/lib/blueprint-types";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DEV_PROJECTS_PATH = path.join(process.cwd(), "data/dev-projects.json");

type SaveDevProjectPayload = {
  title?: string;
  request: BlueprintRequest;
  blueprint: Blueprint;
};

type DevProject = {
  id: string;
  title: string;
  deck_type: string;
  audience_role: string;
  communication_style: string;
  key_message: string;
  created_at: string;
  updated_at: string;
  request_payload: BlueprintRequest;
  blueprint: Blueprint;
};

type DevProjectStore = {
  projects: DevProject[];
};

export function isLocalDevAuthEnabled(request: Request) {
  if (process.env.SLIDEMATRIX_ENABLE_DEV_AUTH !== "true") {
    return false;
  }

  const host = request.headers.get("host") ?? "";

  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

export async function listDevProjects() {
  const store = await readDevProjectStore();

  return store.projects
    .slice()
    .sort((first, second) => second.updated_at.localeCompare(first.updated_at))
    .slice(0, 20)
    .map((project) => ({
      id: project.id,
      title: project.title,
      deck_type: project.deck_type,
      audience_role: project.audience_role,
      communication_style: project.communication_style,
      key_message: project.key_message,
      created_at: project.created_at,
      updated_at: project.updated_at,
    }));
}

export async function getDevProject(id: string) {
  const store = await readDevProjectStore();

  return store.projects.find((project) => project.id === id) ?? null;
}

export async function saveDevProject(payload: SaveDevProjectPayload) {
  const store = await readDevProjectStore();
  const now = new Date().toISOString();
  const project = {
    id: `dev-${crypto.randomUUID()}`,
    title: createDevProjectTitle(payload),
    deck_type: payload.request.deckType,
    audience_role: payload.request.audienceRole,
    communication_style: payload.request.communicationStyle,
    key_message: payload.blueprint.keyMessage,
    created_at: now,
    updated_at: now,
    request_payload: payload.request,
    blueprint: payload.blueprint,
  };

  store.projects.unshift(project);
  await writeDevProjectStore(store);

  return {
    id: project.id,
    title: project.title,
    created_at: project.created_at,
  };
}

async function readDevProjectStore(): Promise<DevProjectStore> {
  try {
    const source = await readFile(DEV_PROJECTS_PATH, "utf8");
    const store = JSON.parse(source) as DevProjectStore;

    return {
      projects: Array.isArray(store.projects) ? store.projects : [],
    };
  } catch {
    return { projects: [] };
  }
}

async function writeDevProjectStore(store: DevProjectStore) {
  await mkdir(path.dirname(DEV_PROJECTS_PATH), { recursive: true });
  await writeFile(DEV_PROJECTS_PATH, JSON.stringify(store, null, 2));
}

function createDevProjectTitle(payload: SaveDevProjectPayload) {
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
