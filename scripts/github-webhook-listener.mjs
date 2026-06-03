import { createHmac, timingSafeEqual } from "node:crypto";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const webhookPort = Number(process.env.WEBHOOK_PORT || 9010);
const webhookPath = process.env.WEBHOOK_PATH || "/github/webhook";
const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || "";
const expectedRepository = process.env.GITHUB_REPOSITORY || "";
const deployScriptPath = process.env.DEPLOY_SCRIPT || path.join(repoRoot, "scripts", "deploy-staging.mjs");

let deploymentInProgress = false;
let pendingDeployRequested = false;

function log(message) {
  process.stdout.write(`[webhook] ${new Date().toISOString()} ${message}\n`);
}

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(`${JSON.stringify(payload)}\n`);
}

function verifySignature(rawBody, signatureHeader) {
  if (!webhookSecret) {
    return false;
  }

  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const received = Buffer.from(signatureHeader.slice("sha256=".length), "hex");
  const expectedHex = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  const expected = Buffer.from(expectedHex, "hex");

  if (received.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(received, expected);
}

function runStagingDeploy() {
  return new Promise((resolve, reject) => {
    log(`Starting staging deploy process via ${deployScriptPath}`);

    const child = spawn(process.execPath, [deployScriptPath], {
      cwd: repoRoot,
      env: process.env,
      stdio: "inherit"
    });

    child.on("error", (error) => reject(error));
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Staging deploy exited with code ${code}`));
      }
    });
  });
}

async function scheduleDeploy() {
  if (deploymentInProgress) {
    pendingDeployRequested = true;
    log("Deploy already in progress, queued one additional run.");
    return;
  }

  deploymentInProgress = true;

  try {
    do {
      pendingDeployRequested = false;
      await runStagingDeploy();
    } while (pendingDeployRequested);
  } catch (error) {
    log(`Deploy run failed: ${error.message}`);
  } finally {
    deploymentInProgress = false;
  }
}

const server = http.createServer((req, res) => {
  if (req.method !== "POST" || req.url !== webhookPath) {
    json(res, 404, { ok: false, error: "not_found" });
    return;
  }

  const chunks = [];

  req.on("data", (chunk) => chunks.push(chunk));

  req.on("end", () => {
    const rawBody = Buffer.concat(chunks);
    const signatureHeader = req.headers["x-hub-signature-256"];
    const eventName = req.headers["x-github-event"];

    if (typeof signatureHeader !== "string" || !verifySignature(rawBody, signatureHeader)) {
      json(res, 401, { ok: false, error: "invalid_signature" });
      return;
    }

    let payload;
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      json(res, 400, { ok: false, error: "invalid_json" });
      return;
    }

    if (eventName === "ping") {
      json(res, 200, { ok: true, type: "ping" });
      return;
    }

    if (eventName !== "push") {
      json(res, 202, { ok: true, ignored: "event" });
      return;
    }

    if (payload.ref !== "refs/heads/main") {
      json(res, 202, { ok: true, ignored: "branch" });
      return;
    }

    if (
      expectedRepository &&
      payload.repository &&
      payload.repository.full_name &&
      payload.repository.full_name !== expectedRepository
    ) {
      json(res, 202, { ok: true, ignored: "repository" });
      return;
    }

    scheduleDeploy().catch((error) => {
      log(`Unexpected scheduler error: ${error.message}`);
    });

    json(res, 202, { ok: true, status: "accepted" });
  });
});

server.listen(webhookPort, "0.0.0.0", () => {
  if (!webhookSecret) {
    log("Warning: GITHUB_WEBHOOK_SECRET is empty. All requests will fail signature verification.");
  }

  log(`GitHub webhook listener is running on 0.0.0.0:${webhookPort}${webhookPath}`);
});
