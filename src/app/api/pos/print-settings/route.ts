import { NextRequest } from "next/server";
import { proxyToBackend } from "../../_utils/proxy-to-backend";
import { getProxyUrl } from "../../../../lib/proxy-utils";

const BASE_PATH = "/pos/print-settings";

export async function GET(request: NextRequest) {
    return proxyToBackend(request, {
        url: getProxyUrl("GET", BASE_PATH)!,
        method: "GET",
    });
}

export async function PUT(request: NextRequest) {
    return proxyToBackend(request, {
        url: getProxyUrl("PUT", BASE_PATH)!,
        method: "PUT",
        forwardBody: true,
    });
}
