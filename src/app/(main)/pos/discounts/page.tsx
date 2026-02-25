'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { message, Modal, Typography, Button, Space, Tag, Switch } from 'antd';
import {
    PercentageOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    DollarOutlined
} from '@ant-design/icons';
import { Discounts, DiscountType } from '../../../../types/api/pos/discounts';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useGlobalLoading } from '../../../../contexts/pos/GlobalLoadingContext';
import { useAsyncAction } from '../../../../hooks/useAsyncAction';
import { useSocket } from '../../../../hooks/useSocket';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { useRealtimeList } from '../../../../utils/pos/realtime';
import { readCache, writeCache } from '../../../../utils/pos/cache';
import { useListState } from '../../../../hooks/pos/useListState';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { pageStyles, globalStyles } from '../../../../theme/pos/discounts/style';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import PageContainer from '../../../../components/ui/page/PageContainer';
import PageSection from '../../../../components/ui/page/PageSection';
import PageStack from '../../../../components/ui/page/PageStack';
import UIPageHeader from '../../../../components/ui/page/PageHeader';
import UIEmptyState from '../../../../components/ui/states/EmptyState';
import ListPagination, { type CreatedSort } from '../../../../components/ui/pagination/ListPagination';
import { DEFAULT_CREATED_SORT, parseCreatedSort } from '../../../../lib/list-sort';
import { ModalSelector } from "../../../../components/ui/select/ModalSelector";
import { StatsGroup } from "../../../../components/ui/card/StatsGroup";
import { SearchInput } from "../../../../components/ui/input/SearchInput";
import { SearchBar } from "../../../../components/ui/page/SearchBar";
import { useEffectivePermissions } from "../../../../hooks/useEffectivePermissions";

const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';
type TypeFilter = 'all' | DiscountType.Fixed | DiscountType.Percentage;
interface DiscountCardProps {
    discount: Discounts;
    canUpdate: boolean;
    canDelete: boolean;
    onEdit: (discount: Discounts) => void;
    onDelete: (discount: Discounts) => void;
    onToggleActive: (discount: Discounts, next: boolean) => void;
    updatingStatusId: string | null;
}

const formatDate = (raw: string | Date) => {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
};

const formatDiscountValue = (discount: Discounts) => {
    const amount = Number(discount.discount_amount || 0);
    if (discount.discount_type === DiscountType.Percentage) {
        return `${amount}%`;
    }
    return `${amount.toLocaleString('th-TH')} บาท`;
};

const DiscountCard = ({ discount, canUpdate, canDelete, onEdit, onDelete, onToggleActive, updatingStatusId }: DiscountCardProps) => {
    const isFixed = discount.discount_type === DiscountType.Fixed;

    return (
        <div
            className="discount-card"
            style={{
                ...pageStyles.discountCard(discount.is_active),
                borderRadius: 16,
                cursor: canUpdate ? "pointer" : "default",
            }}
            onClick={() => {
                if (!canUpdate) return;
                onEdit(discount);
            }}
        >
            <div style={pageStyles.discountCardInner}>
                <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: isFixed
                        ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                        : 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: isFixed
                        ? '0 4px 10px rgba(3, 105, 161, 0.18)'
                        : '0 4px 10px rgba(126, 34, 206, 0.18)'
                }}>
                    {isFixed ? (
                        <DollarOutlined style={{ fontSize: 22, color: '#0369a1' }} />
                    ) : (
                        <PercentageOutlined style={{ fontSize: 22, color: '#7e22ce' }} />
                    )}
                </div>

                <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text
                            strong
                            style={{
                                fontSize: 16,
                                color: '#0f172a'
                            }}
                            ellipsis={{ tooltip: discount.display_name }}
                        >
                            {discount.display_name}
                        </Text>
                        <Tag color={discount.is_active ? 'green' : 'default'}>
                            {discount.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </Tag>
                    </div>
                    <Text
                        type="secondary"
                        style={{ fontSize: 13, display: 'block', color: '#334155' }}
                        ellipsis={{ tooltip: discount.discount_name }}
                    >
                        {discount.discount_name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                        มูลค่าส่วนลด {formatDiscountValue(discount)}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                        สร้างเมื่อ {formatDate(discount.create_date)}
                    </Text>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Switch
                        size="small"
                        checked={discount.is_active}
                        loading={updatingStatusId === discount.id}
                        disabled={!canUpdate}
                        onClick={(checked, event) => {
                            if (!canUpdate) return;
                            event?.stopPropagation();
                            onToggleActive(discount, checked);
                        }}
                    />
                    {canUpdate ? (
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(discount);
                            }}
                            style={{
                                borderRadius: 10,
                                color: '#d97706',
                                background: '#fff7ed',
                                width: 36,
                                height: 36
                            }}
                        />
                    ) : null}
                    {canDelete ? (
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(discount);
                            }}
                            style={{
                                borderRadius: 10,
                                background: '#fef2f2',
                                width: 36,
                                height: 36
                            }}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default function DiscountsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const {
        searchText,
        setSearchText,
        debouncedSearch,
        page,
        setPage,
        pageSize,
        setPageSize,
        createdSort,
        setCreatedSort,
        filters,
        updateFilter,
        total,
        setTotal,
    } = useListState<{ status: StatusFilter; type: TypeFilter }>({
        defaultPageSize: 10,
        defaultFilters: { status: 'all', type: 'all' }
    });

    const [discounts, setDiscounts] = useState<Discounts[]>([]);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const canCreateDiscounts = can("discounts.page", "create");
    const canUpdateDiscounts = can("discounts.page", "update");
    const canDeleteDiscounts = can("discounts.page", "delete");

    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    useEffect(() => {
        const cached = readCache<Discounts[]>('pos:discounts', 5 * 60 * 1000);
        if (cached && cached.length > 0) {
            setDiscounts(cached);
        }
    }, []);

    useEffect(() => {
        const cached = readCache<Discounts[]>('pos:discounts:v2', 5 * 60 * 1000);
        if (cached && cached.length > 0 && !debouncedSearch && filters.status === 'all' && filters.type === 'all' && page === 1) {
            setDiscounts(cached);
        }
    }, [debouncedSearch, filters, page]);

    const fetchDiscounts = useCallback(async () => {
        execute(async () => {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', String(pageSize));
            if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
            if (filters.status !== 'all') params.set('status', filters.status);
            if (filters.type !== 'all') params.set('type', filters.type);
            params.set('sort_created', createdSort);
            const response = await fetch(`/api/pos/discounts?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลส่วนลดได้');
            }
            const payload = await response.json();
            const data = Array.isArray(payload?.data) ? payload.data : [];
            setDiscounts(data);
            setTotal(typeof payload?.total === 'number' ? payload.total : 0);

            if (!debouncedSearch.trim() && filters.status === 'all' && filters.type === 'all' && createdSort === 'old' && page === 1) {
                writeCache('pos:discounts:v2', data);
            }
        }, 'กำลังโหลดข้อมูลส่วนลด...');
    }, [execute, page, pageSize, debouncedSearch, filters.status, filters.type, createdSort, setTotal]);

    useEffect(() => {
        if (isAuthorized) {
            fetchDiscounts();
        }
    }, [isAuthorized, fetchDiscounts]);

    useRealtimeList(
        socket,
        { create: RealtimeEvents.discounts.create, update: RealtimeEvents.discounts.update, delete: RealtimeEvents.discounts.delete },
        setDiscounts
    );


    const filteredDiscounts = useMemo(() => discounts, [discounts]);

    const handleAdd = () => {
        if (!canCreateDiscounts) {
            message.error("คุณไม่มีสิทธิ์เพิ่มส่วนลด");
            return;
        }
        showLoading('กำลังเปิดหน้าจัดการส่วนลด...');
        router.push('/pos/discounts/manager/add');
    };

    const handleEdit = (discount: Discounts) => {
        if (!canUpdateDiscounts) {
            message.error("คุณไม่มีสิทธิ์แก้ไขส่วนลด");
            return;
        }
        showLoading('กำลังเปิดหน้าแก้ไขส่วนลด...');
        router.push(`/pos/discounts/manager/edit/${discount.id}`);
    };

    const handleDelete = (discount: Discounts) => {
        if (!canDeleteDiscounts) {
            message.error("คุณไม่มีสิทธิ์ลบส่วนลด");
            return;
        }
        Modal.confirm({
            title: 'ยืนยันการลบส่วนลด',
            content: `คุณต้องการลบส่วนลด ${discount.display_name} หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            onOk: async () => {
                await execute(async () => {
                    const csrfToken = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/discounts/delete/${discount.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) {
                        throw new Error('ไม่สามารถลบส่วนลดได้');
                    }
                    await fetchDiscounts();
                    message.success(`ลบส่วนลด "${discount.display_name}" สำเร็จ`);
                }, 'กำลังลบส่วนลด...');
            },
        });
    };

    const handleToggleActive = async (discount: Discounts, next: boolean) => {
        if (!canUpdateDiscounts) {
            message.error("คุณไม่มีสิทธิ์แก้ไขส่วนลด");
            return;
        }
        setUpdatingStatusId(discount.id);
        try {
            const csrfToken = await getCsrfTokenCached();
            const response = await fetch(`/api/pos/discounts/update/${discount.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({ is_active: next })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถเปลี่ยนสถานะส่วนลดได้');
            }

            await fetchDiscounts();
            message.success(next ? 'เปิดใช้งานส่วนลดแล้ว' : 'ปิดใช้งานส่วนลดแล้ว');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถเปลี่ยนสถานะส่วนลดได้');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กำลังพากลับ..." tone="danger" />;
    }

    if (permissionLoading) {
        return <AccessGuardFallback message="กำลังโหลดสิทธิ์ผู้ใช้งาน..." />;
    }

    const activeCount = discounts.filter((d) => d.is_active).length;
    const inactiveCount = discounts.filter((d) => !d.is_active).length;
    const fixedCount = discounts.filter((d) => d.discount_type === DiscountType.Fixed).length;
    const percentageCount = discounts.filter((d) => d.discount_type === DiscountType.Percentage).length;

    return (
        <div className="discount-page" style={pageStyles.container}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="ส่วนลด"
                icon={<PercentageOutlined />}
                actions={
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} onClick={() => { void fetchDiscounts(); }} />
                        {canCreateDiscounts ? (
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                เพิ่มส่วนลด
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <StatsGroup
                        stats={[
                            { label: 'ทั้งหมด', value: total, color: '#0f172a' },
                            { label: 'ใช้งาน', value: activeCount, color: '#d97706' },
                            { label: 'ปิดใช้งาน', value: inactiveCount, color: '#b91c1c' },
                            { label: 'ลดเป็นบาท', value: fixedCount, color: '#0369a1' },
                            { label: 'ลด %', value: percentageCount, color: '#7e22ce' },
                        ]}
                    />

                    <SearchBar>
                        <SearchInput
                            placeholder="ค้นหา"
                            value={searchText}
                            onChange={(val) => setSearchText(val)}
                        />
                        <Space wrap size={10}>
                            <ModalSelector<StatusFilter>
                                title="เลือกสถานะ"
                                options={[
                                    { label: `ทั้งหมด`, value: 'all' },
                                    { label: `ใช้งาน`, value: 'active' },
                                    { label: `ปิดใช้งาน`, value: 'inactive' }
                                ]}
                                value={filters.status}
                                onChange={(value) => updateFilter('status', value)}
                                style={{ minWidth: 120 }}
                            />
                            <ModalSelector<TypeFilter>
                                title="เลือกประเภท"
                                options={[
                                    { label: `ทุกประเภท`, value: 'all' },
                                    { label: `ลดเป็นบาท`, value: DiscountType.Fixed },
                                    { label: `ลด %`, value: DiscountType.Percentage }
                                ]}
                                value={filters.type}
                                onChange={(value) => updateFilter('type', value)}
                                style={{ minWidth: 120 }}
                            />
                            <ModalSelector<CreatedSort>
                                title="เรียงลำดับ"
                                options={[
                                    { label: 'เก่าก่อน', value: 'old' },
                                    { label: 'ใหม่ก่อน', value: 'new' },
                                ]}
                                value={createdSort}
                                onChange={(value) => setCreatedSort(value)}
                                style={{ minWidth: 120 }}
                            />
                        </Space>
                    </SearchBar>

                    <PageSection
                        title="รายการส่วนลด"
                        extra={<span style={{ fontWeight: 600 }}>{total} รายการ</span>}
                    >
                        {filteredDiscounts.length > 0 ? (
                            filteredDiscounts.map((discount) => (
                                <DiscountCard
                                    key={discount.id}
                                    discount={discount}
                                    canUpdate={canUpdateDiscounts}
                                    canDelete={canDeleteDiscounts}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onToggleActive={handleToggleActive}
                                    updatingStatusId={updatingStatusId}
                                />
                            ))
                        ) : (
                            <UIEmptyState
                                title={
                                    searchText.trim()
                                        ? 'ไม่พบส่วนลดตามคำค้น'
                                        : 'ยังไม่มีส่วนลด'
                                }
                                description={
                                    searchText.trim()
                                        ? 'ลองเปลี่ยนคำค้น หรือตัวกรองสถานะ/ประเภท'
                                        : 'เพิ่มส่วนลดแรกเพื่อเริ่มใช้งาน'
                                }
                            />
                        )}
                        <div style={{ marginTop: 12 }}>
                            <ListPagination
                                page={page}
                                pageSize={pageSize}
                                total={total}
                                onPageChange={setPage}
                                onPageSizeChange={setPageSize}
                                activeColor="#7C3AED"
                            />
                        </div>
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
