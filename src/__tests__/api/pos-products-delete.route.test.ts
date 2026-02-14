/** @jest-environment node */

import { NextRequest } from "next/server";
import { DELETE } from "../../app/api/pos/products/delete/[id]/route";
import { productsService } from "../../services/pos/products.service";
import { BackendHttpError } from "../../utils/api/backendResponse";

jest.mock("../../services/pos/products.service", () => ({
    productsService: {
        delete: jest.fn(),
    },
}));

describe("DELETE /api/pos/products/delete/:id", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each([401, 403, 409])("preserves backend status %s from service error", async (statusCode) => {
        (productsService.delete as jest.Mock).mockRejectedValue(
            new BackendHttpError(statusCode, `backend-status-${statusCode}`)
        );

        const req = new NextRequest("http://localhost/api/pos/products/delete/p1", {
            method: "DELETE",
            headers: {
                cookie: "sid=abc",
                "x-csrf-token": "csrf123",
            },
        });

        const res = await DELETE(req, { params: { id: "p1" } });
        const payload = await res.json();

        expect(productsService.delete).toHaveBeenCalledWith("p1", "sid=abc", "csrf123");
        expect(res.status).toBe(statusCode);
        expect(payload).toEqual({ error: `backend-status-${statusCode}` });
    });
});
