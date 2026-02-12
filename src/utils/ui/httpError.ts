import { BackendHttpError } from "../api/backendResponse";

type ErrorLike = {
    status?: unknown;
    statusCode?: unknown;
    code?: unknown;
    message?: unknown;
    response?: {
        status?: unknown;
        data?: unknown;
    };
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object";
}

function inferStatusFromText(message: string): number | undefined {
    const normalized = message.toLowerCase();
    if (normalized.includes("unauthorized")) return 401;
    if (normalized.includes("forbidden")) return 403;
    if (normalized.includes("conflict")) return 409;
    if (/\b401\b/.test(normalized)) return 401;
    if (/\b403\b/.test(normalized)) return 403;
    if (/\b409\b/.test(normalized)) return 409;
    return undefined;
}

export function resolveHttpStatus(error: unknown): number | undefined {
    if (error instanceof BackendHttpError) return error.status;
    if (!error) return undefined;

    if (typeof error === "string") {
        return inferStatusFromText(error);
    }

    if (!isRecord(error)) return undefined;
    const maybe = error as ErrorLike;

    if (typeof maybe.status === "number") return maybe.status;
    if (typeof maybe.statusCode === "number") return maybe.statusCode;
    if (typeof maybe.response?.status === "number") return maybe.response.status;

    if (typeof maybe.code === "string") {
        const code = maybe.code.toUpperCase();
        if (code === "UNAUTHORIZED") return 401;
        if (code === "FORBIDDEN") return 403;
        if (code === "CONFLICT") return 409;
    }

    if (typeof maybe.message === "string") {
        return inferStatusFromText(maybe.message);
    }

    return undefined;
}

export function resolveHttpErrorMessage(error: unknown): string | undefined {
    if (!error) return undefined;
    if (typeof error === "string") return error;
    if (!isRecord(error)) return undefined;

    const maybe = error as ErrorLike;
    if (typeof maybe.message === "string" && maybe.message.trim()) return maybe.message;

    const payload = maybe.response?.data;
    if (isRecord(payload)) {
        const nestedError = payload.error;
        if (isRecord(nestedError) && typeof nestedError.message === "string" && nestedError.message.trim()) {
            return nestedError.message;
        }
        if (typeof nestedError === "string" && nestedError.trim()) return nestedError;
        if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
    }

    return undefined;
}
