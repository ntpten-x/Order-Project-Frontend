/** @jest-environment node */

import { NextRequest } from "next/server";

import { DELETE, GET, PUT } from "../../app/api/pos/delivery/[id]/route";
import { deliveryService } from "../../services/pos/delivery.service";
import { BackendHttpError } from "../../utils/api/backendResponse";

jest.mock("../../services/pos/delivery.service", () => ({
    deliveryService: {
        getById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
}));

describe("/api/pos/delivery/:id", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("forwards GET requests to deliveryService.getById", async () => {
        (deliveryService.getById as jest.Mock).mockResolvedValue({ id: "d1", delivery_name: "Grab" });

        const req = new NextRequest("http://localhost/api/pos/delivery/d1", {
            method: "GET",
            headers: { cookie: "sid=abc" },
        });

        const res = await GET(req, { params: { id: "d1" } });
        const payload = await res.json();

        expect(deliveryService.getById).toHaveBeenCalledWith("d1", "sid=abc");
        expect(res.status).toBe(200);
        expect(payload).toEqual({ id: "d1", delivery_name: "Grab" });
    });

    it("forwards PUT requests to deliveryService.update", async () => {
        (deliveryService.update as jest.Mock).mockResolvedValue({ id: "d1", delivery_name: "LINE MAN" });

        const req = new NextRequest("http://localhost/api/pos/delivery/d1", {
            method: "PUT",
            headers: {
                cookie: "sid=abc",
                "x-csrf-token": "csrf123",
                "content-type": "application/json",
            },
            body: JSON.stringify({ delivery_name: "LINE MAN" }),
        });

        const res = await PUT(req, { params: { id: "d1" } });
        const payload = await res.json();

        expect(deliveryService.update).toHaveBeenCalledWith(
            "d1",
            { delivery_name: "LINE MAN" },
            "sid=abc",
            "csrf123"
        );
        expect(res.status).toBe(200);
        expect(payload).toEqual({ id: "d1", delivery_name: "LINE MAN" });
    });

    it("preserves backend status for DELETE errors", async () => {
        (deliveryService.delete as jest.Mock).mockRejectedValue(new BackendHttpError(404, "provider missing"));

        const req = new NextRequest("http://localhost/api/pos/delivery/d1", {
            method: "DELETE",
            headers: {
                cookie: "sid=abc",
                "x-csrf-token": "csrf123",
            },
        });

        const res = await DELETE(req, { params: { id: "d1" } });
        const payload = await res.json();

        expect(deliveryService.delete).toHaveBeenCalledWith("d1", "sid=abc", "csrf123");
        expect(res.status).toBe(404);
        expect(payload).toEqual({ error: "provider missing" });
    });
});
