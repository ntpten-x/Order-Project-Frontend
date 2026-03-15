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
            .stock-category-manage-page .stock-manage-card {
                border-radius: 20px;
                border: 1px solid #e2e8f0;
                box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
            }

            .stock-category-manage-page .stock-manage-main-card .ant-card-body,
            .stock-category-manage-page .stock-manage-side-card .ant-card-body {
                padding: 24px;
            }

            .stock-category-manage-page .stock-manage-card-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 20px;
            }

            .stock-category-manage-page .stock-manage-card-icon,
            .stock-category-manage-page .stock-manage-side-icon {
                font-size: 18px;
                color: #1d4ed8;
            }

            .stock-category-manage-page .stock-manage-muted-text {
                display: block;
                margin-top: 4px;
                font-size: 13px;
            }

            .stock-category-manage-page .stock-manage-switch-panel {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 16px;
                padding: 16px;
                margin-bottom: 20px;
                border-radius: 14px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
            }

            .stock-category-manage-page .stock-manage-form-actions {
                display: flex;
                gap: 12px;
            }

            .stock-category-manage-page .stock-manage-action-button {
                flex: 1;
            }

            .stock-category-manage-page .stock-manage-action-button-primary {
                flex: 1.4;
            }

            .stock-category-manage-page .stock-manage-side-grid {
                display: grid;
                gap: 14px;
            }

            .stock-category-manage-page .stock-manage-preview-title {
                margin: 0 0 12px;
            }

            .stock-category-manage-page .stock-manage-help-text {
                color: #475569;
                margin-bottom: 12px;
            }

            .stock-category-manage-page .stock-manage-detail-line {
                display: block;
                margin-bottom: 6px;
            }

            .stock-category-manage-page .ant-form-item {
                margin-bottom: 20px;
            }

            .stock-category-manage-page .ant-form-item:last-child {
                margin-bottom: 0;
            }

            .stock-category-manage-page .ant-input,
            .stock-category-manage-page .ant-input-affix-wrapper {
                min-height: 48px;
                border-radius: 14px;
            }

            .stock-category-manage-page .ant-input:focus,
            .stock-category-manage-page .ant-input-focused,
            .stock-category-manage-page .ant-input-affix-wrapper-focused {
                border-color: #1d4ed8;
                box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.12);
            }

            @media (max-width: 767px) {
                .stock-category-manage-page .stock-manage-main-card .ant-card-body,
                .stock-category-manage-page .stock-manage-side-card .ant-card-body {
                    padding: 18px;
                }

                .stock-category-manage-page .stock-manage-switch-panel,
                .stock-category-manage-page .stock-manage-form-actions {
                    flex-direction: column;
                    align-items: stretch;
                }

                .stock-category-manage-page .stock-manage-action-button,
                .stock-category-manage-page .stock-manage-action-button-primary {
                    width: 100%;
                    flex: initial;
                }
            }
        `}</style>
    );
}
