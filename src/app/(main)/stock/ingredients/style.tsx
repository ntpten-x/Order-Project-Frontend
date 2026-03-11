"use client";

export default function IngredientsPageStyle() {
    return (
        <style>{`
            .stock-ingredient-shell {
                min-height: 100vh;
                background:
                    radial-gradient(circle at top left, rgba(14, 165, 233, 0.08), transparent 28%),
                    linear-gradient(180deg, #f8fbff 0%, #f5f7fb 48%, #f8fafc 100%);
                padding-bottom: 120px;
            }

            .stock-ingredient-hero,
            .stock-ingredient-panel,
            .stock-ingredient-card {
                border: 1px solid rgba(148, 163, 184, 0.18);
                box-shadow: 0 18px 48px rgba(15, 23, 42, 0.06);
            }

            .stock-ingredient-hero {
                background: linear-gradient(135deg, rgba(255,255,255,0.96), rgba(240,249,255,0.92));
                border-radius: 28px;
                padding: 24px;
            }

            .stock-ingredient-hero-grid {
                display: grid;
                gap: 18px;
                grid-template-columns: minmax(0, 1.65fr) minmax(280px, 0.95fr);
                align-items: start;
            }

            .stock-ingredient-eyebrow {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                border-radius: 999px;
                background: rgba(14, 165, 233, 0.12);
                color: #0369a1;
                font-size: 12px;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
            }

            .stock-ingredient-title {
                margin: 14px 0 10px;
                color: #0f172a;
                font-size: clamp(1.8rem, 1.25rem + 1.4vw, 2.7rem);
                line-height: 1.08;
            }

            .stock-ingredient-subtitle {
                margin: 0;
                color: #475569;
                font-size: 0.98rem;
                line-height: 1.7;
            }

            .stock-ingredient-side {
                display: grid;
                gap: 12px;
            }

            .stock-ingredient-side-card {
                border-radius: 22px;
                background: rgba(255, 255, 255, 0.92);
                border: 1px solid rgba(125, 211, 252, 0.3);
                padding: 18px 20px;
                display: grid;
                gap: 6px;
            }

            .stock-ingredient-side-label {
                color: #64748b;
                font-size: 13px;
            }

            .stock-ingredient-side-value {
                color: #0f172a;
                font-size: 1.45rem;
                font-weight: 700;
                letter-spacing: -0.03em;
            }

            .stock-ingredient-stat-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 12px;
            }

            .stock-ingredient-stat-card {
                padding: 18px 20px;
                border-radius: 22px;
                background: rgba(255, 255, 255, 0.9);
                border: 1px solid rgba(148, 163, 184, 0.16);
                box-shadow: 0 14px 40px rgba(15, 23, 42, 0.04);
                display: grid;
                gap: 6px;
            }

            .stock-ingredient-stat-label {
                color: #64748b;
                font-size: 13px;
            }

            .stock-ingredient-stat-value {
                color: #0f172a;
                font-size: 1.5rem;
                font-weight: 700;
                letter-spacing: -0.03em;
            }

            .stock-ingredient-panel {
                background: rgba(255,255,255,0.95);
                border-radius: 24px;
                padding: 16px;
            }

            .stock-ingredient-toolbar {
                display: grid;
                grid-template-columns: minmax(0, 1fr) minmax(240px, 280px);
                gap: 12px;
            }

            .stock-ingredient-card {
                background: rgba(255,255,255,0.98);
                border-radius: 24px;
            }

            .stock-ingredient-card-grid {
                display: grid;
                gap: 18px;
                grid-template-columns: minmax(0, 1fr) auto;
                align-items: center;
            }

            .stock-ingredient-card-main {
                display: grid;
                gap: 14px;
                grid-template-columns: auto minmax(0, 1fr);
                align-items: start;
            }

            .stock-ingredient-thumb {
                flex-shrink: 0;
            }

            .stock-ingredient-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 8px;
            }

            .stock-ingredient-badge {
                display: inline-flex;
                align-items: center;
                padding: 6px 10px;
                border-radius: 999px;
                background: #e0f2fe;
                color: #075985;
                font-size: 12px;
                font-weight: 700;
                letter-spacing: 0.04em;
                text-transform: uppercase;
            }

            .stock-ingredient-desc {
                margin: 8px 0 0;
                color: #64748b;
                line-height: 1.65;
            }

            .stock-ingredient-actions {
                display: flex;
                flex-wrap: wrap;
                justify-content: flex-end;
                gap: 8px;
            }

            .stock-ingredient-empty {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 220px;
            }

            @media (max-width: 1024px) {
                .stock-ingredient-hero-grid,
                .stock-ingredient-toolbar {
                    grid-template-columns: 1fr;
                }
            }

            @media (max-width: 768px) {
                .stock-ingredient-shell {
                    padding-bottom: 104px;
                }

                .stock-ingredient-hero {
                    padding: 20px;
                    border-radius: 24px;
                }

                .stock-ingredient-stat-grid {
                    grid-template-columns: 1fr;
                }

                .stock-ingredient-card-grid,
                .stock-ingredient-card-main {
                    grid-template-columns: 1fr;
                }

                .stock-ingredient-actions {
                    justify-content: stretch;
                }

                .stock-ingredient-actions .ant-btn {
                    flex: 1 1 160px;
                }
            }

            @media (max-width: 576px) {
                .stock-ingredient-panel,
                .stock-ingredient-card {
                    border-radius: 20px;
                }
            }
        `}</style>
    );
}
