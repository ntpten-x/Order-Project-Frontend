'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message, Modal, Typography, Button, Space, Tag, Switch } from 'antd';
import {
    TableOutlined,
    PlusOutlined,
    ReloadOutlined,
    QrcodeOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleFilled,
    ClockCircleOutlined,
} from '@ant-design/icons';
import { Tables, TableStatus } from '../../../../types/api/pos/tables';
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from '../../../../contexts/pos/GlobalLoadingContext';
import { useSocket } from '../../../../hooks/useSocket';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { readCache, writeCache } from '../../../../utils/pos/cache';
import { pageStyles, globalStyles } from '../../../../theme/pos/tables/style';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import PageContainer from '../../../../components/ui/page/PageContainer';
import PageSection from '../../../../components/ui/page/PageSection';
import PageStack from '../../../../components/ui/page/PageStack';
import UIPageHeader from '../../../../components/ui/page/PageHeader';
import UIEmptyState from '../../../../components/ui/states/EmptyState';
import PageState from '../../../../components/ui/states/PageState';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import type { CreatedSort } from '../../../../components/ui/pagination/ListPagination';
import { DEFAULT_CREATED_SORT } from '../../../../lib/list-sort';
import { ModalSelector } from '../../../../components/ui/select/ModalSelector';
import { StatsGroup } from '../../../../components/ui/card/StatsGroup';
import { SearchInput } from '../../../../components/ui/input/SearchInput';
import { SearchBar } from '../../../../components/ui/page/SearchBar';
import ListPagination from '../../../../components/ui/pagination/ListPagination';
import { useEffectivePermissions } from '../../../../hooks/useEffectivePermissions';
import { useListState } from '../../../../hooks/pos/useListState';
import { useRealtimeRefresh } from '../../../../utils/pos/realtime';

const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';
type TableStateFilter = 'all' | TableStatus.Available | TableStatus.Unavailable;
type TablesCachePayload = {
    items: Tables[];
    total: number;
};

const TABLES_CACHE_KEY = 'pos:tables:list:default-v2';
const TABLES_CACHE_TTL_MS = 60 * 1000;

interface TableCardProps {
    table: Tables;
    canUpdate: boolean;
    canDelete: boolean;
    onEdit: (table: Tables) => void;
    onDelete: (table: Tables) => void;
    onToggleActive: (table: Tables, next: boolean) => void;
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

const getTableStatusLabel = (status: TableStatus) => {
    return status === TableStatus.Available ? 'ว่าง' : 'ไม่ว่าง';
};

const TableCard = ({
    table,
    canUpdate,
    canDelete,
    onEdit,
    onDelete,
    onToggleActive,
    updatingStatusId,
    deletingId,
}: TableCardProps) => {
    const isAvailable = table.status === TableStatus.Available;
    const hasActiveOrder = Boolean(table.active_order_id);

    return (
        <div
            className="table-card"
            style={{
                ...pageStyles.tableCard(table.is_active),
                borderRadius: 18,
                cursor: canUpdate ? 'pointer' : 'default',
            }}
            onClick={() => {
                if (!canUpdate) return;
                onEdit(table);
            }}
        >
            <div style={pageStyles.tableCardInner}>
                <div
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: isAvailable
                            ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
                            : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: isAvailable
                            ? '0 6px 14px rgba(5, 150, 105, 0.16)'
                            : '0 6px 14px rgba(217, 119, 6, 0.16)',
                    }}
                >
                    <TableOutlined
                        style={{
                            fontSize: 24,
                            color: isAvailable ? '#059669' : '#b45309',
                        }}
                    />
                </div>

                <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <Text
                            strong
                            style={{
                                fontSize: 16,
                                color: '#0f172a',
                            }}
                            ellipsis={{ tooltip: table.table_name }}
                        >
                            {table.table_name}
                        </Text>
                        {table.is_active ? <CheckCircleFilled style={{ color: '#10B981', fontSize: 14 }} /> : null}
                        <Tag color={table.is_active ? 'green' : 'default'} style={{ borderRadius: 999 }}>
                            {table.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </Tag>
                        <Tag color={isAvailable ? 'green' : 'orange'} style={{ margin: 0, borderRadius: 999 }}>
                            {getTableStatusLabel(table.status)}
                        </Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
                        อัปเดตล่าสุด {formatDate(table.update_date)}
                    </Text>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Switch
                        size="small"
                        checked={table.is_active}
                        loading={updatingStatusId === table.id}
                        disabled={!canUpdate || deletingId === table.id}
                        onClick={(checked, event) => {
                            if (!canUpdate) return;
                            event?.stopPropagation();
                            onToggleActive(table, checked);
                        }}
                    />
                    {canUpdate ? (
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(table);
                            }}
                            style={{
                                borderRadius: 10,
                                color: '#7C3AED',
                                background: '#f5f3ff',
                                width: 36,
                                height: 36,
                            }}
                        />
                    ) : null}
                    {canDelete ? (
                        <Button
                            type="text"
                            danger
                            loading={deletingId === table.id}
                            icon={deletingId === table.id ? undefined : <DeleteOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(table);
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

export default function TablesPage() {
    const router = useRouter();
    const [tables, setTables] = useState<Tables[]>([]);
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
            table_state: 'all' as TableStateFilter,
        },
    });

    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const canCreateTables = can('tables.page', 'create');
    const canUpdateTables = can('tables.page', 'update');
    const canDeleteTables = can('tables.page', 'delete');
    const isDefaultListView = useMemo(
        () =>
            page === 1 &&
            pageSize === 10 &&
            createdSort === DEFAULT_CREATED_SORT &&
            !debouncedSearch.trim() &&
            filters.status === 'all' &&
            filters.table_state === 'all',
        [createdSort, debouncedSearch, filters.status, filters.table_state, page, pageSize]
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
        const cached = readCache<TablesCachePayload>(TABLES_CACHE_KEY, TABLES_CACHE_TTL_MS);
        if (!cached) return;

        setTables(cached.items || []);
        setTotal(cached.total || 0);
        setHasCachedSnapshot(true);
        setLoading(false);
    }, [isAuthorized, isDefaultListView, isUrlReady, setTotal]);

    useEffect(() => {
        if (!isDefaultListView || loading) return;
        writeCache<TablesCachePayload>(TABLES_CACHE_KEY, {
            items: tables,
            total,
        });
    }, [isDefaultListView, loading, tables, total]);

    const fetchTables = useCallback(
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
                const response = await fetch(`/api/pos/tables?${params.toString()}`, {
                    cache: 'no-store',
                    signal: controller.signal,
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลโต๊ะได้');
                }

                const payload = await response.json();
                if (controller.signal.aborted) return;

                setTables(payload.data || []);
                setTotal(payload.total || 0);
                setLastSyncedAt(new Date().toISOString());
            } catch (fetchError) {
                if (controller.signal.aborted) return;
                setError(fetchError instanceof Error ? fetchError : new Error('ไม่สามารถดึงข้อมูลโต๊ะได้'));
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
            void fetchTables({ background: hasCachedSnapshot });
        }
    }, [fetchTables, hasCachedSnapshot, isAuthorized, isUrlReady]);

    useRealtimeRefresh({
        socket,
        events: [
            RealtimeEvents.tables.create,
            RealtimeEvents.tables.update,
            RealtimeEvents.tables.delete,
        ],
        enabled: isAuthorized && isUrlReady,
        debounceMs: 250,
        onRefresh: () => {
            void fetchTables({ background: true });
        },
    });

    const handleAdd = () => {
        if (!canCreateTables) {
            message.error('คุณไม่มีสิทธิ์เพิ่มโต๊ะ');
            return;
        }
        showLoading('กำลังเปิดหน้าจัดการโต๊ะ...');
        router.push('/pos/tables/manager/add');
    };

    const handleOpenQrCodes = () => {
        showLoading('กำลังเปิดหน้า QR โต๊ะ...');
        router.push('/pos/qr-code');
    };

    const handleEdit = (table: Tables) => {
        if (!canUpdateTables) {
            message.error('คุณไม่มีสิทธิ์แก้ไขโต๊ะ');
            return;
        }
        showLoading('กำลังเปิดหน้าแก้ไขโต๊ะ...');
        router.push(`/pos/tables/manager/edit/${table.id}`);
    };

    const handleDelete = (table: Tables) => {
        if (!canDeleteTables) {
            message.error('คุณไม่มีสิทธิ์ลบโต๊ะ');
            return;
        }

        Modal.confirm({
            title: 'ยืนยันการลบโต๊ะ',
            content: `คุณต้องการลบโต๊ะ ${table.table_name} หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            onOk: async () => {
                setDeletingId(table.id);
                try {
                    const csrfToken = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/tables/delete/${table.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken,
                        },
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || errorData.message || 'ไม่สามารถลบโต๊ะได้');
                    }

                    const shouldMoveToPreviousPage = page > 1 && tables.length === 1;
                    setTables((prev) => prev.filter((item) => item.id !== table.id));
                    setTotal((prev) => Math.max(prev - 1, 0));

                    if (shouldMoveToPreviousPage) {
                        setPage(page - 1);
                    } else {
                        void fetchTables({ background: true });
                    }

                    message.success(`ลบโต๊ะ "${table.table_name}" สำเร็จ`);
                } catch (deleteError) {
                    message.error(deleteError instanceof Error ? deleteError.message : 'ไม่สามารถลบโต๊ะได้');
                } finally {
                    setDeletingId(null);
                }
            },
        });
    };

    const handleToggleActive = async (table: Tables, next: boolean) => {
        if (!canUpdateTables) {
            message.error('คุณไม่มีสิทธิ์แก้ไขโต๊ะ');
            return;
        }

        setUpdatingStatusId(table.id);
        try {
            const csrfToken = await getCsrfTokenCached();
            const response = await fetch(`/api/pos/tables/update/${table.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                body: JSON.stringify({ is_active: next }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถเปลี่ยนสถานะโต๊ะได้');
            }

            const updated = await response.json();
            setTables((prev) => prev.map((item) => (item.id === table.id ? updated : item)));
            message.success(next ? 'เปิดใช้งานโต๊ะแล้ว' : 'ปิดใช้งานโต๊ะแล้ว');
        } catch (toggleError) {
            message.error(toggleError instanceof Error ? toggleError.message : 'ไม่สามารถเปลี่ยนสถานะโต๊ะได้');
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

    const activeCount = tables.filter((table) => table.is_active).length;
    const inactiveCount = tables.filter((table) => !table.is_active).length;
    const availableCount = tables.filter((table) => table.status === TableStatus.Available).length;
    const unavailableCount = tables.filter((table) => table.status === TableStatus.Unavailable).length;

    return (
        <div className="tables-page" style={pageStyles.container}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="โต๊ะ"
                icon={<TableOutlined />}
                actions={
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => void fetchTables({ background: tables.length > 0 })}>
                        </Button>
                        <Button icon={<QrcodeOutlined />} onClick={handleOpenQrCodes}>
                            QR โต๊ะ
                        </Button>
                        {canCreateTables ? (
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                เพิ่มโต๊ะ
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <SearchBar>
                        <SearchInput
                            placeholder="ค้นหา"
                            value={searchText}
                            onChange={setSearchText}
                        />
                        <Space wrap size={10} style={{ justifyContent: 'space-between', width: '100%' }}>
                            <Space wrap size={10}>
                                <ModalSelector<StatusFilter>
                                    title="เลือกสถานะการใช้งาน"
                                    options={[
                                        { label: 'ทั้งหมด', value: 'all' },
                                        { label: 'ใช้งาน', value: 'active' },
                                        { label: 'ปิดใช้งาน', value: 'inactive' },
                                    ]}
                                    value={filters.status}
                                    onChange={(value) => updateFilter('status', value)}
                                    style={{ minWidth: 132 }}
                                />
                                <ModalSelector<TableStateFilter>
                                    title="เลือกสถานะโต๊ะ"
                                    options={[
                                        { label: 'ทุกสถานะโต๊ะ', value: 'all' },
                                        { label: 'ว่าง', value: TableStatus.Available },
                                        { label: 'ไม่ว่าง', value: TableStatus.Unavailable },
                                    ]}
                                    value={filters.table_state}
                                    onChange={(value) => updateFilter('table_state', value)}
                                    style={{ minWidth: 132 }}
                                />
                                <ModalSelector<CreatedSort>
                                    title="เลือกรูปแบบการเรียงลำดับ"
                                    options={[
                                        { label: 'เก่าก่อน', value: 'old' },
                                        { label: 'ใหม่ก่อน', value: 'new' },
                                    ]}
                                    value={createdSort}
                                    onChange={setCreatedSort}
                                    style={{ minWidth: 132 }}
                                />
                            </Space>
                        </Space>
                    </SearchBar>

                    <PageSection
                        title="รายการโต๊ะ"
                        extra={
                            <Space size={8} wrap>
                                {refreshing ? <Tag color="processing">กำลังอัปเดตข้อมูล</Tag> : null}
                                <span style={{ fontWeight: 600 }}>{total} รายการ</span>
                            </Space>
                        }
                    >
                        {loading && tables.length === 0 ? (
                            <PageState status="loading" title="กำลังโหลดข้อมูลโต๊ะ..." />
                        ) : error && tables.length === 0 ? (
                            <PageState
                                status="error"
                                title="โหลดข้อมูลโต๊ะไม่สำเร็จ"
                                error={error}
                                onRetry={() => void fetchTables()}
                            />
                        ) : tables.length > 0 ? (
                            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                {tables.map((table) => (
                                    <TableCard
                                        key={table.id}
                                        table={table}
                                        canUpdate={canUpdateTables}
                                        canDelete={canDeleteTables}
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
                                        total={total}
                                        pageSize={pageSize}
                                        loading={loading || refreshing}
                                        onPageChange={setPage}
                                        onPageSizeChange={setPageSize}
                                        activeColor="#7C3AED"
                                    />
                                </div>
                            </Space>
                        ) : (
                            <UIEmptyState
                                title={debouncedSearch.trim() ? 'ไม่พบโต๊ะตามคำค้น' : 'ยังไม่มีโต๊ะในระบบ'}
                                description={
                                    debouncedSearch.trim()
                                        ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรองเพื่อค้นหาโต๊ะที่ต้องการ'
                                        : 'เพิ่มโต๊ะแรกเพื่อเริ่มใช้งาน POS และสร้าง QR ให้ลูกค้า'
                                }
                            />
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
