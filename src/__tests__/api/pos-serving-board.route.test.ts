/** @jest-environment node */

import type { NextRequest } from "next/server";
import { GET as getServingBoard } from "../../app/api/pos/orders/serve-board/route";
import { PATCH as patchServingBoardItem } from "../../app/api/pos/orders/serve-board/items/[id]/route";
import { PATCH as patchServingBoardGroup } from "../../app/api/pos/orders/serve-board/groups/[id]/route";
import { servingBoardService } from "../../services/pos/servingBoard.service";

jest.mock("../../services/pos/servingBoard.service", () => ({
    servingBoardService: {
        getBoard: jest.fn(),
        updateItemStatus: jest.fn(),
        updateGroupStatus: jest.fn(),
    },
}));

describe("serving board API routes", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("GET /api/pos/orders/serve-board forwards cookie to service", async () => {
        (servingBoardService.getBoard as jest.Mock).mockResolvedValue([{ id: "group-1" }]);

        const request = {
            headers: {
                get: (key: string) => (key.toLowerCase() === "cookie" ? "sid=abc" : null),
            },
        } as unknown as NextRequest;

        const response = await getServingBoard(request);
        const body = await response.json();

        expect(servingBoardService.getBoard).toHaveBeenCalledWith("sid=abc");
        expect(response.status).toBe(200);
        expect(body).toEqual([{ id: "group-1" }]);
    });

    it("PATCH /api/pos/orders/serve-board/items/[id] forwards status, cookie, and csrf token", async () => {
        (servingBoardService.updateItemStatus as jest.Mock).mockResolvedValue(undefined);

        const request = {
            json: jest.fn().mockResolvedValue({ serving_status: "Served" }),
            headers: {
                get: (key: string) => {
                    const normalized = key.toLowerCase();
                    if (normalized === "cookie") return "sid=abc";
                    if (normalized === "x-csrf-token") return "csrf-1";
                    return null;
                },
            },
        } as unknown as NextRequest;

        const response = await patchServingBoardItem(request, { params: { id: "item-1" } });
        const body = await response.json();

        expect(servingBoardService.updateItemStatus).toHaveBeenCalledWith("item-1", "Served", "sid=abc", "csrf-1");
        expect(response.status).toBe(200);
        expect(body).toEqual({ success: true });
    });

    it("PATCH /api/pos/orders/serve-board/groups/[id] forwards status, cookie, and csrf token", async () => {
        (servingBoardService.updateGroupStatus as jest.Mock).mockResolvedValue(undefined);

        const request = {
            json: jest.fn().mockResolvedValue({ serving_status: "PendingServe" }),
            headers: {
                get: (key: string) => {
                    const normalized = key.toLowerCase();
                    if (normalized === "cookie") return "sid=xyz";
                    if (normalized === "x-csrf-token") return "csrf-2";
                    return null;
                },
            },
        } as unknown as NextRequest;

        const response = await patchServingBoardGroup(request, { params: { id: "group-9" } });
        const body = await response.json();

        expect(servingBoardService.updateGroupStatus).toHaveBeenCalledWith("group-9", "PendingServe", "sid=xyz", "csrf-2");
        expect(response.status).toBe(200);
        expect(body).toEqual({ success: true });
    });
});
