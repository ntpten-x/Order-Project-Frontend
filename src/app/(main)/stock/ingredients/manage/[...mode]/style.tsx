"use client";

export default function IngredientsManageStyle() {
    return (
        <style>{`
            .stock-ingredient-manage-shell {
                min-height: 100vh;
                background:
                    radial-gradient(circle at top right, rgba(34, 197, 94, 0.09), transparent 28%),
                    linear-gradient(180deg, #f8fbff 0%, #f5f7fb 55%, #f8fafc 100%);
                padding-bottom: 112px;
            }

            .stock-ingredient-manage-hero,
            .stock-ingredient-manage-panel,
            .stock-ingredient-manage-preview {
                border: 1px solid rgba(148, 163, 184, 0.18);
                box-shadow: 0 18px 48px rgba(15, 23, 42, 0.06);
            }

            .stock-ingredient-manage-hero {
                background: linear-gradient(135deg, rgba(255,255,255,0.96), rgba(240,253,244,0.95));
                border-radius: 28px;
                padding: 24px;
            }

            .stock-ingredient-manage-grid {
                display: grid;
                gap: 18px;
                grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.95fr);
                align-items: start;
            }

            .stock-ingredient-manage-eyebrow {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                border-radius: 999px;
                background: rgba(34, 197, 94, 0.12);
                color: #15803d;
                font-size: 12px;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
            }

            .stock-ingredient-manage-title {
                margin: 14px 0 10px;
                color: #0f172a;
                font-size: clamp(1.7rem, 1.25rem + 1.2vw, 2.4rem);
                line-height: 1.1;
            }

            .stock-ingredient-manage-subtitle {
                margin: 0;
                color: #475569;
                line-height: 1.7;
            }

            .stock-ingredient-manage-preview {
                border-radius: 22px;
                background: rgba(255,255,255,0.96);
                padding: 18px;
                display: grid;
                gap: 12px;
            }

            .stock-ingredient-manage-preview-key {
                color: #64748b;
                font-size: 12px;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
            }

            .stock-ingredient-manage-preview-row {
                display: grid;
                grid-template-columns: auto minmax(0, 1fr);
                gap: 12px;
                align-items: center;
            }

            .stock-ingredient-manage-preview-value {
                color: #0f172a;
                font-size: 1.2rem;
                font-weight: 700;
            }

            .stock-ingredient-manage-panel {
                background: rgba(255,255,255,0.97);
                border-radius: 26px;
                padding: 22px;
            }

            .stock-ingredient-manage-panel .ant-form-item {
                margin-bottom: 18px;
            }

            .stock-ingredient-manage-panel .ant-form-item-label > label {
                color: #0f172a;
                font-weight: 600;
            }

            .stock-ingredient-manage-panel .ant-input,
            .stock-ingredient-manage-panel .ant-input-affix-wrapper {
                border-radius: 14px;
                min-height: 48px;
            }

            .stock-ingredient-manage-panel textarea.ant-input {
                min-height: 120px;
            }

            .stock-ingredient-manage-actions {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                flex-wrap: wrap;
            }

            .stock-ingredient-manage-actions-left,
            .stock-ingredient-manage-actions-right {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }

            @media (max-width: 1024px) {
                .stock-ingredient-manage-grid {
                    grid-template-columns: 1fr;
                }
            }

            @media (max-width: 768px) {
                .stock-ingredient-manage-shell {
                    padding-bottom: 96px;
                }

                .stock-ingredient-manage-hero,
                .stock-ingredient-manage-panel {
                    padding: 20px;
                    border-radius: 22px;
                }

                .stock-ingredient-manage-actions {
                    flex-direction: column-reverse;
                }

                .stock-ingredient-manage-actions-left,
                .stock-ingredient-manage-actions-right {
                    width: 100%;
                }

                .stock-ingredient-manage-actions .ant-btn {
                    flex: 1 1 100%;
                }
            }
        `}</style>
    );
}
