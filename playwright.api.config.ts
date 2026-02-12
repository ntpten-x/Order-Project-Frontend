import { defineConfig } from '@playwright/test';

const e2ePort = Number(process.env.E2E_PORT || 3100);
const e2eBaseUrl = `http://localhost:${e2ePort}`;
const webServerTimeout = Number(process.env.E2E_WEB_SERVER_TIMEOUT || 180000);

export default defineConfig({
    testDir: './tests/e2e-api',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 1,
    reporter: 'list',
    use: {
        baseURL: e2eBaseUrl,
    },
    webServer: {
        command: `npm run dev -- -p ${e2ePort}`,
        url: `${e2eBaseUrl}/api/health`,
        timeout: webServerTimeout,
        reuseExistingServer: false,
    },
});
