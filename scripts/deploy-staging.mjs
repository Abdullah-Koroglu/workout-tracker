import process from "node:process";
import {
  acquireLock,
  getEnvBoolean,
  log,
  readCommandOutput,
  runCommand,
  updateState,
  verifyHealth
} from "./deploy-common.mjs";

const branch = process.env.DEPLOY_BRANCH || "main";
const remote = process.env.DEPLOY_REMOTE || "origin";
const dockerEnvFile = process.env.DOCKER_ENV_FILE || ".env.docker.prod";
const imageRepo = process.env.DOCKER_IMAGE_REPO || "fitcoach";
const stagingHealthUrl = process.env.STAGING_HEALTH_URL || "http://127.0.0.1:3002/";

const stagingServices = (process.env.STAGING_SERVICES || "staging_postgres,staging_nextjs_app,staging_ws_server")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

async function deployStaging() {
  const releaseLock = await acquireLock("staging-deploy");

  try {
    log("Starting staging deployment...");

    const dirtyWorkingTree = await runCommand("git", ["status", "--porcelain"], {
      capture: true,
      allowFailure: false
    });

    if (dirtyWorkingTree.stdout.trim()) {
      throw new Error("Working tree is not clean. Refusing to deploy.");
    }

    await runCommand("git", ["fetch", remote, branch]);
    await runCommand("git", ["checkout", branch]);
    await runCommand("git", ["pull", "--ff-only", remote, branch]);

    const fullSha = await readCommandOutput("git", ["rev-parse", "HEAD"]);
    const shortSha = await readCommandOutput("git", ["rev-parse", "--short", "HEAD"]);
    const imageTag = `staging-${shortSha}`;

    log(`Building Docker image ${imageRepo}:${imageTag} from ${fullSha}...`);
    await runCommand("docker", [
      "build",
      "-t",
      `${imageRepo}:${imageTag}`,
      "-t",
      `${imageRepo}:latest`,
      "."
    ]);

    log("Bringing staging services up...");
    await runCommand("docker", [
      "compose",
      "--env-file",
      dockerEnvFile,
      "--profile",
      "staging",
      "up",
      "-d",
      "--no-build",
      ...stagingServices
    ]);

    if (getEnvBoolean("STAGING_AUTO_SEED", false)) {
      log("STAGING_AUTO_SEED is enabled. Running staging seed...");
      await runCommand("docker", [
        "compose",
        "--env-file",
        dockerEnvFile,
        "--profile",
        "staging-tools",
        "run",
        "--rm",
        "staging_seed"
      ]);
    }

    log(`Running staging health check: ${stagingHealthUrl}`);
    await verifyHealth(stagingHealthUrl);

    await updateState((state) => ({
      ...state,
      lastStaging: {
        branch,
        remote,
        commitSha: fullSha,
        imageTag,
        imageRepo,
        deployedAt: new Date().toISOString(),
        healthUrl: stagingHealthUrl
      }
    }));

    log("Staging deployment completed successfully.");
  } finally {
    await releaseLock();
  }
}

deployStaging().catch((error) => {
  log(`Staging deployment failed: ${error.message}`);
  process.exitCode = 1;
});
