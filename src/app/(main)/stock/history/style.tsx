"use client";

import React from "react";

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

      .stock-history-search-panel,
      .stock-history-summary-card,
      .stock-history-toolbar,
      .stock-history-feedback,
      .stock-history-card,
      .stock-history-pagination {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04);
      }

      .stock-history-header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .stock-history-search-panel {
        margin-bottom: 16px;
        border-radius: 16px;
        padding: 4px 16px;
        animation: stockHistoryFadeInUp 0.2s ease;
      }

      .stock-history-search-panel .ant-input,
      .stock-history-search-panel .ant-input-affix-wrapper {
        border: none !important;
        box-shadow: none !important;
        background: transparent !important;
      }

      .stock-history-summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }

      .stock-history-summary-card {
        border-radius: 18px;
        padding: 16px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .stock-history-summary-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
      }

      .stock-history-summary-label {
        display: block;
        margin-bottom: 6px;
        color: #64748b;
        font-size: 13px;
      }

      .stock-history-summary-value {
        display: block;
        color: #0f172a;
        font-size: 24px;
        line-height: 1.2;
        font-weight: 700;
      }

      .stock-history-summary-meta {
        display: block;
        margin-top: 6px;
        color: #94a3b8;
        font-size: 12px;
      }

      .stock-history-tab-row {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        overflow-x: auto;
        padding-bottom: 4px;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .stock-history-tab-row::-webkit-scrollbar {
        display: none;
      }

      .stock-history-tab-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 44px;
        padding: 10px 18px;
        border-radius: 14px;
        border: 1px solid #e2e8f0;
        background: #ffffff;
        color: #475569;
        font-size: 14px;
        font-weight: 600;
        white-space: nowrap;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
      }

      .stock-history-tab-btn:hover {
        transform: translateY(-1px);
      }

      .stock-history-tab-btn:active {
        transform: scale(0.98);
      }

      .stock-history-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px;
        margin-bottom: 16px;
        border-radius: 16px;
      }

      .stock-history-toolbar-right {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .stock-history-segmented {
        background: #f1f5f9;
        padding: 4px;
        border-radius: 14px;
      }

      .stock-history-segmented .ant-segmented-item {
        min-height: 36px;
        border-radius: 10px;
        font-weight: 600;
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

      .stock-history-pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 16px;
        padding: 14px 16px;
        border-radius: 16px;
      }

      .stock-history-pagination-summary {
        color: #64748b;
        font-size: 13px;
      }

      @media screen and (max-width: 1200px) {
        .stock-history-summary-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media screen and (max-width: 768px) {
        .stock-history-page-shell {
          padding-bottom: 96px;
        }

        .stock-history-header-actions,
        .stock-history-toolbar,
        .stock-history-toolbar-right,
        .stock-history-card-head,
        .stock-history-card-main,
        .stock-history-card-foot,
        .stock-history-pagination {
          flex-direction: column;
          align-items: stretch;
        }

        .stock-history-summary-grid {
          grid-template-columns: 1fr 1fr;
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
        .stock-history-summary-grid {
          grid-template-columns: 1fr;
        }

        .stock-history-card-actions .ant-btn {
          flex-basis: 100%;
        }
      }
    `}</style>
  );
}
