import { readFile } from "node:fs/promises";

const REQUIRED_ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
const TABLE_CHECK_PATHS = {
  projects: "/rest/v1/projects?select=id&limit=1",
  project_materials: "/rest/v1/project_materials?select=id&limit=1",
};

async function main() {
  const env = await loadLocalEnv();
  const result = await checkSupabaseEnvironment(env);

  if (!result.ok) {
    console.error(result.message);
    process.exit(1);
  }

  console.log(result.message);
}

export async function checkSupabaseEnvironment(env) {
  const missing = REQUIRED_ENV_KEYS.filter((key) => !env[key]?.trim());

  if (missing.length) {
    return {
      ok: false,
      message: `Missing Supabase environment variables: ${missing.join(", ")}`,
    };
  }

  let projectUrl;

  try {
    projectUrl = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
  } catch {
    return {
      ok: false,
      message: "NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase project URL.",
    };
  }

  try {
    const response = await fetch(new URL("/auth/v1/settings", projectUrl), {
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `Supabase connection check failed with HTTP ${response.status}. Check the Project URL and Publishable key.`,
      };
    }
  } catch (error) {
    return {
      ok: false,
      message: `Unable to reach Supabase: ${error instanceof Error ? error.message : "Unknown network error"}`,
    };
  }

  const projectTable = await checkSupabaseTable(projectUrl, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, "projects");

  if (!projectTable.ok) {
    return projectTable;
  }

  const materialsTable = await checkSupabaseTable(
    projectUrl,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    "project_materials",
  );

  if (!materialsTable.ok) {
    return materialsTable;
  }

  return {
    ok: true,
    message: "Supabase environment and Database migration looks reachable.",
  };
}

async function checkSupabaseTable(projectUrl, publishableKey, tableName) {
  try {
    const response = await fetch(new URL(TABLE_CHECK_PATHS[tableName], projectUrl), {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
      },
    });

    if (response.status === 404) {
      return {
        ok: false,
        message: `Supabase table "${tableName}" was not found. Run supabase/migrations/0001_initial_slidematrixai.sql in the SQL Editor.`,
      };
    }

    if (!response.ok && response.status !== 401 && response.status !== 403) {
      const body = await response.text().catch(() => "");

      return {
        ok: false,
        message: `Supabase table "${tableName}" check failed with HTTP ${response.status}. ${body}`,
      };
    }

    return { ok: true, message: `Supabase table "${tableName}" is reachable.` };
  } catch (error) {
    return {
      ok: false,
      message: `Unable to verify Supabase table "${tableName}": ${
        error instanceof Error ? error.message : "Unknown network error"
      }`,
    };
  }
}

async function loadLocalEnv() {
  return {
    ...process.env,
    ...(await parseEnvFile(".env.local")),
  };
}

async function parseEnvFile(path) {
  try {
    const source = await readFile(path, "utf8");
    const entries = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const equalsIndex = line.indexOf("=");
        const key = equalsIndex === -1 ? line : line.slice(0, equalsIndex);
        const value = equalsIndex === -1 ? "" : line.slice(equalsIndex + 1);

        return [key, value.replace(/^['"]|['"]$/g, "")];
      });

    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

main();
