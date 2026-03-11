"use client";

export default function IngredientsUnitManageStyle() {
    return (
        <style jsx global>{`
            .stock-unit-manage-shell {
                min-height: 100vh;
                padding-bottom: 132px;
                background:
                    radial-gradient(circle at top right, rgba(34, 197, 94, 0.1), transparent 20%),
                    radial-gradient(circle at top left, rgba(22, 119, 255, 0.08), transparent 22%),
                    linear-gradient(180deg, #f8fbff 0%, #f4f7fb 100%);
            }

            .stock-unit-manage-hero,
            .stock-unit-manage-panel,
            .stock-unit-manage-preview,
            .stock-unit-manage-actions {
                background: rgba(255, 255, 255, 0.94);
                border: 1px solid rgba(148, 163, 184, 0.18);
                box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
                backdrop-filter: blur(12px);
            }

            .stock-unit-manage-hero {
                border-radius: 28px;
                padding: 24px;
            }

            .stock-unit-manage-grid {
                display: grid;
                grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
                gap: 16px;
                align-items: start;
            }

            .stock-unit-manage-title {
                margin: 0;
                color: #0f172a;
                font-size: clamp(24px, 4vw, 34px);
                line-height: 1.1;
                font-weight: 800;
            }

            .stock-unit-manage-subtitle {
                margin: 8px 0 0;
                max-width: 720px;
                color: #475569;
                line-height: 1.7;
                font-size: 14px;
            }

            .stock-unit-manage-eyebrow {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                width: fit-content;
                margin-bottom: 12px;
                padding: 8px 12px;
                border-radius: 999px;
                background: rgba(15, 23, 42, 0.06);
                color: #334155;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.04em;
            }

            .stock-unit-manage-preview {
                border-radius: 24px;
                padding: 18px;
            }

            .stock-unit-manage-preview-key {
                color: #64748b;
                font-size: 12px;
            }

            .stock-unit-manage-preview-value {
                color: #0f172a;
                font-size: 22px;
                font-weight: 800;
                line-height: 1.2;
            }

            .stock-unit-manage-panel {
                border-radius: 24px;
                padding: 20px;
            }

            .stock-unit-manage-panel .ant-form-item {
                margin-bottom: 18px;
            }

            .stock-unit-manage-panel .ant-form-item:last-child {
                margin-bottom: 0;
            }

            .stock-unit-manage-panel .ant-input,
            .stock-unit-manage-panel .ant-input-affix-wrapper {
                border-radius: 16px;
                min-height: 48px;
            }

            .stock-unit-manage-panel .ant-input:focus,
            .stock-unit-manage-panel .ant-input-focused,
            .stock-unit-manage-panel .ant-input-affix-wrapper-focused {
                border-color: #1677ff;
                box-shadow: 0 0 0 4px rgba(22, 119, 255, 0.12);
            }

            .stock-unit-manage-actions {
                position: sticky;
                bottom: 16px;
                z-index: 20;
                display: flex;
                justify-content: space-between;
                gap: 12px;
                margin-top: 4px;
                padding: 14px;
                border-radius: 22px;
            }

            .stock-unit-manage-actions-left,
            .stock-unit-manage-actions-right {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }

            @media (max-width: 992px) {
                .stock-unit-manage-grid {
                    grid-template-columns: 1fr;
                }
            }

            @media (max-width: 640px) {
                .stock-unit-manage-shell {
                    padding-bottom: 110px;
                }

                .stock-unit-manage-hero,
                .stock-unit-manage-panel,
                .stock-unit-manage-preview,
                .stock-unit-manage-actions {
                    border-radius: 22px;
                    padding: 16px;
                }

                .stock-unit-manage-actions {
                    position: static;
                    flex-direction: column;
                }

                .stock-unit-manage-actions-left,
                .stock-unit-manage-actions-right {
                    width: 100%;
                }

                .stock-unit-manage-actions .ant-btn {
                    flex: 1 1 100%;
                }
            }
        `}</style>
    );
}
