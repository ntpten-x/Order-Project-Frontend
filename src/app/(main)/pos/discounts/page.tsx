'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Spin, Typography } from 'antd';
import { PercentageOutlined } from '@ant-design/icons';
import { Discounts, DiscountType } from "../../../../types/api/pos/discounts";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { useAuth } from "../../../../contexts/AuthContext";
import {
    DiscountPageStyles,
    pageStyles,
    PageHeader,
    StatsCard,
    DiscountCard,
    EmptyState
} from './style';

const { Text } = Typography;

import { authService } from "../../../../services/auth.service";

export default function DiscountsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [discounts, setDiscounts] = useState<Discounts[]>([]);
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

    const fetchDiscounts = useCallback(async () => {
        execute(async () => {
            const response = await fetch('/api/pos/discounts');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลส่วนลดได้');
            }
            const data = await response.json();
            setDiscounts(data);
        }, 'กำลังโหลดข้อมูลส่วนลด...');
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
                fetchDiscounts();
            }
        }
    }, [user, authLoading, router, fetchDiscounts]);

    useEffect(() => {
        fetchDiscounts();
    }, [fetchDiscounts]);

    useEffect(() => {
        if (!socket) return;

        socket.on('discounts:create', (newItem: Discounts) => {
            setDiscounts((prev) => [...prev, newItem]);
        });

        socket.on('discounts:update', (updatedItem: Discounts) => {
            setDiscounts((prev) =>
                prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
            );
        });

        socket.on('discounts:delete', ({ id }: { id: string }) => {
            setDiscounts((prev) => prev.filter((item) => item.id !== id));
        });

        return () => {
            socket.off('discounts:create');
            socket.off('discounts:update');
            socket.off('discounts:delete');
        };
    }, [socket]);

    const handleAdd = () => {
        showLoading();
        router.push('/pos/discounts/manager/add');
        setTimeout(() => hideLoading(), 1000);
    };

    const handleEdit = (discount: Discounts) => {
        showLoading();
        router.push(`/pos/discounts/manager/edit/${discount.id}`);
        setTimeout(() => hideLoading(), 1000);
    };

    const handleDelete = (discount: Discounts) => {
        Modal.confirm({
            title: 'ยืนยันการลบส่วนลด',
            content: `คุณต้องการลบส่วนลด "${discount.display_name || discount.discount_name}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            onOk: async () => {
                await execute(async () => {
                    const response = await fetch(`/api/pos/discounts/delete/${discount.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) {
                        throw new Error('ไม่สามารถลบส่วนลดได้');
                    }
                    message.success(`ลบส่วนลด "${discount.display_name || discount.discount_name}" สำเร็จ`);
                }, "กำลังลบส่วนลด...");
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

    const activeDiscounts = discounts.filter(d => d.is_active);
    const inactiveDiscounts = discounts.filter(d => !d.is_active);
    const fixedDiscounts = discounts.filter(d => d.discount_type === DiscountType.Fixed);
    const percentageDiscounts = discounts.filter(d => d.discount_type === DiscountType.Percentage);

    return (
        <div className="discount-page" style={pageStyles.container}>
            <DiscountPageStyles />
            
            {/* Header */}
            <PageHeader 
                onRefresh={fetchDiscounts}
                onAdd={handleAdd}
            />
            
            {/* Stats Card */}
            <StatsCard 
                totalDiscounts={discounts.length}
                fixedDiscounts={fixedDiscounts.length}
                percentageDiscounts={percentageDiscounts.length}
                activeDiscounts={activeDiscounts.length}
                inactiveDiscounts={inactiveDiscounts.length}
            />

            {/* Discounts List */}
            <div style={pageStyles.listContainer}>
                {discounts.length > 0 ? (
                    <>
                        <div style={pageStyles.sectionTitle}>
                            <PercentageOutlined style={{ fontSize: 18, color: '#fa8c16' }} />
                            <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>
                                รายการส่วนลด
                            </span>
                            <div style={{
                                background: 'linear-gradient(135deg, #fa8c16 0%, #d48806 100%)',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 600
                            }}>
                                {discounts.length} รายการ
                            </div>
                        </div>

                        {discounts.map((discount, index) => (
                            <DiscountCard
                                key={discount.id}
                                discount={discount}
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
