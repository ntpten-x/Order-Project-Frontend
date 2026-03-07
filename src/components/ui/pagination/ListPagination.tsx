'use client';

import React from 'react';
import { Grid, Pagination, Space, Typography } from 'antd';
import { ModalSelector } from '../select/ModalSelector';

const { Text } = Typography;

export type CreatedSort = 'old' | 'new';

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
    activeColor?: string;
};

export default function ListPagination({
    page,
    pageSize,
    total,
    loading = false,
    pageSizeOptions = [10, 20, 50, 100],
    onPageChange,
    onPageSizeChange,
    sortCreated = 'old',
    onSortCreatedChange,
    activeColor,
}: ListPaginationProps) {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);

    return (
        <div
            className="pagination-grid"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px solid #F1F5F9',
                width: '100%',
            }}
        >
            {/* ── Record Range (Centered) ── */}
            <Text type="secondary" style={{ fontSize: 14, color: '#64748B' }}>
                แสดง {start}-{end} จาก {total} รายการ
            </Text>

            {/* ── Controls Row ── */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'minmax(150px, 1fr) auto minmax(150px, 1fr)',
                    alignItems: 'center',
                    gap: isMobile ? 12 : 16,
                    width: '100%',
                }}
            >
                {/* Left: Page Size Selector */}
                <div style={{ justifySelf: isMobile ? 'center' : 'start' }}>
                    <Space size={8}>
                        <Text type="secondary">ต่อหน้า</Text>
                        <ModalSelector<number>
                            title="เลือกจำนวนรายการต่อหน้า"
                            value={pageSize}
                            disabled={loading}
                            onChange={onPageSizeChange}
                            options={pageSizeOptions.map((size) => ({ value: size, label: `${size}` }))}
                            style={{ minWidth: 88 }}
                        />
                    </Space>
                </div>

                {/* Center: Pagination controls */}
                <div style={{ justifySelf: 'center' }}>
                    <Pagination
                        size={isMobile ? 'small' : undefined}
                        current={page}
                        pageSize={pageSize}
                        total={total}
                        disabled={loading}
                        showSizeChanger={false}
                        onChange={onPageChange}
                        itemRender={(current, type, originalElement) => {
                            if (type === 'page' && current === page) {
                                return (
                                    <div
                                        style={{
                                            border: `1.5px solid ${activeColor || '#4F46E5'}`,
                                            borderRadius: 10,
                                            width: 32,
                                            height: 32,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: '#ffffff',
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: activeColor || '#4F46E5',
                                                fontWeight: 800,
                                                fontSize: 15,
                                                fontFamily: 'inherit',
                                            }}
                                        >
                                            {current}
                                        </span>
                                    </div>
                                );
                            }
                            return originalElement;
                        }}
                    />
                </div>

                {/* Right: Sort selector (if any) */}
                <div style={{ justifySelf: isMobile ? 'center' : 'end' }}>
                    {onSortCreatedChange ? (
                        <Space size={8}>
                            <Text type="secondary">เรียงตาม</Text>
                            <ModalSelector<CreatedSort>
                                title="เลือกรูปแบบการเรียงลำดับ"
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
                        <div style={{ width: 40 }} />
                    )}
                </div>
            </div>

            <style jsx>{`
                :global(.ant-pagination-item-active) {
                    border-color: transparent !important;
                    background: transparent !important;
                }

                :global(.ant-pagination-item-active a) {
                    color: inherit !important;
                }

                :global(.ant-pagination-item:focus-visible),
                :global(.ant-pagination-item-active:focus-visible) {
                    outline: none !important;
                    border-color: transparent !important;
                }
            `}</style>
        </div>
    );
}
