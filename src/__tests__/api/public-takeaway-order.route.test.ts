/** @jest-environment node */

import { NextRequest } from "next/server";
import { GET as GET_BOOTSTRAP } from "../../app/api/public/takeaway-order/[token]/route";
import { POST as POST_ORDER } from "../../app/api/public/takeaway-order/[token]/order/route";
import { GET as GET_ORDER } from "../../app/api/public/takeaway-order/[token]/order/[orderId]/route";
import { proxyPublicJsonRequest } from "../../app/api/public/_utils/proxy";
import { handleApiRouteError } from "../../app/api/_utils/route-error";

jest.mock("../../app/api/public/_utils/proxy", () => ({
    proxyPublicJsonRequest: jest.fn(),
}));

jest.mock("../../app/api/_utils/route-error", () => ({
    handleApiRouteError: jest.fn((error: unknown) => {
        const message = error instanceof Error ? error.message : "unknown-error";
        return Response.json({ error: message }, { status: 500 });
    }),
}));

describe("public takeaway-order proxy routes", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("GET bootstrap proxies encoded token to backend", async () => {
        (proxyPublicJsonRequest as jest.Mock).mockResolvedValue(
            Response.json({ success: true, data: { channel: { kind: "takeaway" } } }, { status: 200 })
        );

        const request = new NextRequest("http://localhost/api/public/takeaway-order/take away", {
            method: "GET",
        });

        const response = await GET_BOOTSTRAP(request, {
            params: { token: "take away" },
        });
        const payload = await response.json();

        expect(proxyPublicJsonRequest).toHaveBeenCalledWith({
            method: "GET",
            backendPath: "/public/takeaway-order/take%20away",
        });
        expect(response.status).toBe(200);
        expect(payload).toEqual({ success: true, data: { channel: { kind: "takeaway" } } });
    });

    it("POST order forwards body and Idempotency-Key header", async () => {
        (proxyPublicJsonRequest as jest.Mock).mockResolvedValue(
            Response.json({ success: true, data: { order: { id: "o1" } } }, { status: 200 })
        );

        const request = new NextRequest("http://localhost/api/public/takeaway-order/t1/order", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "idempotency-key": "idem-123",
            },
            body: JSON.stringify({
                customer_name: "Alice",
                items: [{ product_id: "p1", quantity: 2 }],
            }),
        });

        const response = await POST_ORDER(request, {
            params: { token: "t1" },
        });
        const payload = await response.json();

        expect(proxyPublicJsonRequest).toHaveBeenCalledWith({
            method: "POST",
            backendPath: "/public/takeaway-order/t1/order",
            body: {
                customer_name: "Alice",
                items: [{ product_id: "p1", quantity: 2 }],
            },
            headers: {
                "Idempotency-Key": "idem-123",
            },
        });
        expect(response.status).toBe(200);
        expect(payload).toEqual({ success: true, data: { order: { id: "o1" } } });
    });

    it("POST order accepts x-idempotency-key fallback and GET order encodes params", async () => {
        (proxyPublicJsonRequest as jest.Mock)
            .mockResolvedValueOnce(
                Response.json({ success: true, data: { order: { id: "o2" } } }, { status: 200 })
            )
            .mockResolvedValueOnce(
                Response.json({ success: true, data: { order: { id: "o/2" } } }, { status: 200 })
            );

        const submitRequest = new NextRequest("http://localhost/api/public/takeaway-order/t 2/order", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-idempotency-key": "idem-456",
            },
            body: JSON.stringify({
                customer_phone: "0891234567",
                items: [{ product_id: "p2", quantity: 1 }],
            }),
        });

        const submitResponse = await POST_ORDER(submitRequest, {
            params: { token: "t 2" },
        });
        const submitPayload = await submitResponse.json();

        const getRequest = new NextRequest("http://localhost/api/public/takeaway-order/t 2/order/o/2", {
            method: "GET",
        });

        const getResponse = await GET_ORDER(getRequest, {
            params: { token: "t 2", orderId: "o/2" },
        });
        const getPayload = await getResponse.json();

        expect(proxyPublicJsonRequest).toHaveBeenNthCalledWith(1, {
            method: "POST",
            backendPath: "/public/takeaway-order/t%202/order",
            body: {
                customer_phone: "0891234567",
                items: [{ product_id: "p2", quantity: 1 }],
            },
            headers: {
                "Idempotency-Key": "idem-456",
            },
        });
        expect(proxyPublicJsonRequest).toHaveBeenNthCalledWith(2, {
            method: "GET",
            backendPath: "/public/takeaway-order/t%202/order/o%2F2",
        });
        expect(submitPayload).toEqual({ success: true, data: { order: { id: "o2" } } });
        expect(getPayload).toEqual({ success: true, data: { order: { id: "o/2" } } });
    });

    it("delegates proxy failures to route error handler", async () => {
        (proxyPublicJsonRequest as jest.Mock).mockRejectedValue(new Error("proxy-failed"));

        const request = new NextRequest("http://localhost/api/public/takeaway-order/t1", {
            method: "GET",
        });

        const response = await GET_BOOTSTRAP(request, {
            params: { token: "t1" },
        });
        const payload = await response.json();

        expect(handleApiRouteError).toHaveBeenCalledWith(expect.any(Error));
        expect(response.status).toBe(500);
        expect(payload).toEqual({ error: "proxy-failed" });
    });
});
