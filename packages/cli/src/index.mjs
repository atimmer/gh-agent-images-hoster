#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import process from "node:process";
import { lookup as lookupMimeType } from "mime-types";

const CONFIG_DIR = path.join(os.homedir(), ".config", "agent-images");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");
const LEGACY_CONFIG_PATH = path.join(
  os.homedir(),
  ".config",
  "gh-agent-images",
  "config.json",
);
const SKILL_REPO_URL = "https://github.com/atimmer/gh-agent-images-hoster";
const SKILL_NAME = "gh-agent-images-upload";

function parseArgs(argv) {
  const positional = [];
  const flags = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) {
        flags[key] = true;
      } else {
        flags[key] = next;
        index += 1;
      }
      continue;
    }

    positional.push(token);
  }

  return { positional, flags };
}

function printUsage() {
  console.log(`agent-images CLI

Usage:
  agent-images auth login --api <url> --token <token> [--agent <default-agent-name>]
  agent-images upload <file-path> --agent <agent-name> [--alt <markdown-alt-text>]
  agent-images install-skill [--agent <agent>] [--global]

Notes:
  - upload returns markdown you can paste directly into GitHub pull requests.
  - install-skill delegates to skills.sh via: npx skills add ${SKILL_REPO_URL} --skill ${SKILL_NAME}
  - auth config is stored at ${CONFIG_PATH}
`);
}

async function readConfig() {
  try {
    const raw = await readFile(CONFIG_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    try {
      const legacyRaw = await readFile(LEGACY_CONFIG_PATH, "utf8");
      return JSON.parse(legacyRaw);
    } catch {
      return null;
    }
  }
}

async function saveConfig(config) {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function ensureHttpUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("`--api` must be a valid URL.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("`--api` must use http:// or https://.");
  }

  return parsed.origin;
}

async function runAuthLogin(flags) {
  const token = typeof flags.token === "string" ? flags.token.trim() : "";
  const api = typeof flags.api === "string" ? ensureHttpUrl(flags.api.trim()) : "";
  const defaultAgent =
    typeof flags.agent === "string" && flags.agent.trim()
      ? flags.agent.trim()
      : "codex-agent";

  if (!token) {
    throw new Error("Missing required flag: --token");
  }

  if (!api) {
    throw new Error("Missing required flag: --api");
  }

  await saveConfig({
    api,
    token,
    defaultAgent,
  });

  console.log(`Saved auth config to ${CONFIG_PATH}`);
  console.log(`Default agent: ${defaultAgent}`);
}

function toAbsolutePath(inputPath) {
  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }
  return path.join(process.cwd(), inputPath);
}

function chooseContentType(filePath) {
  const guessed = lookupMimeType(filePath);
  if (!guessed) {
    return "application/octet-stream";
  }
  return guessed;
}

async function runUpload(positional, flags) {
  const fileArg = positional[0];
  if (!fileArg) {
    throw new Error("Missing required argument: <file-path>");
  }

  const config = await readConfig();
  if (!config?.api || !config?.token) {
    throw new Error(
      "Missing auth config. Run: agent-images auth login --api <url> --token <token> --agent <name>",
    );
  }

  const agentName =
    typeof flags.agent === "string" && flags.agent.trim()
      ? flags.agent.trim()
      : config.defaultAgent;

  if (!agentName) {
    throw new Error("No agent name configured. Pass --agent <name>.");
  }

  const filePath = toAbsolutePath(fileArg);
  const fileStats = await stat(filePath);
  if (!fileStats.isFile()) {
    throw new Error(`Not a file: ${filePath}`);
  }

  const fileName = path.basename(filePath);
  const bytes = await readFile(filePath);
  const contentType = chooseContentType(fileName);
  if (!contentType.startsWith("image/")) {
    throw new Error(
      `The file does not look like an image (detected content type: ${contentType}).`,
    );
  }

  const formData = new FormData();
  const blob = new Blob([bytes], {
    type: contentType,
  });

  formData.append("file", blob, fileName);
  formData.append("agentName", agentName);

  if (typeof flags.alt === "string" && flags.alt.trim()) {
    formData.append("alt", flags.alt.trim());
  }

  const uploadResponse = await fetch(`${config.api}/api/cli/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
    },
    body: formData,
  });

  let body;
  try {
    body = await uploadResponse.json();
  } catch {
    body = {};
  }

  if (!uploadResponse.ok) {
    throw new Error(body.error || `Upload failed with status ${uploadResponse.status}`);
  }

  if (!body.markdown) {
    throw new Error("Upload succeeded but markdown was missing from the response.");
  }

  process.stdout.write(`${body.markdown}\n`);
}

async function runCommand(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.once("error", (error) => {
      reject(error);
    });

    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Command failed with exit code ${code ?? "unknown"}.`));
    });
  });
}

async function runInstallSkill(flags) {
  const args = ["skills", "add", SKILL_REPO_URL, "--skill", SKILL_NAME];

  if (typeof flags.agent === "string" && flags.agent.trim()) {
    args.push("--agent", flags.agent.trim());
  }

  if (flags.global === true) {
    args.push("--global");
  }

  await runCommand("npx", args);
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const [command, subcommand, ...restPositional] = positional;

  if (!command || command === "--help" || command === "help") {
    printUsage();
    return;
  }

  if (command === "auth" && subcommand === "login") {
    await runAuthLogin(flags);
    return;
  }

  if (command === "upload") {
    await runUpload([subcommand, ...restPositional].filter(Boolean), flags);
    return;
  }

  if (command === "install-skill" || (command === "skill" && subcommand === "install")) {
    await runInstallSkill(flags);
    return;
  }

  throw new Error("Unknown command. Run `agent-images --help` for usage.");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown CLI error.";
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
