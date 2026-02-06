"use client";

import React from "react";
import { Table } from "antd";
import type { TableProps } from "antd";

import UIEmptyState from "../states/EmptyState";

type PageTableProps<RecordType extends object> = TableProps<RecordType> & {
  emptyTitle?: string;
  emptyDescription?: React.ReactNode;
  emptyAction?: React.ReactNode;
  emptyImage?: React.ReactNode;
};

export default function PageTable<RecordType extends object>({
  emptyTitle = "ไม่มีข้อมูล",
  emptyDescription,
  emptyAction,
  emptyImage,
  scroll,
  locale,
  pagination,
  ...props
}: PageTableProps<RecordType>) {
  return (
    <Table<RecordType>
      {...props}
      scroll={{ x: "max-content", ...scroll }}
      pagination={pagination === undefined ? { size: "small" } : pagination}
      locale={{
        ...locale,
        emptyText: (
          <div style={{ padding: 16 }}>
            <UIEmptyState
              title={emptyTitle}
              description={emptyDescription}
              action={emptyAction}
              image={emptyImage}
            />
          </div>
        ),
      }}
    />
  );
}

