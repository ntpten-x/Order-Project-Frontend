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

export default function IngredientsManageStyle() {
    return (
        <style jsx global>{`
            .stock-ingredients-manage-page .stock-ingredient-card {
                border-radius: 20px;
                border: 1px solid #e2e8f0;
                box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
            }

            .stock-ingredients-manage-page .stock-ingredient-main-card .ant-card-body,
            .stock-ingredients-manage-page .stock-ingredient-side-card .ant-card-body {
                padding: 24px;
            }

            .stock-ingredients-manage-page .stock-ingredient-card-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 20px;
            }

            .stock-ingredients-manage-page .stock-ingredient-card-icon,
            .stock-ingredients-manage-page .stock-ingredient-side-icon {
                font-size: 18px;
                color: #0f766e;
            }

            .stock-ingredients-manage-page .stock-ingredient-inline-action {
                display: flex;
                flex-direction: column;
                gap: 4px;
                margin-top: 6px;
            }

            .stock-ingredients-manage-page .stock-ingredient-side-grid {
                display: grid;
                gap: 14px;
            }

            .stock-ingredients-manage-page .stock-ingredient-preview-row {
                display: grid;
                grid-template-columns: auto minmax(0, 1fr);
                gap: 14px;
                align-items: center;
            }

            .stock-ingredients-manage-page .stock-ingredient-preview-title {
                margin: 0 0 6px;
                word-break: break-word;
            }

            .stock-ingredients-manage-page .stock-ingredient-preview-description {
                margin: 16px 0 0;
                padding-top: 16px;
                border-top: 1px solid #e2e8f0;
                color: #475569;
            }

            .stock-ingredients-manage-page .stock-ingredient-help-text {
                color: #475569;
                margin-bottom: 12px;
            }

            .stock-ingredients-manage-page .stock-ingredient-detail-line,
            .stock-ingredients-manage-page .stock-ingredient-muted-text {
                display: block;
            }

            .stock-ingredients-manage-page .stock-ingredient-muted-text {
                margin-top: 4px;
                font-size: 13px;
            }

            .stock-ingredients-manage-page .stock-ingredient-switch-panel {
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

            .stock-ingredients-manage-page .stock-ingredient-form-actions {
                display: flex;
                gap: 12px;
                margin-top: 4px;
            }

            .stock-ingredients-manage-page .stock-ingredient-action-button {
                flex: 1;
            }

            .stock-ingredients-manage-page .stock-ingredient-action-button-primary {
                flex: 1.4;
            }

            .stock-ingredients-manage-page .ant-form-item {
                margin-bottom: 20px;
            }

            .stock-ingredients-manage-page .ant-input,
            .stock-ingredients-manage-page .ant-input-affix-wrapper {
                min-height: 48px;
                border-radius: 14px;
            }

            .stock-ingredients-manage-page textarea.ant-input {
                min-height: 120px;
                border-radius: 14px;
            }

            .stock-ingredients-manage-page .ant-input:focus,
            .stock-ingredients-manage-page .ant-input-focused,
            .stock-ingredients-manage-page .ant-input-affix-wrapper-focused {
                border-color: #0f766e;
                box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
            }

            @media (max-width: 767px) {
                .stock-ingredients-manage-page .stock-ingredient-main-card .ant-card-body,
                .stock-ingredients-manage-page .stock-ingredient-side-card .ant-card-body {
                    padding: 18px;
                }

                .stock-ingredients-manage-page .stock-ingredient-preview-row,
                .stock-ingredients-manage-page .stock-ingredient-switch-panel,
                .stock-ingredients-manage-page .stock-ingredient-form-actions {
                    grid-template-columns: 1fr;
                    flex-direction: column;
                    align-items: stretch;
                }

                .stock-ingredients-manage-page .stock-ingredient-action-button,
                .stock-ingredients-manage-page .stock-ingredient-action-button-primary {
                    width: 100%;
                    flex: initial;
                }
            }
        `}</style>
    );
}
