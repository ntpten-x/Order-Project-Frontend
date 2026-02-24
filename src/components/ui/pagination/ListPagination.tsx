'use client';

import React from 'react';
import { Pagination, Space, Typography } from 'antd';
import { ModalSelector } from '../select/ModalSelector';

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
                display: 'grid',
                gridTemplateColumns: 'minmax(250px, 1fr) auto minmax(250px, 1fr)',
                alignItems: 'center',
                gap: 16,
                marginTop: 16,
                paddingTop: 12,
                borderTop: '1px solid #E2E8F0',
                width: '100%',
                //@ts-ignore
                '--phone-layout': '1fr'
            }}
            className="pagination-grid"
        >
            <div style={{ justifySelf: 'start' }}>
                <Space size={12} wrap>
                    <Text type="secondary" style={{ whiteSpace: 'nowrap' }}>
                        แสดง {start}-{end} จาก {total} รายการ
                    </Text>
                    <Space size={6}>
                        <Text type="secondary">ต่อหน้า</Text>
                        <ModalSelector<number>
                            title="เลือกจำนวนต่อหน้า"
                            value={pageSize}
                            disabled={loading}
                            onChange={onPageSizeChange}
                            options={pageSizeOptions.map((size) => ({ value: size, label: `${size}` }))}
                            style={{ minWidth: 80 }}
                        />
                    </Space>
                </Space>
            </div>

            <div style={{ justifySelf: 'center' }}>
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

            <div style={{ justifySelf: 'end' }}>
                {onSortCreatedChange ? (
                    <Space size={6}>
                        <Text type="secondary">เรียงตาม</Text>
                        <ModalSelector<CreatedSort>
                            title="เลือกการเรียงลำดับ"
                            value={sortCreated}
                            disabled={loading}
                            onChange={onSortCreatedChange}
                            options={[
                                { value: 'old', label: 'เก่าก่อน' },
                                { value: 'new', label: 'ใหม่ก่อน' },
                            ]}
                            style={{ minWidth: 100 }}
                        />
                    </Space>
                ) : (
                    <div style={{ width: 40 }} /> // Spacer to keep center balanced
                )}
            </div>
            <style jsx>{`
                @media (max-width: 991px) {
                    .pagination-grid {
                        display: flex !important;
                        flex-direction: column;
                        align-items: center;
                        gap: 20px;
                    }
                }
            `}</style>
        </div>
    );
}

