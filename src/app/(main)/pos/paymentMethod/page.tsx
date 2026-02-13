'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { message, Modal, Typography, Tag, Button, Input, Space, Segmented, Switch } from 'antd';
import {
    CreditCardOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    WalletOutlined,
    QrcodeOutlined,
    BankOutlined,
} from '@ant-design/icons';
import { PaymentMethod } from '../../../../types/api/pos/paymentMethod';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useGlobalLoading } from '../../../../contexts/pos/GlobalLoadingContext';
import { useAsyncAction } from '../../../../hooks/useAsyncAction';
import { useSocket } from '../../../../hooks/useSocket';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { useRealtimeRefresh } from '../../../../utils/pos/realtime';
import { readCache, writeCache } from '../../../../utils/pos/cache';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { paymentMethodService } from '../../../../services/pos/paymentMethod.service';
import { globalStyles, pageStyles } from '../../../../theme/pos/paymentMethod/style';
import { useDebouncedValue } from '../../../../utils/useDebouncedValue';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import PageContainer from '../../../../components/ui/page/PageContainer';
import PageSection from '../../../../components/ui/page/PageSection';
import PageStack from '../../../../components/ui/page/PageStack';
import UIPageHeader from '../../../../components/ui/page/PageHeader';
import UIEmptyState from '../../../../components/ui/states/EmptyState';
import ListPagination, { type CreatedSort } from '../../../../components/ui/pagination/ListPagination';
import { DEFAULT_CREATED_SORT, parseCreatedSort } from '../../../../lib/list-sort';

const { Text } = Typography;

const PAYMENT_METHOD_LIMIT = 50;
const PAYMENT_METHOD_CACHE_KEY = 'pos:payment-methods:v2';
const PAYMENT_METHOD_CACHE_TTL = 5 * 60 * 1000;

type StatusFilter = 'all' | 'active' | 'inactive';

type PaymentMethodCacheResult = {
    data: PaymentMethod[];
    total: number;
    page: number;
    last_page: number;
};

interface StatsCardProps {
    total: number;
    active: number;
    inactive: number;
}

const StatsCard = ({ total, active, inactive }: StatsCardProps) => (
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
            <span style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', display: 'block' }}>{total}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ทั้งหมด</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#0f766e', display: 'block' }}>{active}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ใช้งาน</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#b91c1c', display: 'block' }}>{inactive}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ปิดใช้งาน</Text>
        </div>
    </div>
);

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
    onEdit: (paymentMethod: PaymentMethod) => void;
    onDelete: (paymentMethod: PaymentMethod) => void;
    onToggleActive: (paymentMethod: PaymentMethod, next: boolean) => void;
    updatingStatusId: string | null;
}

const PaymentMethodCard = ({ paymentMethod, onEdit, onDelete, onToggleActive, updatingStatusId }: PaymentMethodCardProps) => {
    const icon = getPaymentIcon(paymentMethod.payment_method_name);

    return (
        <div
            className="payment-method-card"
            style={{
                ...pageStyles.paymentMethodCard(paymentMethod.is_active),
                borderRadius: 16,
            }}
            onClick={() => onEdit(paymentMethod)}
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
                        onClick={(checked, event) => {
                            event?.stopPropagation();
                            onToggleActive(paymentMethod, checked);
                        }}
                    />
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
                </div>
            </div>
        </div>
    );
};

export default function PaymentMethodPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isUrlReadyRef = useRef(false);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchValue, setSearchValue] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [createdSort, setCreatedSort] = useState<CreatedSort>(DEFAULT_CREATED_SORT);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const debouncedSearch = useDebouncedValue(searchValue.trim(), 350);

    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard();

    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    useEffect(() => {
        if (isUrlReadyRef.current) return;

        const pageParam = Number(searchParams.get('page') || '1');
        const qParam = searchParams.get('q') || '';
        const statusParam = searchParams.get('status');
        const sortParam = searchParams.get('sort_created');
        const nextStatus: StatusFilter =
            statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all';

        setPage(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);
        setSearchValue(qParam);
        setStatusFilter(nextStatus);
        setCreatedSort(parseCreatedSort(sortParam));
        isUrlReadyRef.current = true;
    }, [searchParams]);

    useEffect(() => {
        if (!isUrlReadyRef.current) return;
        const params = new URLSearchParams();
        if (page > 1) params.set('page', String(page));
        if (debouncedSearch) params.set('q', debouncedSearch);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (createdSort !== DEFAULT_CREATED_SORT) params.set('sort_created', createdSort);

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, [router, pathname, page, debouncedSearch, statusFilter, createdSort]);

    useEffect(() => {
        if (debouncedSearch || page !== 1 || createdSort !== DEFAULT_CREATED_SORT) return;
        const cached = readCache<PaymentMethodCacheResult>(PAYMENT_METHOD_CACHE_KEY, PAYMENT_METHOD_CACHE_TTL);
        if (cached?.data?.length) {
            setPaymentMethods(cached.data);
            setTotal(cached.total);
        }
    }, [debouncedSearch, page, createdSort]);

    const fetchPaymentMethods = useCallback(async () => {
        execute(async () => {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('limit', PAYMENT_METHOD_LIMIT.toString());
            if (debouncedSearch) {
                params.set('q', debouncedSearch);
            }
            if (statusFilter !== 'all') {
                params.set('status', statusFilter);
            }
            params.set('sort_created', createdSort);

            const result = await paymentMethodService.getAll(undefined, params);
            setPaymentMethods(result.data || []);
            setTotal(result.total || 0);

            if (!debouncedSearch && page === 1 && createdSort === DEFAULT_CREATED_SORT) {
                writeCache(PAYMENT_METHOD_CACHE_KEY, result);
            }
        }, 'กำลังโหลดข้อมูลวิธีการชำระเงิน...');
    }, [debouncedSearch, execute, page, statusFilter, createdSort]);

    useEffect(() => {
        if (isAuthorized) {
            fetchPaymentMethods();
        }
    }, [isAuthorized, fetchPaymentMethods]);

    useRealtimeRefresh({
        socket,
        events: [RealtimeEvents.paymentMethods.create, RealtimeEvents.paymentMethods.update, RealtimeEvents.paymentMethods.delete],
        onRefresh: () => fetchPaymentMethods(),
        intervalMs: 20000,
        debounceMs: 800,
    });

    const filteredPaymentMethods = useMemo(() => {
        if (statusFilter === 'all') return paymentMethods;
        if (statusFilter === 'active') return paymentMethods.filter((item) => item.is_active);
        return paymentMethods.filter((item) => !item.is_active);
    }, [paymentMethods, statusFilter]);

    const handleAdd = () => {
        showLoading('กำลังเปิดหน้าจัดการวิธีการชำระเงิน...');
        router.push('/pos/paymentMethod/manager/add');
    };

    const handleEdit = (paymentMethod: PaymentMethod) => {
        showLoading('กำลังเปิดหน้าแก้ไขวิธีการชำระเงิน...');
        router.push(`/pos/paymentMethod/manager/edit/${paymentMethod.id}`);
    };

    const handleDelete = (paymentMethod: PaymentMethod) => {
        Modal.confirm({
            title: 'ยืนยันการลบวิธีการชำระเงิน',
            content: `คุณต้องการลบวิธีการชำระเงิน "${paymentMethod.display_name}" หรือไม่?`,
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

    if (isChecking) {
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
                subtitle={`ทั้งหมด ${total} รายการ`}
                icon={<CreditCardOutlined />}
                actions={
                    <Space size={8} wrap>
                        <Button icon={<ReloadOutlined />} onClick={fetchPaymentMethods} />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                            เพิ่มวิธีชำระเงิน
                        </Button>
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <StatsCard
                        total={paymentMethods.length}
                        active={activePaymentMethods}
                        inactive={inactivePaymentMethods}
                    />

                    <PageSection title="ค้นหาและตัวกรอง">
                        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr' }}>
                            <Input
                                allowClear
                                placeholder="ค้นหาวิธีการชำระเงิน..."
                                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                                value={searchValue}
                                onChange={(e) => {
                                    setPage(1);
                                    setSearchValue(e.target.value);
                                }}
                            />
                            <Segmented<StatusFilter>
                                options={[
                                    { label: 'ทั้งหมด', value: 'all' },
                                    { label: 'ใช้งาน', value: 'active' },
                                    { label: 'ปิดใช้งาน', value: 'inactive' },
                                ]}
                                value={statusFilter}
                                onChange={(value) => {
                                    setPage(1);
                                    setStatusFilter(value);
                                }}
                            />
                        </div>
                    </PageSection>

                    <PageSection title="รายการวิธีการชำระเงิน" extra={<span style={{ fontWeight: 600 }}>{filteredPaymentMethods.length}</span>}>
                        {filteredPaymentMethods.length > 0 ? (
                            <>
                                {filteredPaymentMethods.map((paymentMethod) => (
                                    <PaymentMethodCard
                                        key={paymentMethod.id}
                                        paymentMethod={paymentMethod}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onToggleActive={handleToggleActive}
                                        updatingStatusId={updatingStatusId}
                                    />
                                ))}

                                <div style={{ marginTop: 16 }}>
                                    <ListPagination
                                        page={page}
                                        pageSize={PAYMENT_METHOD_LIMIT}
                                        pageSizeOptions={[PAYMENT_METHOD_LIMIT]}
                                        total={total}
                                        onPageChange={(p) => setPage(p)}
                                        onPageSizeChange={() => {
                                            setPage(1);
                                        }}
                                        sortCreated={createdSort}
                                        onSortCreatedChange={(nextSort) => {
                                            setPage(1);
                                            setCreatedSort(nextSort);
                                        }}
                                    />
                                </div>
                            </>
                        ) : (
                            <UIEmptyState
                                title={searchValue.trim() ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีวิธีการชำระเงิน'}
                                description={
                                    searchValue.trim()
                                        ? 'ลองเปลี่ยนคำค้น หรือตัวกรองสถานะ'
                                        : 'เพิ่มวิธีการชำระเงินแรกเพื่อเริ่มใช้งาน'
                                }
                                action={
                                    !searchValue.trim() ? (
                                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                            เพิ่มวิธีชำระเงิน
                                        </Button>
                                    ) : null
                                }
                            />
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
