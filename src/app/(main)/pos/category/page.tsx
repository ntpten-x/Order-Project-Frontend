'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, message, Modal, Typography, Button, Pagination, Space, Tag, Switch } from 'antd';
import {
    TagsOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { Category } from '../../../../types/api/pos/category';
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
import { type CreatedSort } from '../../../../components/ui/pagination/ListPagination';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { DEFAULT_CREATED_SORT } from '../../../../lib/list-sort';
import { ModalSelector } from '../../../../components/ui/select/ModalSelector';
import { SearchBar } from '../../../../components/ui/page/SearchBar';
import { SearchInput } from '@/components/ui/input/SearchInput';
import { useEffectivePermissions } from '../../../../hooks/useEffectivePermissions';
import { useListState } from '../../../../hooks/pos/useListState';
import { useRealtimeRefresh } from '../../../../utils/pos/realtime';


const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';
type CategoryCachePayload = {
    items: Category[];
    total: number;
};

const CATEGORY_CACHE_KEY = 'pos:category:list:default-v1';
const CATEGORY_CACHE_TTL_MS = 60 * 1000;

interface CategoryCardProps {
    category: Category;
    canOpenManager: boolean;
    canToggleStatus: boolean;
    canDelete: boolean;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
    onToggleActive: (category: Category, next: boolean) => void;
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

const CategoryCard = ({
    category,
    onEdit,
    onDelete,
    onToggleActive,
    updatingStatusId,
    deletingId,
    canOpenManager,
    canToggleStatus,
    canDelete,
}: CategoryCardProps) => {
    return (
        <div
            className="category-card"
            style={{
                ...pageStyles.categoryCard(category.is_active),
                borderRadius: 16,
                cursor: canOpenManager ? 'pointer' : 'default',
            }}
            onClick={() => {
                if (!canOpenManager) return;
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
                        อัปเดตล่าสุด {formatDate(category.update_date)}
                    </Text>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Switch
                        size="small"
                        checked={category.is_active}
                        loading={updatingStatusId === category.id}
                        disabled={!canToggleStatus || deletingId === category.id}
                        onClick={(checked, event) => {
                            event?.stopPropagation();
                            if (!canToggleStatus) return;
                            onToggleActive(category, checked);
                        }}
                    />
                    {canOpenManager ? (
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

export default function CategoryPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
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
    const canViewCategory = can('category.page', 'view');
    const canSearchCategory = can('category.search.feature', 'view');
    const canFilterCategory = can('category.filter.feature', 'view');
    const canOpenCategoryManager = can('category.manager.feature', 'access');
    const canCreateCategory = can('category.page', 'create') && can('category.create.feature', 'create') && canOpenCategoryManager;
    const canEditCategory = can('category.page', 'update') && can('category.edit.feature', 'update') && canOpenCategoryManager;
    const canToggleCategoryStatus = can('category.page', 'update') && can('category.status.feature', 'update') && canOpenCategoryManager;
    const canDeleteCategory = can('category.page', 'delete') && can('category.delete.feature', 'delete') && canOpenCategoryManager;
    const canOpenCategoryEditWorkspace = canOpenCategoryManager && (canEditCategory || canToggleCategoryStatus || canDeleteCategory);


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
        const cached = readCache<CategoryCachePayload>(CATEGORY_CACHE_KEY, CATEGORY_CACHE_TTL_MS);
        if (!cached) return;

        setCategories(cached.items || []);
        setTotal(cached.total || 0);
        setHasCachedSnapshot(true);
        setLoading(false);
    }, [isAuthorized, isDefaultListView, isUrlReady, setTotal]);

    useEffect(() => {
        if (!isDefaultListView || loading) return;
        writeCache<CategoryCachePayload>(CATEGORY_CACHE_KEY, {
            items: categories,
            total,
        });
    }, [categories, isDefaultListView, loading, total]);

    useEffect(() => {
        if (!canSearchCategory && searchText) {
            setSearchText('');
        }
    }, [canSearchCategory, searchText, setSearchText]);

    useEffect(() => {
        if (!canFilterCategory && filters.status !== 'all') {
            updateFilter('status', 'all');
        }
    }, [canFilterCategory, filters.status, updateFilter]);

    useEffect(() => {
        if (!canFilterCategory && createdSort !== DEFAULT_CREATED_SORT) {
            setCreatedSort(DEFAULT_CREATED_SORT);
        }
    }, [canFilterCategory, createdSort, setCreatedSort]);

    const fetchCategories = useCallback(
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
                if (!canSearchCategory) {
                    params.delete('q');
                }
                if (!canFilterCategory) {
                    params.delete('status');
                    params.delete('sort_created');
                }
                const response = await fetch(`/api/pos/category?${params.toString()}`, {
                    cache: 'no-store',
                    signal: controller.signal,
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลหมวดหมู่ได้');
                }

                const payload = await response.json();
                if (controller.signal.aborted) return;

                setCategories(payload.data || []);
                setTotal(payload.total || 0);
            } catch (fetchError) {
                if (controller.signal.aborted) return;
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
        [canFilterCategory, canSearchCategory, getQueryParams, isAuthorized, setTotal]
    );

    useEffect(() => {
        if (isUrlReady && isAuthorized) {
            void fetchCategories({ background: hasCachedSnapshot });
        }
    }, [fetchCategories, hasCachedSnapshot, isAuthorized, isUrlReady]);

    useRealtimeRefresh({
        socket,
        events: [
            RealtimeEvents.categories.create,
            RealtimeEvents.categories.update,
            RealtimeEvents.categories.delete,
        ],
        enabled: isAuthorized && isUrlReady,
        debounceMs: 250,
        onRefresh: () => {
            void fetchCategories({ background: true });
        },
    });

    const handleAdd = () => {
        if (!canCreateCategory) {
            message.warning('คุณไม่มีสิทธิ์เพิ่มหมวดหมู่');
            return;
        }
        showLoading('กำลังเปิดหน้าจัดการหมวดหมู่...');
        router.push('/pos/category/manager/add');
    };

    const handleEdit = (category: Category) => {
        if (!canOpenCategoryEditWorkspace) {
            message.warning('คุณไม่มีสิทธิ์แก้ไขหมวดหมู่');
            return;
        }
        showLoading('กำลังเปิดหน้าแก้ไขหมวดหมู่...');
        router.push(`/pos/category/manager/edit/${category.id}`);
    };

    const handleDelete = (category: Category) => {
        if (!canDeleteCategory) {
            message.warning('คุณไม่มีสิทธิ์ลบหมวดหมู่');
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
                    const csrfToken = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/category/delete/${category.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken,
                        },
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || errorData.message || 'ไม่สามารถลบหมวดหมู่ได้');
                    }

                    const shouldMoveToPreviousPage = page > 1 && categories.length === 1;
                    setCategories((prev) => prev.filter((item) => item.id !== category.id));
                    setTotal((prev) => Math.max(prev - 1, 0));
                    if (shouldMoveToPreviousPage) {
                        setPage(page - 1);
                    } else {
                        void fetchCategories({ background: true });
                    }
                    message.success(`ลบหมวดหมู่ "${category.display_name}" สำเร็จ`);
                } catch (deleteError) {
                    message.error(deleteError instanceof Error ? deleteError.message : 'ไม่สามารถลบหมวดหมู่ได้');
                } finally {
                    setDeletingId(null);
                }
            },
        });
    };

    const handleToggleActive = async (category: Category, next: boolean) => {
        if (!canToggleCategoryStatus) {
            message.warning('คุณไม่มีสิทธิ์เปลี่ยนสถานะหมวดหมู่');
            return;
        }
        setUpdatingStatusId(category.id);
        try {
            const csrfToken = await getCsrfTokenCached();
            const response = await fetch(`/api/pos/category/update/${category.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                body: JSON.stringify({ is_active: next }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถเปลี่ยนสถานะหมวดหมู่ได้');
            }

            const updated = await response.json();
            setCategories((prev) => prev.map((item) => (item.id === category.id ? updated : item)));
            message.success(next ? 'เปิดใช้งานหมวดหมู่แล้ว' : 'ปิดใช้งานหมวดหมู่แล้ว');
        } catch (toggleError) {
            message.error(toggleError instanceof Error ? toggleError.message : 'ไม่สามารถเปลี่ยนสถานะหมวดหมู่ได้');
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

    return (
        <div className="category-page" style={pageStyles.container}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="หมวดหมู่สินค้า"
                icon={<TagsOutlined />}
                actions={
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => void fetchCategories({ background: categories.length > 0 })}>
                        </Button>
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
                            disabled={!canSearchCategory}
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
                                    disabled={!canFilterCategory}
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
                                    disabled={!canFilterCategory}
                                />
                            </Space>
                        </Space>
                    </SearchBar>

                    {!canSearchCategory || !canFilterCategory ? (
                        <Alert
                            type="warning"
                            showIcon
                            message="บาง control ถูกล็อกตามสิทธิ์"
                            description={`Search ${canSearchCategory ? 'พร้อมใช้งาน' : 'ถูกปิด'} | Filter/Sort ${canFilterCategory ? 'พร้อมใช้งาน' : 'ถูกปิด'}`}
                        />
                    ) : null}

                    <PageSection
                        title="รายการหมวดหมู่"
                        extra={
                            <Space size={8} wrap>
                                {refreshing ? <Tag color="processing">กำลังอัปเดตข้อมูล</Tag> : null}
                                <span style={{ fontWeight: 600 }}>{total} รายการ</span>
                                <span></span>
                            </Space>
                        }
                    >
                        {loading && categories.length === 0 ? (
                            <PageState status="loading" title="กำลังโหลดข้อมูลหมวดหมู่..." />
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
                                        canOpenManager={canOpenCategoryEditWorkspace}
                                        canToggleStatus={canToggleCategoryStatus}
                                        canDelete={canDeleteCategory}
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
                                title={debouncedSearch.trim() ? 'ไม่พบหมวดหมู่ตามคำค้น' : 'ยังไม่มีหมวดหมู่'}
                                description={
                                    debouncedSearch.trim()
                                        ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ'
                                        : canCreateCategory
                                            ? 'เพิ่มหมวดหมู่แรกเพื่อเริ่มใช้งานเมนูสินค้าใน POS'
                                            : 'บัญชีนี้ดูรายการได้ แต่ไม่สามารถสร้างหมวดหมู่ใหม่'
                                }
                            />
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
