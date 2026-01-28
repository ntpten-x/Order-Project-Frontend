'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Spin, Typography } from 'antd';
import { CarOutlined } from '@ant-design/icons';
import { Delivery } from "../../../../types/api/pos/delivery";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { useAuth } from "../../../../contexts/AuthContext";
import {
    DeliveryPageStyles,
    pageStyles,
    PageHeader,
    StatsCard,
    DeliveryCard,
    EmptyState
} from './style';

const { Text } = Typography;

import { authService } from "../../../../services/auth.service";

export default function DeliveryPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
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

    const fetchDeliveries = useCallback(async () => {
        execute(async () => {
            const response = await fetch('/api/pos/delivery');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลบริการส่งได้');
            }
            const data = await response.json();
            setDeliveries(data);
        }, 'กำลังโหลดข้อมูลบริการส่ง...');
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
                fetchDeliveries();
            }
        }
    }, [user, authLoading, router, fetchDeliveries]);

    useEffect(() => {
        fetchDeliveries();
    }, [fetchDeliveries]);

    useEffect(() => {
        if (!socket) return;

        socket.on('delivery:create', (newItem: Delivery) => {
            setDeliveries((prev) => [...prev, newItem]);
        });

        socket.on('delivery:update', (updatedItem: Delivery) => {
            setDeliveries((prev) =>
                prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
            );
        });

        socket.on('delivery:delete', ({ id }: { id: string }) => {
            setDeliveries((prev) => prev.filter((item) => item.id !== id));
        });

        return () => {
            socket.off('delivery:create');
            socket.off('delivery:update');
            socket.off('delivery:delete');
        };
    }, [socket]);

    const handleAdd = () => {
        showLoading();
        router.push('/pos/delivery/manager/add');
        setTimeout(() => hideLoading(), 1000);
    };

    const handleEdit = (delivery: Delivery) => {
        showLoading();
        router.push(`/pos/delivery/manager/edit/${delivery.id}`);
        setTimeout(() => hideLoading(), 1000);
    };

    const handleDelete = (delivery: Delivery) => {
        Modal.confirm({
            title: 'ยืนยันการลบบริการส่ง',
            content: `คุณต้องการลบบริการส่ง "${delivery.delivery_name}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            onOk: async () => {
                await execute(async () => {
                    const response = await fetch(`/api/pos/delivery/delete/${delivery.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) {
                        throw new Error('ไม่สามารถลบบริการส่งได้');
                    }
                    message.success(`ลบบริการส่ง "${delivery.delivery_name}" สำเร็จ`);
                }, "กำลังลบบริการส่ง...");
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

    const activeDeliveries = deliveries.filter(d => d.is_active);
    const inactiveDeliveries = deliveries.filter(d => !d.is_active);

    return (
        <div className="delivery-page" style={pageStyles.container}>
            <DeliveryPageStyles />
            
            {/* Header */}
            <PageHeader 
                onRefresh={fetchDeliveries}
                onAdd={handleAdd}
            />
            
            {/* Stats Card */}
            <StatsCard 
                totalDelivery={deliveries.length}
                activeDelivery={activeDeliveries.length}
                inactiveDelivery={inactiveDeliveries.length}
            />

            {/* Deliveries List */}
            <div style={pageStyles.listContainer}>
                {deliveries.length > 0 ? (
                    <>
                        <div style={pageStyles.sectionTitle}>
                            <CarOutlined style={{ fontSize: 18, color: '#13c2c2' }} />
                            <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>
                                รายการบริการส่ง
                            </span>
                            <div style={{
                                background: 'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 600
                            }}>
                                {deliveries.length} รายการ
                            </div>
                        </div>

                        {deliveries.map((delivery, index) => (
                            <DeliveryCard
                                key={delivery.id}
                                delivery={delivery}
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
