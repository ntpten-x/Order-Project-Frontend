"use client";

import React from "react";

export default function StockBuyingPageStyle() {
  return (
    <style jsx global>{`
      .stock-buying-shell {
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 22%),
          linear-gradient(180deg, #f8fbff 0%, #f3f6fb 100%);
        padding-bottom: 132px;
      }

      .stock-buying-hero,
      .stock-buying-layout {
        display: grid;
        gap: 18px;
      }

      .stock-buying-hero {
        grid-template-columns: minmax(0, 1.05fr) minmax(0, 1.2fr);
        align-items: start;
      }

      .stock-buying-layout {
        grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.85fr);
        align-items: start;
      }

      .stock-buying-hero-copy,
      .stock-buying-item-card,
      .stock-buying-summary-card,
      .stock-buying-footer-card {
        border: 1px solid rgba(148, 163, 184, 0.18);
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
      }

      .stock-buying-hero-copy,
      .stock-buying-summary-card,
      .stock-buying-footer-card {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(16px);
        border-radius: 24px;
      }

      .stock-buying-hero-copy {
        padding: 24px;
      }

      .stock-buying-chip {
        border-radius: 999px;
        font-weight: 700;
        padding-inline: 10px;
      }

      .stock-buying-note {
        margin-top: 14px;
        padding: 14px 16px;
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 18px;
        display: grid;
        gap: 4px;
      }

      .stock-buying-main,
      .stock-buying-aside {
        min-width: 0;
      }

      .stock-buying-aside {
        position: sticky;
        top: 96px;
      }

      .stock-buying-summary-card .ant-card-body {
        padding: 20px;
      }

      .stock-buying-summary-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
      }

      .stock-buying-summary-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .stock-buying-summary-grid > div {
        padding: 14px;
        background: #f8fafc;
        border-radius: 18px;
      }

      .stock-buying-summary-grid .ant-typography {
        margin: 0;
      }

      .stock-buying-pill-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .stock-buying-list {
        display: grid;
        gap: 14px;
      }

      .stock-buying-item-card {
        background: rgba(255, 255, 255, 0.96);
        border-radius: 24px;
      }

      .stock-buying-item-card .ant-card-body {
        padding: 18px;
        display: grid;
        gap: 16px;
      }

      .stock-buying-item-head,
      .stock-buying-item-controls,
      .stock-buying-item-title-row,
      .stock-buying-modal-item,
      .stock-buying-footer-card {
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }

      .stock-buying-item-head {
        align-items: flex-start;
      }

      .stock-buying-item-identity {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        min-width: 0;
        flex: 1;
      }

      .stock-buying-item-copy {
        min-width: 0;
        display: grid;
        gap: 4px;
      }

      .stock-buying-item-title-row {
        align-items: center;
        flex-wrap: wrap;
      }

      .stock-buying-item-description {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .stock-buying-item-toggle {
        flex-shrink: 0;
      }

      .stock-buying-item-controls {
        align-items: end;
      }

      .stock-buying-item-quick-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .stock-buying-item-quick-actions .ant-btn,
      .stock-buying-qty-box .ant-btn,
      .stock-buying-footer-card .ant-btn {
        border-radius: 14px;
        font-weight: 600;
      }

      .stock-buying-qty-box {
        display: grid;
        gap: 8px;
        min-width: min(100%, 280px);
      }

      .stock-buying-qty-box .ant-input-number {
        border-radius: 0;
      }

      .stock-buying-qty-box .ant-input-number-input {
        text-align: center;
        font-weight: 700;
      }

      .stock-buying-footer {
        position: fixed;
        left: 16px;
        right: 16px;
        bottom: 18px;
        z-index: 50;
      }

      .stock-buying-footer-card {
        padding: 16px 18px;
        align-items: center;
      }

      .stock-buying-footer-main {
        font-size: 16px;
        font-weight: 700;
        color: #0f172a;
      }

      .stock-buying-modal-summary {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .stock-buying-modal-summary > div,
      .stock-buying-modal-item {
        background: #f8fafc;
        border-radius: 16px;
        padding: 12px 14px;
      }

      .stock-buying-modal-list {
        display: grid;
        gap: 8px;
      }

      .stock-buying-modal-item {
        align-items: center;
      }

      @media screen and (max-width: 1180px) {
        .stock-buying-hero,
        .stock-buying-layout {
          grid-template-columns: 1fr;
        }

        .stock-buying-aside {
          position: static;
          top: auto;
        }
      }

      @media screen and (max-width: 768px) {
        .stock-buying-shell {
          padding-bottom: 108px;
        }

        .stock-buying-hero-copy,
        .stock-buying-summary-card .ant-card-body,
        .stock-buying-item-card .ant-card-body {
          padding: 16px;
        }

        .stock-buying-item-head,
        .stock-buying-item-controls,
        .stock-buying-footer-card,
        .stock-buying-modal-item {
          flex-direction: column;
          align-items: stretch;
        }

        .stock-buying-item-toggle {
          width: 100%;
        }

        .stock-buying-item-toggle .ant-switch {
          width: 100%;
        }

        .stock-buying-summary-grid,
        .stock-buying-modal-summary {
          grid-template-columns: 1fr;
        }

        .stock-buying-footer {
          left: 12px;
          right: 12px;
          bottom: 12px;
        }
      }
    `}</style>
  );
}
