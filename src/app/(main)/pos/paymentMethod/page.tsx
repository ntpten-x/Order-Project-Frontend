'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Spin, Typography, Tag, Button, Empty } from 'antd';
import { 
    CreditCardOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleFilled,
    CloseCircleFilled
} from '@ant-design/icons';
import { PaymentMethod } from "../../../../types/api/pos/paymentMethod";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { useAuth } from "../../../../contexts/AuthContext";
import { authService } from "../../../../services/auth.service";
import { pageStyles, globalStyles } from '../../../../theme/pos/paymentMethod/style';

const { Text, Title } = Typography;

// ============ HEADER COMPONENT ============

interface HeaderProps {
    onRefresh: () => void;
    onAdd: () => void;
}

const PageHeader = ({ onRefresh, onAdd }: HeaderProps) => (
    <div style={pageStyles.header}>
        <div style={pageStyles.headerDecoCircle1} />
        <div style={pageStyles.headerDecoCircle2} />
        
        <div style={pageStyles.headerContent}>
            <div style={pageStyles.headerLeft}>
                <div style={pageStyles.headerIconBox}>
                    <CreditCardOutlined style={{ fontSize: 24, color: 'white' }} />
                </div>
                <div>
                    <Text style={{ 
                        color: 'rgba(255,255,255,0.85)', 
                        fontSize: 13,
                        display: 'block'
                    }}>
                        จัดการข้อมูล
                    </Text>
                    <Title level={4} style={{ 
                        color: 'white', 
                        margin: 0,
                        fontWeight: 700,
                        letterSpacing: '0.5px'
                    }}>
                        วิธีชำระเงิน
                    </Title>
                </div>
            </div>
            <div style={pageStyles.headerActions}>
                <Button
                    type="text"
                    icon={<ReloadOutlined style={{ color: 'white' }} />}
                    onClick={onRefresh}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: 12,
                        height: 40,
                        width: 40
                    }}
                />
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={onAdd}
                    style={{
                        background: 'white',
                        color: '#10b981',
                        borderRadius: 12,
                        height: 40,
                        fontWeight: 600,
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                >
                    เพิ่มวิธีชำระเงิน
                </Button>
            </div>
        </div>
    </div>
);

// ============ STATS CARD COMPONENT ============

interface StatsCardProps {
    totalPaymentMethods: number;
    activePaymentMethods: number;
    inactivePaymentMethods: number;
}

const StatsCard = ({ totalPaymentMethods, activePaymentMethods, inactivePaymentMethods }: StatsCardProps) => (
    <div style={pageStyles.statsCard}>
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#10b981' }}>{totalPaymentMethods}</span>
            <Text style={pageStyles.statLabel}>ทั้งหมด</Text>
        </div>
        <div style={{ width: 1, background: '#f0f0f0' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#52c41a' }}>{activePaymentMethods}</span>
            <Text style={pageStyles.statLabel}>เปิดใช้งาน</Text>
        </div>
        <div style={{ width: 1, background: '#f0f0f0' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#ff4d4f' }}>{inactivePaymentMethods}</span>
            <Text style={pageStyles.statLabel}>ปิดใช้งาน</Text>
        </div>
    </div>
);

// ============ PAYMENT METHOD CARD COMPONENT ============

interface PaymentMethodCardProps {
    paymentMethod: PaymentMethod;
    index: number;
    onEdit: (paymentMethod: PaymentMethod) => void;
    onDelete: (paymentMethod: PaymentMethod) => void;
}

const PaymentMethodCard = ({ paymentMethod, index, onEdit, onDelete }: PaymentMethodCardProps) => {
    return (
        <div
            className="payment-method-card"
            style={{
                ...pageStyles.paymentMethodCard(paymentMethod.is_active),
                animationDelay: `${index * 0.03}s`
            }}
        >
            <div style={pageStyles.paymentMethodCardInner}>
                {/* Icon */}
                <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 14,
                    border: '2px solid #f0f0f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    flexShrink: 0,
                    overflow: 'hidden',
                    position: 'relative',
                    background: paymentMethod.is_active 
                        ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                        : 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <CreditCardOutlined style={{ 
                        fontSize: 28, 
                        color: paymentMethod.is_active ? '#10b981' : '#ff4d4f' 
                    }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text 
                            strong 
                            style={{ fontSize: 16, color: '#1a1a2e' }}
                        >
                            {paymentMethod.display_name || paymentMethod.payment_method_name}
                        </Text>
                        {paymentMethod.is_active ? (
                            <CheckCircleFilled style={{ color: '#52c41a', fontSize: 14 }} />
                        ) : (
                            <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 14 }} />
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Tag 
                            color="green"
                            style={{ 
                                borderRadius: 8, 
                                margin: 0,
                                fontSize: 11 
                            }}
                        >
                            {paymentMethod.payment_method_name}
                        </Tag>
                        <Tag 
                            color={paymentMethod.is_active ? 'success' : 'default'}
                            style={{ 
                                borderRadius: 8, 
                                margin: 0,
                                fontSize: 11 
                            }}
                        >
                            {paymentMethod.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </Tag>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(paymentMethod);
                        }}
                        style={{
                            borderRadius: 10,
                            color: '#10b981',
                            background: '#d1fae5'
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
                            background: '#fff2f0'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

// ============ EMPTY STATE COMPONENT ============

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
    <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
            <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 15 }}>
                    ยังไม่มีวิธีชำระเงิน
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                    เริ่มต้นเพิ่มวิธีชำระเงินแรกของคุณ
                </Text>
            </div>
        }
        style={{
            padding: '60px 20px',
            background: 'white',
            borderRadius: 20,
            margin: '0 16px'
        }}
    >
        <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={onAdd}
            style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none'
            }}
        >
            เพิ่มวิธีชำระเงิน
        </Button>
    </Empty>
);

export default function PaymentMethodPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const { execute } = useAsyncAction();
    const { showLoading, hideLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const [csrfToken, setCsrfToken] = useState<string>("");

    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        const fetchCsrf = async () => {
             const token = await authService.getCsrfToken();
             setCsrfToken(token);
        };
        fetchCsrf();
    }, []);

    const fetchPaymentMethods = useCallback(async () => {
        execute(async () => {
            const response = await fetch('/api/pos/paymentMethod');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลวิธีชำระเงินได้');
            }
            const data = await response.json();
            setPaymentMethods(data);
        }, 'กำลังโหลดข้อมูลวิธีชำระเงิน...');
    }, [execute]);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                setIsAuthorized(false);
                setTimeout(() => {
                    router.replace('/login');
                }, 1000); 
            } else if (user.role !== 'Admin') {
                setIsAuthorized(false);
                message.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
                setTimeout(() => {
                    router.replace('/pos');
                }, 1000); 
            } else {
                setIsAuthorized(true);
                fetchPaymentMethods();
            }
        }
    }, [user, authLoading, router, fetchPaymentMethods]);

    useEffect(() => {
        fetchPaymentMethods();
    }, [fetchPaymentMethods]);

    useEffect(() => {
        if (!socket) return;

        socket.on('paymentMethod:create', (newItem: PaymentMethod) => {
            setPaymentMethods((prev) => [...prev, newItem]);
        });

        socket.on('paymentMethod:update', (updatedItem: PaymentMethod) => {
            setPaymentMethods((prev) =>
                prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
            );
        });

        socket.on('paymentMethod:delete', ({ id }: { id: string }) => {
            setPaymentMethods((prev) => prev.filter((item) => item.id !== id));
        });

        return () => {
            socket.off('paymentMethod:create');
            socket.off('paymentMethod:update');
            socket.off('paymentMethod:delete');
        };
    }, [socket]);

    const handleAdd = () => {
        showLoading();
        router.push('/pos/paymentMethod/manager/add');
        setTimeout(() => hideLoading(), 1000);
    };

    const handleEdit = (paymentMethod: PaymentMethod) => {
        showLoading();
        router.push(`/pos/paymentMethod/manager/edit/${paymentMethod.id}`);
        setTimeout(() => hideLoading(), 1000);
    };

    const handleDelete = (paymentMethod: PaymentMethod) => {
        Modal.confirm({
            title: 'ยืนยันการลบวิธีชำระเงิน',
            content: `คุณต้องการลบวิธีชำระเงิน "${paymentMethod.display_name || paymentMethod.payment_method_name}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            onOk: async () => {
                await execute(async () => {
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

    if (authLoading || isAuthorized === null) {
        return (
            <div style={{ 
                display: 'flex', 
                height: '100vh', 
                justifyContent: 'center', 
                alignItems: 'center', 
                flexDirection: 'column', 
                gap: 16 
            }}>
                <Spin size="large" />
                <Text type="secondary">กำลังตรวจสอบสิทธิ์การใช้งาน...</Text>
            </div>
        );
    }

    if (isAuthorized === false) {
        return (
            <div style={{ 
                display: 'flex', 
                height: '100vh', 
                justifyContent: 'center', 
                alignItems: 'center', 
                flexDirection: 'column', 
                gap: 16 
            }}>
                <Spin size="large" />
                <Text type="danger">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กำลังพากลับ...</Text>
            </div>
        );
    }

    const activePaymentMethods = paymentMethods.filter(pm => pm.is_active);
    const inactivePaymentMethods = paymentMethods.filter(pm => !pm.is_active);

    return (
        <div className="payment-method-page" style={pageStyles.container}>
            <style>{globalStyles}</style>
            
            {/* Header */}
            <PageHeader 
                onRefresh={fetchPaymentMethods}
                onAdd={handleAdd}
            />
            
            {/* Stats Card */}
            <StatsCard 
                totalPaymentMethods={paymentMethods.length}
                activePaymentMethods={activePaymentMethods.length}
                inactivePaymentMethods={inactivePaymentMethods.length}
            />

            {/* Payment Methods List */}
            <div style={pageStyles.listContainer}>
                {paymentMethods.length > 0 ? (
                    <>
                        <div style={pageStyles.sectionTitle}>
                            <CreditCardOutlined style={{ fontSize: 18, color: '#10b981' }} />
                            <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>
                                รายการวิธีชำระเงิน
                            </span>
                            <div style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 600
                            }}>
                                {paymentMethods.length} รายการ
                            </div>
                        </div>

                        {paymentMethods.map((paymentMethod, index) => (
                            <PaymentMethodCard
                                key={paymentMethod.id}
                                paymentMethod={paymentMethod}
                                index={index}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </>
                ) : (
                    <EmptyState onAdd={handleAdd} />
                )}
            </div>
        </div>
    );
}
