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

      .stock-buying-hero-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        width: 100%;
      }

      .stock-buying-hero-header-left {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
        flex: 1;
      }

      .stock-buying-title-group {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .stock-buying-hero-header-right {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }

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
        display: flex;
        width: 100%;
        margin-top: 8px;
      }

      .stock-buying-sidebar-sticky {
        position: sticky;
        top: 100px;
        z-index: 10;
        transition: top 0.3s ease;
      }

      @media screen and (max-width: 991px) { /* xl in antd typically 1200, lg 992 */
        .stock-buying-sidebar-sticky {
          position: static;
          top: auto;
        }
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

      .stock-buying-item-card-v3 {
        position: relative;
        padding-left: 12px;
        background: #ffffff;
        border: 1px solid rgba(241, 245, 249, 0.9);
        box-shadow: 0 10px 25px rgba(15, 23, 42, 0.02);
        border-radius: 20px;
        overflow: hidden;
        transition: all 0.25s ease;
        display: flex;
        flex-direction: column;
      }

      .stock-buying-item-card-v3:hover {
        transform: translateY(-3px);
        box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
        border-color: rgba(37, 99, 235, 0.1);
      }

      .stock-buying-item-status-bar {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        width: 6px;
        border-radius: 0;
      }

      .item-v3-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 16px 16px 0 12px;
      }

      .item-v3-identity {
        display: flex;
        align-items: center;
        gap: 14px;
        min-width: 0;
        flex: 1;
      }

      .item-v3-copy {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .item-v3-title-row {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .item-v3-toggle {
        flex-shrink: 0;
      }

      .item-v3-body {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        padding: 0 16px 16px 12px;
      }

      .item-v3-stats {
        display: flex;
        gap: 8px;
        flex: 1;
        min-width: 0;
      }

      .item-v3-stat-box {
        background: #f8fafc;
        border-radius: 12px;
        padding: 8px 12px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-width: 0;
        border: 1px solid #f1f5f9;
        transition: all 0.2s ease;
      }

      .item-v3-stat-box.active {
        background: #f0fdf4;
        border-color: #dcfce7;
      }

      .item-v3-stat-label {
        font-size: 11px;
        color: #64748b;
        font-weight: 500;
        white-space: nowrap;
      }

      .item-v3-stat-value {
        font-size: 15px;
        font-weight: 700;
        color: #0f172a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .item-v3-quick-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }

      .item-v3-quick-actions .ant-btn {
        height: 38px;
        padding: 0 16px;
        font-size: 13px;
        font-weight: 700;
        border-radius: 12px;
        transition: all 0.2s ease;
        border: 1px solid transparent;
      }

      .item-v3-quick-actions .btn-match {
        background: #ecfdf5 !important;
        border-color: #a7f3d0 !important;
        color: #065f46 !important;
      }

      .item-v3-quick-actions .btn-match:hover {
        background: #d1fae5 !important;
        border-color: #059669 !important;
        transform: translateY(-1px);
      }

      .item-v3-quick-actions .btn-skip {
        background: #fef2f2 !important;
        border-color: #fecaca !important;
        color: #b91c1c !important;
      }

      .item-v3-quick-actions .btn-skip:hover {
        background: #fee2e2 !important;
        border-color: #dc2626 !important;
        transform: translateY(-1px);
      }

      .item-v3-footer {
        display: flex;
        justify-content: center;
        padding: 0 16px 16px 12px;
        margin-top: auto;
      }

      .item-v3-qty-box {
        display: flex;
        align-items: center;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
        width: 100%;
        max-width: 180px;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
      }

      .item-v3-qty-box .ant-btn {
        height: 38px;
        width: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 15px;
        border: none !important;
      }

      .item-v3-qty-box .btn-minus {
        background: #fff1f2 !important;
        color: #e11d48 !important;
        border-radius: 0 !important;
      }

      .item-v3-qty-box .btn-minus:hover {
        background: #fee2e2 !important;
      }

      .item-v3-qty-box .btn-plus {
        background: #f0fdf4 !important;
        color: #10b981 !important;
        border-radius: 0 !important;
      }

      .item-v3-qty-box .btn-plus:hover {
        background: #d1fae5 !important;
      }

      .item-v3-qty-box .ant-input-number {
        flex: 1;
        text-align: center;
        border: none !important;
        box-shadow: none !important;
        background: transparent;
      }

      .item-v3-qty-box .ant-input-number-input {
        text-align: center !important;
        font-weight: 700;
        color: #000000;
        height: 38px !important;
        padding: 0 !important;
      }
      @media screen and (max-width: 640px) {
        .item-v3-body {
          flex-direction: column;
          align-items: stretch;
          gap: 12px;
        }

        .item-v3-quick-actions {
          justify-content: flex-end;
        }

        .item-v3-footer {
          justify-content: stretch;
        }

        .item-v3-qty-box {
          max-width: 100%;
        }
      }

      .stock-buying-qty-box {
        display: grid;
        gap: 6px;
        min-width: min(100%, 240px);
      }

      .stock-buying-qty-box .ant-space-compact {
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        overflow: hidden;
        background: #ffffff;
      }

      .stock-buying-qty-box .ant-btn {
        background: #f8fafc;
        border: none !important;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
      }

      .stock-buying-qty-box .ant-btn:hover {
        background: #f1f5f9;
        color: #1e293b;
      }

      .stock-buying-qty-box .ant-input-number {
        border: none !important;
        box-shadow: none !important;
        flex: 1;
        display: flex;
        align-items: center;
      }

      .stock-buying-qty-box .ant-input-number-input {
        text-align: center;
        font-weight: 700;
        color: #0f172a;
        padding: 0 !important;
        height: 36px !important;
        line-height: 36px !important;
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
        justify-content: center !important;
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

        .stock-buying-hero-header {
          flex-direction: column;
          align-items: stretch;
          gap: 12px;
        }

        .stock-buying-hero-header-right {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          width: 100%;
        }

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
