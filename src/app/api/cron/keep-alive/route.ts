import { NextResponse } from 'next/server';
import { handleApiRouteError } from "../../_utils/route-error";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const backendUrl = process.env.RENDER_BACKEND_URL;
        const frontendUrl = process.env.RENDER_FRONTEND_URL;

        if (!backendUrl && !frontendUrl) {
            return NextResponse.json({ message: 'No targets configured' }, { status: 400 });
        }

        const results = await Promise.all([
            backendUrl ? pingService(backendUrl, 'Backend') : Promise.resolve({ name: 'Backend', status: 'skipped' }),
            frontendUrl ? pingService(frontendUrl, 'Frontend') : Promise.resolve({ name: 'Frontend', status: 'skipped' })
        ]);

        return NextResponse.json({
            message: 'Keep-alive ping completed',
            timestamp: new Date().toISOString(),
            results
        });

    } catch (error) {
        console.error('Keep-alive failed:', error);
        return handleApiRouteError(error);
    }
}

async function pingService(url: string, name: string) {
    try {
        const start = Date.now();
        // Use health endpoint for backend, or root for frontend
        const targetUrl = name === 'Backend' && !url.endsWith('/health') && !url.endsWith('/')
            ? `${url}/health`
            : url;

        const response = await fetch(targetUrl);
        const duration = Date.now() - start;

        return {
            name,
            url: targetUrl,
            status: response.status,
            ok: response.ok,
            duration: `${duration}ms`
        };
    } catch (error) {
        return {
            name,
            url,
            status: 'error',
            error: (error as Error).message
        };
    }
}