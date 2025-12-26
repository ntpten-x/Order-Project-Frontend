'use client';

import React from 'react';

export default function IngredientsPageStyle() {
  return (
    <style jsx global>{`
      .custom-table .ant-table {
        background: transparent !important;
      }
      .custom-table .ant-table-thead > tr > th {
        background: rgba(0, 0, 0, 0.02) !important;
        font-weight: 600;
      }
      .dark .custom-table .ant-table-thead > tr > th {
        background: rgba(255, 255, 255, 0.02) !important;
        color: rgba(255, 255, 255, 0.65);
      }
      .dark .ant-card {
        background: #141414;
        border-color: rgba(255, 255, 255, 0.05);
      }
      .dark .ant-typography {
        color: rgba(255, 255, 255, 0.85);
      }
      .dark .ant-typography-secondary {
        color: rgba(255, 255, 255, 0.45);
      }
    `}</style>
  );
}
