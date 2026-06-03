import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(scriptDir, "..");

export const stateDir = process.env.DEPLOY_STATE_DIR || path.join(repoRoot, ".deploy");
export const stateFile = path.join(stateDir, "state.json");

export function nowIso() {
  return new Date().toISOString();
}

export function log(message) {
  process.stdout.write(`[${nowIso()}] ${message}\n`);
}

export function getEnvBoolean(name, defaultValue = false) {
  const raw = process.env[name];
  if (raw === undefined) {
    return defaultValue;
  }

  const normalized = String(raw).trim().toLowerCase();
  return ["1", "true", "yes", "y", "on"].includes(normalized);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function ensureStateDir() {
  await fs.mkdir(stateDir, { recursive: true });
}

export async function loadState() {
  await ensureStateDir();

  try {
    const content = await fs.readFile(stateFile, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

export async function saveState(nextState) {
  await ensureStateDir();
  await fs.writeFile(stateFile, `${JSON.stringify(nextState, null, 2)}\n`, "utf8");
}

export async function updateState(mutator) {
  const current = await loadState();
  const next = await mutator(current);
  await saveState(next);
  return next;
}

export async function runCommand(command, args, options = {}) {
  const {
    cwd = repoRoot,
    env = process.env,
    allowFailure = false,
    capture = false,
    prefix = "",
    shell = false
  } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      shell,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      if (capture) {
        stdout += text;
      }
      process.stdout.write(prefix ? `${prefix}${text}` : text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      if (capture) {
        stderr += text;
      }
      process.stderr.write(prefix ? `${prefix}${text}` : text);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      const result = { code: code ?? 1, stdout, stderr };

      if (!allowFailure && result.code !== 0) {
        const commandLine = [command, ...args].join(" ");
        const failure = new Error(`Command failed (${result.code}): ${commandLine}`);
        failure.result = result;
        reject(failure);
        return;
      }

      resolve(result);
    });
  });
}

export async function readCommandOutput(command, args, options = {}) {
  const result = await runCommand(command, args, { ...options, capture: true });
  return result.stdout.trim();
}

export async function acquireLock(lockName) {
  await ensureStateDir();
  const lockPath = path.join(stateDir, `${lockName}.lock`);

  try {
    const handle = await fs.open(lockPath, "wx");
    const lockPayload = {
      pid: process.pid,
      lockName,
      startedAt: nowIso()
    };

    await handle.writeFile(`${JSON.stringify(lockPayload, null, 2)}\n`, "utf8");
    await handle.close();

    return async () => {
      try {
        await fs.unlink(lockPath);
      } catch (error) {
        if (!error || error.code !== "ENOENT") {
          throw error;
        }
      }
    };
  } catch (error) {
    if (error && error.code === "EEXIST") {
      let holder = "unknown";
      try {
        holder = await fs.readFile(lockPath, "utf8");
      } catch {
        // Ignore read errors and return a generic lock message.
      }

      const lockError = new Error(`Lock is already held (${lockName}). Holder: ${holder}`);
      lockError.code = "DEPLOY_LOCKED";
      throw lockError;
    }

    throw error;
  }
}

export async function verifyHealth(url, options = {}) {
  const {
    retries = Number(process.env.DEPLOY_HEALTH_RETRIES || 20),
    delayMs = Number(process.env.DEPLOY_HEALTH_DELAY_MS || 3000),
    timeoutMs = Number(process.env.DEPLOY_HEALTH_TIMEOUT_MS || 5000)
  } = options;

  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "user-agent": "fitcoach-deploy-bot/1.0"
        }
      });

      clearTimeout(timer);

      if (response.ok) {
        log(`Health check passed (${url}) on attempt ${attempt}/${retries}.`);
        return;
      }

      lastError = new Error(`Health check returned ${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
    }

    log(`Health check retry ${attempt}/${retries} failed for ${url}: ${lastError?.message || "unknown error"}`);
    if (attempt < retries) {
      await sleep(delayMs);
    }
  }

  throw new Error(`Health check failed for ${url}: ${lastError?.message || "unknown error"}`);
}
