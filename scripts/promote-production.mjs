import process from "node:process";
import {
  acquireLock,
  loadState,
  log,
  runCommand,
  updateState,
  verifyHealth
} from "./deploy-common.mjs";

const dockerEnvFile = process.env.DOCKER_ENV_FILE || ".env.docker.prod";
const productionHealthUrl = process.env.PRODUCTION_HEALTH_URL || "http://127.0.0.1:3000/";
const productionServices = (process.env.PRODUCTION_SERVICES || "nextjs_app,ws_server")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

async function promoteProduction() {
  const args = process.argv.slice(2);
  const isApproved = args.includes("--approve");
  const expectedShaArg = args.find((arg) => !arg.startsWith("--"));
  const expectedSha = expectedShaArg || process.env.PROMOTE_SHA || "";
  const releaseLock = await acquireLock("production-promote");

  try {
    log("Starting manual production promotion...");

    if (!isApproved) {
      throw new Error("Manual approval missing. Re-run with --approve.");
    }

    const state = await loadState();
    const staging = state.lastStaging;

    if (!staging || !staging.commitSha || !staging.imageTag || !staging.imageRepo) {
      throw new Error("No successful staging deployment found in state file.");
    }

    if (expectedSha && expectedSha !== staging.commitSha) {
      throw new Error(
        `Promote SHA mismatch. Expected ${expectedSha}, latest staging SHA is ${staging.commitSha}.`
      );
    }

    const sourceImage = `${staging.imageRepo}:${staging.imageTag}`;
    const productionShaTag = `prod-${staging.commitSha.slice(0, 12)}`;

    await runCommand("docker", ["image", "inspect", sourceImage]);

    log(`Tagging ${sourceImage} as ${staging.imageRepo}:${productionShaTag} and latest...`);
    await runCommand("docker", ["tag", sourceImage, `${staging.imageRepo}:${productionShaTag}`]);
    await runCommand("docker", ["tag", sourceImage, `${staging.imageRepo}:latest`]);

    const previousProductionImageTag = state.lastProduction?.imageTag || null;

    try {
      log("Applying production services...");
      await runCommand("docker", [
        "compose",
        "--env-file",
        dockerEnvFile,
        "up",
        "-d",
        "--no-build",
        ...productionServices
      ]);

      log(`Running production health check: ${productionHealthUrl}`);
      await verifyHealth(productionHealthUrl);
    } catch (deployError) {
      if (previousProductionImageTag) {
        log(`Production health failed, rolling back to ${staging.imageRepo}:${previousProductionImageTag}...`);
        await runCommand("docker", ["tag", `${staging.imageRepo}:${previousProductionImageTag}`, `${staging.imageRepo}:latest`], {
          allowFailure: true
        });

        await runCommand("docker", [
          "compose",
          "--env-file",
          dockerEnvFile,
          "up",
          "-d",
          "--no-build",
          ...productionServices
        ], {
          allowFailure: true
        });
      }

      throw deployError;
    }

    await updateState((currentState) => ({
      ...currentState,
      lastProduction: {
        commitSha: staging.commitSha,
        imageTag: productionShaTag,
        imageRepo: staging.imageRepo,
        promotedAt: new Date().toISOString(),
        promotedFromStagingAt: staging.deployedAt,
        healthUrl: productionHealthUrl
      }
    }));

    log("Manual production promotion completed successfully.");
  } finally {
    await releaseLock();
  }
}

promoteProduction().catch((error) => {
  log(`Production promotion failed: ${error.message}`);
  process.exitCode = 1;
});
