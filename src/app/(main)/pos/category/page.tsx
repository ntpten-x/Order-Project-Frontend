'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { message, Modal, Typography, Button, Input, Space, Segmented, Tag, Switch } from 'antd';
import {
    TagsOutlined,
    ShopOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined
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
import ListPagination from '../../../../components/ui/pagination/ListPagination';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { useDebouncedValue } from '../../../../utils/useDebouncedValue';

const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';

interface StatsCardProps {
    totalCategories: number;
    activeCategories: number;
    inactiveCategories: number;
}

const StatsCard = ({ totalCategories, activeCategories, inactiveCategories }: StatsCardProps) => (
    <div style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 8,
        padding: 14
    }}>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', display: 'block' }}>{totalCategories}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ทั้งหมด</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#0f766e', display: 'block' }}>{activeCategories}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ใช้งาน</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#b91c1c', display: 'block' }}>{inactiveCategories}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ปิดใช้งาน</Text>
        </div>
    </div>
);

interface CategoryCardProps {
    category: Category;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
    onToggleActive: (category: Category, next: boolean) => void;
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

const CategoryCard = ({ category, onEdit, onDelete, onToggleActive, updatingStatusId }: CategoryCardProps) => {
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
                        onClick={(checked, event) => {
                            event?.stopPropagation();
                            onToggleActive(category, checked);
                        }}
                    />
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
                            height: 36
                        }}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
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
    const isUrlReadyRef = useRef(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalCategories, setTotalCategories] = useState(0);
    const debouncedSearch = useDebouncedValue(searchText, 300);
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard();

    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    useEffect(() => {
        const cached = readCache<Category[]>('pos:categories', 5 * 60 * 1000);
        if (cached && cached.length > 0) {
            setCategories(cached);
        }
    }, []);

    useEffect(() => {
        if (isUrlReadyRef.current) return;
        const pageParam = parseInt(searchParams.get('page') || '1', 10);
        const limitParam = parseInt(searchParams.get('limit') || '20', 10);
        const qParam = searchParams.get('q') || '';
        const statusParam = searchParams.get('status');
        setPage(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);
        setPageSize(Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 20);
        setSearchText(qParam);
        setStatusFilter(statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all');
        isUrlReadyRef.current = true;
    }, [searchParams]);

    useEffect(() => {
        if (!isUrlReadyRef.current) return;
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(pageSize));
        if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
        if (statusFilter !== 'all') params.set('status', statusFilter);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [router, pathname, page, pageSize, debouncedSearch, statusFilter]);

    const fetchCategories = useCallback(async (nextPage: number = page, nextPageSize: number = pageSize) => {
        execute(async () => {
            const params = new URLSearchParams();
            params.set('page', String(nextPage));
            params.set('limit', String(nextPageSize));
            if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
            if (statusFilter !== 'all') params.set('status', statusFilter);
            const response = await fetch(`/api/pos/category?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลหมวดหมู่ได้');
            }
            const payload = await response.json();
            const data = Array.isArray(payload?.data) ? payload.data : [];
            if (!Array.isArray(data)) throw new Error('รูปแบบข้อมูลไม่ถูกต้อง');
            setCategories(data);
            setTotalCategories(typeof payload?.total === 'number' ? payload.total : 0);
            setPage(typeof payload?.page === 'number' ? payload.page : nextPage);
            setPageSize(nextPageSize);
        }, 'กำลังโหลดข้อมูลหมวดหมู่...');
    }, [execute, page, pageSize, debouncedSearch, statusFilter]);

    useEffect(() => {
        if (!isUrlReadyRef.current) return;
        if (isAuthorized) {
            fetchCategories();
        }
    }, [isAuthorized, fetchCategories, page, pageSize]);

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
        showLoading('กำลังเปิดหน้าจัดการหมวดหมู่...');
        router.push('/pos/category/manager/add');
    };

    const handleEdit = (category: Category) => {
        showLoading('กำลังเปิดหน้าแก้ไขหมวดหมู่...');
        router.push(`/pos/category/manager/edit/${category.id}`);
    };

    const handleDelete = (category: Category) => {
        Modal.confirm({
            title: 'ยืนยันการลบหมวดหมู่',
            content: `คุณต้องการลบหมวดหมู่ "${category.display_name}" หรือไม่?`,
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
                    await fetchCategories(page, pageSize);
                    message.success(`ลบหมวดหมู่ "${category.display_name}" สำเร็จ`);
                }, 'กำลังลบหมวดหมู่...');
            },
        });
    };

    const handleToggleActive = async (category: Category, next: boolean) => {
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

            await fetchCategories(page, pageSize);
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
                subtitle={`ทั้งหมด ${totalCategories} รายการ`}
                icon={<TagsOutlined />}
                actions={
                    <Space size={8} wrap>
                        <Button icon={<ShopOutlined />} onClick={() => router.push('/pos/products')}>
                            ไปหน้าสินค้า
                        </Button>
                        <Button icon={<ReloadOutlined />} onClick={fetchCategories} />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                            เพิ่มหมวดหมู่
                        </Button>
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <StatsCard
                        totalCategories={totalCategories}
                        activeCategories={activeCategories.length}
                        inactiveCategories={inactiveCategories.length}
                    />

                    <PageSection title="ค้นหาและตัวกรอง">
                        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr', alignItems: 'center' }}>
                            <Input
                                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                                allowClear
                                placeholder="ค้นหาจากชื่อแสดงหรือชื่อระบบ..."
                                value={searchText}
                                onChange={(e) => {
                                    setPage(1);
                                    setSearchText(e.target.value);
                                }}
                            />
                            <Segmented<StatusFilter>
                                options={[
                                    { label: `ทั้งหมด (${categories.length})`, value: 'all' },
                                    { label: `ใช้งาน (${activeCategories.length})`, value: 'active' },
                                    { label: `ปิดใช้งาน (${inactiveCategories.length})`, value: 'inactive' }
                                ]}
                                value={statusFilter}
                                onChange={(value) => {
                                    setPage(1);
                                    setStatusFilter(value);
                                }}
                            />
                        </div>
                    </PageSection>

                    <PageSection
                        title="รายการหมวดหมู่"
                        extra={<span style={{ fontWeight: 600 }}>{filteredCategories.length}</span>}
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
                                action={
                                    !searchText.trim() ? (
                                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                            เพิ่มหมวดหมู่
                                        </Button>
                                    ) : null
                                }
                            />
                        )}
                        <ListPagination
                            page={page}
                            pageSize={pageSize}
                            total={totalCategories}
                            onPageChange={setPage}
                            onPageSizeChange={(size) => {
                                setPage(1);
                                setPageSize(size);
                            }}
                        />
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
