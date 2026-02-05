"use client";

import type { CSSProperties } from "react";

export const pageStyles = {
    container: {
        background: "#f6f7fb",
        minHeight: "100vh",
        paddingBottom: 80,
    } as CSSProperties,
    filtersCard: {
        borderRadius: 18,
        boxShadow: "0 12px 40px rgba(15, 23, 42, 0.05)",
        border: "1px solid #edf1f7",
    } as CSSProperties,
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 12,
    } as CSSProperties,
    tableCard: {
        borderRadius: 18,
        boxShadow: "0 10px 34px rgba(15, 23, 42, 0.05)",
        border: "1px solid #edf1f7",
    } as CSSProperties,
    jsonBlock: {
        background: "#0b1021",
        color: "#e8f0ff",
        borderRadius: 12,
        padding: 12,
        fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: 12,
        lineHeight: 1.5,
        maxHeight: 320,
        overflow: "auto",
        border: "1px solid #151b33",
    } as CSSProperties,
};

export const AuditPageStyles = () => (
    <style>{`
      .audit-table .ant-table-tbody > tr:hover > td {
        background: #f5f7ff !important;
      }
      .audit-table .ant-table-cell {
        font-size: 13px;
      }
      .audit-chip {
        border-radius: 999px;
        padding: 4px 10px;
        font-weight: 600;
      }
      .audit-drawer .ant-drawer-body {
        padding: 18px;
      }
    `}</style>
);
