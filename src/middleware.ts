import { NextRequest, NextResponse } from "next/server";

type GuardedRouteType = "orders" | "payment" | "delivery";

type OrderLike = {
    id?: string;
    status?: string;
    order_type?: string;
};

type CacheEntry<T> = {
    expiresAt: number;
    value: T;
};

const SHIFT_CACHE_TTL_MS = 3000;
const ORDER_CACHE_TTL_MS = 2000;
const shiftStatusCache = new Map<string, CacheEntry<number>>();
const orderCache = new Map<string, CacheEntry<OrderLike | null>>();
const ORDER_FETCH_FAILED = Symbol("ORDER_FETCH_FAILED");

const KNOWN_API_PREFIXES = [
    "/api/auth",
    "/api/audit",
    "/api/branches",
    "/api/system",
    "/api/csrf",
    "/api/health",
    "/api/permissions",
    "/api/pos",
    "/api/roles",
    "/api/stock",
    "/api/users",
    "/api/cron",
];

const PUBLIC_API_PREFIXES = [
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/me",
    "/api/csrf",
    "/api/health",
    "/api/cron/keep-alive",
];

const PROTECTED_PAGE_PREFIXES = ["/users", "/branch", "/pos", "/stock", "/audit", "/Health-System"];

function readCache<T>(store: Map<string, CacheEntry<T>>, key: string): T | null {
    const hit = store.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expiresAt) {
        store.delete(key);
        return null;
    }
    return hit.value;
}

function writeCache<T>(store: Map<string, CacheEntry<T>>, key: string, value: T, ttlMs: number) {
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function hasAuthToken(request: NextRequest): boolean {
    return Boolean(request.cookies.get("token")?.value);
}

function isKnownApiPath(pathname: string): boolean {
    return KNOWN_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPublicApiPath(pathname: string): boolean {
    return PUBLIC_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isProtectedPagePath(pathname: string): boolean {
    return PROTECTED_PAGE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isShiftProtectedPath(pathname: string): boolean {
    const protectedPrefixes = [
        "/pos/channels/delivery",
        "/pos/channels/dine-in",
        "/pos/channels/takeaway",
        "/pos/orders",
        "/pos/items",
        "/pos/kitchen",
    ];

    return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function parseGuardedRoute(pathname: string): { type: GuardedRouteType; orderId: string } | null {
    const paymentMatch = pathname.match(/^\/pos\/items\/payment\/([^/]+)\/?$/);
    if (paymentMatch?.[1]) return { type: "payment", orderId: paymentMatch[1] };

    const deliveryMatch = pathname.match(/^\/pos\/items\/delivery\/([^/]+)\/?$/);
    if (deliveryMatch?.[1]) return { type: "delivery", orderId: deliveryMatch[1] };

    const ordersMatch = pathname.match(/^\/pos\/orders\/([^/]+)\/?$/);
    if (ordersMatch?.[1]) return { type: "orders", orderId: ordersMatch[1] };

    return null;
}

function normalize(value: unknown): string {
    return String(value ?? "").trim().toLowerCase();
}

function getCancelRedirect(orderType: string): string {
    const t = normalize(orderType);
    if (t === "delivery") return "/pos/channels/delivery";
    if (t === "takeaway") return "/pos/channels/takeaway";
    if (t === "dinein") return "/pos/channels/dine-in";
    return "/pos/channels";
}

function getWaitingRedirect(orderType: string, orderId: string): string {
    const t = normalize(orderType);
    if (t === "delivery") return `/pos/items/delivery/${orderId}`;
    return `/pos/items/payment/${orderId}`;
}

function buildRedirectPath(order: OrderLike, currentType: GuardedRouteType, fallbackOrderId: string): string | null {
    const orderId = String(order.id || fallbackOrderId);
    const status = normalize(order.status);
    const orderType = String(order.order_type || "");

    if (status === "paid" || status === "completed") return `/pos/dashboard/${orderId}`;
    if (status === "cancelled") return getCancelRedirect(orderType);

    if (status === "waitingforpayment") {
        const target = getWaitingRedirect(orderType, orderId);
        return currentType === "orders" ? target : null;
    }

    const detailsPath = `/pos/orders/${orderId}`;
    if (currentType === "orders") return null;
    return detailsPath;
}

function buildShiftRedirect(request: NextRequest) {
    const redirectUrl = new URL("/pos/shift", request.url);
    redirectUrl.searchParams.set("openShift", "1");
    redirectUrl.searchParams.set("redirect", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(redirectUrl);
}

function buildLoginRedirect(request: NextRequest) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(redirectUrl);
}

async function getShiftStatus(request: NextRequest): Promise<number | null> {
    const cookie = request.headers.get("cookie") || "";
    const cacheKey = `shift:${cookie}`;
    const cached = readCache(shiftStatusCache, cacheKey);
    if (cached !== null) return cached;

    try {
        const apiUrl = new URL("/api/pos/shifts/current", request.url);
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                Accept: "application/json",
                ...(cookie ? { Cookie: cookie } : {}),
            },
            cache: "no-store",
        });

        writeCache(shiftStatusCache, cacheKey, response.status, SHIFT_CACHE_TTL_MS);
        return response.status;
    } catch {
        return null;
    }
}

async function getOrderForGuard(request: NextRequest, orderId: string): Promise<OrderLike | null | typeof ORDER_FETCH_FAILED> {
    const cookie = request.headers.get("cookie") || "";
    const cacheKey = `order:${cookie}:${orderId}`;
    const cached = readCache(orderCache, cacheKey);
    if (cached !== null) return cached;

    try {
        const apiUrl = new URL(`/api/pos/orders/${orderId}`, request.url);
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                Accept: "application/json",
                ...(cookie ? { Cookie: cookie } : {}),
            },
            cache: "no-store",
        });

        if (!response.ok) {
            writeCache(orderCache, cacheKey, null, ORDER_CACHE_TTL_MS);
            return null;
        }

        const payload = await response.json().catch(() => null);
        const order = (payload?.data ?? payload) as OrderLike | null;
        writeCache(orderCache, cacheKey, order, ORDER_CACHE_TTL_MS);
        return order;
    } catch {
        return ORDER_FETCH_FAILED;
    }
}

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    if (pathname.startsWith("/api")) {
        if (!isKnownApiPath(pathname)) {
            return NextResponse.json(
                { error: `deny-by-default: ${pathname} is not whitelisted` },
                { status: 403 }
            );
        }

        if (!hasAuthToken(request) && !isPublicApiPath(pathname)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.next();
    }

    if (isProtectedPagePath(pathname) && !hasAuthToken(request)) {
        return buildLoginRedirect(request);
    }

    const parsed = parseGuardedRoute(pathname);

    if (isShiftProtectedPath(pathname)) {
        const shiftStatus = await getShiftStatus(request);
        if (shiftStatus === 404 || shiftStatus === null) {
            return buildShiftRedirect(request);
        }
    }

    if (!parsed) return NextResponse.next();

    const order = await getOrderForGuard(request, parsed.orderId);
    if (order === ORDER_FETCH_FAILED) {
        return NextResponse.redirect(new URL("/pos/channels", request.url));
    }
    if (!order) return NextResponse.next();

    const redirectPath = buildRedirectPath(order, parsed.type, parsed.orderId);
    if (!redirectPath || redirectPath === pathname) {
        return NextResponse.next();
    }

    return NextResponse.redirect(new URL(redirectPath, request.url));
}

export const config = {
    matcher: [
        "/api/:path*",
        "/users/:path*",
        "/branch/:path*",
        "/pos/channels/delivery/:path*",
        "/pos/channels/dine-in/:path*",
        "/pos/channels/takeaway/:path*",
        "/pos/orders/:path*",
        "/pos/items/:path*",
        "/pos/kitchen/:path*",
        "/stock/:path*",
        "/audit/:path*",
        "/Health-System/:path*",
        "/Health-System",
    ],
};
