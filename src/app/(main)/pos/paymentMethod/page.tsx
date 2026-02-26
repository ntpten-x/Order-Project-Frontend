'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Typography, Tag, Button, Space, Switch } from 'antd';
import {
    CreditCardOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    WalletOutlined,
    QrcodeOutlined,
    BankOutlined,
} from '@ant-design/icons';
import { PaymentMethod } from '../../../../types/api/pos/paymentMethod';
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from '../../../../contexts/pos/GlobalLoadingContext';
import { useAsyncAction } from '../../../../hooks/useAsyncAction';
import { useSocket } from '../../../../hooks/useSocket';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { useRealtimeList } from '../../../../utils/pos/realtime';
import { readCache, writeCache } from '../../../../utils/pos/cache';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { paymentMethodService } from '../../../../services/pos/paymentMethod.service';
import { globalStyles, pageStyles } from '../../../../theme/pos/paymentMethod/style';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import PageContainer from '../../../../components/ui/page/PageContainer';
import PageSection from '../../../../components/ui/page/PageSection';
import PageStack from '../../../../components/ui/page/PageStack';
import UIPageHeader from '../../../../components/ui/page/PageHeader';
import UIEmptyState from '../../../../components/ui/states/EmptyState';
import ListPagination, { type CreatedSort } from '../../../../components/ui/pagination/ListPagination';
import { DEFAULT_CREATED_SORT } from '../../../../lib/list-sort';
import { ModalSelector } from "../../../../components/ui/select/ModalSelector";
import { StatsGroup } from "../../../../components/ui/card/StatsGroup";
import { SearchInput } from "../../../../components/ui/input/SearchInput";
import { SearchBar } from "../../../../components/ui/page/SearchBar";
import { useEffectivePermissions } from "../../../../hooks/useEffectivePermissions";
import { useListState } from "../../../../hooks/pos/useListState";

const { Text } = Typography;

const PAYMENT_METHOD_CACHE_KEY = 'pos:payment-methods:v2';
const PAYMENT_METHOD_CACHE_TTL = 5 * 60 * 1000;

type StatusFilter = 'all' | 'active' | 'inactive';

type PaymentMethodCacheResult = {
    data: PaymentMethod[];
    total: number;
    page: number;
    last_page: number;
};



const getPaymentIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('cash') || lower.includes('เงินสด')) return <WalletOutlined />;
    if (lower.includes('promptpay') || lower.includes('พร้อมเพย์') || lower.includes('qr')) return <QrcodeOutlined />;
    if (lower.includes('bank') || lower.includes('โอน')) return <BankOutlined />;
    return <CreditCardOutlined />;
};

const formatDate = (raw?: string) => {
    if (!raw) return '-';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

interface PaymentMethodCardProps {
    paymentMethod: PaymentMethod;
    canUpdate: boolean;
    canDelete: boolean;
    onEdit: (paymentMethod: PaymentMethod) => void;
    onDelete: (paymentMethod: PaymentMethod) => void;
    onToggleActive: (paymentMethod: PaymentMethod, next: boolean) => void;
    updatingStatusId: string | null;
}

const PaymentMethodCard = ({ paymentMethod, canUpdate, canDelete, onEdit, onDelete, onToggleActive, updatingStatusId }: PaymentMethodCardProps) => {
    const icon = getPaymentIcon(paymentMethod.payment_method_name);

    return (
        <div
            className="payment-method-card"
            style={{
                ...pageStyles.paymentMethodCard(paymentMethod.is_active),
                borderRadius: 16,
            }}
            onClick={() => {
                if (!canUpdate) return;
                onEdit(paymentMethod);
            }}
        >
            <div style={pageStyles.paymentMethodCardInner}>
                <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: paymentMethod.is_active
                        ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                        : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: paymentMethod.is_active ? '0 4px 10px rgba(16, 185, 129, 0.18)' : 'none'
                }}>
                    <div style={{ fontSize: 20, color: paymentMethod.is_active ? '#059669' : '#94a3b8' }}>{icon}</div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text strong style={{ fontSize: 16, color: '#0f172a' }} ellipsis={{ tooltip: paymentMethod.display_name }}>
                            {paymentMethod.display_name}
                        </Text>
                        <Tag color={paymentMethod.is_active ? 'green' : 'default'}>
                            {paymentMethod.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </Tag>
                    </div>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 4 }} ellipsis={{ tooltip: paymentMethod.payment_method_name }}>
                        {paymentMethod.payment_method_name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        สร้างเมื่อ {formatDate(paymentMethod.create_date)}
                    </Text>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Switch
                        size="small"
                        checked={paymentMethod.is_active}
                        loading={updatingStatusId === paymentMethod.id}
                        disabled={!canUpdate}
                        onClick={(checked, event) => {
                            event?.stopPropagation();
                            onToggleActive(paymentMethod, checked);
                        }}
                    />
                    {canUpdate ? (
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(paymentMethod);
                            }}
                            style={{
                                borderRadius: 10,
                                color: '#065f46',
                                background: '#ecfdf5',
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
                                onDelete(paymentMethod);
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

export default function PaymentMethodPage() {
    const router = useRouter();
    const {
        searchText,
        setSearchText,
        debouncedSearch,
        page,
        setPage,
        pageSize,
        setPageSize,
        createdSort,
        setCreatedSort,
        filters,
        updateFilter,
        total,
        setTotal,
        getQueryParams,
        isUrlReady
    } = useListState<{ status: StatusFilter }>({
        defaultPageSize: 10,
        defaultFilters: { status: 'all' }
    });

    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreatePaymentMethods = can("payment_method.page", "create");
    const canUpdatePaymentMethods = can("payment_method.page", "update");
    const canDeletePaymentMethods = can("payment_method.page", "delete");

    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    useEffect(() => {
        if (!debouncedSearch && page === 1 && createdSort === DEFAULT_CREATED_SORT && filters.status === 'all') {
            const cached = readCache<PaymentMethodCacheResult>(PAYMENT_METHOD_CACHE_KEY, PAYMENT_METHOD_CACHE_TTL);
            if (cached?.data?.length) {
                setPaymentMethods(cached.data);
                setTotal(cached.total);
            }
        }
    }, [debouncedSearch, page, createdSort, filters.status, setTotal]);

    const fetchPaymentMethods = useCallback(async () => {
        execute(async () => {
            const params = getQueryParams();
            const result = await paymentMethodService.getAll(undefined, params);
            setPaymentMethods(result.data || []);
            setTotal(result.total || 0);

            if (!debouncedSearch && page === 1 && createdSort === DEFAULT_CREATED_SORT && filters.status === 'all') {
                writeCache(PAYMENT_METHOD_CACHE_KEY, result);
            }
        }, 'กำลังโหลดข้อมูลวิธีการชำระเงิน...');
    }, [getQueryParams, execute, debouncedSearch, page, createdSort, filters.status, setTotal]);

    useEffect(() => {
        if (isUrlReady && isAuthorized) {
            fetchPaymentMethods();
        }
    }, [isUrlReady, isAuthorized, fetchPaymentMethods]);

    useRealtimeList(
        socket,
        { 
            create: RealtimeEvents.paymentMethods.create, 
            update: RealtimeEvents.paymentMethods.update, 
            delete: RealtimeEvents.paymentMethods.delete 
        },
        setPaymentMethods
    );

    const handleAdd = () => {
        if (!canCreatePaymentMethods) {
            message.error('คุณไม่มีสิทธิ์เพิ่มวิธีการชำระเงิน');
            return;
        }
        showLoading('กำลังเปิดหน้าจัดการวิธีการชำระเงิน...');
        router.push('/pos/paymentMethod/manager/add');
    };

    const handleEdit = (paymentMethod: PaymentMethod) => {
        if (!canUpdatePaymentMethods) {
            message.error('คุณไม่มีสิทธิ์แก้ไขวิธีการชำระเงิน');
            return;
        }
        showLoading('กำลังเปิดหน้าแก้ไขวิธีการชำระเงิน...');
        router.push(`/pos/paymentMethod/manager/edit/${paymentMethod.id}`);
    };

    const handleDelete = (paymentMethod: PaymentMethod) => {
        if (!canDeletePaymentMethods) {
            message.error('คุณไม่มีสิทธิ์ลบวิธีการชำระเงิน');
            return;
        }
        Modal.confirm({
            title: 'ยืนยันการลบวิธีการชำระเงิน',
            content: `คุณต้องการลบวิธีการชำระเงิน ${paymentMethod.display_name} หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
            onOk: async () => {
                await execute(async () => {
                    const csrfToken = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/paymentMethod/delete/${paymentMethod.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) {
                        throw new Error('ไม่สามารถลบวิธีการชำระเงินได้');
                    }
                    setPaymentMethods((prev) => prev.filter((item) => item.id !== paymentMethod.id));
                    setTotal((prev) => Math.max(prev - 1, 0));
                    message.success(`ลบวิธีการชำระเงิน "${paymentMethod.display_name}" สำเร็จ`);
                }, 'กำลังลบวิธีการชำระเงิน...');
            },
        });
    };

    const handleToggleActive = async (paymentMethod: PaymentMethod, next: boolean) => {
        setUpdatingStatusId(paymentMethod.id);
        try {
            const csrfToken = await getCsrfTokenCached();
            const response = await fetch(`/api/pos/paymentMethod/update/${paymentMethod.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({ is_active: next })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถเปลี่ยนสถานะวิธีการชำระเงินได้');
            }

            const updated = await response.json();
            setPaymentMethods((prev) => prev.map((item) => item.id === paymentMethod.id ? updated : item));
            message.success(next ? 'เปิดใช้งานวิธีชำระเงินแล้ว' : 'ปิดใช้งานวิธีชำระเงินแล้ว');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถเปลี่ยนสถานะวิธีการชำระเงินได้');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    if (isChecking || permissionLoading) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กำลังพากลับ..." tone="danger" />;
    }

    const activePaymentMethods = paymentMethods.filter((item) => item.is_active).length;
    const inactivePaymentMethods = paymentMethods.filter((item) => !item.is_active).length;

    return (
        <div className="payment-method-page" style={pageStyles.container}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="วิธีการชำระเงิน"
                icon={<CreditCardOutlined />}
                actions={
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} onClick={fetchPaymentMethods} />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={!canCreatePaymentMethods}>
                            เพิ่มวิธีชำระเงิน
                        </Button>
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <StatsGroup
                        stats={[
                            { label: 'ทั้งหมด', value: total, color: '#0f172a' },
                            { label: 'ใช้งาน', value: activePaymentMethods, color: '#0f766e' },
                            { label: 'ปิดใช้งาน', value: inactivePaymentMethods, color: '#b91c1c' },
                        ]}
                    />

                    <SearchBar>
                        <SearchInput
                            placeholder="ค้นหา"
                            value={searchText}
                            onChange={(val) => setSearchText(val)}
                        />
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
                                style={{ minWidth: 150 }}
                            />
                            <ModalSelector<CreatedSort>
                                title="เรียงลำดับ"
                                options={[
                                    { label: 'เก่าก่อน', value: 'old' },
                                    { label: 'ใหม่ก่อน', value: 'new' },
                                ]}
                                value={createdSort}
                                onChange={(value) => setCreatedSort(value)}
                                style={{ minWidth: 150 }}
                            />
                        </Space>
                    </SearchBar>

                    <PageSection 
                        title="รายการวิธีการชำระเงิน" 
                        extra={<span style={{ fontWeight: 600 }}>{total} รายการ</span>}
                    >
                        <Space direction="vertical" size={16} style={{ width: '100%' }}>
                            {paymentMethods.length > 0 ? (
                                paymentMethods.map((paymentMethod) => (
                                    <PaymentMethodCard
                                        key={paymentMethod.id}
                                        paymentMethod={paymentMethod}
                                        canUpdate={canUpdatePaymentMethods}
                                        canDelete={canDeletePaymentMethods}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onToggleActive={handleToggleActive}
                                        updatingStatusId={updatingStatusId}
                                    />
                                ))
                            ) : (
                                <UIEmptyState
                                    title={searchText.trim() ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีวิธีการชำระเงิน'}
                                    description={
                                        searchText.trim()
                                            ? 'ลองเปลี่ยนคำค้น หรือตัวกรองสถานะ'
                                            : 'เพิ่มวิธีการชำระเงินแรกเพื่อเริ่มใช้งาน'
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
                                    activeColor="#7C3AED"
                                />
                            </div>
                        </Space>
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
