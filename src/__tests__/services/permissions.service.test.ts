import { permissionsService } from "../../services/permissions.service";
import { getProxyUrl } from "../../lib/proxy-utils";

jest.mock("../../lib/proxy-utils", () => ({
    getProxyUrl: jest.fn(),
}));

type MockFetchResponse = {
    ok: boolean;
    json: () => Promise<unknown>;
};

describe("permissionsService cache behavior", () => {
    const fetchMock = jest.fn<Promise<MockFetchResponse>, [string, RequestInit?]>();

    beforeEach(() => {
        jest.clearAllMocks();
        permissionsService.clearCache();
        (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
        (getProxyUrl as jest.Mock).mockImplementation((_method: string, url: string) => `http://backend${url}`);
    });

    it("caches effective user permissions when cookie is not provided", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: {
                    user: { id: "u1", username: "alice", roleId: "r1" },
                    role: { id: "r1", roles_name: "manager", display_name: "Manager" },
                    permissions: [],
                },
            }),
        });

        await permissionsService.getUserEffectivePermissions("u1");
        await permissionsService.getUserEffectivePermissions("u1");

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("does not cache effective user permissions when cookie is provided", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: {
                    user: { id: "u1", username: "alice", roleId: "r1" },
                    role: { id: "r1", roles_name: "manager", display_name: "Manager" },
                    permissions: [],
                },
            }),
        });

        await permissionsService.getUserEffectivePermissions("u1", "sid=abc");
        await permissionsService.getUserEffectivePermissions("u1", "sid=abc");

        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("invalidates effective user cache after successful update", async () => {
        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: {
                        user: { id: "u1", username: "alice", roleId: "r1" },
                        role: { id: "r1", roles_name: "manager", display_name: "Manager" },
                        permissions: [],
                    },
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: { updated: true, approvalRequired: false },
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: {
                        user: { id: "u1", username: "alice", roleId: "r1" },
                        role: { id: "r1", roles_name: "manager", display_name: "Manager" },
                        permissions: [{ resourceKey: "users.page" }],
                    },
                }),
            });

        await permissionsService.getUserEffectivePermissions("u1");
        await permissionsService.updateUserPermissions(
            "u1",
            { permissions: [] },
            "csrf-token"
        );
        await permissionsService.getUserEffectivePermissions("u1");

        expect(fetchMock).toHaveBeenCalledTimes(3);
    });
});

