'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Pagination, message, Modal, Space, Switch, Tag, Typography } from 'antd';
import { DeleteOutlined, DollarOutlined, EditOutlined, PercentageOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { Discounts, DiscountType } from '../../../../types/api/pos/discounts';
import { useGlobalLoading } from '../../../../contexts/pos/GlobalLoadingContext';
import { useSocket } from '../../../../hooks/useSocket';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { readCache, writeCache } from '../../../../utils/pos/cache';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { pageStyles, globalStyles } from '../../../../theme/pos/discounts/style';
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
import { useEffectivePermissions } from '../../../../hooks/useEffectivePermissions';
import { useListState } from '../../../../hooks/pos/useListState';
import { useRealtimeRefresh } from '../../../../utils/pos/realtime';
import { DEFAULT_CREATED_SORT } from '../../../../lib/list-sort';


const { Text } = Typography;
type StatusFilter = 'all' | 'active' | 'inactive';
type TypeFilter = 'all' | DiscountType.Fixed | DiscountType.Percentage;
type DiscountsCachePayload = { items: Discounts[]; total: number };
const DISCOUNTS_CACHE_KEY = 'pos:discounts:list:default-v3';
const DISCOUNTS_CACHE_TTL_MS = 60 * 1000;

const formatDate = (raw: string | Date) => {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const formatDiscountAmount = (discount: Discounts) => {
    const amount = Number(discount.discount_amount || 0);
    return discount.discount_type === DiscountType.Percentage
        ? `${amount.toLocaleString('th-TH')}%`
        : `${amount.toLocaleString('th-TH')} บาท`;
};

type DiscountCardProps = {
    discount: Discounts;
    canOpenManager: boolean;
    canToggleStatus: boolean;
    canDelete: boolean;
    onEdit: (discount: Discounts) => void;
    onDelete: (discount: Discounts) => void;
    onToggleActive: (discount: Discounts, next: boolean) => void;
    updatingStatusId: string | null;
    deletingId: string | null;
};

function DiscountCard({
    discount,
    canOpenManager,
    canToggleStatus,
    canDelete,
    onEdit,
    onDelete,
    onToggleActive,
    updatingStatusId,
    deletingId,
}: DiscountCardProps) {
    const isFixed = discount.discount_type === DiscountType.Fixed;
    return (
        <div
            className="discount-card"
            style={{ ...pageStyles.discountCard(discount.is_active), borderRadius: 16, cursor: canOpenManager ? 'pointer' : 'default' }}
            onClick={() => {
                if (!canOpenManager) return;
                onEdit(discount);
            }}
        >
            <div style={pageStyles.discountCardInner}>
                <div
                    style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        background: discount.is_active
                            ? isFixed ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' : 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)'
                            : '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    {isFixed ? <DollarOutlined style={{ fontSize: 22, color: discount.is_active ? '#2563eb' : '#94a3b8' }} /> : <PercentageOutlined style={{ fontSize: 22, color: discount.is_active ? '#7c3aed' : '#94a3b8' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <Text strong style={{ fontSize: 16, color: '#0f172a' }} ellipsis={{ tooltip: discount.display_name }}>{discount.display_name}</Text>
                        <Tag color={discount.is_active ? 'green' : 'default'} style={{ borderRadius: 999 }}>{discount.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}</Tag>
                        <Tag color={isFixed ? 'blue' : 'purple'} style={{ borderRadius: 999 }}>{isFixed ? 'ลดเป็นบาท' : 'ลดเปอร์เซ็นต์'}</Tag>
                    </div>
                    <Text style={{ fontSize: 13, display: 'block', marginTop: 4, color: '#b45309', fontWeight: 700 }}>{formatDiscountAmount(discount)}</Text>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>อัปเดตล่าสุด {formatDate(discount.create_date)}</Text>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Switch
                        size="small"
                        checked={discount.is_active}
                        loading={updatingStatusId === discount.id}
                        disabled={!canToggleStatus || deletingId === discount.id}
                        onClick={(checked, event) => {
                            event?.stopPropagation();
                            if (!canToggleStatus) return;
                            onToggleActive(discount, checked);
                        }}
                    />
                    {canOpenManager ? <Button type="text" icon={<EditOutlined />} onClick={(event) => { event.stopPropagation(); onEdit(discount); }} style={{ borderRadius: 10, color: '#b45309', background: '#fef3c7', width: 36, height: 36 }} /> : null}
                    {canDelete ? <Button type="text" danger loading={deletingId === discount.id} icon={deletingId === discount.id ? undefined : <DeleteOutlined />} onClick={(event) => { event.stopPropagation(); onDelete(discount); }} style={{ borderRadius: 10, background: '#fef2f2', width: 36, height: 36 }} /> : null}
                </div>
            </div>
        </div>
    );
}

export default function DiscountsPage() {
    const router = useRouter();
    const [discounts, setDiscounts] = useState<Discounts[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [hasCachedSnapshot, setHasCachedSnapshot] = useState(false);
    const requestRef = useRef<AbortController | null>(null);
    const cacheHydratedRef = useRef(false);
    const { searchText, setSearchText, debouncedSearch, page, setPage, pageSize, setPageSize, createdSort, setCreatedSort, filters, updateFilter, total, setTotal, getQueryParams, isUrlReady } = useListState<{ status: StatusFilter; type: TypeFilter }>({ defaultPageSize: 10, defaultFilters: { status: 'all', type: 'all' } });
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canViewDiscounts = can('discounts.page', 'view');
    const canSearchDiscounts = can('discounts.search.feature', 'view');
    const canFilterDiscounts = can('discounts.filter.feature', 'view');
    const canOpenDiscountsManager = can('discounts.manager.feature', 'access');
    const canCreateDiscounts = can('discounts.page', 'create') && can('discounts.create.feature', 'create') && canOpenDiscountsManager;
    const canEditDiscountMetadata = can('discounts.page', 'update') && can('discounts.edit.feature', 'update') && canOpenDiscountsManager;
    const canEditDiscountPricing = can('discounts.page', 'update') && can('discounts.pricing.feature', 'update') && canOpenDiscountsManager;
    const canToggleDiscountStatus = can('discounts.page', 'update') && can('discounts.status.feature', 'update') && canOpenDiscountsManager;
    const canDeleteDiscounts = can('discounts.page', 'delete') && can('discounts.delete.feature', 'delete') && canOpenDiscountsManager;
    const canOpenDiscountEditWorkspace = canOpenDiscountsManager && (canEditDiscountMetadata || canEditDiscountPricing || canToggleDiscountStatus || canDeleteDiscounts);
    const currentRoleName = String(user?.role ?? '').trim().toLowerCase();
    const isDefaultListView = useMemo(() => page === 1 && pageSize === 10 && createdSort === DEFAULT_CREATED_SORT && !debouncedSearch.trim() && filters.status === 'all' && filters.type === 'all', [createdSort, debouncedSearch, filters.status, filters.type, page, pageSize]);

    useEffect(() => { void getCsrfTokenCached(); }, []);
    useEffect(() => () => { requestRef.current?.abort(); }, []);

    useEffect(() => {
        if (!isUrlReady || !isAuthorized || !isDefaultListView || cacheHydratedRef.current) return;
        cacheHydratedRef.current = true;
        const cached = readCache<DiscountsCachePayload>(DISCOUNTS_CACHE_KEY, DISCOUNTS_CACHE_TTL_MS);
        if (!cached) return;
        setDiscounts(cached.items || []);
        setTotal(cached.total || 0);
        setHasCachedSnapshot(true);
        setLoading(false);
    }, [isAuthorized, isDefaultListView, isUrlReady, setTotal]);

    useEffect(() => {
        if (!isDefaultListView || loading) return;
        writeCache<DiscountsCachePayload>(DISCOUNTS_CACHE_KEY, { items: discounts, total });
    }, [discounts, isDefaultListView, loading, total]);

    useEffect(() => {
        if (!canSearchDiscounts && searchText) setSearchText('');
    }, [canSearchDiscounts, searchText, setSearchText]);

    useEffect(() => {
        if (!canFilterDiscounts && filters.status !== 'all') updateFilter('status', 'all');
        if (!canFilterDiscounts && filters.type !== 'all') updateFilter('type', 'all');
    }, [canFilterDiscounts, filters.status, filters.type, updateFilter]);

    useEffect(() => {
        if (!canFilterDiscounts && createdSort !== DEFAULT_CREATED_SORT) setCreatedSort(DEFAULT_CREATED_SORT);
    }, [canFilterDiscounts, createdSort, setCreatedSort]);

    const fetchDiscounts = useCallback(async (options?: { background?: boolean }) => {
        if (!isAuthorized) return;
        requestRef.current?.abort();
        const controller = new AbortController();
        requestRef.current = controller;
        const background = options?.background === true;
        if (background) setRefreshing(true);
        else setLoading(true);
        setError(null);
        try {
            const params = getQueryParams();
            if (!canSearchDiscounts) params.delete('q');
            if (!canFilterDiscounts) {
                params.delete('status');
                params.delete('type');
                params.delete('sort_created');
            }
            const response = await fetch(`/api/pos/discounts?${params.toString()}`, { cache: 'no-store', signal: controller.signal });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลส่วนลดได้');
            }
            const payload = await response.json();
            if (controller.signal.aborted) return;
            setDiscounts(payload.data || []);
            setTotal(payload.total || 0);
        } catch (fetchError) {
            if (controller.signal.aborted) return;
            setError(fetchError instanceof Error ? fetchError : new Error('ไม่สามารถดึงข้อมูลส่วนลดได้'));
        } finally {
            if (requestRef.current === controller) requestRef.current = null;
            if (!controller.signal.aborted) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, [canFilterDiscounts, canSearchDiscounts, getQueryParams, isAuthorized, setTotal]);

    useEffect(() => {
        if (isUrlReady && isAuthorized) void fetchDiscounts({ background: hasCachedSnapshot });
    }, [fetchDiscounts, hasCachedSnapshot, isAuthorized, isUrlReady]);

    useRealtimeRefresh({
        socket,
        events: [RealtimeEvents.discounts.create, RealtimeEvents.discounts.update, RealtimeEvents.discounts.delete],
        enabled: isAuthorized && isUrlReady,
        debounceMs: 250,
        onRefresh: () => { void fetchDiscounts({ background: true }); },
    });

    const handleAdd = () => {
        if (!canCreateDiscounts) {
            message.warning('คุณไม่มีสิทธิ์เพิ่มส่วนลด');
            return;
        }
        showLoading('กำลังเปิดหน้าจัดการส่วนลด...');
        router.push('/pos/discounts/manager/add');
    };

    const handleEdit = (discount: Discounts) => {
        if (!canOpenDiscountEditWorkspace) {
            message.warning('คุณไม่มีสิทธิ์แก้ไขส่วนลด');
            return;
        }
        showLoading('กำลังเปิดหน้าแก้ไขส่วนลด...');
        router.push(`/pos/discounts/manager/edit/${discount.id}`);
    };

    const handleDelete = (discount: Discounts) => {
        if (!canDeleteDiscounts) {
            message.warning('คุณไม่มีสิทธิ์ลบส่วนลด');
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
                setDeletingId(discount.id);
                try {
                    const csrfToken = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/discounts/delete/${discount.id}`, { method: 'DELETE', headers: { 'X-CSRF-Token': csrfToken } });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || errorData.message || 'ไม่สามารถลบส่วนลดได้');
                    }
                    const shouldMoveToPreviousPage = page > 1 && discounts.length === 1;
                    setDiscounts((prev) => prev.filter((item) => item.id !== discount.id));
                    setTotal((prev) => Math.max(prev - 1, 0));
                    if (shouldMoveToPreviousPage) setPage(page - 1);
                    else void fetchDiscounts({ background: true });
                    message.success(`ลบส่วนลด "${discount.display_name}" สำเร็จ`);
                } catch (deleteError) {
                    message.error(deleteError instanceof Error ? deleteError.message : 'ไม่สามารถลบส่วนลดได้');
                } finally {
                    setDeletingId(null);
                }
            },
        });
    };

    const handleToggleActive = async (discount: Discounts, next: boolean) => {
        if (!canToggleDiscountStatus) {
            message.warning('คุณไม่มีสิทธิ์เปลี่ยนสถานะส่วนลด');
            return;
        }
        setUpdatingStatusId(discount.id);
        try {
            const csrfToken = await getCsrfTokenCached();
            const response = await fetch(`/api/pos/discounts/update/${discount.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
                body: JSON.stringify({ is_active: next }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถเปลี่ยนสถานะส่วนลดได้');
            }
            const updated = await response.json();
            setDiscounts((prev) => prev.map((item) => (item.id === discount.id ? updated : item)));
            void fetchDiscounts({ background: true });
            message.success(next ? 'เปิดใช้งานส่วนลดแล้ว' : 'ปิดใช้งานส่วนลดแล้ว');
        } catch (toggleError) {
            message.error(toggleError instanceof Error ? toggleError.message : 'ไม่สามารถเปลี่ยนสถานะส่วนลดได้');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    if (isChecking) return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    if (!isAuthorized) return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    if (permissionLoading) return <AccessGuardFallback message="กำลังโหลดสิทธิ์ผู้ใช้งาน..." />;

    return (
        <div className="discount-page" style={pageStyles.container}>
            <style>{globalStyles}</style>
            <UIPageHeader
                title="ส่วนลด"
                icon={<PercentageOutlined />}
                actions={
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => void fetchDiscounts({ background: discounts.length > 0 })} />
                        {canCreateDiscounts ? <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>เพิ่มส่วนลด</Button> : null}
                    </Space>
                }
            />
            <PageContainer>
                <PageStack>
                    
                    
                    <SearchBar>
                        <SearchInput placeholder="ค้นหา" value={searchText} onChange={setSearchText} disabled={!canSearchDiscounts} />
                        <Space wrap size={10} style={{ justifyContent: 'space-between', width: '100%' }}>
                            <Space wrap size={10}>
                                <ModalSelector<StatusFilter> title="เลือกสถานะ" options={[{ label: 'ทั้งหมด', value: 'all' }, { label: 'ใช้งาน', value: 'active' }, { label: 'ปิดใช้งาน', value: 'inactive' }]} value={filters.status} onChange={(value) => updateFilter('status', value)} style={{ minWidth: 120 }} disabled={!canFilterDiscounts} />
                                <ModalSelector<TypeFilter> title="เลือกประเภท" options={[{ label: 'ทั้งหมด', value: 'all' }, { label: 'ลดเป็นบาท', value: DiscountType.Fixed }, { label: 'ลดเปอร์เซ็นต์', value: DiscountType.Percentage }]} value={filters.type} onChange={(value) => updateFilter('type', value)} style={{ minWidth: 140 }} disabled={!canFilterDiscounts} />
                                <ModalSelector<CreatedSort> title="เรียงลำดับ" options={[{ label: 'เก่าก่อน', value: 'old' }, { label: 'ใหม่ก่อน', value: 'new' }]} value={createdSort} onChange={setCreatedSort} style={{ minWidth: 120 }} disabled={!canFilterDiscounts} />
                            </Space>
                        </Space>
                    </SearchBar>
                    {!canSearchDiscounts || !canFilterDiscounts ? <Alert type="warning" showIcon message="บาง control ถูกล็อกตามสิทธิ์" description={`Search ${canSearchDiscounts ? 'พร้อมใช้งาน' : 'ถูกปิด'} | Filter/Sort ${canFilterDiscounts ? 'พร้อมใช้งาน' : 'ถูกปิด'}`} /> : null}
                    <PageSection title="รายการส่วนลด" extra={<Space size={8} wrap>{refreshing ? <Tag color="processing">กำลังอัปเดตข้อมูล</Tag> : null}<span style={{ fontWeight: 600 }}>{total} รายการ</span><span></span></Space>}>
                        {loading && discounts.length === 0 ? <PageState status="loading" title="กำลังโหลดข้อมูลส่วนลด..." /> : error && discounts.length === 0 ? <PageState status="error" title="โหลดข้อมูลส่วนลดไม่สำเร็จ" error={error} onRetry={() => void fetchDiscounts()} /> : discounts.length > 0 ? <Space direction="vertical" size={16} style={{ width: '100%' }}>{discounts.map((discount) => <DiscountCard key={discount.id} discount={discount} canOpenManager={canOpenDiscountEditWorkspace} canToggleStatus={canToggleDiscountStatus} canDelete={canDeleteDiscounts} onEdit={handleEdit} onDelete={handleDelete} onToggleActive={handleToggleActive} updatingStatusId={updatingStatusId} deletingId={deletingId} />)}<div className="pos-pagination-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 16, position: 'relative', width: '100%', borderTop: '1px solid #E2E8F0', paddingTop: 16 }}><div className="pos-pagination-total" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}><Text type="secondary" style={{ fontSize: 13, color: '#64748B' }}>ทั้งหมด {total} รายการ</Text></div><Pagination current={page} total={total} pageSize={pageSize} onChange={(nextPage) => setPage(nextPage)} showSizeChanger={false} /></div></Space> : <UIEmptyState title={debouncedSearch.trim() ? 'ไม่พบส่วนลดตามคำค้น' : 'ยังไม่มีส่วนลด'} description={debouncedSearch.trim() ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง แล้วค้นหาอีกครั้ง' : canCreateDiscounts ? 'เพิ่มส่วนลดแรกเพื่อให้ทีมงานเลือกใช้งานบนหน้า POS ได้ทันที' : 'บัญชีนี้ดูรายการส่วนลดได้ แต่ยังไม่มีสิทธิ์สร้างหรือแก้ไขกติกาส่วนลด'} />}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
