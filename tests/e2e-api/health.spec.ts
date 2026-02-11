import { expect, test } from '@playwright/test';

test.describe('API health smoke', () => {
    test('GET /api/health returns ok payload', async ({ request }) => {
        const response = await request.get('/api/health');
        expect(response.ok()).toBeTruthy();

        const payload = await response.json();
        expect(payload).toMatchObject({
            ok: true,
            service: 'frontend',
        });
        expect(typeof payload.timestamp).toBe('string');
    });
});
