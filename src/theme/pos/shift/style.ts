
import { CSSProperties } from 'react';
import { posColors } from '../index';

// ============ STYLES ============

export const pageStyles = {
    container: {
        paddingBottom: 100,
        backgroundColor: posColors.background,
        minHeight: '100dvh',
        fontFamily:
            "var(--font-sans), 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    } as CSSProperties,
};

export const globalStyles = `
    /* ═══════════════════════════════════════════
       Shift Page – Clean Modern Design
       ═══════════════════════════════════════════ */

    .shift-page-content {
        max-width: 960px;
        margin: 0 auto;
    }

    /* ── Status Banner ── */
    .shift-status-banner {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 18px 20px;
        border-radius: 16px;
        border: 1px solid #d1fae5;
        background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    }

    .shift-status-icon {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: linear-gradient(135deg, #10b981, #059669);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: #fff;
        font-size: 22px;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
    }

    .shift-status-text {
        flex: 1;
        min-width: 0;
    }

    .shift-status-text .status-label {
        font-size: 16px;
        font-weight: 700;
        color: #065f46;
        margin: 0;
        line-height: 1.3;
    }

    .shift-status-text .status-sub {
        font-size: 13px;
        color: #047857;
        margin-top: 2px;
    }

    /* ── Info Grid ── */
    .shift-info-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
    }

    .shift-info-item {
        padding: 14px 16px;
        border-radius: 14px;
        background: #fff;
        border: 1px solid #e2e8f0;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .shift-info-item:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }

    .shift-info-item .info-label {
        font-size: 12px;
        color: #94a3b8;
        font-weight: 500;
        margin-bottom: 4px;
    }

    .shift-info-item .info-value {
        font-size: 15px;
        font-weight: 700;
        color: #1e293b;
        line-height: 1.3;
        word-break: break-word;
    }

    /* ── Metric Cards ── */
    .shift-metric-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }

    .shift-metric-card {
        padding: 16px;
        border-radius: 14px;
        background: #fff;
        border: 1px solid #e2e8f0;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        position: relative;
        overflow: hidden;
    }

    .shift-metric-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }

    .shift-metric-card .metric-icon-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    }

    .shift-metric-card .metric-icon-box {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        flex-shrink: 0;
    }

    .shift-metric-card .metric-label {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
    }

    .shift-metric-card .metric-value {
        font-size: 22px;
        font-weight: 800;
        line-height: 1.2;
        letter-spacing: -0.02em;
    }

    /* ── Payment Method Cards ── */
    .shift-payment-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }

    .shift-payment-card {
        padding: 14px 16px;
        border-radius: 12px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        transition: background 0.15s ease;
    }

    .shift-payment-card:hover {
        background: #f1f5f9;
    }

    .shift-payment-card .payment-method {
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
        margin-bottom: 4px;
    }

    .shift-payment-card .payment-value {
        font-size: 18px;
        font-weight: 700;
        color: #0f172a;
    }

    /* ── Top Products ── */
    .shift-top-products {
        display: grid;
        gap: 8px;
    }

    .shift-product-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        border-radius: 12px;
        background: #fff;
        border: 1px solid #e2e8f0;
        transition: background 0.15s ease, transform 0.15s ease;
        gap: 12px;
    }

    .shift-product-row:hover {
        background: #f8fafc;
        transform: translateX(2px);
    }

    .shift-product-left {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
        flex: 1;
    }

    .shift-product-rank {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 800;
        flex-shrink: 0;
    }

    .shift-product-rank.rank-1 {
        background: linear-gradient(135deg, #fef3c7, #fde68a);
        color: #92400e;
    }

    .shift-product-rank.rank-2 {
        background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
        color: #475569;
    }

    .shift-product-rank.rank-3 {
        background: linear-gradient(135deg, #fed7aa, #fdba74);
        color: #9a3412;
    }

    .shift-product-rank.rank-other {
        background: #f1f5f9;
        color: #64748b;
    }

    .shift-product-info {
        min-width: 0;
    }

    .shift-product-name {
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
        line-height: 1.3;
    }

    .shift-product-qty {
        font-size: 12px;
        color: #94a3b8;
        margin-top: 1px;
    }

    .shift-product-revenue {
        font-size: 15px;
        font-weight: 700;
        color: #0f172a;
        flex-shrink: 0;
    }

    /* ── Empty State ── */
    .shift-empty-box {
        text-align: center;
        padding: 48px 20px;
        border-radius: 16px;
        background: #f8fafc;
        border: 2px dashed #e2e8f0;
    }

    .shift-empty-icon {
        width: 64px;
        height: 64px;
        border-radius: 20px;
        background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
        font-size: 28px;
        color: #6366f1;
    }

    .shift-empty-title {
        font-size: 17px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 6px;
    }

    .shift-empty-desc {
        font-size: 14px;
        color: #64748b;
    }

    /* ── Alert Box ── */
    .shift-alert-box {
        margin-top: 12px;
        border-radius: 12px;
        border: 1px solid #fecaca;
        background: linear-gradient(135deg, #fef2f2, #fee2e2);
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .shift-alert-box .alert-icon {
        color: #ef4444;
        font-size: 16px;
        flex-shrink: 0;
    }

    .shift-alert-box .alert-text {
        color: #991b1b;
        font-size: 13px;
        font-weight: 500;
    }

    /* ═══════════════════════════════════════════
       RESPONSIVE
       ═══════════════════════════════════════════ */

    @media (max-width: 767px) {
        .shift-info-grid {
            grid-template-columns: 1fr;
        }

        .shift-metric-grid {
            grid-template-columns: 1fr;
        }

        .shift-payment-grid {
            grid-template-columns: 1fr;
        }

        .shift-status-banner {
            padding: 14px 16px;
        }

        .shift-metric-card .metric-value {
            font-size: 20px;
        }
    }

    @media (min-width: 768px) and (max-width: 1023px) {
        .shift-info-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .shift-metric-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (min-width: 1024px) {
        .shift-metric-grid {
            grid-template-columns: repeat(3, 1fr);
        }

        .shift-info-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }
`;
