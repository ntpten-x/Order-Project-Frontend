'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App, Modal, Typography, Button, Space, Tag, Switch } from 'antd';
import {
    TagsOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { StockCategory } from '../../../../types/api/stock/category';
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from '../../../../contexts/pos/GlobalLoadingContext';
import { useSocket } from '../../../../hooks/useSocket';
import { authService } from '../../../../services/auth.service';
import { readCache, writeCache } from '../../../../utils/pos/cache';
import StockCategoryPageStyle, { pageStyles, globalStyles } from './style';
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
import { stockCategoryService } from '../../../../services/stock/category.service';

const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';
type CategoryCachePayload = {
    items: StockCategory[];
    total: number;
};

const CATEGORY_CACHE_KEY = 'stock:category:list:default-v1';
const CATEGORY_CACHE_TTL_MS = 60 * 1000;

interface CategoryCardProps {
    category: StockCategory;
    canUpdate: boolean;
    canDelete: boolean;
    onEdit: (category: StockCategory) => void;
    onDelete: (category: StockCategory) => void;
    onToggleActive: (category: StockCategory, next: boolean) => void;
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

const CategoryCard = ({
    category,
    onEdit,
    onDelete,
    onToggleActive,
    updatingStatusId,
    deletingId,
    canUpdate,
    canDelete,
}: CategoryCardProps) => {
    return (
        <div
            className="stock-category-card"
            style={{
                ...pageStyles.categoryCard(category.is_active),
                borderRadius: 16,
                cursor: canUpdate ? 'pointer' : 'default',
            }}
            onClick={() => {
                if (!canUpdate) return;
                onEdit(category);
            }}
        >
            <div style={pageStyles.categoryCardInner}>
                <div
                    style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        background: category.is_active
                            ? 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)'
                            : '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: category.is_active ? '0 4px 10px rgba(15, 118, 110, 0.18)' : 'none',
                    }}
                >
                    <TagsOutlined
                        style={{
                            fontSize: 22,
                            color: category.is_active ? '#0f766e' : '#94a3b8',
                        }}
                    />
                </div>

                <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <Text strong style={{ fontSize: 16, color: '#0f172a' }} ellipsis={{ tooltip: category.display_name }}>
                            {category.display_name}
                        </Text>
                        <Tag color={category.is_active ? 'green' : 'default'} style={{ borderRadius: 999 }}>
                            {category.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                        อัปเดตล่าสุด {formatDate(category.update_date || category.create_date)}
                    </Text>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Switch
                        size="small"
                        checked={category.is_active}
                        loading={updatingStatusId === category.id}
                        disabled={!canUpdate || deletingId === category.id}
                        onClick={(checked, event) => {
                            event?.stopPropagation();
                            if (!canUpdate) return;
                            onToggleActive(category, checked);
                        }}
                    />
                    {canUpdate ? (
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(category);
                            }}
                            style={{
                                borderRadius: 10,
                                color: '#0369a1',
                                background: '#e0f2fe',
                                width: 36,
                                height: 36,
                            }}
                        />
                    ) : null}
                    {canDelete ? (
                        <Button
                            type="text"
                            danger
                            loading={deletingId === category.id}
                            icon={deletingId === category.id ? undefined : <DeleteOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(category);
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

export default function StockCategoryPage() {
    const { message: messageApi } = App.useApp();
    const router = useRouter();
    const [categories, setCategories] = useState<StockCategory[]>([]);
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
    const canCreateCategory = can('stock.category.page', 'create');
    const canUpdateCategory = can('stock.category.page', 'update');
    const canDeleteCategory = can('stock.category.page', 'delete');
    const canView = can('stock.category.page', 'view');

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
        const cached = readCache<CategoryCachePayload>(CATEGORY_CACHE_KEY, CATEGORY_CACHE_TTL_MS);
        if (!cached) return;

        setCategories(cached.items || []);
        setTotal(cached.total || 0);
        setHasCachedSnapshot(true);
        setLoading(false);
    }, [user, canView, isDefaultListView, isUrlReady, setTotal]);

    useEffect(() => {
        if (!isDefaultListView || loading) return;
        writeCache<CategoryCachePayload>(CATEGORY_CACHE_KEY, {
            items: categories,
            total,
        });
    }, [categories, isDefaultListView, loading, total]);

    const fetchCategories = useCallback(
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
                const payload = await stockCategoryService.findAllPaginated(undefined, params, {
                    signal: controller.signal,
                });
                
                if (controller.signal.aborted) return;

                setCategories(Array.isArray(payload.data) ? payload.data : []);
                setTotal(Number(payload.total || 0));
            } catch (fetchError) {
                if ((fetchError as Error)?.name === 'AbortError') return;
                setError(fetchError instanceof Error ? fetchError : new Error('ไม่สามารถดึงข้อมูลหมวดหมู่ได้'));
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
            void fetchCategories({ background: hasCachedSnapshot });
        }
    }, [fetchCategories, hasCachedSnapshot, user, canView, isUrlReady]);

    useRealtimeRefresh({
        socket,
        events: [
            RealtimeEvents.stockCategories.create,
            RealtimeEvents.stockCategories.update,
            RealtimeEvents.stockCategories.delete,
        ],
        enabled: Boolean(canView && isUrlReady),
        debounceMs: 250,
        onRefresh: () => {
            void fetchCategories({ background: true });
        },
    });

    const handleAdd = () => {
        if (!canCreateCategory) {
            messageApi.warning('คุณไม่มีสิทธิ์เพิ่มหมวดหมู่');
            return;
        }
        showLoading('กำลังเปิดหน้าจัดการหมวดหมู่...');
        router.push('/stock/category/manage/add');
    };

    const handleEdit = (category: StockCategory) => {
        if (!canUpdateCategory) {
            messageApi.warning('คุณไม่มีสิทธิ์แก้ไขหมวดหมู่');
            return;
        }
        showLoading('กำลังเปิดหน้าแก้ไขหมวดหมู่...');
        router.push(`/stock/category/manage/edit/${category.id}`);
    };

    const handleDelete = (category: StockCategory) => {
        if (!canDeleteCategory) {
            messageApi.warning('คุณไม่มีสิทธิ์ลบหมวดหมู่');
            return;
        }
        Modal.confirm({
            title: 'ยืนยันการลบหมวดหมู่',
            content: `คุณต้องการลบหมวดหมู่ ${category.display_name} หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            onOk: async () => {
                setDeletingId(category.id);
                try {
                    await stockCategoryService.delete(category.id, undefined, csrfToken);
                    const shouldMoveToPreviousPage = page > 1 && categories.length === 1;
                    setCategories((prev) => prev.filter((item) => item.id !== category.id));
                    setTotal((prev) => Math.max(prev - 1, 0));
                    if (shouldMoveToPreviousPage) {
                        setPage(page - 1);
                    } else {
                        void fetchCategories({ background: true });
                    }
                    messageApi.success(`ลบหมวดหมู่ "${category.display_name}" สำเร็จ`);
                } catch (deleteError) {
                    messageApi.error(deleteError instanceof Error ? deleteError.message : 'ไม่สามารถลบหมวดหมู่ได้');
                } finally {
                    setDeletingId(null);
                }
            },
        });
    };

    const handleToggleActive = async (category: StockCategory, next: boolean) => {
        if (!canUpdateCategory) {
            messageApi.warning('คุณไม่มีสิทธิ์เปลี่ยนสถานะหมวดหมู่');
            return;
        }
        setUpdatingStatusId(category.id);
        try {
            const updated = await stockCategoryService.update(
                category.id,
                { display_name: category.display_name, is_active: next },
                undefined,
                csrfToken
            );
            setCategories((prev) => prev.map((item) => (item.id === category.id ? updated : item)));
            messageApi.success(next ? 'เปิดใช้งานหมวดหมู่แล้ว' : 'ปิดใช้งานหมวดหมู่แล้ว');
        } catch (toggleError) {
            messageApi.error(toggleError instanceof Error ? toggleError.message : 'ไม่สามารถเปลี่ยนสถานะหมวดหมู่ได้');
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
        <div className="category-page" style={pageStyles.container}>
            <StockCategoryPageStyle />
            <style>{globalStyles}</style>

            <UIPageHeader
                title="หมวดหมู่วัตถุดิบ"
                icon={<TagsOutlined />}
                actions={
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => void fetchCategories({ background: categories.length > 0 })} />
                        {canCreateCategory ? (
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                เพิ่มหมวดหมู่
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
                        title="รายการหมวดหมู่"
                        extra={
                            <Space size={8} wrap>
                                {refreshing ? <Tag color="processing">กำลังอัปเดตข้อมูล</Tag> : null}
                                <span style={{ fontWeight: 600 }}>{total} รายการ</span>
                            </Space>
                        }
                    >
                        {loading && categories.length === 0 ? (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 180, width: "100%" }}>
                                <ReloadOutlined spin style={{ fontSize: 32, color: "rgba(0,0,0,0.45)" }} />
                            </div>
                        ) : error && categories.length === 0 ? (
                            <PageState
                                status="error"
                                title="โหลดข้อมูลหมวดหมู่ไม่สำเร็จ"
                                error={error}
                                onRetry={() => void fetchCategories()}
                            />
                        ) : categories.length > 0 ? (
                            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                {categories.map((category) => (
                                    <CategoryCard
                                        key={category.id}
                                        category={category}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onToggleActive={handleToggleActive}
                                        updatingStatusId={updatingStatusId}
                                        deletingId={deletingId}
                                        canUpdate={canUpdateCategory}
                                        canDelete={canDeleteCategory}
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
                                        activeColor="#0369a1"
                                    />
                                </div>
                            </Space>
                        ) : (
                            <UIEmptyState
                                title={debouncedSearch.trim() ? 'ไม่พบหมวดหมู่ตามคำค้น' : 'ยังไม่มีหมวดหมู่'}
                                description={
                                    debouncedSearch.trim()
                                        ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ'
                                        : 'เพิ่มหมวดหมู่แรกเพื่อเริ่มใช้งานเมนูแสตควัตถุดิบ'
                                }
                            />
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
