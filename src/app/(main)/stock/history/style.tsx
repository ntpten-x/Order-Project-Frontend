"use client";

export default function HistoryPageStyle() {
  return (
    <style jsx global>{`
      @keyframes stockHistoryFadeInUp {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .stock-history-page-shell {
        min-height: 100dvh;
        background: #f8fafc;
        padding-bottom: 120px;
      }

      .stock-history-feedback,
      .stock-history-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04);
      }

      .stock-history-header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .stock-history-feedback {
        margin-bottom: 14px;
        border-radius: 14px;
        padding: 12px 14px;
      }

      .stock-history-feedback-danger {
        color: #b91c1c;
        background: #fef2f2;
        border-color: #fecaca;
      }

      .stock-history-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .stock-history-card {
        border-radius: 18px;
        padding: 16px;
        animation: stockHistoryFadeInUp 0.35s ease both;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .stock-history-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
      }

      .stock-history-card-head,
      .stock-history-card-main,
      .stock-history-card-main-left,
      .stock-history-card-main-right,
      .stock-history-card-foot,
      .stock-history-card-metrics,
      .stock-history-meta-row,
      .stock-history-item-chips,
      .stock-history-card-actions {
        display: flex;
      }

      .stock-history-card-head,
      .stock-history-card-foot {
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .stock-history-card-main {
        justify-content: space-between;
        gap: 16px;
        margin-top: 14px;
      }

      .stock-history-card-main-left,
      .stock-history-card-main-right {
        flex-direction: column;
        gap: 10px;
      }

      .stock-history-card-main-left {
        flex: 1;
        min-width: 0;
      }

      .stock-history-card-main-right {
        min-width: 180px;
        align-items: flex-end;
      }

      .stock-history-card-title {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .stock-history-card-code {
        font-size: 16px;
        font-weight: 700;
        color: #0f172a;
      }

      .stock-history-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
      }

      .stock-history-status-dot {
        width: 6px;
        height: 6px;
        border-radius: 999px;
        display: inline-block;
      }

      .stock-history-meta-row,
      .stock-history-card-metrics,
      .stock-history-item-chips,
      .stock-history-card-actions {
        flex-wrap: wrap;
        gap: 8px;
      }

      .stock-history-meta-row {
        color: #64748b;
        font-size: 13px;
      }

      .stock-history-meta-row span,
      .stock-history-card-metrics span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .stock-history-card-metrics span {
        padding: 6px 10px;
        border-radius: 10px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        color: #475569;
        font-size: 12px;
        font-weight: 600;
      }

      .stock-history-item-chip {
        margin-inline-end: 0;
        padding-inline: 10px;
        border-radius: 999px;
        background: #f8fafc;
        border: 1px solid #dbeafe;
        color: #334155;
        font-weight: 600;
      }

      .stock-history-remark {
        width: 100%;
        padding: 12px 14px;
        border-radius: 14px;
        background: #f8fafc;
        color: #475569;
      }

      .stock-history-remark-title {
        display: block;
        margin-bottom: 4px;
        color: #94a3b8;
        font-size: 12px;
        font-weight: 600;
      }

      .stock-history-card-actions {
        justify-content: flex-end;
      }

      .stock-history-card-actions .ant-btn {
        border-radius: 12px;
        font-weight: 600;
      }

      @media screen and (max-width: 768px) {
        .stock-history-page-shell {
          padding-bottom: 96px;
        }

        .stock-history-header-actions,
        .stock-history-card-head,
        .stock-history-card-main,
        .stock-history-card-foot {
          flex-direction: column;
          align-items: stretch;
        }

        .stock-history-card-main-right {
          min-width: 0;
          align-items: flex-start;
        }

        .stock-history-card-actions {
          justify-content: stretch;
        }

        .stock-history-card-actions .ant-btn {
          flex: 1 1 calc(50% - 6px);
        }
      }

      @media screen and (max-width: 576px) {
        .stock-history-card-actions .ant-btn {
          flex-basis: 100%;
        }
      }
    `}</style>
  );
}
