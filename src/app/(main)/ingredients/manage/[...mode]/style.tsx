'use client';

import React from 'react';

export default function IngredientsManageStyle() {
  return (
    <style jsx global>{`
      .ant-form-item-label > label {
        font-weight: 500;
        color: #4b5563;
      }
      .ant-input-lg, .ant-input-number-lg, .ant-select-lg .ant-select-selector {
        border-radius: 8px;
        padding-top: 8px;
        padding-bottom: 8px;
      }
      .dark .ant-form-item-label > label {
        color: rgba(255, 255, 255, 0.85);
      }
      .dark .ant-card {
        background: #141414;
        border-color: rgba(255, 255, 255, 0.05);
      }
    `}</style>
  );
}
