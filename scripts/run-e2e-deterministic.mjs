import { spawn } from 'node:child_process';

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const port = process.env.E2E_PORT || '3100';
const webServerTimeout = process.env.E2E_WEB_SERVER_TIMEOUT || '240000';

const baseEnv = {
    ...process.env,
    CI: '1',
    E2E_PORT: port,
    E2E_WEB_SERVER_TIMEOUT: webServerTimeout,
    PLAYWRIGHT_HTML_OPEN: 'never',
};

function runNpm(args) {
    return new Promise((resolve, reject) => {
        const child = spawn(npmCmd, args, {
            stdio: 'inherit',
            env: baseEnv,
        });

        child.on('error', reject);
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
                return;
            }

            reject(new Error(`Command failed: npm ${args.join(' ')} (exit ${code})`));
        });
    });
}

async function main() {
    await runNpm(['run', 'test:e2e:api']);
    await runNpm(['run', 'test:e2e', '--', '--workers=1', '--retries=1', '--reporter=list']);
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
