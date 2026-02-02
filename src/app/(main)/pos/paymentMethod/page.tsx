'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Typography, Tag, Button, Empty, Input, Pagination, Row, Col } from 'antd';
import { 
    CreditCardOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleFilled,
    CloseCircleFilled,
    SearchOutlined,
    BankOutlined,
    WalletOutlined,
    QrcodeOutlined
} from '@ant-design/icons';
import { PaymentMethod } from "../../../../types/api/pos/paymentMethod";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { getCsrfTokenCached } from "../../../../utils/pos/csrf";
import { useRoleGuard } from "../../../../utils/pos/accessControl";
import { useRealtimeRefresh } from "../../../../utils/pos/realtime";
import { readCache, writeCache } from "../../../../utils/pos/cache";
import { paymentMethodService } from "../../../../services/pos/paymentMethod.service";
import { pageStyles, globalStyles } from '../../../../theme/pos/paymentMethod/style';
import { useDebouncedValue } from '../../../../utils/useDebouncedValue';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';

const { Text, Title } = Typography;

const PAYMENT_METHOD_LIMIT = 50;
const PAYMENT_METHOD_CACHE_KEY = "pos:payment-methods";
const PAYMENT_METHOD_CACHE_TTL = 5 * 60 * 1000;

type PaymentMethodCacheResult = {
    data: PaymentMethod[];
    total: number;
    page: number;
    last_page: number;
};

// ============ HEADER COMPONENT ============

interface HeaderProps {
    onRefresh: () => void;
    onAdd: () => void;
    searchValue: string;
    onSearchChange: (value: string) => void;
    page: number;
    total: number;
    lastPage: number;
    setPage: (page: number) => void;
}

const PageHeader = ({ onRefresh, onAdd, searchValue, onSearchChange, page, total, lastPage, setPage }: HeaderProps) => (
    <div style={{
        marginBottom: 16,
        background: 'white',
        borderRadius: 16,
        padding: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
        {/* Title with Icon */}
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: 14
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                    width: 40,
                    height: 40,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 3px 8px rgba(16, 185, 129, 0.3)'
                }}>
                    <CreditCardOutlined style={{ fontSize: 20, color: 'white' }} />
                </div>
                <div>
                    <Title level={5} style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
                        วิธีชำระเงิน
                    </Title>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>{total} รายการ</Text>
                </div>
            </div>
            <Button
                icon={<ReloadOutlined />}
                onClick={onRefresh}
                style={{
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    color: '#64748B'
                }}
            />
        </div>

        {/* Search Row */}
        <div style={{ display: 'flex', gap: 8 }}>
            <Input
                allowClear
                placeholder="ค้นหาวิธีชำระเงิน..."
                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{ 
                    flex: 1,
                    height: 42, 
                    borderRadius: 10,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0'
                }}
            />
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onAdd}
                style={{
                    height: 42,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    fontWeight: 600,
                    boxShadow: '0 3px 8px rgba(16, 185, 129, 0.25)',
                    paddingLeft: 14,
                    paddingRight: 14
                }}
            >
                เพิ่ม
            </Button>
        </div>

        {lastPage > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                <Pagination
                    current={page}
                    pageSize={PAYMENT_METHOD_LIMIT}
                    total={total}
                    onChange={(value) => setPage(value)}
                    size="small"
                    hideOnSinglePage
                />
            </div>
        )}
    </div>
)



// ============ STATS CARD COMPONENT ============

interface StatsCardProps {
    totalPaymentMethods: number;
    activePaymentMethods: number;
    inactivePaymentMethods: number;
}

const StatsCard = ({ totalPaymentMethods, activePaymentMethods, inactivePaymentMethods }: StatsCardProps) => (
    <div className="grid grid-cols-3 gap-2 md:gap-4" style={{ 
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        padding: '12px 8px',
        marginBottom: 20
    }}>
        <div style={{ textAlign: 'center', padding: '8px 4px' }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#10b981', display: 'block' }}>{totalPaymentMethods}</span>
            <Text style={{ fontSize: 11, color: '#64748b' }}>ทั้งหมด</Text>
        </div>
        <div style={{ textAlign: 'center', padding: '8px 4px', borderLeft: '1px solid #f0f0f0', borderRight: '1px solid #f0f0f0' }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#52c41a', display: 'block' }}>{activePaymentMethods}</span>
            <Text style={{ fontSize: 11, color: '#64748b' }}>เปิดใช้</Text>
        </div>
        <div style={{ textAlign: 'center', padding: '8px 4px' }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#ff4d4f', display: 'block' }}>{inactivePaymentMethods}</span>
            <Text style={{ fontSize: 11, color: '#64748b' }}>ปิดใช้</Text>
        </div>
    </div>
);

// ============ EMPTY STATE COMPONENT ============

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        width: '100%'
    }}>
        <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
                <div style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 16, fontWeight: 500 }}>
                        ยังไม่มีวิธีชำระเงิน
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 14 }}>
                        เริ่มต้นเพิ่มวิธีชำระเงินแรกของคุณ
                    </Text>
                </div>
            }
            style={{
                padding: '40px',
                background: 'white',
                borderRadius: 24,
                boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                width: '100%',
                maxWidth: 400
            }}
        >
            <Button 
                type="primary" 
                size="large"
                icon={<PlusOutlined />} 
                onClick={onAdd}
                style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: 12,
                    marginTop: 16,
                    height: 44,
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
            >
                เพิ่มวิธีชำระเงิน
            </Button>
        </Empty>
    </div>
);

// ============ PAYMENT METHOD CARD COMPONENT ============

interface PaymentMethodCardProps {
    paymentMethod: PaymentMethod;
    onEdit: (paymentMethod: PaymentMethod) => void;
    onDelete: (paymentMethod: PaymentMethod) => void;
}

const getPaymentIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('cash') || lower.includes('เงินสด')) return <WalletOutlined />;
    if (lower.includes('promptpay') || lower.includes('พร้อมเพย์') || lower.includes('qr')) return <QrcodeOutlined />;
    if (lower.includes('bank') || lower.includes('โอน')) return <BankOutlined />;
    return <CreditCardOutlined />;
};

const PaymentMethodCard = ({ paymentMethod, onEdit, onDelete }: PaymentMethodCardProps) => {
    const icon = getPaymentIcon(paymentMethod.payment_method_name);
    
    return (
        <Col xs={24} sm={12} lg={8}>
            <div
                style={{
                    background: 'white',
                    borderRadius: 14,
                    padding: 14,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    border: '1px solid #F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    opacity: paymentMethod.is_active ? 1 : 0.7
                }}
                onClick={() => onEdit(paymentMethod)}
            >
                {/* Icon */}
                <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: paymentMethod.is_active 
                        ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                        : '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <div style={{ 
                        fontSize: 20, 
                        color: paymentMethod.is_active ? '#059669' : '#94A3B8' 
                    }}>
                        {icon}
                    </div>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Text 
                            strong 
                            ellipsis
                            style={{ fontSize: 14, color: '#1E293B' }}
                        >
                            {paymentMethod.display_name || paymentMethod.payment_method_name}
                        </Text>
                        {paymentMethod.is_active ? (
                            <CheckCircleFilled style={{ color: '#10B981', fontSize: 13, flexShrink: 0 }} />
                        ) : (
                            <CloseCircleFilled style={{ color: '#EF4444', fontSize: 13, flexShrink: 0 }} />
                        )}
                    </div>
                    <Tag 
                        style={{ 
                            borderRadius: 4, 
                            margin: 0,
                            marginTop: 4,
                            fontSize: 10,
                            padding: '1px 6px',
                            border: 'none',
                            background: '#F1F5F9',
                            color: '#64748B'
                        }}
                    >
                        {paymentMethod.payment_method_name}
                    </Tag>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(paymentMethod);
                        }}
                        style={{
                            borderRadius: 6,
                            color: '#10B981',
                            width: 32,
                            height: 32,
                            padding: 0
                        }}
                    />
                    <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(paymentMethod);
                        }}
                        style={{
                            borderRadius: 6,
                            color: '#EF4444',
                            width: 32,
                            height: 32,
                            padding: 0
                        }}
                    />
                </div>
            </div>
        </Col>
    );
};

export default function PaymentMethodPage() {
    const router = useRouter();
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [lastPage, setLastPage] = useState(1);
    const [searchValue, setSearchValue] = useState("");
    const debouncedSearch = useDebouncedValue(searchValue.trim(), 400);
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard({ requiredRole: "Admin" });


    useEffect(() => {
        getCsrfTokenCached();
    }, []);
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    useEffect(() => {
        if (debouncedSearch || page !== 1) return;
        const cached = readCache<PaymentMethodCacheResult>(PAYMENT_METHOD_CACHE_KEY, PAYMENT_METHOD_CACHE_TTL);
        if (cached?.data?.length) {
            setPaymentMethods(cached.data);
            setTotal(cached.total);
            setLastPage(cached.last_page);
        }
    }, [debouncedSearch, page]);

    const fetchPaymentMethods = useCallback(async () => {
        execute(async () => {
            const params = new URLSearchParams();
            params.set("page", page.toString());
            params.set("limit", PAYMENT_METHOD_LIMIT.toString());
            if (debouncedSearch) {
                params.set("q", debouncedSearch);
            }
            const result = await paymentMethodService.getAll(undefined, params);
            setPaymentMethods(result.data);
            setTotal(result.total);
            setLastPage(result.last_page);
            if (!debouncedSearch && page === 1) {
                writeCache(PAYMENT_METHOD_CACHE_KEY, result);
            }
        }, 'กำลังโหลดข้อมูลวิธีการชำระเงิน...');
    }, [debouncedSearch, execute, page]);

    useEffect(() => {
        if (isAuthorized) {
            fetchPaymentMethods();
        }
    }, [isAuthorized, fetchPaymentMethods]);

    useRealtimeRefresh({
        socket,
        events: ["paymentMethod:create", "paymentMethod:update", "paymentMethod:delete"],
        onRefresh: () => fetchPaymentMethods(),
        intervalMs: 20000,
        debounceMs: 1000,
    });

    const handleAdd = () => {
        showLoading("กำลังเปิดหน้าจัดการวิธีชำระเงิน...");
        router.push('/pos/paymentMethod/manager/add');
    };

    const handleEdit = (paymentMethod: PaymentMethod) => {
        showLoading("กำลังเปิดหน้าแก้ไขวิธีชำระเงิน...");
        router.push(`/pos/paymentMethod/manager/edit/${paymentMethod.id}`);
    };

    const handleDelete = (paymentMethod: PaymentMethod) => {
        Modal.confirm({
            title: 'ยืนยันการลบวิธีชำระเงิน',
            content: `คุณต้องการลบวิธีชำระเงิน "${paymentMethod.display_name || paymentMethod.payment_method_name}" หรือไม่?`,
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
                        throw new Error('ไม่สามารถลบวิธีชำระเงินได้');
                    }
                    message.success(`ลบวิธีชำระเงิน "${paymentMethod.display_name || paymentMethod.payment_method_name}" สำเร็จ`);
                }, "กำลังลบวิธีชำระเงิน...");
            },
        });
    };

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กำลังพากลับ..." tone="danger" />;
    }

    const activePaymentMethods = paymentMethods.filter(pm => pm.is_active);
    const inactivePaymentMethods = paymentMethods.filter(pm => !pm.is_active);

    return (
        <div style={{ padding: 16, background: '#F8FAFC', minHeight: '100vh' }}>
            <style>{globalStyles}</style>
            
            {/* Header */}
            <PageHeader 
                onRefresh={fetchPaymentMethods}
                onAdd={handleAdd}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                page={page}
                total={total}
                lastPage={lastPage}
                setPage={setPage}
            />
            
            {/* Stats Card */}
            <StatsCard 
                totalPaymentMethods={paymentMethods.length}
                activePaymentMethods={activePaymentMethods.length}
                inactivePaymentMethods={inactivePaymentMethods.length}
            />

            {/* Payment Methods List */}
            <div>
                {paymentMethods.length > 0 ? (
                    <Row gutter={[12, 12]}>
                        {paymentMethods.map((paymentMethod) => (
                            <PaymentMethodCard
                                key={paymentMethod.id}
                                paymentMethod={paymentMethod}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </Row>
                ) : (
                    <EmptyState onAdd={handleAdd} />
                )}
            </div>
        </div>
    );
}
