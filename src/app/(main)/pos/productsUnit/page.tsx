'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Spin, Typography } from 'antd';
import { UnorderedListOutlined } from '@ant-design/icons';
import { ProductsUnit } from "../../../../types/api/pos/productsUnit";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { useAuth } from "../../../../contexts/AuthContext";
import {
    UnitPageStyles,
    pageStyles,
    PageHeader,
    StatsCard,
    UnitCard,
    EmptyState
} from './style';

const { Text } = Typography;

import { authService } from "../../../../services/auth.service";

export default function ProductsUnitPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [units, setUnits] = useState<ProductsUnit[]>([]);
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

    const fetchUnits = useCallback(async () => {
        execute(async () => {
            const response = await fetch('/api/pos/productsUnit');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลหน่วยสินค้าได้');
            }
            const data = await response.json();
            setUnits(data);
        }, 'กำลังโหลดข้อมูลหน่วยสินค้า...');
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
                fetchUnits();
            }
        }
    }, [user, authLoading, router, fetchUnits]);

    useEffect(() => {
        fetchUnits();
    }, [fetchUnits]);

    useEffect(() => {
        if (!socket) return;

        socket.on('productsUnit:create', (newItem: ProductsUnit) => {
            setUnits((prev) => [...prev, newItem]);
        });

        socket.on('productsUnit:update', (updatedItem: ProductsUnit) => {
            setUnits((prev) =>
                prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
            );
        });

        socket.on('productsUnit:delete', ({ id }: { id: string }) => {
            setUnits((prev) => prev.filter((item) => item.id !== id));
        });

        return () => {
            socket.off('productsUnit:create');
            socket.off('productsUnit:update');
            socket.off('productsUnit:delete');
        };
    }, [socket]);

    const handleAdd = () => {
        showLoading();
        router.push('/pos/productsUnit/manager/add');
        setTimeout(() => hideLoading(), 1000);
    };

    const handleEdit = (unit: ProductsUnit) => {
        showLoading();
        router.push(`/pos/productsUnit/manager/edit/${unit.id}`);
        setTimeout(() => hideLoading(), 1000);
    };

    const handleDelete = (unit: ProductsUnit) => {
        Modal.confirm({
            title: 'ยืนยันการลบหน่วยสินค้า',
            content: `คุณต้องการลบหน่วย "${unit.display_name}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            onOk: async () => {
                await execute(async () => {
                    const response = await fetch(`/api/pos/productsUnit/delete/${unit.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) {
                        throw new Error('ไม่สามารถลบหน่วยสินค้าได้');
                    }
                    message.success(`ลบหน่วย "${unit.display_name}" สำเร็จ`);
                }, "กำลังลบหน่วยสินค้า...");
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

    const activeUnits = units.filter(u => u.is_active);
    const inactiveUnits = units.filter(u => !u.is_active);

    return (
        <div className="unit-page" style={pageStyles.container}>
            <UnitPageStyles />
            
            {/* Header */}
            <PageHeader 
                onRefresh={fetchUnits}
                onAdd={handleAdd}
            />
            
            {/* Stats Card */}
            <StatsCard 
                totalUnits={units.length}
                activeUnits={activeUnits.length}
                inactiveUnits={inactiveUnits.length}
            />

            {/* Units List */}
            <div style={pageStyles.listContainer}>
                {units.length > 0 ? (
                    <>
                        <div style={pageStyles.sectionTitle}>
                            <UnorderedListOutlined style={{ fontSize: 18, color: '#13c2c2' }} />
                            <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>
                                รายการหน่วยสินค้า
                            </span>
                            <div style={{
                                background: 'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 600
                            }}>
                                {units.length} รายการ
                            </div>
                        </div>

                        {units.map((unit, index) => (
                            <UnitCard
                                key={unit.id}
                                unit={unit}
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
