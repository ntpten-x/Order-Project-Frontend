import { NextRequest } from "next/server";
import { proxyToBackend } from "../../_utils/proxy-to-backend";
import { getProxyUrl } from "../../../../lib/proxy-utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const baseUrl = getProxyUrl("GET", "/system/health");
    const search = req.nextUrl.search || "";
    const url = `${baseUrl || ""}${search}`;
    return proxyToBackend(req, { url, method: "GET" });
}
