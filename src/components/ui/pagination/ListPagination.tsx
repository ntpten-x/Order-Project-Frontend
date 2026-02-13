'use client';

import React from 'react';
import { Pagination, Select, Space, Typography } from 'antd';

const { Text } = Typography;

export type CreatedSort = "old" | "new";

type ListPaginationProps = {
    page: number;
    pageSize: number;
    total: number;
    loading?: boolean;
    pageSizeOptions?: number[];
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    sortCreated?: CreatedSort;
    onSortCreatedChange?: (sort: CreatedSort) => void;
};

export default function ListPagination({
    page,
    pageSize,
    total,
    loading = false,
    pageSizeOptions = [10, 20, 50, 100],
    onPageChange,
    onPageSizeChange,
    sortCreated = "old",
    onSortCreatedChange,
}: ListPaginationProps) {
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);

    return (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginTop: 16,
                paddingTop: 12,
                borderTop: '1px solid #E2E8F0',
            }}
        >
            <Space size={12} wrap>
                <Text type="secondary">แสดง {start}-{end} จาก {total} รายการ</Text>
                <Space size={6}>
                    <Text type="secondary">ต่อหน้า</Text>
                    <Select
                        size="small"
                        value={pageSize}
                        disabled={loading}
                        onChange={onPageSizeChange}
                        options={pageSizeOptions.map((size) => ({ value: size, label: `${size}` }))}
                        style={{ width: 84 }}
                    />
                </Space>
                {onSortCreatedChange ? (
                    <Space size={6}>
                        <Text type="secondary">เรียงตาม</Text>
                        <Select<CreatedSort>
                            size="small"
                            value={sortCreated}
                            disabled={loading}
                            onChange={onSortCreatedChange}
                            options={[
                                { value: 'old', label: 'เก่าก่อน' },
                                { value: 'new', label: 'ใหม่ก่อน' },
                            ]}
                            style={{ width: 108 }}
                        />
                    </Space>
                ) : null}
            </Space>

            <Pagination
                size="small"
                current={page}
                pageSize={pageSize}
                total={total}
                disabled={loading}
                showSizeChanger={false}
                onChange={onPageChange}
            />
        </div>
    );
}
