import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig, env } from "prisma/config";

function loadDotEnvLocal() {
  const envLocalPath = resolve(process.cwd(), ".env.local");

  if (!existsSync(envLocalPath)) {
    return;
  }

  const lines = readFileSync(envLocalPath, "utf8").split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadDotEnvLocal();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Use direct connection for Prisma CLI operations (migrations/introspection)
    url: env("DIRECT_URL")
  }
});
