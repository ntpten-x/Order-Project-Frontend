'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message, Modal, Typography, Button, Space, Tag, Switch } from 'antd';
import {
    TagsOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

import { useGlobalLoading } from '../../../../contexts/pos/GlobalLoadingContext';
import { useSocket } from '../../../../hooks/useSocket';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { readCache, writeCache } from '../../../../utils/pos/cache';
import { pageStyles, globalStyles } from '../../../../theme/pos/category/style';
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
import { SearchInput } from '@/components/ui/input/SearchInput';
import { useEffectivePermissions } from '../../../../hooks/useEffectivePermissions';
import { useListState } from '../../../../hooks/pos/useListState';
import { useRealtimeRefresh } from '../../../../utils/pos/realtime';
import { ToppingGroup } from '../../../../types/api/pos/toppingGroup';

const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';
type ToppingGroupCachePayload = {
    items: ToppingGroup[];
    total: number;
};

const TOPPING_GROUP_CACHE_KEY = 'pos:topping-group:list:default-v1';
const TOPPING_GROUP_CACHE_TTL_MS = 60 * 1000;

interface ToppingGroupCardProps {
    toppingGroup: ToppingGroup;
    canUpdate: boolean;
    canDelete: boolean;
    onEdit: (toppingGroup: ToppingGroup) => void;
    onDelete: (toppingGroup: ToppingGroup) => void;
    onToggleActive: (toppingGroup: ToppingGroup, next: boolean) => void;
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

const ToppingGroupCard = ({
    toppingGroup,
    onEdit,
    onDelete,
    onToggleActive,
    updatingStatusId,
    deletingId,
    canUpdate,
    canDelete,
}: ToppingGroupCardProps) => {
    return (
        <div
            className="category-card"
            style={{
                ...pageStyles.categoryCard(toppingGroup.is_active),
                borderRadius: 16,
                cursor: canUpdate ? 'pointer' : 'default',
            }}
            onClick={() => {
                if (!canUpdate) return;
                onEdit(toppingGroup);
            }}
        >
            <div style={pageStyles.categoryCardInner}>
                <div
                    style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        background: toppingGroup.is_active
                            ? 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)'
                            : '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: toppingGroup.is_active ? '0 4px 10px rgba(109, 40, 217, 0.18)' : 'none',
                    }}
                >
                    <TagsOutlined
                        style={{
                            fontSize: 22,
                            color: toppingGroup.is_active ? '#6d28d9' : '#94a3b8',
                        }}
                    />
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
                        disabled={!canUpdate || deletingId === toppingGroup.id}
                        onClick={(checked, event) => {
                            event?.stopPropagation();
                            if (!canUpdate) return;
                            onToggleActive(toppingGroup, checked);
                        }}
                    />
                    {canUpdate ? (
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(toppingGroup);
                            }}
                            style={{
                                borderRadius: 10,
                                color: '#6d28d9',
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
                            loading={deletingId === toppingGroup.id}
                            icon={deletingId === toppingGroup.id ? undefined : <DeleteOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(toppingGroup);
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
        defaultFilters: {
            status: 'all' as StatusFilter,
        },
    });

    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreateToppingGroup = can('topping.page', 'create');
    const canUpdateToppingGroup = can('topping.page', 'update');
    const canDeleteToppingGroup = can('topping.page', 'delete');
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
        const cached = readCache<ToppingGroupCachePayload>(TOPPING_GROUP_CACHE_KEY, TOPPING_GROUP_CACHE_TTL_MS);
        if (!cached) return;

        setToppingGroups(cached.items || []);
        setTotal(cached.total || 0);
        setHasCachedSnapshot(true);
        setLoading(false);
    }, [isAuthorized, isDefaultListView, isUrlReady, setTotal]);

    useEffect(() => {
        if (!isDefaultListView || loading) return;
        writeCache<ToppingGroupCachePayload>(TOPPING_GROUP_CACHE_KEY, {
            items: toppingGroups,
            total,
        });
    }, [isDefaultListView, loading, toppingGroups, total]);

    const fetchToppingGroups = useCallback(
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
                const response = await fetch(`/api/pos/toppingGroup?${params.toString()}`, {
                    cache: 'no-store',
                    signal: controller.signal,
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูล Topping Group ได้');
                }

                const payload = await response.json();
                if (controller.signal.aborted) return;

                setToppingGroups(payload.data || []);
                setTotal(payload.total || 0);
            } catch (fetchError) {
                if (controller.signal.aborted) return;
                setError(fetchError instanceof Error ? fetchError : new Error('ไม่สามารถดึงข้อมูล Topping Group ได้'));
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
            void fetchToppingGroups({ background: hasCachedSnapshot });
        }
    }, [fetchToppingGroups, hasCachedSnapshot, isAuthorized, isUrlReady]);

    useRealtimeRefresh({
        socket,
        events: [
            RealtimeEvents.toppingGroups.create,
            RealtimeEvents.toppingGroups.update,
            RealtimeEvents.toppingGroups.delete,
        ],
        enabled: isAuthorized && isUrlReady,
        debounceMs: 250,
        onRefresh: () => {
            void fetchToppingGroups({ background: true });
        },
    });

    const handleAdd = () => {
        if (!canCreateToppingGroup) {
            message.error('คุณไม่มีสิทธิ์เพิ่ม Topping Group');
            return;
        }
        showLoading('กำลังเปิดหน้าจัดการ Topping Group...');
        router.push('/pos/toppingGroup/manager/add');
    };

    const handleEdit = (toppingGroup: ToppingGroup) => {
        if (!canUpdateToppingGroup) {
            message.error('คุณไม่มีสิทธิ์แก้ไข Topping Group');
            return;
        }
        showLoading('กำลังเปิดข้อมูล Topping Group...');
        router.push(`/pos/toppingGroup/manager/edit/${toppingGroup.id}`);
    };

    const handleDelete = (toppingGroup: ToppingGroup) => {
        if (!canDeleteToppingGroup) {
            message.error('คุณไม่มีสิทธิ์ลบ Topping Group');
            return;
        }

        Modal.confirm({
            title: 'ลบ Topping Group',
            content: `ต้องการลบ ${toppingGroup.display_name} ใช่หรือไม่?`,
            okText: 'ลบ',
            cancelText: 'ยกเลิก',
            okType: 'danger',
            centered: true,
            onOk: async () => {
                setDeletingId(toppingGroup.id);
                try {
                    const token = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/toppingGroup/delete/${toppingGroup.id}`, {
                        method: 'DELETE',
                        headers: { 'X-CSRF-Token': token },
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || errorData.message || 'ไม่สามารถลบ Topping Group ได้');
                    }
                    message.success('ลบ Topping Group สำเร็จ');
                    void fetchToppingGroups({ background: toppingGroups.length > 0 });
                } catch (deleteError) {
                    message.error(deleteError instanceof Error ? deleteError.message : 'ไม่สามารถลบ Topping Group ได้');
                } finally {
                    setDeletingId(null);
                }
            },
        });
    };

    const handleToggleActive = async (toppingGroup: ToppingGroup, next: boolean) => {
        if (!canUpdateToppingGroup) {
            message.error('คุณไม่มีสิทธิ์แก้ไข Topping Group');
            return;
        }

        setUpdatingStatusId(toppingGroup.id);
        try {
            const token = await getCsrfTokenCached();
            const response = await fetch(`/api/pos/toppingGroup/update/${toppingGroup.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': token,
                },
                body: JSON.stringify({
                    display_name: toppingGroup.display_name,
                    is_active: next,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถอัปเดตสถานะ Topping Group ได้');
            }

            setToppingGroups((current) =>
                current.map((item) => (item.id === toppingGroup.id ? { ...item, is_active: next } : item))
            );
            message.success(next ? 'เปิดใช้งาน Topping Group แล้ว' : 'ปิดใช้งาน Topping Group แล้ว');
        } catch (toggleError) {
            message.error(toggleError instanceof Error ? toggleError.message : 'ไม่สามารถเปลี่ยนสถานะ Topping Group ได้');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    if (isChecking) return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    if (!isAuthorized) return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กำลังพากลับ..." tone="danger" />;
    if (permissionLoading) return <AccessGuardFallback message="กำลังโหลดสิทธิ์ผู้ใช้งาน..." />;

    return (
        <div className="topping-group-page" style={pageStyles.container}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="Topping Group"
                icon={<TagsOutlined />}
                actions={
                    <Space size={10} wrap>
                        <Button
                            icon={<ReloadOutlined />}
                            loading={refreshing}
                            onClick={() => void fetchToppingGroups({ background: toppingGroups.length > 0 })}
                        />
                        {canCreateToppingGroup ? (
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                เพิ่ม Topping Group
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <SearchBar>
                        <SearchInput placeholder="ค้นหา Topping Group" value={searchText} onChange={setSearchText} />
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

                    <PageSection>
                        {loading ? (
                            <PageState status="loading" title="กำลังโหลด Topping Group..." />
                        ) : error ? (
                            <PageState
                                status="error"
                                error={error}
                                onRetry={() => void fetchToppingGroups({ background: false })}
                            />
                        ) : toppingGroups.length === 0 ? (
                            <UIEmptyState
                                image={<TagsOutlined style={{ fontSize: 48, color: '#8b5cf6' }} />}
                                title={debouncedSearch ? 'ไม่พบ Topping Group ที่ค้นหา' : 'ยังไม่มี Topping Group'}
                                description={
                                    debouncedSearch
                                        ? 'ลองเปลี่ยนคำค้นหาหรือเงื่อนไขตัวกรอง'
                                        : 'สร้าง Topping Group เพื่อใช้กำหนดว่าสินค้าเห็นท็อปปิ้งชุดใดได้บ้าง'
                                }
                                action={
                                    canCreateToppingGroup ? (
                                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                            เพิ่ม Topping Group
                                        </Button>
                                    ) : undefined
                                }
                            />
                        ) : (
                            <>
                                <div style={{ display: 'grid', gap: 12 }}>
                                    {toppingGroups.map((item) => (
                                        <ToppingGroupCard
                                            key={item.id}
                                            toppingGroup={item}
                                            canUpdate={canUpdateToppingGroup}
                                            canDelete={canDeleteToppingGroup}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onToggleActive={handleToggleActive}
                                            updatingStatusId={updatingStatusId}
                                            deletingId={deletingId}
                                        />
                                    ))}
                                </div>

                                <ListPagination
                                    page={page}
                                    pageSize={pageSize}
                                    total={total}
                                    loading={loading || refreshing}
                                    onPageChange={setPage}
                                    onPageSizeChange={setPageSize}
                                    sortCreated={createdSort}
                                    onSortCreatedChange={setCreatedSort}
                                />
                            </>
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
