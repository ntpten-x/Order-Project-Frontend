'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App, Modal, Typography, Button, Space, Tag, Switch } from 'antd';
import {
    ExperimentOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { IngredientsUnit } from '../../../../types/api/stock/ingredientsUnit';
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from '../../../../contexts/pos/GlobalLoadingContext';
import { useSocket } from '../../../../hooks/useSocket';
import { authService } from '../../../../services/auth.service';
import { readCache, writeCache } from '../../../../utils/pos/cache';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import PageContainer from '../../../../components/ui/page/PageContainer';
import PageSection from '../../../../components/ui/page/PageSection';
import PageStack from '../../../../components/ui/page/PageStack';
import UIPageHeader from '../../../../components/ui/page/PageHeader';
import UIEmptyState from '../../../../components/ui/states/EmptyState';
import PageState from '../../../../components/ui/states/PageState';
import ListPagination, { type CreatedSort } from '../../../../components/ui/pagination/ListPagination';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { DEFAULT_CREATED_SORT } from '../../../../lib/list-sort';
import { ModalSelector } from '../../../../components/ui/select/ModalSelector';
import { SearchBar } from '../../../../components/ui/page/SearchBar';
import { SearchInput } from '../../../../components/ui/input/SearchInput';
import { useEffectivePermissions } from '../../../../hooks/useEffectivePermissions';
import { useListState } from '../../../../hooks/pos/useListState';
import { useRealtimeRefresh } from '../../../../utils/pos/realtime';
import { useAuth } from '../../../../contexts/AuthContext';
import { ingredientsUnitService } from '../../../../services/stock/ingredientsUnit.service';
import { pageStyles } from './style';

const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';
type UnitCachePayload = {
    items: IngredientsUnit[];
    total: number;
};

const UNIT_CACHE_KEY = 'stock:ingredients-unit:list:default-v1';
const UNIT_CACHE_TTL_MS = 60 * 1000;

interface UnitCardProps {
    unit: IngredientsUnit;
    canUpdate: boolean;
    canDelete: boolean;
    onEdit: (unit: IngredientsUnit) => void;
    onDelete: (unit: IngredientsUnit) => void;
    onToggleActive: (unit: IngredientsUnit, next: boolean) => void;
    updatingStatusId: string | null;
    deletingId: string | null;
}

const formatDate = (raw?: string | Date) => {
    if (!raw) return '-';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

const UnitCard = ({
    unit,
    onEdit,
    onDelete,
    onToggleActive,
    updatingStatusId,
    deletingId,
    canUpdate,
    canDelete,
}: UnitCardProps) => {
    return (
        <div
            className="stock-ingredients-unit-card"
            style={{
                ...pageStyles.unitCard(unit.is_active),
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
                    <ExperimentOutlined
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
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                        อัปเดตล่าสุด {formatDate(unit.update_date || unit.create_date)}
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

export default function IngredientsUnitPage() {
    const { message: messageApi } = App.useApp();
    const router = useRouter();
    const [units, setUnits] = useState<IngredientsUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [hasCachedSnapshot, setHasCachedSnapshot] = useState(false);
    const [csrfToken, setCsrfToken] = useState<string>("");
    const requestRef = useRef<AbortController | null>(null);
    const cacheHydratedRef = useRef(false);
    
    const {
        page,
        setPage,
        pageSize,
        setPageSize,
        total,
        setTotal,
        searchText,
        setSearchText,
        debouncedSearch,
        createdSort,
        setCreatedSort,
        filters,
        updateFilter,
        getQueryParams,
        isUrlReady,
    } = useListState({
        defaultPageSize: 10,
        defaultFilters: {
            status: 'all' as StatusFilter,
        },
    });

    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { user, loading: authLoading } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreateUnit = can('stock.ingredients_unit.page', 'create');
    const canUpdateUnit = can('stock.ingredients_unit.page', 'update');
    const canDeleteUnit = can('stock.ingredients_unit.page', 'delete');
    const canView = can('stock.ingredients_unit.page', 'view');

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
        let mounted = true;
        const run = async () => {
            if (!user?.id) return;
            try {
                const token = await authService.getCsrfToken();
                if (mounted) setCsrfToken(token);
            } catch {
                if (mounted) messageApi.error('โหลดโทเค็นความปลอดภัยไม่สำเร็จ');
            }
        };
        void run();
        return () => {
            mounted = false;
        };
    }, [messageApi, user?.id]);

    useEffect(() => {
        return () => {
            requestRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (!isUrlReady || !user || !canView || !isDefaultListView || cacheHydratedRef.current) {
            return;
        }

        cacheHydratedRef.current = true;
        const cached = readCache<UnitCachePayload>(UNIT_CACHE_KEY, UNIT_CACHE_TTL_MS);
        if (!cached) return;

        setUnits(cached.items || []);
        setTotal(cached.total || 0);
        setHasCachedSnapshot(true);
        setLoading(false);
    }, [user, canView, isDefaultListView, isUrlReady, setTotal]);

    useEffect(() => {
        if (!isDefaultListView || loading) return;
        writeCache<UnitCachePayload>(UNIT_CACHE_KEY, {
            items: units,
            total,
        });
    }, [units, isDefaultListView, loading, total]);

    const fetchUnits = useCallback(
        async (options?: { background?: boolean }) => {
            if (!canView) return;

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
                const payload = await ingredientsUnitService.findAllPaginated(undefined, params, {
                    signal: controller.signal,
                });
                
                if (controller.signal.aborted) return;

                setUnits(Array.isArray(payload.data) ? payload.data : []);
                setTotal(Number(payload.total || 0));
            } catch (fetchError) {
                if ((fetchError as Error)?.name === 'AbortError') return;
                setError(fetchError instanceof Error ? fetchError : new Error('ไม่สามารถดึงข้อมูลหน่วยนับได้'));
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
        [getQueryParams, canView, setTotal]
    );

    useEffect(() => {
        if (isUrlReady && user && canView) {
            void fetchUnits({ background: hasCachedSnapshot });
        }
    }, [fetchUnits, hasCachedSnapshot, user, canView, isUrlReady]);

    useRealtimeRefresh({
        socket,
        events: [
            RealtimeEvents.ingredientsUnit.create,
            RealtimeEvents.ingredientsUnit.update,
            RealtimeEvents.ingredientsUnit.delete,
        ],
        enabled: Boolean(canView && isUrlReady),
        debounceMs: 250,
        onRefresh: () => {
            void fetchUnits({ background: true });
        },
    });

    const handleAdd = () => {
        if (!canCreateUnit) {
            messageApi.warning('คุณไม่มีสิทธิ์เพิ่มหน่วยนับ');
            return;
        }
        showLoading('กำลังเปิดหน้าจัดการหน่วยนับ...');
        router.push('/stock/ingredientsUnit/manage/add');
    };

    const handleEdit = (unit: IngredientsUnit) => {
        if (!canUpdateUnit) {
            messageApi.warning('คุณไม่มีสิทธิ์แก้ไขหน่วยนับ');
            return;
        }
        showLoading('กำลังเปิดหน้าแก้ไขหน่วยนับ...');
        router.push(`/stock/ingredientsUnit/manage/edit/${unit.id}`);
    };

    const handleDelete = (unit: IngredientsUnit) => {
        if (!canDeleteUnit) {
            messageApi.warning('คุณไม่มีสิทธิ์ลบหน่วยนับ');
            return;
        }
        Modal.confirm({
            title: 'ยืนยันการลบหน่วยนับ',
            content: `คุณต้องการลบหน่วยนับ ${unit.display_name} หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            onOk: async () => {
                setDeletingId(unit.id);
                try {
                    await ingredientsUnitService.delete(unit.id, undefined, csrfToken);
                    const shouldMoveToPreviousPage = page > 1 && units.length === 1;
                    setUnits((prev) => prev.filter((item) => item.id !== unit.id));
                    setTotal((prev) => Math.max(prev - 1, 0));
                    if (shouldMoveToPreviousPage) {
                        setPage(page - 1);
                    } else {
                        void fetchUnits({ background: true });
                    }
                    messageApi.success(`ลบหน่วยนับ "${unit.display_name}" สำเร็จ`);
                } catch (deleteError) {
                    messageApi.error(deleteError instanceof Error ? deleteError.message : 'ไม่สามารถลบหน่วยนับได้');
                } finally {
                    setDeletingId(null);
                }
            },
        });
    };

    const handleToggleActive = async (unit: IngredientsUnit, next: boolean) => {
        if (!canUpdateUnit) {
            messageApi.warning('คุณไม่มีสิทธิ์เปลี่ยนสถานะหน่วยนับ');
            return;
        }
        setUpdatingStatusId(unit.id);
        try {
            const updated = await ingredientsUnitService.update(
                unit.id,
                { display_name: unit.display_name, is_active: next },
                undefined,
                csrfToken
            );
            setUnits((prev) => prev.map((item) => (item.id === unit.id ? updated : item)));
            messageApi.success(next ? 'เปิดใช้งานหน่วยนับแล้ว' : 'ปิดใช้งานหน่วยนับแล้ว');
        } catch (toggleError) {
            messageApi.error(toggleError instanceof Error ? toggleError.message : 'ไม่สามารถเปลี่ยนสถานะหน่วยนับได้');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    if (authLoading || permissionLoading) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!user || !canView) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <div style={pageStyles.container} data-testid="stock-ingredients-unit-page">
            <UIPageHeader
                title="หน่วยนับวัตถุดิบ"
                icon={<ExperimentOutlined />}
                actions={
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => void fetchUnits({ background: units.length > 0 })} />
                        {canCreateUnit ? (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleAdd}
                                data-testid="stock-ingredients-unit-add"
                            >
                                เพิ่มหน่วยนับ
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <SearchBar>
                        <div data-testid="stock-ingredients-unit-search">
                            <SearchInput
                                placeholder="ค้นหา"
                                value={searchText}
                                onChange={setSearchText}
                            />
                        </div>
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
                        </Space>
                    </SearchBar>

                    <PageSection
                        title="รายการหน่วยนับ"
                        extra={
                            <Space size={8} wrap>
                                {refreshing ? <Tag color="processing">กำลังอัปเดตข้อมูล</Tag> : null}
                                <span style={{ fontWeight: 600 }}>{total} รายการ</span>
                            </Space>
                        }
                    >
                        {loading && units.length === 0 ? (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 180, width: "100%" }}>
                                <ReloadOutlined spin style={{ fontSize: 32, color: "rgba(0,0,0,0.45)" }} />
                            </div>
                        ) : error && units.length === 0 ? (
                            <PageState
                                status="error"
                                title="โหลดข้อมูลหน่วยนับไม่สำเร็จ"
                                error={error}
                                onRetry={() => void fetchUnits()}
                            />
                        ) : units.length > 0 ? (
                            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                {units.map((unit) => (
                                    <UnitCard
                                        key={unit.id}
                                        unit={unit}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onToggleActive={handleToggleActive}
                                        updatingStatusId={updatingStatusId}
                                        deletingId={deletingId}
                                        canUpdate={canUpdateUnit}
                                        canDelete={canDeleteUnit}
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
                                title={debouncedSearch.trim() ? "ไม่พบหน่วยนับตามคำค้น" : "ยังไม่มีหน่วยนับวัตถุดิบ"}
                                description={
                                    debouncedSearch.trim()
                                        ? "ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ"
                                        : "เพิ่มหน่วยนับแรกเพื่อให้ทีมงานเลือกใช้งานได้ถูกต้อง"
                                }
                            />
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
