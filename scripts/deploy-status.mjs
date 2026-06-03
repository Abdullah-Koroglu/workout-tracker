import { loadState } from "./deploy-common.mjs";

const state = await loadState();

if (!state.lastStaging && !state.lastProduction) {
  process.stdout.write("No deployment state found.\n");
  process.exit(0);
}

if (state.lastStaging) {
  process.stdout.write("=== Last Staging Deploy ===\n");
  process.stdout.write(`${JSON.stringify(state.lastStaging, null, 2)}\n`);
}

if (state.lastProduction) {
  process.stdout.write("=== Last Production Promote ===\n");
  process.stdout.write(`${JSON.stringify(state.lastProduction, null, 2)}\n`);
}
