import { NextResponse } from "next/server";
import { BackendHttpError } from "../../../utils/api/backendResponse";

type ErrorWithStatus = {
    status?: unknown;
    code?: unknown;
    message?: unknown;
};

function inferStatusFromMessage(message: string): number {
    const normalized = message.toLowerCase();
    if (normalized.includes("unauthorized")) return 401;
    if (normalized.includes("forbidden")) return 403;
    if (normalized.includes("conflict")) return 409;
    if (normalized.includes("not found")) return 404;
    if (normalized.includes("bad request")) return 400;
    if (normalized.includes("validation")) return 400;
    return 500;
}

function resolveStatus(error: unknown): number {
    if (error instanceof BackendHttpError) return error.status;
    if (error && typeof error === "object") {
        const maybe = error as ErrorWithStatus;
        if (typeof maybe.status === "number" && maybe.status >= 400 && maybe.status <= 599) {
            return maybe.status;
        }
        if (typeof maybe.code === "string") {
            if (maybe.code === "UNAUTHORIZED") return 401;
            if (maybe.code === "FORBIDDEN") return 403;
            if (maybe.code === "CONFLICT") return 409;
            if (maybe.code === "NOT_FOUND") return 404;
            if (maybe.code === "BAD_REQUEST") return 400;
        }
        if (typeof maybe.message === "string") {
            return inferStatusFromMessage(maybe.message);
        }
    }
    if (typeof error === "string") return inferStatusFromMessage(error);
    return 500;
}

export function getRouteErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message.trim()) return error.message;
    if (typeof error === "string" && error.trim()) return error;
    return fallback;
}

export function handleApiRouteError(error: unknown, fallback: string = "Internal Server Error") {
    return NextResponse.json(
        { error: getRouteErrorMessage(error, fallback) },
        { status: resolveStatus(error) }
    );
}
