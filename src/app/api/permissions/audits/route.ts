import { NextRequest } from "next/server";
import { proxyToBackend } from "../../_utils/proxy-to-backend";
import { getProxyUrl } from "../../../../lib/proxy-utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const base = getProxyUrl("GET", "/permissions/audits");
    const target = new URL(base!);
    req.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value));
    return proxyToBackend(req, { url: target.toString(), method: "GET" });
}
