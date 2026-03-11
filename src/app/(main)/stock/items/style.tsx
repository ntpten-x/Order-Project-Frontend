'use client';

import React from 'react';

export default function ItemsPageStyle() {
  return (
    <style jsx global>{`
      .stock-items-page-shell {
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, rgba(14, 165, 233, 0.08), transparent 24%),
          linear-gradient(180deg, #f8fbff 0%, #f3f6fb 100%);
        padding-bottom: 120px;
      }

      .stock-items-hero {
        display: grid;
        grid-template-columns: minmax(0, 1.05fr) minmax(0, 1.2fr);
        gap: 18px;
        align-items: start;
      }

      .stock-items-hero-copy,
      .stock-items-table-wrap,
      .stock-items-empty-card,
      .stock-items-card,
      .stock-items-toolbar,
      .stock-items-pagination,
      .stock-items-refresh-error {
        border: 1px solid rgba(148, 163, 184, 0.18);
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
      }

      .stock-items-hero-copy,
      .stock-items-toolbar,
      .stock-items-pagination,
      .stock-items-refresh-error {
        background: rgba(255, 255, 255, 0.88);
        backdrop-filter: blur(16px);
        border-radius: 24px;
      }

      .stock-items-hero-copy {
        padding: 24px;
      }

      .stock-items-toolbar {
        padding: 16px;
        display: grid;
        gap: 12px;
        margin-bottom: 14px;
      }

      .stock-items-toolbar-main,
      .stock-items-toolbar-secondary {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
      }

      .stock-items-search {
        min-width: 280px;
        flex: 1 1 360px;
      }

      .stock-items-segmented {
        background: #eef2ff;
        padding: 4px;
        border-radius: 16px;
      }

      .stock-items-segmented .ant-segmented-item {
        border-radius: 12px;
        min-height: 38px;
        display: inline-flex;
        align-items: center;
        font-weight: 600;
      }

      .stock-items-segmented-compact .ant-segmented-item {
        min-height: 34px;
        font-size: 13px;
      }

      .stock-items-table-wrap {
        background: rgba(255, 255, 255, 0.92);
        border-radius: 24px;
        overflow: hidden;
      }

      .items-table .ant-table {
        background: transparent !important;
      }

      .items-table .ant-table-thead > tr > th {
        background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%) !important;
        border-bottom: 1px solid #e2e8f0 !important;
        color: #0f172a !important;
        font-size: 13px;
        font-weight: 700;
        padding: 16px 14px;
      }

      .items-table .ant-table-tbody > tr > td {
        padding: 18px 14px;
        vertical-align: top;
        border-bottom: 1px solid #eef2f7;
        transition: background 0.2s ease;
      }

      .items-table .ant-table-tbody > tr:hover > td {
        background: rgba(241, 245, 249, 0.74) !important;
      }

      .stock-items-status-tag,
      .stock-items-preview-tag {
        border-radius: 999px;
        padding-inline: 10px;
        font-weight: 600;
      }

      .stock-items-preview-tag {
        margin-inline-end: 0;
        background: #f8fafc;
        border-color: #dbeafe;
        color: #334155;
      }

      .stock-items-action-button {
        border-radius: 12px;
        font-weight: 600;
      }

      .stock-items-card {
        width: 100%;
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.92);
        margin-bottom: 12px;
      }

      .stock-items-card .ant-card-body {
        padding: 18px;
      }

      .stock-items-card-head,
      .stock-items-card-meta {
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }

      .stock-items-card-head {
        align-items: flex-start;
      }

      .stock-items-card-subtitle {
        font-size: 12px;
        color: #64748b;
        margin-top: 2px;
      }

      .stock-items-card-meta {
        margin-top: 14px;
        flex-wrap: wrap;
      }

      .stock-items-card-tags,
      .stock-items-card-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .stock-items-card-tags {
        margin-top: 14px;
      }

      .stock-items-card-remark {
        margin-top: 14px;
        padding: 12px 14px;
        background: #f8fafc;
        border-radius: 16px;
      }

      .stock-items-card-actions {
        margin-top: 16px;
      }

      .stock-items-refresh-error {
        margin-bottom: 14px;
        padding: 10px 14px;
        color: #b42318;
        background: rgba(254, 242, 242, 0.95);
      }

      .stock-items-pagination {
        margin-top: 14px;
        padding: 14px 16px;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
      }

      .stock-items-pagination-summary {
        color: #64748b;
        font-size: 13px;
      }

      @media screen and (max-width: 1024px) {
        .stock-items-hero {
          grid-template-columns: 1fr;
        }
      }

      @media screen and (max-width: 768px) {
        .stock-items-page-shell {
          padding-bottom: 96px;
        }

        .stock-items-hero-copy {
          padding: 18px;
        }

        .stock-items-toolbar {
          padding: 14px;
          border-radius: 20px;
        }

        .stock-items-search {
          min-width: 100%;
          flex-basis: 100%;
        }

        .stock-items-toolbar-main,
        .stock-items-toolbar-secondary,
        .stock-items-card-head,
        .stock-items-card-meta,
        .stock-items-pagination {
          flex-direction: column;
          align-items: stretch;
        }

        .stock-items-card {
          border-radius: 18px;
        }

        .stock-items-card .ant-card-body {
          padding: 16px;
        }
      }
    `}</style>
  );
}
