'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message, Modal, Typography, Button, Space, Tag, Switch } from 'antd';
import {
    UnorderedListOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { ProductsUnit } from '../../../../types/api/pos/productsUnit';
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from '../../../../contexts/pos/GlobalLoadingContext';
import { useSocket } from '../../../../hooks/useSocket';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { readCache, writeCache } from '../../../../utils/pos/cache';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { pageStyles, globalStyles } from '../../../../theme/pos/productsUnit/style';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import PageContainer from '../../../../components/ui/page/PageContainer';
import PageSection from '../../../../components/ui/page/PageSection';
import PageStack from '../../../../components/ui/page/PageStack';
import UIPageHeader from '../../../../components/ui/page/PageHeader';
import UIEmptyState from '../../../../components/ui/states/EmptyState';
import PageState from '../../../../components/ui/states/PageState';
import ListPagination, { type CreatedSort } from '../../../../components/ui/pagination/ListPagination';
import { ModalSelector } from '../../../../components/ui/select/ModalSelector';
import { StatsGroup } from '../../../../components/ui/card/StatsGroup';
import { SearchInput } from '../../../../components/ui/input/SearchInput';
import { SearchBar } from '../../../../components/ui/page/SearchBar';
import { useEffectivePermissions } from '../../../../hooks/useEffectivePermissions';
import { useListState } from '../../../../hooks/pos/useListState';
import { useRealtimeRefresh } from '../../../../utils/pos/realtime';
import { DEFAULT_CREATED_SORT } from '../../../../lib/list-sort';

const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';
type ProductsUnitCachePayload = {
    items: ProductsUnit[];
    total: number;
};

const PRODUCTS_UNIT_CACHE_KEY = 'pos:products-unit:list:default-v1';
const PRODUCTS_UNIT_CACHE_TTL_MS = 60 * 1000;

interface UnitCardProps {
    unit: ProductsUnit;
    canUpdate: boolean;
    canDelete: boolean;
    onEdit: (unit: ProductsUnit) => void;
    onDelete: (unit: ProductsUnit) => void;
    onToggleActive: (unit: ProductsUnit, next: boolean) => void;
    updatingStatusId: string | null;
    deletingId: string | null;
}

const formatDate = (raw: string | Date) => {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

const UnitCard = ({
    unit,
    canUpdate,
    canDelete,
    onEdit,
    onDelete,
    onToggleActive,
    updatingStatusId,
    deletingId,
}: UnitCardProps) => {
    return (
        <div
            className="unit-card"
            style={{
                ...pageStyles.unitCard(unit.is_active),
                borderRadius: 16,
                cursor: canUpdate ? 'pointer' : 'default',
            }}
            onClick={() => {
                if (!canUpdate) return;
                onEdit(unit);
            }}
        >
            <div style={pageStyles.unitCardInner}>
                <div
                    style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        background: unit.is_active
                            ? 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)'
                            : '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: unit.is_active ? '0 4px 10px rgba(14, 116, 144, 0.18)' : 'none',
                    }}
                >
                    <UnorderedListOutlined
                        style={{
                            fontSize: 22,
                            color: unit.is_active ? '#0e7490' : '#94a3b8',
                        }}
                    />
                </div>

                <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <Text strong style={{ fontSize: 16, color: '#0f172a' }} ellipsis={{ tooltip: unit.display_name }}>
                            {unit.display_name}
                        </Text>
                        <Tag color={unit.is_active ? 'green' : 'default'} style={{ borderRadius: 999 }}>
                            {unit.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 13, display: 'block', color: '#334155' }} ellipsis={{ tooltip: unit.display_name }}>
                        {unit.display_name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                        อัปเดตล่าสุด {formatDate(unit.update_date)}
                    </Text>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Switch
                        size="small"
                        checked={unit.is_active}
                        loading={updatingStatusId === unit.id}
                        disabled={!canUpdate || deletingId === unit.id}
                        onClick={(checked, event) => {
                            event?.stopPropagation();
                            if (!canUpdate) return;
                            onToggleActive(unit, checked);
                        }}
                    />
                    {canUpdate ? (
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(unit);
                            }}
                            style={{
                                borderRadius: 10,
                                color: '#0e7490',
                                background: '#ecfeff',
                                width: 36,
                                height: 36,
                            }}
                        />
                    ) : null}
                    {canDelete ? (
                        <Button
                            type="text"
                            danger
                            loading={deletingId === unit.id}
                            icon={deletingId === unit.id ? undefined : <DeleteOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(unit);
                            }}
                            style={{
                                borderRadius: 10,
                                background: '#fef2f2',
                                width: 36,
                                height: 36,
                            }}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default function ProductsUnitPage() {
    const router = useRouter();
    const [units, setUnits] = useState<ProductsUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [hasCachedSnapshot, setHasCachedSnapshot] = useState(false);
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
    const requestRef = useRef<AbortController | null>(null);
    const cacheHydratedRef = useRef(false);
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
        getQueryParams,
        isUrlReady,
    } = useListState<{ status: StatusFilter }>({
        defaultPageSize: 10,
        defaultFilters: { status: 'all' },
    });

    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreateUnits = can('products_unit.page', 'create');
    const canUpdateUnits = can('products_unit.page', 'update');
    const canDeleteUnits = can('products_unit.page', 'delete');
    const isDefaultListView = useMemo(
        () =>
            page === 1 &&
            pageSize === 10 &&
            createdSort === DEFAULT_CREATED_SORT &&
            !debouncedSearch.trim() &&
            filters.status === 'all',
        [createdSort, debouncedSearch, filters.status, page, pageSize]
    );

    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    useEffect(() => {
        return () => {
            requestRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (!isUrlReady || !isAuthorized || !isDefaultListView || cacheHydratedRef.current) {
            return;
        }

        cacheHydratedRef.current = true;
        const cached = readCache<ProductsUnitCachePayload>(PRODUCTS_UNIT_CACHE_KEY, PRODUCTS_UNIT_CACHE_TTL_MS);
        if (!cached) return;

        setUnits(cached.items || []);
        setTotal(cached.total || 0);
        setHasCachedSnapshot(true);
        setLoading(false);
    }, [isAuthorized, isDefaultListView, isUrlReady, setTotal]);

    useEffect(() => {
        if (!isDefaultListView || loading) return;
        writeCache<ProductsUnitCachePayload>(PRODUCTS_UNIT_CACHE_KEY, {
            items: units,
            total,
        });
    }, [isDefaultListView, loading, total, units]);

    const fetchUnits = useCallback(
        async (options?: { background?: boolean }) => {
            if (!isAuthorized) return;

            requestRef.current?.abort();
            const controller = new AbortController();
            requestRef.current = controller;
            const background = options?.background === true;

            if (background) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            try {
                const params = getQueryParams();
                const response = await fetch(`/api/pos/productsUnit?${params.toString()}`, {
                    cache: 'no-store',
                    signal: controller.signal,
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลหน่วยสินค้าได้');
                }

                const payload = await response.json();
                if (controller.signal.aborted) return;

                setUnits(payload.data || []);
                setTotal(payload.total || 0);
                setLastSyncedAt(new Date().toISOString());
            } catch (fetchError) {
                if (controller.signal.aborted) return;
                setError(fetchError instanceof Error ? fetchError : new Error('ไม่สามารถดึงข้อมูลหน่วยสินค้าได้'));
            } finally {
                if (requestRef.current === controller) {
                    requestRef.current = null;
                }
                if (!controller.signal.aborted) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        },
        [getQueryParams, isAuthorized, setTotal]
    );

    useEffect(() => {
        if (isUrlReady && isAuthorized) {
            void fetchUnits({ background: hasCachedSnapshot });
        }
    }, [fetchUnits, hasCachedSnapshot, isAuthorized, isUrlReady]);

    useRealtimeRefresh({
        socket,
        events: [
            RealtimeEvents.productsUnit.create,
            RealtimeEvents.productsUnit.update,
            RealtimeEvents.productsUnit.delete,
        ],
        enabled: isAuthorized && isUrlReady,
        debounceMs: 250,
        onRefresh: () => {
            void fetchUnits({ background: true });
        },
    });

    const handleAdd = () => {
        if (!canCreateUnits) {
            message.error('คุณไม่มีสิทธิ์เพิ่มหน่วยสินค้า');
            return;
        }
        showLoading('กำลังเปิดหน้าจัดการหน่วยสินค้า...');
        router.push('/pos/productsUnit/manager/add');
    };

    const handleEdit = (unit: ProductsUnit) => {
        if (!canUpdateUnits) {
            message.error('คุณไม่มีสิทธิ์แก้ไขหน่วยสินค้า');
            return;
        }
        showLoading('กำลังเปิดหน้าแก้ไขหน่วยสินค้า...');
        router.push(`/pos/productsUnit/manager/edit/${unit.id}`);
    };

    const handleDelete = (unit: ProductsUnit) => {
        if (!canDeleteUnits) {
            message.error('คุณไม่มีสิทธิ์ลบหน่วยสินค้า');
            return;
        }
        Modal.confirm({
            title: 'ยืนยันการลบหน่วยสินค้า',
            content: `คุณต้องการลบหน่วยสินค้า ${unit.display_name} หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            onOk: async () => {
                setDeletingId(unit.id);
                try {
                    const csrfToken = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/productsUnit/delete/${unit.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken,
                        },
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || errorData.message || 'ไม่สามารถลบหน่วยสินค้าได้');
                    }

                    const shouldMoveToPreviousPage = page > 1 && units.length === 1;
                    setUnits((prev) => prev.filter((item) => item.id !== unit.id));
                    setTotal((prev) => Math.max(prev - 1, 0));
                    if (shouldMoveToPreviousPage) {
                        setPage(page - 1);
                    } else {
                        void fetchUnits({ background: true });
                    }
                    message.success(`ลบหน่วย "${unit.display_name}" สำเร็จ`);
                } catch (deleteError) {
                    message.error(deleteError instanceof Error ? deleteError.message : 'ไม่สามารถลบหน่วยสินค้าได้');
                } finally {
                    setDeletingId(null);
                }
            },
        });
    };

    const handleToggleActive = async (unit: ProductsUnit, next: boolean) => {
        if (!canUpdateUnits) {
            message.error('คุณไม่มีสิทธิ์เปลี่ยนสถานะหน่วยสินค้า');
            return;
        }
        setUpdatingStatusId(unit.id);
        try {
            const csrfToken = await getCsrfTokenCached();
            const response = await fetch(`/api/pos/productsUnit/update/${unit.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                body: JSON.stringify({ is_active: next }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถเปลี่ยนสถานะหน่วยสินค้าได้');
            }

            const updated = await response.json();
            setUnits((prev) => prev.map((item) => (item.id === unit.id ? updated : item)));
            message.success(next ? 'เปิดใช้งานหน่วยสินค้าแล้ว' : 'ปิดใช้งานหน่วยสินค้าแล้ว');
        } catch (toggleError) {
            message.error(toggleError instanceof Error ? toggleError.message : 'ไม่สามารถเปลี่ยนสถานะหน่วยสินค้าได้');
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

    const activeUnits = units.filter((unit) => unit.is_active).length;
    const inactiveUnits = units.filter((unit) => !unit.is_active).length;

    return (
        <div className="unit-page" style={pageStyles.container}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="หน่วยสินค้า"
                subtitle="จัดการหน่วยนับของสินค้าให้ใช้งานง่ายและสอดคล้องกับหน้าขายสินค้า"
                icon={<UnorderedListOutlined />}
                actions={
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => void fetchUnits({ background: units.length > 0 })}>
                            รีเฟรช
                        </Button>
                        {canCreateUnits ? (
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                เพิ่มหน่วยสินค้า
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <StatsGroup
                        stats={[
                            { label: 'ผลลัพธ์ทั้งหมด', value: total, color: '#0f172a', subLabel: 'ตามตัวกรองปัจจุบัน' },
                            { label: 'ใช้งานในหน้านี้', value: activeUnits, color: '#0e7490', subLabel: 'พร้อมใช้งานใน POS' },
                            { label: 'ปิดใช้งานในหน้านี้', value: inactiveUnits, color: '#b91c1c', subLabel: 'ซ่อนจากหน้าเลือกสินค้า' },
                        ]}
                    />

                    <SearchBar>
                        <SearchInput
                            placeholder="ค้นหาชื่อหน่วยหรือชื่อระบบ"
                            value={searchText}
                            onChange={setSearchText}
                        />
                        <Space wrap size={10} style={{ justifyContent: 'space-between', width: '100%' }}>
                            <Space wrap size={10}>
                                <ModalSelector<StatusFilter>
                                    title="เลือกสถานะ"
                                    options={[
                                        { label: 'ทั้งหมด', value: 'all' },
                                        { label: 'ใช้งาน', value: 'active' },
                                        { label: 'ปิดใช้งาน', value: 'inactive' },
                                    ]}
                                    value={filters.status}
                                    onChange={(value) => updateFilter('status', value)}
                                    style={{ minWidth: 120 }}
                                />
                                <ModalSelector<CreatedSort>
                                    title="เรียงลำดับ"
                                    options={[
                                        { label: 'เก่าก่อน', value: 'old' },
                                        { label: 'ใหม่ก่อน', value: 'new' },
                                    ]}
                                    value={createdSort}
                                    onChange={setCreatedSort}
                                    style={{ minWidth: 120 }}
                                />
                            </Space>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {lastSyncedAt ? `อัปเดตล่าสุด ${formatDate(lastSyncedAt)}` : 'ยังไม่มีข้อมูลล่าสุด'}
                            </Text>
                        </Space>
                    </SearchBar>

                    <PageSection
                        title="รายการหน่วยสินค้า"
                        extra={
                            <Space size={8} wrap>
                                {refreshing ? <Tag color="processing">กำลังอัปเดตข้อมูล</Tag> : null}
                                <span style={{ fontWeight: 600 }}>{total} รายการ</span>
                            </Space>
                        }
                    >
                        {loading && units.length === 0 ? (
                            <PageState status="loading" title="กำลังโหลดข้อมูลหน่วยสินค้า..." />
                        ) : error && units.length === 0 ? (
                            <PageState
                                status="error"
                                title="โหลดข้อมูลหน่วยสินค้าไม่สำเร็จ"
                                error={error}
                                onRetry={() => void fetchUnits()}
                            />
                        ) : units.length > 0 ? (
                            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                {units.map((unit) => (
                                    <UnitCard
                                        key={unit.id}
                                        unit={unit}
                                        canUpdate={canUpdateUnits}
                                        canDelete={canDeleteUnits}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onToggleActive={handleToggleActive}
                                        updatingStatusId={updatingStatusId}
                                        deletingId={deletingId}
                                    />
                                ))}

                                <div style={{ marginTop: 12 }}>
                                    <ListPagination
                                        page={page}
                                        pageSize={pageSize}
                                        total={total}
                                        loading={loading || refreshing}
                                        onPageChange={setPage}
                                        onPageSizeChange={setPageSize}
                                        activeColor="#0e7490"
                                    />
                                </div>
                            </Space>
                        ) : (
                            <UIEmptyState
                                title={debouncedSearch.trim() ? 'ไม่พบหน่วยสินค้าตามคำค้น' : 'ยังไม่มีหน่วยสินค้า'}
                                description={
                                    debouncedSearch.trim()
                                        ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ'
                                        : 'เพิ่มหน่วยสินค้าแรกเพื่อให้ทีมงานเลือกใช้งานได้ถูกต้อง'
                                }
                                action={
                                    canCreateUnits ? (
                                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                            เพิ่มหน่วยสินค้าแรก
                                        </Button>
                                    ) : null
                                }
                            />
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
