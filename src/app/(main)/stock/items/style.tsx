'use client';

import React from 'react';

export default function ItemsPageStyle() {
  return (
    <style jsx global>{`
      @keyframes stockItemsFadeInUp {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .stock-items-page-shell {
        min-height: 100vh;
        background: #f8fafc;
        padding-bottom: 120px;
      }

      .stock-items-search-panel,
      .stock-items-summary-card,
      .stock-items-toolbar,
      .stock-items-feedback,
      .stock-items-card,
      .stock-items-pagination {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04);
      }

      .stock-items-header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .stock-items-search-panel {
        margin-bottom: 16px;
        border-radius: 16px;
        padding: 4px 16px;
        animation: stockItemsFadeInUp 0.2s ease;
      }

      .stock-items-search-panel .ant-input,
      .stock-items-search-panel .ant-input-affix-wrapper {
        border: none !important;
        box-shadow: none !important;
        background: transparent !important;
      }

      .stock-items-summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }

      .stock-items-summary-card {
        border-radius: 18px;
        padding: 16px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .stock-items-summary-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
      }

      .stock-items-summary-label {
        display: block;
        margin-bottom: 6px;
        color: #64748b;
        font-size: 13px;
      }

      .stock-items-summary-value {
        display: block;
        color: #0f172a;
        font-size: 24px;
        line-height: 1.2;
        font-weight: 700;
      }

      .stock-items-summary-meta {
        display: block;
        margin-top: 6px;
        color: #94a3b8;
        font-size: 12px;
      }

      .stock-items-tab-row {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        overflow-x: auto;
        padding-bottom: 4px;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .stock-items-tab-row::-webkit-scrollbar {
        display: none;
      }

      .stock-items-tab-btn {
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

      .stock-items-tab-btn:hover {
        transform: translateY(-1px);
      }

      .stock-items-tab-btn:active {
        transform: scale(0.98);
      }

      .stock-items-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px;
        margin-bottom: 16px;
        border-radius: 16px;
      }

      .stock-items-toolbar-right {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .stock-items-segmented {
        background: #f1f5f9;
        padding: 4px;
        border-radius: 14px;
      }

      .stock-items-segmented .ant-segmented-item {
        min-height: 36px;
        border-radius: 10px;
        font-weight: 600;
      }

      .stock-items-feedback {
        margin-bottom: 14px;
        border-radius: 14px;
        padding: 12px 14px;
      }

      .stock-items-feedback-danger {
        color: #b91c1c;
        background: #fef2f2;
        border-color: #fecaca;
      }

      .stock-items-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .stock-items-card {
        border-radius: 18px;
        padding: 16px;
        animation: stockItemsFadeInUp 0.35s ease both;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .stock-items-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
      }

      .stock-items-card-head,
      .stock-items-card-foot,
      .stock-items-card-main,
      .stock-items-card-main-left,
      .stock-items-card-main-right,
      .stock-items-card-metrics {
        display: flex;
      }

      .stock-items-card-head,
      .stock-items-card-foot {
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }

      .stock-items-card-main {
        justify-content: space-between;
        gap: 16px;
        margin-top: 14px;
      }

      .stock-items-card-main-left,
      .stock-items-card-main-right {
        flex-direction: column;
        gap: 10px;
      }

      .stock-items-card-main-left {
        flex: 1;
        min-width: 0;
      }

      .stock-items-card-main-right {
        min-width: 180px;
        align-items: flex-end;
      }

      .stock-items-card-title {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .stock-items-card-code {
        font-size: 16px;
        font-weight: 700;
        color: #0f172a;
      }

      .stock-items-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
      }

      .stock-items-status-dot {
        width: 6px;
        height: 6px;
        border-radius: 999px;
        display: inline-block;
      }

      .stock-items-meta-row,
      .stock-items-card-metrics,
      .stock-items-item-chips,
      .stock-items-card-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .stock-items-meta-row {
        color: #64748b;
        font-size: 13px;
      }

      .stock-items-meta-row span,
      .stock-items-card-metrics span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .stock-items-card-metrics span {
        padding: 6px 10px;
        border-radius: 10px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        color: #475569;
        font-size: 12px;
        font-weight: 600;
      }

      .stock-items-item-chip {
        margin-inline-end: 0;
        padding-inline: 10px;
        border-radius: 999px;
        background: #f8fafc;
        border: 1px solid #dbeafe;
        color: #334155;
        font-weight: 600;
      }

      .stock-items-remark {
        width: 100%;
        padding: 12px 14px;
        border-radius: 14px;
        background: #f8fafc;
        color: #475569;
      }

      .stock-items-remark-title {
        display: block;
        margin-bottom: 4px;
        color: #94a3b8;
        font-size: 12px;
        font-weight: 600;
      }

      .stock-items-card-actions {
        justify-content: flex-end;
      }

      .stock-items-card-actions .ant-btn {
        border-radius: 12px;
        font-weight: 600;
      }

      .stock-items-pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 16px;
        padding: 14px 16px;
        border-radius: 16px;
      }

      .stock-items-pagination-summary {
        color: #64748b;
        font-size: 13px;
      }

      @media screen and (max-width: 1200px) {
        .stock-items-summary-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media screen and (max-width: 768px) {
        .stock-items-page-shell {
          padding-bottom: 96px;
        }

        .stock-items-header-actions,
        .stock-items-toolbar,
        .stock-items-toolbar-right,
        .stock-items-card-head,
        .stock-items-card-main,
        .stock-items-card-foot,
        .stock-items-pagination {
          flex-direction: column;
          align-items: stretch;
        }

        .stock-items-summary-grid {
          grid-template-columns: 1fr 1fr;
        }

        .stock-items-card-main-right {
          min-width: 0;
          align-items: flex-start;
        }

        .stock-items-card-actions {
          justify-content: stretch;
        }

        .stock-items-card-actions .ant-btn {
          flex: 1 1 calc(50% - 6px);
        }
      }

      @media screen and (max-width: 576px) {
        .stock-items-summary-grid {
          grid-template-columns: 1fr;
        }

        .stock-items-card-actions .ant-btn {
          flex-basis: 100%;
        }
      }
    `}</style>
  );
}
