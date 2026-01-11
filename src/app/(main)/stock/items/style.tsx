'use client';

import React from 'react';

export default function ItemsPageStyle() {
  return (
    <style jsx global>{`
      /* Modern Table Styling */
      .items-table .ant-table {
        background: transparent !important;
        border-radius: 16px;
        overflow: hidden;
      }
      .items-table .ant-table-thead > tr > th {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        color: #fff !important;
        font-weight: 600;
        font-size: 14px;
        padding: 16px 12px;
        border: none !important;
      }
      .items-table .ant-table-thead > tr > th::before {
        display: none !important;
      }
      .items-table .ant-table-tbody > tr > td {
        padding: 16px 12px;
        vertical-align: middle;
        border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        transition: all 0.2s ease;
      }
      .items-table .ant-table-tbody > tr:hover > td {
        background: rgba(102, 126, 234, 0.04) !important;
      }
      .items-table .ant-table-tbody > tr:last-child > td {
        border-bottom: none;
      }

      /* Status Card Styling */
      .status-card {
        background: linear-gradient(135deg, #fff 0%, #f8f9fe 100%);
        border-radius: 16px;
        border: 1px solid rgba(102, 126, 234, 0.12);
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.08);
        transition: all 0.3s ease;
      }
      .status-card:hover {
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.15);
        transform: translateY(-2px);
      }

      /* Empty State Styling */
      .empty-state-card {
        background: linear-gradient(180deg, #f8f9fe 0%, #fff 100%);
        border-radius: 20px;
        border: 2px dashed rgba(102, 126, 234, 0.2);
      }

      /* Action Buttons */
      .action-btn {
        border-radius: 10px;
        font-weight: 500;
        transition: all 0.3s ease;
      }
      .action-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      /* Order Item Badge */
      .order-item-badge {
        display: inline-flex;
        align-items: center;
        background: linear-gradient(135deg, #f0f5ff 0%, #e8f0ff 100%);
        padding: 6px 12px;
        border-radius: 20px;
        margin: 3px 4px 3px 0;
        border: 1px solid rgba(102, 126, 234, 0.15);
        font-size: 13px;
        transition: all 0.2s ease;
      }
      .order-item-badge:hover {
        background: linear-gradient(135deg, #e8f0ff 0%, #d9e4ff 100%);
        border-color: rgba(102, 126, 234, 0.3);
      }

      /* Mobile Optimization */
      @media screen and (max-width: 768px) {
        .items-table .ant-table-thead > tr > th {
          font-size: 12px;
          padding: 12px 8px;
        }
        .items-table .ant-table-tbody > tr > td {
          font-size: 13px;
          padding: 12px 8px;
        }
        .order-item-badge {
          font-size: 12px;
          padding: 4px 10px;
        }
      }

      /* Pagination Styling */
      .items-table .ant-pagination {
        padding: 16px 24px;
      }
      .items-table .ant-pagination-item-active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-color: transparent;
      }
      .items-table .ant-pagination-item-active a {
        color: #fff;
      }
    `}</style>
  );
}
