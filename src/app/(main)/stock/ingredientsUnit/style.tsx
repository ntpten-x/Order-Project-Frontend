"use client";

export default function IngredientsUnitPageStyle() {
    return (
        <style jsx global>{`
            .stock-unit-shell {
                min-height: 100vh;
                padding-bottom: 120px;
                background:
                    radial-gradient(circle at top left, rgba(22, 119, 255, 0.09), transparent 24%),
                    linear-gradient(180deg, #f8fbff 0%, #f4f7fb 100%);
            }

            .stock-unit-hero,
            .stock-unit-panel,
            .stock-unit-card {
                background: rgba(255, 255, 255, 0.92);
                border: 1px solid rgba(148, 163, 184, 0.18);
                box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
                backdrop-filter: blur(12px);
            }

            .stock-unit-hero {
                border-radius: 28px;
                padding: 24px;
            }

            .stock-unit-hero-grid {
                display: grid;
                grid-template-columns: minmax(0, 1.45fr) minmax(260px, 0.85fr);
                gap: 16px;
                align-items: start;
            }

            .stock-unit-hero-copy {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .stock-unit-eyebrow {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                width: fit-content;
                padding: 7px 12px;
                border-radius: 999px;
                background: rgba(22, 119, 255, 0.1);
                color: #1668dc;
                font-size: 12px;
                font-weight: 700;
                letter-spacing: 0.04em;
                text-transform: uppercase;
            }

            .stock-unit-title {
                margin: 0;
                color: #0f172a;
                font-size: clamp(24px, 4vw, 34px);
                line-height: 1.1;
                font-weight: 800;
            }

            .stock-unit-subtitle {
                margin: 0;
                max-width: 700px;
                color: #475569;
                font-size: 14px;
                line-height: 1.7;
            }

            .stock-unit-hero-side {
                display: grid;
                gap: 12px;
            }

            .stock-unit-side-card {
                border-radius: 20px;
                padding: 16px;
                background: linear-gradient(135deg, rgba(248, 250, 252, 0.96), rgba(255, 255, 255, 0.96));
                border: 1px solid rgba(148, 163, 184, 0.16);
            }

            .stock-unit-side-label {
                display: block;
                margin-bottom: 6px;
                color: #64748b;
                font-size: 12px;
            }

            .stock-unit-side-value {
                color: #0f172a;
                font-size: 20px;
                font-weight: 800;
            }

            .stock-unit-panel {
                border-radius: 24px;
                padding: 20px;
            }

            .stock-unit-toolbar {
                display: grid;
                grid-template-columns: minmax(0, 1.3fr) minmax(220px, 0.7fr);
                gap: 12px;
                align-items: center;
            }

            .stock-unit-stat-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 12px;
            }

            .stock-unit-stat-card {
                border-radius: 22px;
                padding: 18px;
                background: #ffffff;
                border: 1px solid rgba(148, 163, 184, 0.18);
                box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
            }

            .stock-unit-stat-label {
                display: block;
                margin-bottom: 8px;
                color: #64748b;
                font-size: 12px;
            }

            .stock-unit-stat-value {
                color: #0f172a;
                font-size: 24px;
                font-weight: 800;
                line-height: 1;
            }

            .stock-unit-card {
                border-radius: 22px;
                overflow: hidden;
                transition: transform 0.18s ease, box-shadow 0.18s ease;
            }

            .stock-unit-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 22px 36px rgba(15, 23, 42, 0.08);
            }

            .stock-unit-card .ant-card-body {
                padding: 18px;
            }

            .stock-unit-card-grid {
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                gap: 16px;
                align-items: center;
            }

            .stock-unit-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                width: fit-content;
                padding: 8px 12px;
                border-radius: 999px;
                background: #eef4ff;
                color: #1d4ed8;
                font-size: 12px;
                font-weight: 700;
            }

            .stock-unit-actions {
                display: flex;
                justify-content: flex-end;
                gap: 8px;
                flex-wrap: wrap;
            }

            .stock-unit-list-empty {
                padding: 28px 12px 8px;
            }

            @media (max-width: 992px) {
                .stock-unit-hero-grid,
                .stock-unit-toolbar,
                .stock-unit-card-grid {
                    grid-template-columns: 1fr;
                }

                .stock-unit-stat-grid {
                    grid-template-columns: 1fr;
                }

                .stock-unit-actions {
                    justify-content: stretch;
                }

                .stock-unit-actions .ant-btn {
                    flex: 1 1 180px;
                }
            }

            @media (max-width: 576px) {
                .stock-unit-shell {
                    padding-bottom: 104px;
                }

                .stock-unit-hero,
                .stock-unit-panel {
                    border-radius: 22px;
                    padding: 16px;
                }

                .stock-unit-card .ant-card-body {
                    padding: 16px;
                }

                .stock-unit-title {
                    font-size: 24px;
                }
            }
        `}</style>
    );
}
