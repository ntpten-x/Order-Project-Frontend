import { NextRequest, NextResponse } from "next/server";

type GuardedRouteType = "orders" | "payment" | "delivery";

type OrderLike = {
    id?: string;
    status?: string;
    order_type?: string;
};

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

    if (status === "paid" || status === "completed") {
        return `/pos/dashboard/${orderId}`;
    }

    if (status === "cancelled") {
        return getCancelRedirect(orderType);
    }

    if (status === "waitingforpayment") {
        const target = getWaitingRedirect(orderType, orderId);
        return currentType === "orders" ? target : null;
    }

    // Pending/Cooking/Served should use order details page.
    const detailsPath = `/pos/orders/${orderId}`;
    if (currentType === "orders") return null;
    return detailsPath;
}

export async function middleware(request: NextRequest) {
    const parsed = parseGuardedRoute(request.nextUrl.pathname);
    if (!parsed) return NextResponse.next();

    try {
        const apiUrl = new URL(`/api/pos/orders/${parsed.orderId}`, request.url);
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                Accept: "application/json",
                ...(request.headers.get("cookie") ? { Cookie: request.headers.get("cookie") as string } : {}),
            },
            cache: "no-store",
        });

        if (!response.ok) return NextResponse.next();

        const payload = await response.json().catch(() => null);
        const order = (payload?.data ?? payload) as OrderLike | null;
        if (!order) return NextResponse.next();

        const redirectPath = buildRedirectPath(order, parsed.type, parsed.orderId);
        if (!redirectPath || redirectPath === request.nextUrl.pathname) {
            return NextResponse.next();
        }

        return NextResponse.redirect(new URL(redirectPath, request.url));
    } catch {
        return NextResponse.next();
    }
}

export const config = {
    matcher: ["/pos/orders/:path*", "/pos/items/payment/:path*", "/pos/items/delivery/:path*"],
};

