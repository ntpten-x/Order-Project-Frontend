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

export default function StockCategoryManageStyle() {
    return (
        <style jsx global>{`
            .stock-category-manage-page .ant-form-item {
                margin-bottom: 20px;
            }

            .stock-category-manage-page .ant-form-item:last-child {
                margin-bottom: 0;
            }

            .stock-category-manage-page .ant-input {
                min-height: 48px;
                border-radius: 14px;
            }

            .stock-category-manage-page .ant-input:focus,
            .stock-category-manage-page .ant-input-focused {
                border-color: #1d4ed8;
                box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.12);
            }
        `}</style>
    );
}
