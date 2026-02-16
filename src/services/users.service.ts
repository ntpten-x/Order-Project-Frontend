import { User } from "../types/api/users";
import { getProxyUrl } from "../lib/proxy-utils";
import { UserSchema, UsersResponseSchema } from "../schemas/api/users.schema";
import { getBackendErrorMessage, normalizeBackendPaginated, unwrapBackendData } from "../utils/api/backendResponse";

const BASE_PATH = "/users";

export const userService = {
    getAllUsersPaginated: async (
        cookie?: string,
        searchParams?: URLSearchParams
    ): Promise<{ data: User[]; total: number; page: number; last_page: number }> => {
        let url = getProxyUrl("GET", BASE_PATH);
        if (searchParams) {
            url += `?${searchParams.toString()}`;
        }

        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            headers,
            credentials: "include",
            cache: "no-store"
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const detailedError = errorData.errors?.map((e: { message: string }) => e.message).join(", ");
            throw new Error(detailedError || getBackendErrorMessage(errorData, "ไม่สามารถดึงข้อมูลผู้ใช้ได้"));
        }

        return normalizeBackendPaginated<User>(await response.json());
    },

    getAllUsers: async (cookie?: string, searchParams?: URLSearchParams): Promise<User[]> => {
        let url = getProxyUrl("GET", BASE_PATH);
        if (searchParams) {
            url += `?${searchParams.toString()}`;
        }

        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            headers,
            credentials: 'include',
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const detailedError = errorData.errors?.map((e: { message: string }) => e.message).join(", ");
            throw new Error(detailedError || getBackendErrorMessage(errorData, "ไม่สามารถดึงข้อมูลผู้ใช้ได้"));
        }

        const json = await response.json();
        const payload = unwrapBackendData(json) as unknown;

        if (Array.isArray(payload)) {
            return UsersResponseSchema.parse(payload) as unknown as User[];
        }

        if (payload && typeof payload === "object") {
            const record = payload as Record<string, unknown>;
            if (Array.isArray(record.data)) {
                return UsersResponseSchema.parse(record.data) as unknown as User[];
            }
            if (Array.isArray(record.users)) {
                return UsersResponseSchema.parse(record.users) as unknown as User[];
            }
        }

        throw new Error("Invalid users response shape");
    },

    getUserById: async (id: string, cookie?: string): Promise<User> => {
        const url = getProxyUrl("GET", `${BASE_PATH}/${id}`);
        const headers: HeadersInit = {};
        if (cookie) headers.Cookie = cookie;

        const response = await fetch(url!, {
            headers,
            credentials: 'include',
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const detailedError = errorData.errors?.map((e: { message: string }) => e.message).join(", ");
            throw new Error(detailedError || getBackendErrorMessage(errorData, "ไม่สามารถดึงข้อมูลผู้ใช้ได้"));
        }

        const json = await response.json();
        return UserSchema.parse(unwrapBackendData(json)) as unknown as User;
    },

    createUser: async (data: Partial<User>, cookie?: string, csrfToken?: string): Promise<User> => {
        const url = getProxyUrl("POST", BASE_PATH);
        const headers: Record<string, string> = {
            "Content-Type": "application/json"
        };
        if (cookie) headers.Cookie = cookie;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const detailedError = errorData.errors?.map((e: { message: string }) => e.message).join(", ");
            throw new Error(detailedError || getBackendErrorMessage(errorData, "ไม่สามารถสร้างผู้ใช้ได้"));
        }
        return unwrapBackendData(await response.json()) as User;
    },

    updateUser: async (id: string, data: Partial<User>, cookie?: string, csrfToken?: string): Promise<User> => {
        const url = getProxyUrl("PUT", `${BASE_PATH}/${id}`);
        const headers: Record<string, string> = {
            "Content-Type": "application/json"
        };
        if (cookie) headers.Cookie = cookie;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const detailedError = errorData.errors?.map((e: { message: string }) => e.message).join(", ");
            throw new Error(detailedError || getBackendErrorMessage(errorData, "ไม่สามารถอัปเดตผู้ใช้ได้"));
        }
        return unwrapBackendData(await response.json()) as User;
    },

    deleteUser: async (id: string, cookie?: string, csrfToken?: string): Promise<void> => {
        const url = getProxyUrl("DELETE", `${BASE_PATH}/${id}`);
        const headers: Record<string, string> = {};
        if (cookie) headers.Cookie = cookie;
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(url!, {
            method: "DELETE",
            headers,
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const detailedError = errorData.errors?.map((e: { message: string }) => e.message).join(", ");
            throw new Error(detailedError || getBackendErrorMessage(errorData, "ไม่สามารถลบผู้ใช้ได้"));
        }
    },
};
