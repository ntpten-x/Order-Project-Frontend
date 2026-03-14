"use client";

import React from "react";

export default function StockBuyingPageStyle() {
  return (
    <style jsx global>{`
      @keyframes stockBuyingFadeInUp {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .stock-buying-shell {
        min-height: 100dvh;
        background:
          radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 24%),
          linear-gradient(180deg, #f8fbff 0%, #f3f6fb 100%);
        padding-bottom: 132px;
      }

      .stock-buying-hero {
        position: sticky;
        top: 0;
        z-index: 20;
        padding: 16px 0;
      }

      .stock-buying-hero-panel,
      .stock-buying-section-card,
      .stock-buying-item-card,
      .stock-buying-summary-card,
      .stock-buying-footer-card {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(148, 163, 184, 0.18);
        box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
        backdrop-filter: blur(14px);
      }

      .stock-buying-hero-panel,
      .stock-buying-section-card,
      .stock-buying-summary-card,
      .stock-buying-footer-card {
        border-radius: 24px;
      }

      .stock-buying-hero-panel {
        padding: 18px;
      }

      .stock-buying-hero-top,
      .stock-buying-title-wrap,
      .stock-buying-title-line,
      .stock-buying-hero-actions,
      .stock-buying-section-head,
      .stock-buying-item-head,
      .stock-buying-item-controls,
      .stock-buying-item-stats,
      .stock-buying-summary-row,
      .stock-buying-footer-card,
      .stock-buying-modal-item {
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }

      .stock-buying-hero-top,
      .stock-buying-title-wrap,
      .stock-buying-title-line,
      .stock-buying-item-head {
        align-items: flex-start;
      }

      .stock-buying-title-wrap,
      .stock-buying-title-copy,
      .stock-buying-summary-card {
        min-width: 0;
      }

      .stock-buying-title-wrap {
        flex: 1;
      }

      .stock-buying-title-copy {
        display: grid;
        gap: 6px;
        flex: 1;
      }

      .stock-buying-title-icon,
      .stock-buying-hero-icon-btn {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .stock-buying-title-icon {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        color: #ffffff;
        font-size: 18px;
        flex-shrink: 0;
      }

      .stock-buying-hero-icon-btn {
        border: 1px solid #dbeafe !important;
        background: #eff6ff !important;
        color: #1d4ed8 !important;
      }

      .stock-buying-eyebrow {
        display: block;
        color: #64748b;
        font-size: 13px;
      }

      .stock-buying-title {
        margin: 0 !important;
        color: #0f172a !important;
      }

      .stock-buying-subtitle {
        color: #64748b;
        font-size: 14px;
      }

      .stock-buying-mode-tag {
        margin-inline-end: 0 !important;
        border-radius: 999px;
        padding-inline: 10px;
        font-weight: 700;
      }

      .stock-buying-mode-tag.editable {
        color: #15803d;
        background: #f0fdf4;
        border-color: #bbf7d0;
      }

      .stock-buying-mode-tag.readonly {
        color: #b45309;
        background: #fffbeb;
        border-color: #fde68a;
      }

      .stock-buying-hero-actions {
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .stock-buying-hero-btn {
        border-radius: 14px;
        font-weight: 600;
      }

      .stock-buying-stats-toggle {
        width: 100%;
        margin-top: 14px;
        padding: 12px 14px;
        border: 1px solid #dbeafe;
        background: #eff6ff;
        border-radius: 18px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: background 0.2s ease;
      }

      .stock-buying-stats-toggle:hover {
        background: #e0f2fe;
      }

      .stock-buying-stats-toggle-label {
        display: block;
        color: #64748b;
        font-size: 13px;
      }

      .stock-buying-stats-toggle-value {
        color: #0f172a;
        font-size: 15px;
        font-weight: 700;
      }

      .stock-buying-stats-toggle-icon {
        color: #2563eb;
      }

      .stock-buying-stats-row {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin-top: 14px;
      }

      .stock-buying-stat-card {
        padding: 16px;
        border-radius: 18px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        display: grid;
        gap: 4px;
      }

      .stock-buying-stat-value {
        font-size: 24px;
        font-weight: 800;
        line-height: 1.1;
      }

      .stock-buying-stat-label {
        color: #64748b;
        font-size: 13px;
      }

      .stock-buying-hero-toolbar {
        margin-top: 14px;
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
        gap: 12px;
        align-items: center;
      }

      .stock-buying-search {
        min-width: 0;
      }

      .stock-buying-search-input {
        border-radius: 16px !important;
        background: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
      }

      .stock-buying-search-input .ant-input {
        background: transparent !important;
      }

      .stock-buying-search-icon {
        color: #94a3b8;
      }

      .stock-buying-hero-meta {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        flex-wrap: wrap;
      }

      .stock-buying-hero-meta span {
        padding: 6px 10px;
        border-radius: 999px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        color: #475569;
        font-size: 12px;
        font-weight: 600;
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

      .stock-buying-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.78fr);
        gap: 18px;
        align-items: start;
        margin-top: 8px;
      }

      .stock-buying-main,
      .stock-buying-aside {
        min-width: 0;
      }

      .stock-buying-aside {
        position: sticky;
        top: 224px;
      }

      .stock-buying-section-card {
        padding: 18px;
      }

      .stock-buying-section-head {
        align-items: flex-start;
        margin-bottom: 16px;
      }

      .stock-buying-section-title {
        margin: 0 0 4px !important;
      }

      .stock-buying-section-meta {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .stock-buying-empty {
        padding: 24px 8px;
      }

      .stock-buying-list {
        display: grid;
        gap: 14px;
      }

      .stock-buying-item-card {
        padding: 18px;
        border-radius: 22px;
        animation: stockBuyingFadeInUp 0.32s ease both;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .stock-buying-item-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
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
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .stock-buying-item-description {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .stock-buying-item-status {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid;
        font-size: 12px;
        font-weight: 700;
      }

      .stock-buying-item-toggle {
        flex-shrink: 0;
      }

      .stock-buying-item-stats {
        margin-top: 14px;
        color: #475569;
        font-size: 13px;
        flex-wrap: wrap;
      }

      .stock-buying-item-stats span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 12px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
      }

      .stock-buying-item-controls {
        margin-top: 14px;
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

      .stock-buying-summary-card {
        padding: 20px;
        display: grid;
        gap: 18px;
      }

      .stock-buying-summary-block {
        display: grid;
        gap: 8px;
      }

      .stock-buying-summary-code {
        margin: 0 !important;
      }

      .stock-buying-summary-row {
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

      .stock-buying-footer {
        position: fixed;
        left: 16px;
        right: 16px;
        bottom: calc(18px + env(safe-area-inset-bottom));
        z-index: 40;
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

      @media screen and (max-width: 1200px) {
        .stock-buying-stats-row,
        .stock-buying-hero-toolbar,
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

        .stock-buying-hero {
          padding: 12px 0;
        }

        .stock-buying-hero-panel,
        .stock-buying-section-card,
        .stock-buying-summary-card,
        .stock-buying-item-card {
          padding: 16px;
        }

        .stock-buying-hero-top,
        .stock-buying-title-wrap,
        .stock-buying-title-line,
        .stock-buying-hero-actions,
        .stock-buying-section-head,
        .stock-buying-item-head,
        .stock-buying-item-controls,
        .stock-buying-item-stats,
        .stock-buying-footer-card,
        .stock-buying-modal-item {
          flex-direction: column;
          align-items: stretch;
        }

        .stock-buying-mode-tag {
          width: fit-content;
        }

        .stock-buying-hero-meta {
          justify-content: flex-start;
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
