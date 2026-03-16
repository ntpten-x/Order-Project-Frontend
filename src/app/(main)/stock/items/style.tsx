'use client';

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
        min-height: 100dvh;
        background: #f8fafc;
        padding-bottom: 120px;
      }

      .stock-items-toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        margin-bottom: 16px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04);
        border-radius: 16px;
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

      .stock-items-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
        gap: 16px;
      }

      .stock-items-card-wrapper {
        transition:
          transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
          box-shadow 0.25s ease !important;
      }

      .stock-items-card-wrapper:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08) !important;
      }

      @media screen and (max-width: 992px) {
        .stock-items-list {
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        }
      }

      @media screen and (max-width: 768px) {
        .stock-items-list {
          grid-template-columns: 1fr;
        }

        .stock-items-toolbar {
          align-items: stretch;
        }
      }
    `}</style>
  );
}
