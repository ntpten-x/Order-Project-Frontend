"use client";

import React from "react";

export default function StockPageStyle() {
  return (
    <style jsx global>{`
      .stock-order-shell {
        min-height: 100dvh;
        background:
          radial-gradient(circle at top left, rgba(14, 165, 233, 0.08), transparent 24%),
          linear-gradient(180deg, #f8fbff 0%, #f2f6fb 100%);
        padding-bottom: 120px;
      }

      .stock-order-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.85fr);
        gap: 20px;
        align-items: start;
      }

      .stock-order-main,
      .stock-order-side {
        min-width: 0;
      }

      .stock-order-side {
        position: sticky;
        top: 16px;
      }

      .stock-order-hero,
      .stock-order-toolbar,
      .stock-order-pagination,
      .stock-order-empty,
      .stock-order-summary-card,
      .stock-order-side-alert,
      .stock-catalog-card,
      .stock-cart-summary-card,
      .stock-cart-item-card {
        background: rgba(255, 255, 255, 0.94);
        border: 1px solid rgba(148, 163, 184, 0.16);
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
      }

      .stock-order-hero,
      .stock-order-toolbar,
      .stock-order-pagination,
      .stock-order-empty,
      .stock-order-summary-card {
        border-radius: 24px;
      }

      .stock-order-hero {
        padding: 24px;
        display: grid;
        grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.9fr);
        gap: 18px;
        align-items: stretch;
      }

      .stock-order-hero-copy {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .stock-order-title {
        margin: 4px 0 0 !important;
      }

      .stock-order-subtitle {
        line-height: 1.7;
      }

      .stock-order-hero-metrics {
        display: grid;
        gap: 12px;
      }

      .stock-order-metric-card {
        display: grid;
        gap: 6px;
        padding: 16px 18px;
        border-radius: 20px;
        background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
        border: 1px solid #e2e8f0;
      }

      .stock-order-metric-label {
        font-size: 12px;
        color: #64748b;
      }

      .stock-order-metric-value {
        font-size: 24px;
        font-weight: 700;
        color: #0f172a;
      }

      .stock-order-toolbar {
        display: grid;
        gap: 12px;
        padding: 16px;
        margin-bottom: 16px;
      }

      .stock-order-toolbar-main,
      .stock-order-toolbar-side {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
      }

      .stock-order-search {
        flex: 1 1 360px;
        min-width: 280px;
      }

      .stock-order-segmented {
        background: #eef2ff;
        padding: 4px;
        border-radius: 16px;
        max-width: 100%;
      }

      .stock-order-segmented .ant-segmented-item {
        border-radius: 12px;
        min-height: 38px;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
      }

      .stock-order-segmented-compact .ant-segmented-item {
        min-height: 34px;
        font-size: 13px;
      }

      .stock-order-inline-stat {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border-radius: 14px;
        background: #f8fafc;
        color: #475569;
        font-weight: 600;
      }

      .stock-order-grid .ant-list-items {
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

      .stock-order-pagination {
        margin-top: 16px;
        padding: 14px 16px;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
      }

      .stock-order-pagination-summary {
        color: #64748b;
        font-size: 13px;
      }

      .stock-order-empty {
        padding: 24px 12px 8px;
      }

      .stock-order-summary-card .ant-card-body {
        padding: 18px;
      }

      .stock-order-summary-header {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: flex-start;
        margin-bottom: 14px;
      }

      .stock-order-summary-title {
        margin: 0 0 6px !important;
      }

      .stock-order-summary-badge {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        color: #2563eb;
        font-size: 18px;
      }

      .stock-order-summary-empty {
        padding: 12px 0;
      }

      .stock-order-summary-list {
        padding: 10px 12px;
        border-radius: 16px;
        background: #f8fafc;
        margin-bottom: 12px;
      }

      .stock-order-summary-item {
        display: flex;
        gap: 12px;
        padding: 10px 0;
        border-bottom: 1px solid #e2e8f0;
      }

      .stock-order-summary-item.is-last {
        border-bottom: none;
      }

      .stock-order-summary-item-content {
        flex: 1;
        min-width: 0;
      }

      .stock-order-summary-item-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: flex-start;
      }

      .stock-order-summary-item-subtitle {
        display: block;
        margin-top: 4px;
        font-size: 12px;
      }

      .stock-order-summary-item-note {
        margin-top: 8px;
        padding: 8px 10px;
        border-radius: 10px;
        background: #ffffff;
        color: #475569;
        font-size: 12px;
        line-height: 1.5;
      }

      .stock-order-summary-more {
        margin-bottom: 12px;
        color: #64748b;
        font-size: 12px;
      }

      .stock-order-summary-total {
        display: grid;
        gap: 10px;
        margin-bottom: 14px;
      }

      .stock-order-summary-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }

      .stock-order-summary-footer {
        padding-top: 14px;
        border-top: 1px solid #e2e8f0;
      }

      .stock-order-summary-action {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #1d4ed8;
        font-weight: 600;
      }

      .stock-order-side-alert {
        margin-top: 14px;
        border-radius: 18px;
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

      @media screen and (max-width: 1200px) {
        .stock-order-layout {
          grid-template-columns: 1fr;
        }

        .stock-order-side {
          position: static;
        }
      }

      @media screen and (max-width: 1024px) {
        .stock-order-hero {
          grid-template-columns: 1fr;
        }
      }

      @media screen and (max-width: 768px) {
        .stock-order-shell {
          padding-bottom: 96px;
        }

        .stock-order-hero {
          padding: 18px;
        }

        .stock-order-toolbar,
        .stock-order-pagination,
        .stock-order-empty,
        .stock-order-summary-card {
          border-radius: 20px;
        }

        .stock-order-search {
          min-width: 100%;
          flex-basis: 100%;
        }

        .stock-order-toolbar-main,
        .stock-order-toolbar-side,
        .stock-order-pagination,
        .stock-order-summary-row,
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

        .stock-order-segmented,
        .stock-order-inline-stat {
          width: 100%;
        }

        .stock-order-segmented .ant-segmented-group {
          width: 100%;
        }

        .stock-order-segmented .ant-segmented-item {
          flex: 1 1 0;
          min-width: 0;
          justify-content: center;
        }

        .stock-cart-fab {
          width: 56px !important;
          height: 56px !important;
        }
      }
    `}</style>
  );
}
