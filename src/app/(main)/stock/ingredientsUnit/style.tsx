"use client";

import { CSSProperties } from "react";

export const pageStyles = {
    container: {
        minHeight: "100dvh",
        backgroundColor: "#f8fafc",
        width: "100%",
        overflowX: "hidden",
        paddingBottom: 100,
    } as CSSProperties,
    unitCard: (isActive: boolean): CSSProperties => ({
        marginBottom: 12,
        borderRadius: 16,
        border: `1px solid ${isActive ? "#d1fae5" : "#e2e8f0"}`,
        boxShadow: isActive ? "0 4px 12px rgba(15, 23, 42, 0.06)" : "none",
        overflow: "hidden",
        transition: "all 0.2s ease",
        background: "#ffffff",
        opacity: isActive ? 1 : 0.72,
    }),
    unitCardInner: {
        padding: 16,
        display: "flex",
        alignItems: "center",
        gap: 12,
    } as CSSProperties,
};
