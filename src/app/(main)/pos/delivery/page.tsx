'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Typography, Button, Space, Tag, Switch } from 'antd';
import {
    CarOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { Delivery } from '../../../../types/api/pos/delivery';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useGlobalLoading } from '../../../../contexts/pos/GlobalLoadingContext';
import { useAsyncAction } from '../../../../hooks/useAsyncAction';
import { useSocket } from '../../../../hooks/useSocket';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { useRealtimeList } from '../../../../utils/pos/realtime';
import { readCache, writeCache } from '../../../../utils/pos/cache';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { pageStyles, globalStyles } from '../../../../theme/pos/delivery/style';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import PageContainer from '../../../../components/ui/page/PageContainer';
import PageSection from '../../../../components/ui/page/PageSection';
import PageStack from '../../../../components/ui/page/PageStack';
import UIPageHeader from '../../../../components/ui/page/PageHeader';
import UIEmptyState from '../../../../components/ui/states/EmptyState';
import type { CreatedSort } from '../../../../components/ui/pagination/ListPagination';
import ListPagination from '../../../../components/ui/pagination/ListPagination';
import { DEFAULT_CREATED_SORT } from '../../../../lib/list-sort';
import { ModalSelector } from "../../../../components/ui/select/ModalSelector";
import { StatsGroup } from "../../../../components/ui/card/StatsGroup";
import { SearchInput } from "../../../../components/ui/input/SearchInput";
import { SearchBar } from "../../../../components/ui/page/SearchBar";
import { resolveImageSource } from "../../../../utils/image/source";
import { useEffectivePermissions } from "../../../../hooks/useEffectivePermissions";
import SmartAvatar from "../../../../components/ui/image/SmartAvatar";
import { useListState } from '../../../../hooks/pos/useListState';

const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';

interface DeliveryCardProps {
    delivery: Delivery;
    canUpdate: boolean;
    canDelete: boolean;
    onEdit: (delivery: Delivery) => void;
    onDelete: (delivery: Delivery) => void;
    onToggleActive: (delivery: Delivery, next: boolean) => void;
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



const DeliveryCard = ({ delivery, canUpdate, canDelete, onEdit, onDelete, onToggleActive, updatingStatusId }: DeliveryCardProps) => {
    const logoSource = resolveImageSource(delivery.logo);
    return (
        <div
            className="delivery-card"
            style={{
                ...pageStyles.deliveryCard(delivery.is_active),
                borderRadius: 16,
                cursor: canUpdate ? "pointer" : "default",
            }}
            onClick={() => {
                if (!canUpdate) return;
                onEdit(delivery);
            }}
        >
            <div style={pageStyles.deliveryCardInner}>
                <SmartAvatar
                    src={delivery.logo}
                    alt={delivery.delivery_name}
                    shape="square"
                    size={52}
                    icon={<CarOutlined />}
                    imageStyle={{ objectFit: "contain" }}
                    style={{
                        borderRadius: 14,
                        background: delivery.is_active
                            ? 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)'
                            : '#f1f5f9',
                        color: delivery.is_active ? '#0891B2' : '#94a3b8',
                        boxShadow: delivery.is_active ? '0 4px 10px rgba(8, 145, 178, 0.18)' : 'none',
                        border: logoSource ? '1px solid #dbeafe' : undefined,
                    }}
                />

                <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text
                            strong
                            style={{
                                fontSize: 16,
                                color: '#0f172a'
                            }}
                            ellipsis={{ tooltip: delivery.delivery_name }}
                        >
                            {delivery.delivery_name}
                        </Text>
                        <Tag color={delivery.is_active ? 'green' : 'default'}>
                            {delivery.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </Tag>
                    </div>

                    <Text type="secondary" style={{ fontSize: 13, display: 'block', color: '#334155' }}>
                        รหัสย่อ : {delivery.delivery_prefix || '-'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                        อัปเดตล่าสุด {formatDate(delivery.update_date)}
                    </Text>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Switch
                        size="small"
                        checked={delivery.is_active}
                        loading={updatingStatusId === delivery.id}
                        disabled={!canUpdate}
                        onClick={(checked, event) => {
                            if (!canUpdate) return;
                            event?.stopPropagation();
                            onToggleActive(delivery, checked);
                        }}
                    />
                    {canUpdate ? (
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(delivery);
                            }}
                            style={{
                                borderRadius: 10,
                                color: '#0891B2',
                                background: '#ecfeff',
                                width: 36,
                                height: 36
                            }}
                        />
                    ) : null}
                    {canDelete ? (
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(delivery);
                            }}
                            style={{
                                borderRadius: 10,
                                background: '#fef2f2',
                                width: 36,
                                height: 36
                            }}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default function DeliveryPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
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
    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const canCreateDelivery = can("delivery.page", "create");
    const canUpdateDelivery = can("delivery.page", "update");
    const canDeleteDelivery = can("delivery.page", "delete");

    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    // URL sync managed by useListState hook

    useEffect(() => {
        if (createdSort !== DEFAULT_CREATED_SORT) return;
        const cached = readCache<Delivery[]>('pos:delivery-providers', 5 * 60 * 1000);
        if (cached && cached.length > 0) {
            setDeliveries(cached);
        }
    }, [createdSort]);

    const fetchDeliveries = useCallback(async () => {
        execute(async () => {
            const params = getQueryParams();
            const response = await fetch(`/api/pos/delivery?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลช่องทางจัดส่งได้');
            }
            const payload = await response.json();
            setDeliveries(payload.data || []);
            setTotal(payload.total || 0);
        }, 'กำลังโหลดข้อมูลช่องทางจัดส่ง...');
    }, [execute, getQueryParams, setTotal]);

    useEffect(() => {
        if (isUrlReady && isAuthorized) {
            fetchDeliveries();
        }
    }, [isUrlReady, isAuthorized, fetchDeliveries]);

    useRealtimeList(
        socket,
        { create: RealtimeEvents.delivery.create, update: RealtimeEvents.delivery.update, delete: RealtimeEvents.delivery.delete },
        setDeliveries
    );

    useEffect(() => {
        if (createdSort === DEFAULT_CREATED_SORT && deliveries.length > 0) {
            writeCache('pos:delivery-providers', deliveries);
        }
    }, [deliveries, createdSort]);

    const displayDeliveries = deliveries;

    const handleAdd = () => {
        if (!canCreateDelivery) {
            message.error("คุณไม่มีสิทธิ์เพิ่มช่องทางจัดส่ง");
            return;
        }
        showLoading('กำลังเปิดหน้าจัดการช่องทางจัดส่ง...');
        router.push('/pos/delivery/manager/add');
    };

    const handleEdit = (delivery: Delivery) => {
        if (!canUpdateDelivery) {
            message.error("คุณไม่มีสิทธิ์แก้ไขช่องทางจัดส่ง");
            return;
        }
        showLoading('กำลังเปิดหน้าแก้ไขช่องทางจัดส่ง...');
        router.push(`/pos/delivery/manager/edit/${delivery.id}`);
    };

    const handleDelete = (delivery: Delivery) => {
        if (!canDeleteDelivery) {
            message.error("คุณไม่มีสิทธิ์ลบช่องทางจัดส่ง");
            return;
        }
        Modal.confirm({
            title: 'ยืนยันการลบช่องทางจัดส่ง',
            content: `คุณต้องการลบช่องทางจัดส่ง ${delivery.delivery_name} หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            onOk: async () => {
                await execute(async () => {
                    const csrfToken = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/delivery/delete/${delivery.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) {
                        throw new Error('ไม่สามารถลบช่องทางจัดส่งได้');
                    }
                    setDeliveries((prev: Delivery[]) => prev.filter((item: Delivery) => item.id !== delivery.id));
                    message.success(`ลบช่องทางจัดส่ง "${delivery.delivery_name}" สำเร็จ`);
                }, 'กำลังลบช่องทางจัดส่ง...');
            },
        });
    };

    const handleToggleActive = async (delivery: Delivery, next: boolean) => {
        if (!canUpdateDelivery) {
            message.error("คุณไม่มีสิทธิ์แก้ไขช่องทางจัดส่ง");
            return;
        }
        setUpdatingStatusId(delivery.id);
        try {
            const csrfToken = await getCsrfTokenCached();
            const response = await fetch(`/api/pos/delivery/update/${delivery.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({ is_active: next })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถเปลี่ยนสถานะช่องทางจัดส่งได้');
            }

            const updated = await response.json();
            setDeliveries((prev: Delivery[]) => prev.map((item: Delivery) => item.id === delivery.id ? updated : item));
            message.success(next ? 'เปิดใช้งานช่องทางจัดส่งแล้ว' : 'ปิดใช้งานช่องทางจัดส่งแล้ว');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถเปลี่ยนสถานะช่องทางจัดส่งได้');
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

    const activeDeliveries = deliveries.filter((d) => d.is_active).length;
    const inactiveDeliveries = deliveries.filter((d) => !d.is_active).length;

    return (
        <div className="delivery-page" style={pageStyles.container}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="ช่องทางจัดส่ง"
                icon={<CarOutlined />}
                actions={
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} onClick={fetchDeliveries} />
                        {canCreateDelivery ? (
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                เพิ่มช่องทางจัดส่ง
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <StatsGroup
                        stats={[
                            { label: 'ทั้งหมด', value: deliveries.length, color: '#0f172a' },
                            { label: 'ใช้งาน', value: activeDeliveries, color: '#0891B2' },
                            { label: 'ปิดใช้งาน', value: inactiveDeliveries, color: '#b91c1c' },
                        ]}
                    />

                    <SearchBar>
                        <SearchInput
                            placeholder="ค้นหา"
                            value={searchText}
                            onChange={(val) => {
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
                                style={{ minWidth: 150 }}
                            />
                            <ModalSelector<CreatedSort>
                                title="เรียงลำดับ"
                                options={[
                                    { label: 'เรียงจากเก่าก่อน', value: 'old' },
                                    { label: 'เรียงจากใหม่ก่อน', value: 'new' },
                                ]}
                                value={createdSort}
                                onChange={(value) => setCreatedSort(value)}
                                style={{ minWidth: 150 }}
                            />
                        </Space>
                    </SearchBar>

                    <PageSection
                        title="รายการช่องทางจัดส่ง"
                        extra={<span style={{ fontWeight: 600 }}>{total} รายการ</span>}
                    >
                        {displayDeliveries.length > 0 ? (
                            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                {displayDeliveries.map((delivery) => (
                                    <DeliveryCard
                                        key={delivery.id}
                                        delivery={delivery}
                                        canUpdate={canUpdateDelivery}
                                        canDelete={canDeleteDelivery}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onToggleActive={handleToggleActive}
                                        updatingStatusId={updatingStatusId}
                                    />
                                ))}

                                <div style={{ marginTop: 12 }}>
                                    <ListPagination
                                        page={page}
                                        total={total}
                                        pageSize={pageSize}
                                        onPageChange={setPage}
                                        onPageSizeChange={setPageSize}
                                    />
                                </div>
                            </Space>
                        ) : (
                            <UIEmptyState
                                title={
                                    debouncedSearch.trim()
                                        ? 'ไม่พบช่องทางจัดส่งตามคำค้น'
                                        : 'ยังไม่มีช่องทางจัดส่ง'
                                }
                                description={
                                    debouncedSearch.trim()
                                        ? 'ลองเปลี่ยนคำค้น หรือตัวกรองสถานะ'
                                        : 'เพิ่มช่องทางจัดส่งแรกเพื่อเริ่มใช้งาน'
                                }
                            />
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
