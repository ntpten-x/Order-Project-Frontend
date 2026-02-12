import { defineConfig, devices } from '@playwright/test';

const e2ePort = Number(process.env.E2E_PORT || 3100);
const e2eBaseUrl = `http://localhost:${e2ePort}`;
const webServerTimeout = Number(process.env.E2E_WEB_SERVER_TIMEOUT || 180000);

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: e2eBaseUrl,
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: `npm run dev -- -p ${e2ePort}`,
        url: e2eBaseUrl,
        timeout: webServerTimeout,
        reuseExistingServer: !process.env.CI,
    },
});
