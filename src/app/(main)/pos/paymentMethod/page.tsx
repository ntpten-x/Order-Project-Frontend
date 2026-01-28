'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Spin, Typography } from 'antd';
import { CreditCardOutlined } from '@ant-design/icons';
import { PaymentMethod } from "../../../../types/api/pos/paymentMethod";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { useAuth } from "../../../../contexts/AuthContext";
import {
    PaymentMethodPageStyles,
    pageStyles,
    PageHeader,
    StatsCard,
    PaymentMethodCard,
    EmptyState
} from './style';

const { Text } = Typography;

import { authService } from "../../../../services/auth.service";

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
            <PaymentMethodPageStyles />
            
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
