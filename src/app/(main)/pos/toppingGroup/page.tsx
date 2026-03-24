'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Modal, Pagination, Space, Switch, Tag, Typography, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, TagsOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

import { ToppingGroup } from '../../../../types/api/pos/toppingGroup';
import { useGlobalLoading } from '../../../../contexts/pos/GlobalLoadingContext';
import { useSocket } from '../../../../hooks/useSocket';
import { useEffectivePermissions } from '../../../../hooks/useEffectivePermissions';
import { useListState } from '../../../../hooks/pos/useListState';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import PageContainer from '../../../../components/ui/page/PageContainer';
import PageSection from '../../../../components/ui/page/PageSection';
import PageStack from '../../../../components/ui/page/PageStack';
import UIPageHeader from '../../../../components/ui/page/PageHeader';
import UIEmptyState from '../../../../components/ui/states/EmptyState';
import PageState from '../../../../components/ui/states/PageState';
import { type CreatedSort } from '../../../../components/ui/pagination/ListPagination';
import { ModalSelector } from '../../../../components/ui/select/ModalSelector';
import { SearchInput } from '../../../../components/ui/input/SearchInput';
import { SearchBar } from '../../../../components/ui/page/SearchBar';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';
import { readCache, writeCache } from '../../../../utils/pos/cache';
import { useRealtimeRefresh } from '../../../../utils/pos/realtime';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { DEFAULT_CREATED_SORT } from '../../../../lib/list-sort';
import { pageStyles, globalStyles } from '../../../../theme/pos/category/style';


const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';
type ToppingGroupCachePayload = { items: ToppingGroup[]; total: number };

const TOPPING_GROUP_CACHE_KEY = 'pos:topping-group:list:capabilities-v1';
const TOPPING_GROUP_CACHE_TTL_MS = 60 * 1000;

const formatDate = (raw: string | Date) => {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

type ToppingGroupCardProps = {
    toppingGroup: ToppingGroup;
    canOpenEditWorkspace: boolean;
    canToggleStatus: boolean;
    canDelete: boolean;
    updatingStatusId: string | null;
    deletingId: string | null;
    onEdit: (item: ToppingGroup) => void;
    onDelete: (item: ToppingGroup) => void;
    onToggleActive: (item: ToppingGroup, next: boolean) => void;
};

function ToppingGroupCard({
    toppingGroup,
    canOpenEditWorkspace,
    canToggleStatus,
    canDelete,
    updatingStatusId,
    deletingId,
    onEdit,
    onDelete,
    onToggleActive,
}: ToppingGroupCardProps) {
    return (
        <div
            className="category-card"
            style={{
                ...pageStyles.categoryCard(toppingGroup.is_active),
                borderRadius: 16,
                cursor: canOpenEditWorkspace ? 'pointer' : 'default',
            }}
            onClick={() => {
                if (!canOpenEditWorkspace) return;
                onEdit(toppingGroup);
            }}
        >
            <div style={pageStyles.categoryCardInner}>
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: 14,
                        border: '1px solid #F1F5F9',
                        background: toppingGroup.is_active
                            ? 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)'
                            : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <TagsOutlined style={{ fontSize: 24, color: toppingGroup.is_active ? '#6d28d9' : '#64748b' }} />
                </div>

                <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <Text strong style={{ fontSize: 16, color: '#0f172a' }} ellipsis={{ tooltip: toppingGroup.display_name }}>
                            {toppingGroup.display_name}
                        </Text>
                        <Tag color={toppingGroup.is_active ? 'green' : 'default'} style={{ borderRadius: 999 }}>
                            {toppingGroup.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                        อัปเดตล่าสุด {formatDate(toppingGroup.update_date)}
                    </Text>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Switch
                        size="small"
                        checked={toppingGroup.is_active}
                        loading={updatingStatusId === toppingGroup.id}
                        disabled={!canToggleStatus || deletingId === toppingGroup.id}
                        onClick={(checked, event) => {
                            event?.stopPropagation();
                            if (!canToggleStatus) return;
                            onToggleActive(toppingGroup, checked);
                        }}
                    />
                    {canOpenEditWorkspace ? (
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={(event) => {
                                event.stopPropagation();
                                onEdit(toppingGroup);
                            }}
                            style={{ borderRadius: 10, color: '#6d28d9', background: '#f5f3ff', width: 36, height: 36 }}
                        />
                    ) : null}
                    {canDelete ? (
                        <Button
                            type="text"
                            danger
                            loading={deletingId === toppingGroup.id}
                            icon={deletingId === toppingGroup.id ? undefined : <DeleteOutlined />}
                            onClick={(event) => {
                                event.stopPropagation();
                                onDelete(toppingGroup);
                            }}
                            style={{ borderRadius: 10, background: '#fef2f2', width: 36, height: 36 }}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export default function ToppingGroupPage() {
    const router = useRouter();
    const [toppingGroups, setToppingGroups] = useState<ToppingGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [hasCachedSnapshot, setHasCachedSnapshot] = useState(false);
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
        defaultFilters: { status: 'all' as StatusFilter },
    });

    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking, user } = useRoleGuard({
        unauthorizedMessage: 'คุณไม่มีสิทธิ์เข้าถึงหน้ากลุ่มท็อปปิ้ง',
    });
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const canViewToppingGroupPage = can('topping_group.page', 'view');
    const canSearchToppingGroups = canViewToppingGroupPage && can('topping_group.search.feature', 'view');
    const canFilterToppingGroups = canViewToppingGroupPage && can('topping_group.filter.feature', 'view');
    const canOpenToppingGroupManager = can('topping_group.manager.feature', 'access');
    const canCreateToppingGroup = can('topping_group.page', 'create') && can('topping_group.create.feature', 'create') && canOpenToppingGroupManager;
    const canEditToppingGroup = can('topping_group.page', 'update') && can('topping_group.edit.feature', 'update') && canOpenToppingGroupManager;
    const canToggleToppingGroupStatus = can('topping_group.page', 'update') && can('topping_group.status.feature', 'update') && canOpenToppingGroupManager;
    const canDeleteToppingGroup = can('topping_group.page', 'delete') && can('topping_group.delete.feature', 'delete') && canOpenToppingGroupManager;
    const canOpenEditWorkspace = canOpenToppingGroupManager && (canEditToppingGroup || canToggleToppingGroupStatus || canDeleteToppingGroup);


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
        void getCsrfTokenCached();
    }, []);

    useEffect(() => {
        return () => requestRef.current?.abort();
    }, []);

    useEffect(() => {
        if (!isUrlReady || !isAuthorized || !isDefaultListView || cacheHydratedRef.current) return;

        cacheHydratedRef.current = true;
        const cached = readCache<ToppingGroupCachePayload>(TOPPING_GROUP_CACHE_KEY, TOPPING_GROUP_CACHE_TTL_MS);
        if (!cached) return;

        setToppingGroups(cached.items || []);
        setTotal(cached.total || 0);
        setHasCachedSnapshot(true);
        setLoading(false);
    }, [isAuthorized, isDefaultListView, isUrlReady, setTotal]);

    useEffect(() => {
        if (!isDefaultListView || loading) return;
        writeCache<ToppingGroupCachePayload>(TOPPING_GROUP_CACHE_KEY, { items: toppingGroups, total });
    }, [isDefaultListView, loading, toppingGroups, total]);

    const fetchToppingGroups = useCallback(
        async (options?: { background?: boolean }) => {
            if (!isAuthorized || !canViewToppingGroupPage) return;

            requestRef.current?.abort();
            const controller = new AbortController();
            requestRef.current = controller;
            const background = options?.background === true;

            if (background) setRefreshing(true);
            else setLoading(true);
            setError(null);

            try {
                const params = getQueryParams();
                if (!canSearchToppingGroups) params.delete('q');
                if (!canFilterToppingGroups) {
                    params.delete('status');
                    params.delete('sort_created');
                }

                const response = await fetch(`/api/pos/toppingGroup?${params.toString()}`, {
                    cache: 'no-store',
                    signal: controller.signal,
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'Unable to load topping groups');
                }

                const payload = await response.json();
                if (controller.signal.aborted) return;

                setToppingGroups(payload.data || []);
                setTotal(payload.total || 0);
            } catch (fetchError) {
                if (controller.signal.aborted) return;
                setError(fetchError instanceof Error ? fetchError : new Error('Unable to load topping groups'));
            } finally {
                if (requestRef.current === controller) requestRef.current = null;
                if (!controller.signal.aborted) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        },
        [canFilterToppingGroups, canSearchToppingGroups, canViewToppingGroupPage, getQueryParams, isAuthorized, setTotal]
    );

    useEffect(() => {
        if (isUrlReady && isAuthorized && canViewToppingGroupPage) {
            void fetchToppingGroups({ background: hasCachedSnapshot });
        }
    }, [canViewToppingGroupPage, fetchToppingGroups, hasCachedSnapshot, isAuthorized, isUrlReady]);

    useRealtimeRefresh({
        socket,
        events: [RealtimeEvents.toppingGroups.create, RealtimeEvents.toppingGroups.update, RealtimeEvents.toppingGroups.delete],
        enabled: isAuthorized && isUrlReady && canViewToppingGroupPage,
        debounceMs: 250,
        onRefresh: () => {
            void fetchToppingGroups({ background: true });
        },
    });

    const handleAdd = () => {
        if (!canCreateToppingGroup) {
            message.error('You do not have permission to create topping groups');
            return;
        }
        showLoading('กำลังเปิดหน้าจัดการท็อปปิ้งกรุ๊ป...');
        router.push('/pos/toppingGroup/manager/add');
    };

    const handleEdit = (item: ToppingGroup) => {
        if (!canOpenEditWorkspace) {
            message.error('You do not have permission to open the topping-group manager');
            return;
        }
        showLoading('กำลังเปิดหน้าจัดการท็อปปิ้งกรุ๊ป...');
        router.push(`/pos/toppingGroup/manager/edit/${item.id}`);
    };

    const handleDelete = (item: ToppingGroup) => {
        if (!canDeleteToppingGroup) {
            message.error('You do not have permission to delete topping groups');
            return;
        }

        Modal.confirm({
            title: 'Delete topping group',
            content: `Delete ${item.display_name}?`,
            okText: 'Delete',
            cancelText: 'Cancel',
            okType: 'danger',
            centered: true,
            onOk: async () => {
                setDeletingId(item.id);
                try {
                    const token = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/toppingGroup/delete/${item.id}`, {
                        method: 'DELETE',
                        headers: { 'X-CSRF-Token': token },
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || errorData.message || 'Unable to delete topping group');
                    }
                    message.success('Topping group deleted');
                    void fetchToppingGroups({ background: toppingGroups.length > 0 });
                } catch (deleteError) {
                    message.error(deleteError instanceof Error ? deleteError.message : 'Unable to delete topping group');
                } finally {
                    setDeletingId(null);
                }
            },
        });
    };

    const handleToggleActive = async (item: ToppingGroup, next: boolean) => {
        if (!canToggleToppingGroupStatus) {
            message.error('You do not have permission to update topping-group status');
            return;
        }

        setUpdatingStatusId(item.id);
        try {
            const token = await getCsrfTokenCached();
            const response = await fetch(`/api/pos/toppingGroup/update/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
                body: JSON.stringify({ display_name: item.display_name, is_active: next }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'Unable to update topping-group status');
            }

            setToppingGroups((current) => current.map((candidate) => (candidate.id === item.id ? { ...candidate, is_active: next } : candidate)));
            message.success(next ? 'Topping group activated' : 'Topping group deactivated');
        } catch (toggleError) {
            message.error(toggleError instanceof Error ? toggleError.message : 'Unable to update topping-group status');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    if (isChecking) return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    if (!isAuthorized || !canViewToppingGroupPage) return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    if (permissionLoading) return <AccessGuardFallback message="กำลังโหลดสิทธิ์ของผู้ใช้งาน..." />;

    return (
        <div className="topping-group-page" style={pageStyles.container}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="กลุ่มท็อปปิ้ง"
                icon={<TagsOutlined />}
                actions={
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => void fetchToppingGroups({ background: toppingGroups.length > 0 })} />
                        {canCreateToppingGroup ? (
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                เพิ่มกลุ่มท็อปปิ้ง
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>


                    <SearchBar>
                        <SearchInput
                            placeholder="ค้นหากลุ่มท็อปปิ้ง"
                            value={searchText}
                            onChange={setSearchText}
                            disabled={!canSearchToppingGroups}
                        />
                        <Space wrap size={10} style={{ justifyContent: 'space-between', width: '100%' }}>
                            <Space wrap size={10}>
                                <ModalSelector<StatusFilter>
                                    title="Select status"
                                    options={[
                                        { label: 'ทั้งหมด', value: 'all' },
                                        { label: 'ใช้งาน', value: 'active' },
                                        { label: 'ปิดใช้งาน', value: 'inactive' },
                                    ]}
                                    value={filters.status}
                                    onChange={(value) => updateFilter('status', value)}
                                    style={{ minWidth: 140 }}
                                    disabled={!canFilterToppingGroups}
                                />
                                <ModalSelector<CreatedSort>
                                    title="Sort by created date"
                                    options={[
                                        { label: 'เก่าก่อน', value: 'old' },
                                        { label: 'ใหม่ก่อน', value: 'new' },
                                    ]}
                                    value={createdSort}
                                    onChange={setCreatedSort}
                                    style={{ minWidth: 140 }}
                                    disabled={!canFilterToppingGroups}
                                />
                            </Space>
                        </Space>
                    </SearchBar>

                    <PageSection
                        title="รายการกลุ่มท็อปปิ้ง"
                        extra={
                            <Space size={8} wrap>
                                {refreshing ? <Tag color="processing">Refreshing</Tag> : null}
                                <span style={{ fontWeight: 600 }}>{total} รายการ</span>
                            </Space>
                        }
                    >
                        {loading && toppingGroups.length === 0 ? (
                            <PageState status="loading" title="Loading topping groups..." />
                        ) : error && toppingGroups.length === 0 ? (
                            <PageState status="error" title="Unable to load topping groups" error={error} onRetry={() => void fetchToppingGroups()} />
                        ) : toppingGroups.length > 0 ? (
                            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                {toppingGroups.map((item) => (
                                    <ToppingGroupCard
                                        key={item.id}
                                        toppingGroup={item}
                                        canOpenEditWorkspace={canOpenEditWorkspace}
                                        canToggleStatus={canToggleToppingGroupStatus}
                                        canDelete={canDeleteToppingGroup}
                                        updatingStatusId={updatingStatusId}
                                        deletingId={deletingId}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onToggleActive={handleToggleActive}
                                    />
                                ))}

                                <div className="pos-pagination-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 16, position: 'relative', width: '100%', borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
                                    <div className="pos-pagination-total" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}>
                                        <Text type="secondary" style={{ fontSize: 13, color: '#64748B' }}>
                                            ทั้งหมด {total} รายการ
                                        </Text>
                                    </div>
                                    <Pagination
                                        current={page}
                                        total={total}
                                        pageSize={pageSize}
                                        onChange={(nextPage) => setPage(nextPage)}
                                        showSizeChanger={false}
                                    />
                                </div>
                            </Space>
                        ) : (
                            <UIEmptyState
                                title={debouncedSearch.trim() ? 'ไม่พบกลุ่มท็อปปิ้งที่ค้นหา' : 'ยังไม่มีกลุ่มท็อปปิ้ง'}
                                description={
                                    debouncedSearch.trim()
                                        ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง แล้วค้นหาใหม่อีกครั้ง'
                                        : 'เพิ่มกลุ่มท็อปปิ้งเพื่อจัดระเบียบการเลือกท็อปปิ้งในเมนู'
                                }
                            />
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
