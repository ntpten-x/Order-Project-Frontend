import { spawn } from "node:child_process";
import net from "node:net";

const isWin = process.platform === "win32";

function runCommand(command, args, opts = {}) {
  const runCommandName = isWin ? "cmd.exe" : command;
  const runArgs = isWin ? ["/d", "/s", "/c", `${command} ${args.join(" ")}`] : args;
  return new Promise((resolve, reject) => {
    const child = spawn(runCommandName, runArgs, {
      stdio: "inherit",
      shell: false,
      ...opts,
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed (exit ${code})`));
    });
  });
}

function startCommand(command, args, opts = {}) {
  const runCommandName = isWin ? "cmd.exe" : command;
  const runArgs = isWin ? ["/d", "/s", "/c", `${command} ${args.join(" ")}`] : args;
  return spawn(runCommandName, runArgs, {
    stdio: "inherit",
    shell: false,
    ...opts,
  });
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        server.close(() => reject(new Error("could not allocate port")));
        return;
      }
      const { port } = addr;
      server.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(port);
      });
    });
  });
}

async function waitForHealth(url, timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/health`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`backend health timeout: ${url}/health`);
}

async function checkMonitoring(baseUrl) {
  const health = await fetch(`${baseUrl}/health`);
  if (!health.ok) {
    throw new Error(`/health check failed with status ${health.status}`);
  }

  let metrics = await fetch(`${baseUrl}/metrics`);
  if (metrics.status === 403 && process.env.METRICS_API_KEY) {
    metrics = await fetch(`${baseUrl}/metrics`, {
      headers: { "x-metrics-key": process.env.METRICS_API_KEY },
    });
  }

  if (![200, 403, 404].includes(metrics.status)) {
    throw new Error(`/metrics check failed with status ${metrics.status}`);
  }
  console.log(`[phase7] monitoring: health=${health.status} metrics=${metrics.status}`);
}

function killProcessTree(child) {
  return new Promise((resolve) => {
    if (!child || child.exitCode !== null) {
      resolve();
      return;
    }

    if (isWin) {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
      });
      killer.on("exit", () => resolve());
      killer.on("error", () => resolve());
      return;
    }

    child.once("exit", () => resolve());
    child.kill("SIGTERM");
    setTimeout(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
    }, 3000);
  });
}

async function main() {
  const backendDir = "../Order-Project-Backend";
  const backendPort = Number(await getFreePort());
  const frontendPort = Number(await getFreePort());
  const backendUrl = `http://127.0.0.1:${backendPort}`;

  const baseEnv = {
    ...process.env,
    NO_PROXY: "127.0.0.1,localhost",
    no_proxy: "127.0.0.1,localhost",
    HTTP_PROXY: "",
    HTTPS_PROXY: "",
    ALL_PROXY: "",
  };

  console.log("[phase7] ensure e2e user");
  await runCommand("npm", ["--prefix", backendDir, "run", "ensure:e2e-user"], {
    env: baseEnv,
  });

  console.log("[phase7] run real DB POS flow");
  await runCommand("npm", ["--prefix", backendDir, "run", "test:integration:pos-flow"], {
    env: baseEnv,
  });

  console.log("[phase7] run realtime contract (multi-client coverage)");
  await runCommand("npm", ["--prefix", backendDir, "run", "test:realtime:contract"], {
    env: baseEnv,
  });

  const backendEnv = {
    ...baseEnv,
    PORT: String(backendPort),
    E2E_USERNAME: process.env.E2E_USERNAME || "e2e_pos_admin",
    E2E_PASSWORD: process.env.E2E_PASSWORD || "E2E_Pos_123!",
  };

  console.log(`[phase7] start backend on ${backendUrl}`);
  const backend = startCommand("npx", ["ts-node", "app.ts"], {
    cwd: backendDir,
    env: backendEnv,
  });

  try {
    await waitForHealth(backendUrl, 120000);
    await checkMonitoring(backendUrl);

    const e2eEnv = {
      ...baseEnv,
      CI: "1",
      E2E_PORT: String(frontendPort),
      E2E_WEB_SERVER_TIMEOUT: "240000",
      NEXT_PUBLIC_BACKEND_API: backendUrl,
      BACKEND_API_INTERNAL: backendUrl,
      E2E_USERNAME: process.env.E2E_USERNAME || "e2e_pos_admin",
      E2E_PASSWORD: process.env.E2E_PASSWORD || "E2E_Pos_123!",
    };

    console.log("[phase7] run POS browser flow");
    await runCommand(
      "npx",
      [
        "playwright",
        "test",
        "--config",
        "playwright.config.ts",
        "--project=chromium",
        "--workers=1",
        "--retries=1",
        "--reporter=list",
        "tests/e2e/pos-go-live.phase7.spec.ts",
      ],
      { env: e2eEnv }
    );

    console.log("[phase7] PASS");
  } finally {
    await killProcessTree(backend);
  }
}

main().catch((error) => {
  console.error(`[phase7] failed: ${error.message}`);
  process.exit(1);
});
