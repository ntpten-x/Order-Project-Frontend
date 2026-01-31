import { NextRequest, NextResponse } from "next/server";
import { branchService } from "../../../../services/branch.service";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = req.headers.get("cookie") || "";
        const data = await branchService.getById(params.id, cookie);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch branch" },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const cookie = req.headers.get("cookie") || "";
        const csrfToken = req.headers.get("x-csrf-token") || "";

        const data = await branchService.update(params.id, body, cookie, csrfToken);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update branch" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const cookie = req.headers.get("cookie") || "";
        const csrfToken = req.headers.get("x-csrf-token") || "";

        await branchService.delete(params.id, cookie, csrfToken);
        return NextResponse.json({ message: "Branch deleted successfully" });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete branch" },
            { status: 500 }
        );
    }
}
