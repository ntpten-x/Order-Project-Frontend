import { NextRequest, NextResponse } from "next/server";
import { branchService } from "../../../services/branch.service";

export async function GET(req: NextRequest) {
    try {
        const cookie = req.headers.get("cookie") || "";
        const data = await branchService.getAll(cookie);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch branches" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const cookie = req.headers.get("cookie") || "";
        const csrfToken = req.headers.get("x-csrf-token") || "";

        const data = await branchService.create(body, cookie, csrfToken);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create branch" },
            { status: 500 }
        );
    }
}
