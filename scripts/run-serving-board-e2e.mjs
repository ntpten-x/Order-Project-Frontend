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

function getFreePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on("error", reject);
        server.listen(0, "127.0.0.1", () => {
            const address = server.address();
            if (!address || typeof address === "string") {
                server.close(() => reject(new Error("could not allocate port")));
                return;
            }
            const { port } = address;
            server.close((error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(port);
            });
        });
    });
}

async function waitForHealth(url, timeoutMs = 120000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const response = await fetch(`${url}/health`);
            if (response.ok) {
                return;
            }
        } catch {
            // backend still starting
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error(`backend health timeout: ${url}/health`);
}

async function main() {
    const backendDir = "../Order-Project-Backend";
    const backendPort = Number(process.env.SERVING_BOARD_BACKEND_PORT || await getFreePort());
    const frontendPort = Number(process.env.E2E_PORT || await getFreePort());
    const backendUrl = process.env.SERVING_BOARD_BACKEND_URL || `http://127.0.0.1:${backendPort}`;

    const baseEnv = {
        ...process.env,
        NO_PROXY: "127.0.0.1,localhost",
        no_proxy: "127.0.0.1,localhost",
        HTTP_PROXY: "",
        HTTPS_PROXY: "",
        ALL_PROXY: "",
    };

    const backend = startCommand("npx", ["ts-node", "app.ts"], {
        cwd: backendDir,
        env: {
            ...baseEnv,
            PORT: String(backendPort),
        },
    });

    try {
        await waitForHealth(backendUrl);

        const e2eEnv = {
            ...baseEnv,
            CI: "1",
            E2E_PORT: String(frontendPort),
            E2E_WEB_SERVER_TIMEOUT: process.env.E2E_WEB_SERVER_TIMEOUT || "240000",
            NEXT_PUBLIC_BACKEND_API: backendUrl,
            BACKEND_API_INTERNAL: backendUrl,
            NEXT_PUBLIC_SOCKET_URL: backendUrl,
            PLAYWRIGHT_HTML_OPEN: "never",
            E2E_USERNAME: process.env.E2E_USERNAME || "admin",
            E2E_PASSWORD: process.env.E2E_PASSWORD || "27451tenX.",
        };

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
                "--reporter=line",
                "tests/e2e/serving-board.spec.ts",
            ],
            { env: e2eEnv }
        );
    } finally {
        await killProcessTree(backend);
    }
}

main().catch((error) => {
    console.error(`[serving-board-e2e] failed: ${error.message}`);
    process.exit(1);
});
