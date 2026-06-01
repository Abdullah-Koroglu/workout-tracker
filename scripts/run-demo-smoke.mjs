import { spawnSync } from "node:child_process";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("npm", ["run", "db:seed:demo"]);
run("npx", ["playwright", "test", "e2e/fitcoach-market-ready.spec.ts", "--project=chromium"], {
  env: {
    ...process.env,
    FITCOACH_DEMO_SMOKE: "1",
  },
});
