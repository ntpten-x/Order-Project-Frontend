import { CSSProperties } from 'react';
import { tokens } from "../sharedStyles";

const base = {
    container: {
        paddingBottom: 100,
        backgroundColor: tokens.colors.bg,
        minHeight: '100dvh',
        width: '100%',
        overflowX: 'hidden',
    } as CSSProperties,
};

export const pageStyles = {
    ...base,
    shiftCard: (): CSSProperties => ({
        marginBottom: 0,
        borderRadius: 16,
        border: `1px solid ${tokens.colors.border}`,
        boxShadow: tokens.shadow.sm,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        background: tokens.colors.card,
    }),
    shiftCardInner: {
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    } as CSSProperties,
};

export const globalStyles = `
    /* ═══════════════════════════════════════════
       Shift History – Clean Modern Design
       ═══════════════════════════════════════════ */

    .shift-history-page {
        font-family: var(--font-sans), 'Sarabun', -apple-system, sans-serif;
    }

    /* ── History Card ── */
    .shift-history-card {
        border-radius: 16px !important;
        border: 1px solid #e2e8f0 !important;
        background: #fff !important;
        transition: transform 0.15s ease, box-shadow 0.15s ease !important;
        overflow: hidden;
    }

    .shift-history-card:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08) !important;
    }

    .shift-card-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
        flex-wrap: wrap;
    }

    .shift-card-id {
        font-size: 15px;
        font-weight: 700;
        color: #0f172a;
    }

    .shift-card-meta {
        display: grid;
        gap: 4px;
    }

    .shift-card-meta-row {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        font-size: 13px;
        color: #64748b;
        min-width: 0;
    }

    .shift-card-meta-row > span {
        min-width: 0;
        overflow-wrap: anywhere;
    }

    .shift-card-meta-row .meta-icon {
        font-size: 12px;
        color: #94a3b8;
        flex-shrink: 0;
    }

    /* ── Mini Metrics ── */
    .shift-mini-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 8px;
        margin-top: 12px;
    }

    .mini-metric {
        padding: 10px 12px;
        border-radius: 10px;
        background: #f8fafc;
        border: 1px solid #f1f5f9;
        transition: background 0.15s ease;
    }

    .mini-metric:hover {
        background: #f1f5f9;
    }

    .mini-metric .mini-label {
        font-size: 11px;
        color: #94a3b8;
        font-weight: 500;
    }

    .mini-metric .mini-value {
        font-size: 15px;
        font-weight: 700;
        margin-top: 2px;
        line-height: 1.3;
    }

    /* ── View Summary Button ── */
    .shift-view-btn.ant-btn {
        border-radius: 10px;
        font-weight: 600;
        height: 36px;
        font-size: 13px;
        flex-shrink: 0;
    }

    /* ── Date Modal ── */
    .custom-date-section {
        background: #f8fafc;
        border-radius: 16px;
        padding: 16px;
        border: 1px solid #e2e8f0;
    }

    /* ── Scrollbar ── */
    .shift-history-page *::-webkit-scrollbar {
        width: 5px;
        height: 5px;
    }

    .shift-history-page *::-webkit-scrollbar-track {
        background: transparent;
    }

    .shift-history-page *::-webkit-scrollbar-thumb {
        background: #CBD5E1;
        border-radius: 3px;
    }

    /* ═══════════════════════════════════════════
       RESPONSIVE
       ═══════════════════════════════════════════ */
    @media (max-width: 576px) {
        .shift-history-card .ant-btn {
            width: 100%;
        }

        .shift-history-card > div {
            align-items: stretch !important;
            flex-direction: column !important;
        }

        .ant-picker-range-wrapper {
            flex-direction: column !important;
        }
        .ant-picker-panels {
            flex-direction: column !important;
        }
        .ant-picker-panel-container {
            max-width: 100vw !important;
        }
        .ant-modal {
            margin: 8px auto !important;
        }

        .shift-mini-metrics {
            grid-template-columns: repeat(2, 1fr);
        }

        .mobile-datepicker-dropdown .ant-picker-panel-container {
            max-width: 90vw !important;
            overflow: hidden !important;
        }
        .mobile-datepicker-dropdown .ant-picker-datetime-panel {
            display: flex !important;
            flex-direction: column !important;
        }
        .mobile-datepicker-dropdown .ant-picker-panel {
            width: auto !important;
            min-width: unset !important;
        }
        .mobile-datepicker-dropdown .ant-picker-date-panel,
        .mobile-datepicker-dropdown .ant-picker-time-panel,
        .mobile-datepicker-dropdown .ant-picker-month-panel,
        .mobile-datepicker-dropdown .ant-picker-year-panel,
        .mobile-datepicker-dropdown .ant-picker-decade-panel {
            width: 100% !important;
            min-width: unset !important;
            max-width: 90vw !important;
        }
        .mobile-datepicker-dropdown .ant-picker-content {
            width: 100% !important;
        }
        .mobile-datepicker-dropdown .ant-picker-time-panel {
            border-left: none !important;
            border-top: 1px solid #f0f0f0 !important;
            height: 250px !important;
        }
        .mobile-datepicker-dropdown .ant-picker-time-panel-column {
            height: 100% !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch;
        }
        .mobile-datepicker-dropdown .ant-picker-time-panel-column > li {
            padding: 8px 0 !important;
        }
    }

    .datepicker-fix, .mobile-datepicker-dropdown {
        position: absolute !important;
        top: 100% !important;
        left: 0 !important;
        display: block !important;
        inset: auto !important;
        transform: none !important;
        z-index: 2000 !important;
    }
`;
