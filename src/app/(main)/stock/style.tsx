"use client";

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
        grid-template-columns: minmax(0, 1fr);
      }

      .stock-order-main,
      .stock-cart-item-content {
        min-width: 0;
      }

      .stock-order-empty {
        padding: 24px 12px 8px;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.94);
        border: 1px solid rgba(148, 163, 184, 0.16);
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
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
        border-radius: 999px;
        box-shadow: 0 18px 38px rgba(37, 99, 235, 0.28);
      }

      .stock-cart-item-row {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }

      .stock-cart-item-content {
        flex: 1;
      }

      @media screen and (max-width: 768px) {
        .stock-order-shell {
          padding-bottom: 96px;
        }

        .stock-order-empty {
          border-radius: 20px;
        }

        .stock-cart-item-row {
          flex-direction: column;
          align-items: stretch;
        }

        .stock-cart-fab-wrap {
          bottom: calc(108px + env(safe-area-inset-bottom));
        }

        .stock-cart-fab {
          width: 56px !important;
          height: 56px !important;
        }
      }
    `}</style>
  );
}
