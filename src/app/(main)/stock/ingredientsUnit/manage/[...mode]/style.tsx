"use client";

import { CSSProperties } from "react";

export const pageStyles: Record<string, CSSProperties> = {
    container: {
        minHeight: "100dvh",
        background: "#f8fafc",
        paddingBottom: 96,
    },
    loadingWrap: {
        display: "flex",
        justifyContent: "center",
        padding: "80px 0",
    },
};

export default function IngredientsUnitManageStyle() {
    return (
        <style jsx global>{`
            .stock-ingredients-unit-manage-page .ant-form-item {
                margin-bottom: 20px;
            }

            .stock-ingredients-unit-manage-page .ant-form-item:last-child {
                margin-bottom: 0;
            }

            .stock-ingredients-unit-manage-page .ant-input {
                min-height: 48px;
                border-radius: 14px;
            }

            .stock-ingredients-unit-manage-page .ant-input:focus,
            .stock-ingredients-unit-manage-page .ant-input-focused {
                border-color: #0f766e;
                box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
            }
        `}</style>
    );
}
