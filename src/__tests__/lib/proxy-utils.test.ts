/** @jest-environment node */

describe("proxy-utils", () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
        delete process.env.BACKEND_API_INTERNAL;
        delete process.env.BACKEND_API_URL;
        delete process.env.NEXT_PUBLIC_BACKEND_API;
        delete process.env.NEXT_PUBLIC_API_URL;
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it("falls back to localhost:3000 on the server when no backend env is configured", async () => {
        const { getProxyUrl, PROXY_CONFIGS } = await import("../../lib/proxy-utils");

        expect(PROXY_CONFIGS.API_BASE_URL).toBe("http://localhost:3000");
        expect(getProxyUrl("GET", "/stock/orders")).toBe("http://localhost:3000/stock/orders");
    });

    it("normalizes configured server-side backend URLs", async () => {
        process.env.BACKEND_API_INTERNAL = "https://backend.internal/";
        const { getProxyUrl, PROXY_CONFIGS } = await import("../../lib/proxy-utils");

        expect(PROXY_CONFIGS.API_BASE_URL).toBe("https://backend.internal");
        expect(getProxyUrl("POST", "/stock/ingredients")).toBe("https://backend.internal/stock/ingredients");
    });
});
