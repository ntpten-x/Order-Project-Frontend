"use client";

export default function StockBuyingPageStyle() {
  return (
    <style jsx global>{`
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

      .stock-buying-hero-panel {
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(148, 163, 184, 0.18);
        box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
        backdrop-filter: blur(14px);
        border-radius: 24px;
        padding: 18px;
      }

      .stock-buying-hero-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
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

      .stock-buying-title {
        margin: 0 !important;
        color: #0f172a !important;
      }

      .stock-buying-subtitle {
        color: #64748b;
        font-size: 14px;
      }

      .stock-buying-hero-btn {
        border-radius: 14px;
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
      }

      .stock-buying-sidebar-sticky {
        position: sticky;
        top: 100px;
        z-index: 10;
      }

      .stock-buying-section-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
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
      }

      .item-v3-quick-actions .btn-skip {
        background: #fef2f2 !important;
        border-color: #fecaca !important;
        color: #b91c1c !important;
      }

      .item-v3-quick-actions .btn-skip:hover {
        background: #fee2e2 !important;
        border-color: #dc2626 !important;
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
      }

      .item-v3-qty-box .ant-btn {
        height: 38px;
        width: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none !important;
      }

      .item-v3-qty-box .btn-minus {
        background: #fff1f2 !important;
        color: #e11d48 !important;
      }

      .item-v3-qty-box .btn-minus:hover {
        background: #fee2e2 !important;
      }

      .item-v3-qty-box .btn-plus {
        background: #f0fdf4 !important;
        color: #10b981 !important;
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

      .stock-buying-modal-summary {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .stock-buying-modal-list {
        display: grid;
        gap: 8px;
      }

      @media screen and (max-width: 991px) {
        .stock-buying-sidebar-sticky {
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

        .stock-buying-hero-panel {
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

        .stock-buying-section-head {
          flex-direction: column;
          align-items: stretch;
        }

        .stock-buying-modal-summary {
          grid-template-columns: 1fr;
        }
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
    `}</style>
  );
}
