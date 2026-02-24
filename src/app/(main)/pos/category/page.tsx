'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { message, Modal, Typography, Button, Space, Tag, Switch } from 'antd';
import {
    TagsOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { Category } from '../../../../types/api/pos/category';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useGlobalLoading } from '../../../../contexts/pos/GlobalLoadingContext';
import { useAsyncAction } from '../../../../hooks/useAsyncAction';
import { useSocket } from '../../../../hooks/useSocket';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { useRealtimeList } from '../../../../utils/pos/realtime';
import { readCache, writeCache } from '../../../../utils/pos/cache';
import { pageStyles, globalStyles } from '../../../../theme/pos/category/style';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import PageContainer from '../../../../components/ui/page/PageContainer';
import PageSection from '../../../../components/ui/page/PageSection';
import PageStack from '../../../../components/ui/page/PageStack';
import UIPageHeader from '../../../../components/ui/page/PageHeader';
import UIEmptyState from '../../../../components/ui/states/EmptyState';
import ListPagination, { type CreatedSort } from '../../../../components/ui/pagination/ListPagination';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { ModalSelector } from "../../../../components/ui/select/ModalSelector";
import { StatsGroup } from "../../../../components/ui/card/StatsGroup";
import { SearchBar } from "../../../../components/ui/page/SearchBar";
import { useEffectivePermissions } from '../../../../hooks/useEffectivePermissions';
import { useListState } from '../../../../hooks/pos/useListState';
import { useAuth } from '../../../../contexts/AuthContext';
import { SearchInput } from '@/components/ui/input/SearchInput';
const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';



interface CategoryCardProps {
    category: Category;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
    onToggleActive: (category: Category, next: boolean) => void;
    updatingStatusId: string | null;
    canUpdate: boolean;
    canDelete: boolean;
}

const formatDate = (raw: string | Date) => {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
};

const CategoryCard = ({
    category,
    onEdit,
    onDelete,
    onToggleActive,
    updatingStatusId,
    canUpdate,
    canDelete,
}: CategoryCardProps) => {
    return (
        <div
            className="category-card"
            style={{
                ...pageStyles.categoryCard(category.is_active),
                borderRadius: 16,
            }}
            onClick={() => onEdit(category)}
        >
            <div style={pageStyles.categoryCardInner}>
                <div style={{
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
                    boxShadow: category.is_active ? '0 4px 10px rgba(15, 118, 110, 0.18)' : 'none'
                }}>
                    <TagsOutlined style={{
                        fontSize: 22,
                        color: category.is_active ? '#0f766e' : '#94a3b8'
                    }} />
                </div>

                <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text
                            strong
                            style={{
                                fontSize: 16,
                                color: '#0f172a'
                            }}
                            ellipsis={{ tooltip: category.display_name }}
                        >
                            {category.display_name}
                        </Text>
                        <Tag color={category.is_active ? 'green' : 'default'}>
                            {category.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </Tag>
                    </div>
                    <Text
                        type="secondary"
                        style={{ fontSize: 13, display: 'block', color: '#334155' }}
                        ellipsis={{ tooltip: category.category_name }}
                    >
                        {category.category_name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                        อัปเดตล่าสุด {formatDate(category.update_date)}
                    </Text>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Switch
                        size="small"
                        checked={category.is_active}
                        loading={updatingStatusId === category.id}
                        disabled={!canUpdate}
                        onClick={(checked, event) => {
                            event?.stopPropagation();
                            if (!canUpdate) return;
                            onToggleActive(category, checked);
                        }}
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        disabled={!canUpdate}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!canUpdate) return;
                            onEdit(category);
                        }}
                        style={{
                            borderRadius: 10,
                            color: '#0369a1',
                            background: '#e0f2fe',
                            width: 36,
                            height: 36
                        }}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        disabled={!canDelete}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!canDelete) return;
                            onDelete(category);
                        }}
                        style={{
                            borderRadius: 10,
                            background: '#fef2f2',
                            width: 36,
                            height: 36
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default function CategoryPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [categories, setCategories] = useState<Category[]>([]);
    const {
        page, setPage,
        pageSize, setPageSize,
        total, setTotal,
        searchText, setSearchText,
        debouncedSearch,
        createdSort, setCreatedSort,
        filters, updateFilter,
        getQueryParams,
        isUrlReady
    } = useListState({
        defaultPageSize: 10,
        defaultFilters: {
            status: 'all' as StatusFilter,
        }
    });

    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard();
    const { user } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreateCategory = can("category.page", "create");
    const canUpdateCategory = can("category.page", "update");
    const canDeleteCategory = can("category.page", "delete");

    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    useEffect(() => {
        const cached = readCache<Category[]>('pos:categories', 5 * 60 * 1000);
        if (cached && cached.length > 0) {
            setCategories(cached);
        }
    }, []);

    // URL sync managed by useListState hook

    const fetchCategories = useCallback(async () => {
        execute(async () => {
            const params = getQueryParams();
            const response = await fetch(`/api/pos/category?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลหมวดหมู่ได้');
            }
            const payload = await response.json();
            const data = Array.isArray(payload?.data) ? payload.data : [];
            if (!Array.isArray(data)) throw new Error('รูปแบบข้อมูลไม่ถูกต้อง');
            setCategories(data);
            setTotal(typeof payload?.total === 'number' ? payload.total : 0);
        }, 'กำลังโหลดข้อมูลหมวดหมู่...');
    }, [execute, getQueryParams, setTotal]);

    useEffect(() => {
        if (isUrlReady && isAuthorized) {
            fetchCategories();
        }
    }, [isUrlReady, isAuthorized, fetchCategories]);

    useRealtimeList(
        socket,
        { create: RealtimeEvents.categories.create, update: RealtimeEvents.categories.update, delete: RealtimeEvents.categories.delete },
        setCategories
    );

    const filteredCategories = useMemo(() => categories, [categories]);

    useEffect(() => {
        if (categories.length > 0) {
            writeCache('pos:categories', categories);
        }
    }, [categories]);

    const handleAdd = () => {
        if (!canCreateCategory) {
            message.warning('คุณไม่มีสิทธิ์เพิ่มหมวดหมู่');
            return;
        }
        showLoading('กำลังเปิดหน้าจัดการหมวดหมู่...');
        router.push('/pos/category/manager/add');
    };

    const handleEdit = (category: Category) => {
        if (!canUpdateCategory) {
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
                await execute(async () => {
                    const csrfToken = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/category/delete/${category.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) {
                        throw new Error('ไม่สามารถลบหมวดหมู่ได้');
                    }
                    await fetchCategories();
                    message.success(`ลบหมวดหมู่ "${category.display_name}" สำเร็จ`);
                }, 'กำลังลบหมวดหมู่...');
            },
        });
    };

    const handleToggleActive = async (category: Category, next: boolean) => {
        if (!canUpdateCategory) {
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
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({ is_active: next })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถเปลี่ยนสถานะหมวดหมู่ได้');
            }

            await fetchCategories();
            message.success(next ? 'เปิดใช้งานหมวดหมู่แล้ว' : 'ปิดใช้งานหมวดหมู่แล้ว');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถเปลี่ยนสถานะหมวดหมู่ได้');
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

    const activeCategories = categories.filter(c => c.is_active);
    const inactiveCategories = categories.filter(c => !c.is_active);

    return (
        <div className="category-page" style={pageStyles.container}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="หมวดหมู่สินค้า"
                icon={<TagsOutlined />}
                actions={
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} onClick={() => { void fetchCategories(); }} />
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                            disabled={permissionLoading || !canCreateCategory}
                        >
                            เพิ่มหมวดหมู่
                        </Button>
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <StatsGroup
                        stats={[
                            { label: 'ทั้งหมด', value: total, color: '#0f172a' },
                            { label: 'ใช้งาน', value: activeCategories.length, color: '#0f766e' },
                            { label: 'ปิดใช้งาน', value: inactiveCategories.length, color: '#b91c1c' },
                        ]}
                    />

                    <SearchBar>
                        <SearchInput
                            placeholder="ค้นหา"
                            value={searchText}
                            onChange={(val) => {
                                setPage(1);
                                setSearchText(val);
                            }}
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
                            <ModalSelector<CreatedSort>
                                title="เรียงลำดับ"
                                options={[
                                    { label: 'เรียงจากเก่าก่อน', value: 'old' },
                                    { label: 'เรียงจากใหม่ก่อน', value: 'new' },
                                ]}
                                value={createdSort}
                                onChange={(value) => setCreatedSort(value)}
                                style={{ minWidth: 120 }}
                            />
                        </Space>
                    </SearchBar>

                    <PageSection
                        title="รายการหมวดหมู่"
                        extra={<span style={{ fontWeight: 600 }}>{filteredCategories.length} รายการ</span>}
                    >
                        {filteredCategories.length > 0 ? (
                            filteredCategories.map((category) => (
                                <CategoryCard
                                    key={category.id}
                                    category={category}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onToggleActive={handleToggleActive}
                                    updatingStatusId={updatingStatusId}
                                    canUpdate={canUpdateCategory}
                                    canDelete={canDeleteCategory}
                                />
                            ))
                        ) : (
                            <UIEmptyState
                                title={
                                    searchText.trim()
                                        ? 'ไม่พบหมวดหมู่ตามคำค้น'
                                        : 'ยังไม่มีหมวดหมู่'
                                }
                                description={
                                    searchText.trim()
                                        ? 'ลองเปลี่ยนคำค้น หรือตัวกรองสถานะ'
                                        : 'เพิ่มหมวดหมู่แรกเพื่อเริ่มใช้งาน'
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
                            />
                        </div>
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
