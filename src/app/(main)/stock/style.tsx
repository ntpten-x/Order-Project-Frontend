"use client";

import React from "react";

export default function StockPageStyle() {
  return (
    <style jsx global>{`
      .stock-catalog-shell {
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, rgba(14, 165, 233, 0.08), transparent 26%),
          linear-gradient(180deg, #f8fbff 0%, #f2f6fb 100%);
        padding-bottom: 120px;
      }

      .stock-catalog-hero {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
        gap: 18px;
        align-items: start;
      }

      .stock-catalog-hero-copy,
      .stock-catalog-toolbar,
      .stock-catalog-pagination,
      .stock-catalog-empty,
      .stock-catalog-card,
      .stock-cart-summary-card,
      .stock-cart-item-card {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(148, 163, 184, 0.16);
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
      }

      .stock-catalog-hero-copy,
      .stock-catalog-toolbar,
      .stock-catalog-pagination,
      .stock-catalog-empty {
        border-radius: 24px;
      }

      .stock-catalog-hero-copy {
        padding: 24px;
      }

      .stock-catalog-toolbar {
        display: grid;
        gap: 12px;
        padding: 16px;
        margin-bottom: 16px;
      }

      .stock-catalog-toolbar-main,
      .stock-catalog-toolbar-side {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
      }

      .stock-catalog-search {
        flex: 1 1 360px;
        min-width: 280px;
      }

      .stock-catalog-segmented {
        background: #eef2ff;
        padding: 4px;
        border-radius: 16px;
      }

      .stock-catalog-segmented .ant-segmented-item {
        border-radius: 12px;
        min-height: 38px;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
      }

      .stock-catalog-segmented-compact .ant-segmented-item {
        min-height: 34px;
        font-size: 13px;
      }

      .stock-catalog-inline-stat {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border-radius: 14px;
        background: #f8fafc;
        color: #475569;
        font-weight: 600;
      }

      .stock-catalog-grid .ant-list-items {
        align-items: stretch;
      }

      .stock-catalog-card {
        border-radius: 24px;
        overflow: hidden;
        height: 100%;
      }

      .stock-catalog-card .ant-card-body {
        padding: 0;
      }

      .stock-catalog-card-cover {
        min-height: 190px;
        display: grid;
        place-items: center;
        background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);
        border-bottom: 1px solid #e2e8f0;
      }

      .stock-catalog-card-body {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 18px;
        min-height: 210px;
      }

      .stock-catalog-tag {
        border-radius: 999px;
        font-weight: 600;
        margin-inline-end: 0;
      }

      .stock-catalog-tag-muted {
        background: #f8fafc;
        border-color: #dbeafe;
        color: #334155;
      }

      .stock-catalog-title {
        margin: 0 !important;
        line-height: 1.35 !important;
      }

      .stock-catalog-subtitle {
        display: block;
        margin-top: 2px;
        font-size: 12px;
      }

      .stock-catalog-description {
        margin: 0 !important;
        min-height: 42px;
        color: #475569 !important;
      }

      .stock-catalog-add-button {
        height: 44px;
        margin-top: auto;
        border-radius: 14px;
        font-weight: 700;
      }

      .stock-catalog-stepper {
        margin-top: auto;
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr) 44px;
        gap: 10px;
        align-items: center;
      }

      .stock-catalog-stepper-value {
        min-height: 44px;
        border-radius: 14px;
        background: #f8fafc;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #0f172a;
        font-weight: 700;
      }

      .stock-catalog-stepper-value small {
        font-size: 11px;
        color: #64748b;
        font-weight: 500;
      }

      .stock-catalog-pagination {
        margin-top: 16px;
        padding: 14px 16px;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
      }

      .stock-catalog-pagination-summary {
        color: #64748b;
        font-size: 13px;
      }

      .stock-cart-fab-wrap {
        position: fixed;
        right: 18px;
        bottom: calc(84px + env(safe-area-inset-bottom));
        z-index: 1000;
      }

      .stock-cart-fab {
        width: 58px !important;
        height: 58px !important;
        box-shadow: 0 18px 38px rgba(37, 99, 235, 0.28);
      }

      .stock-cart-summary-card,
      .stock-cart-item-card {
        border-radius: 18px;
      }

      .stock-cart-summary-card .ant-card-body,
      .stock-cart-item-card .ant-card-body {
        padding: 14px;
      }

      .stock-cart-summary-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
      }

      .stock-cart-summary-main {
        font-size: 16px;
        font-weight: 700;
        color: #0f172a;
      }

      .stock-cart-submit {
        height: 46px;
        border-radius: 14px;
        font-weight: 700;
      }

      .stock-cart-item-row {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }

      .stock-cart-item-content {
        flex: 1;
        min-width: 0;
      }

      .stock-cart-item-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: flex-start;
      }

      .stock-cart-item-subtitle {
        font-size: 12px;
        color: #64748b;
      }

      .stock-cart-item-note {
        margin-top: 8px;
        padding: 10px 12px;
        border-radius: 12px;
        background: #f8fafc;
        color: #475569;
        font-size: 12px;
      }

      .stock-cart-item-actions {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
      }

      @media screen and (max-width: 1024px) {
        .stock-catalog-hero {
          grid-template-columns: 1fr;
        }
      }

      @media screen and (max-width: 768px) {
        .stock-catalog-shell {
          padding-bottom: 96px;
        }

        .stock-catalog-hero-copy {
          padding: 18px;
        }

        .stock-catalog-toolbar,
        .stock-catalog-pagination,
        .stock-catalog-empty {
          border-radius: 20px;
        }

        .stock-catalog-search {
          min-width: 100%;
          flex-basis: 100%;
        }

        .stock-catalog-toolbar-main,
        .stock-catalog-toolbar-side,
        .stock-catalog-pagination,
        .stock-cart-summary-row,
        .stock-cart-item-head,
        .stock-cart-item-actions {
          flex-direction: column;
          align-items: stretch;
        }

        .stock-catalog-card-cover {
          min-height: 164px;
        }

        .stock-catalog-card-body {
          padding: 16px;
          min-height: 196px;
        }

        .stock-cart-fab {
          width: 56px !important;
          height: 56px !important;
        }
      }
    `}</style>
  );
}
