'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Spin, Typography } from 'antd';
import { ExperimentOutlined } from '@ant-design/icons';
import { IngredientsUnit } from "../../../types/api/ingredientsUnit";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../contexts/GlobalLoadingContext";
import { useAsyncAction } from "../../../hooks/useAsyncAction";
import { useSocket } from "../../../hooks/useSocket";
import { useAuth } from "../../../contexts/AuthContext";
import {
    IngredientsUnitPageStyles,
    pageStyles,
    PageHeader,
    StatsCard,
    UnitCard,
    EmptyState
} from './style';

const { Text } = Typography;

export default function IngredientsUnitPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [ingredientsUnits, setIngredientsUnits] = useState<IngredientsUnit[]>([]);
    const { execute } = useAsyncAction();
    const { showLoading, hideLoading } = useGlobalLoading();
    const { socket } = useSocket();

    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    const fetchIngredientsUnits = useCallback(async () => {
        execute(async () => {
            const response = await fetch('/api/ingredientsUnit/getAll');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลหน่วยวัตถุดิบได้');
            }
            const data = await response.json();
            setIngredientsUnits(data);
        }, 'กำลังโหลดข้อมูลหน่วยวัตถุดิบ...');
    }, [execute]);

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== 'Admin') {
                setIsAuthorized(false);
                setTimeout(() => {
                    router.replace('/');
                }, 1000); 
            } else {
                setIsAuthorized(true);
                fetchIngredientsUnits();
            }
        }
    }, [user, authLoading, router, fetchIngredientsUnits]);

    useEffect(() => {
        fetchIngredientsUnits();
    }, [fetchIngredientsUnits]);

    useEffect(() => {
        if (!socket) return;

        socket.on('ingredientsUnit:create', (newItem: IngredientsUnit) => {
            setIngredientsUnits((prev) => [...prev, newItem]);
            message.success(`เพิ่มหน่วยวัตถุดิบ ${newItem.unit_name} แล้ว`);
        });

        socket.on('ingredientsUnit:update', (updatedItem: IngredientsUnit) => {
            setIngredientsUnits((prev) =>
                prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
            );
        });

        socket.on('ingredientsUnit:delete', ({ id }: { id: string }) => {
            setIngredientsUnits((prev) => prev.filter((item) => item.id !== id));
        });

        return () => {
            socket.off('ingredientsUnit:create');
            socket.off('ingredientsUnit:update');
            socket.off('ingredientsUnit:delete');
        };
    }, [socket]);

    const handleAdd = () => {
        showLoading();
        router.push('/ingredientsUnit/manage/add');
        setTimeout(() => hideLoading(), 1000);
    };

    const handleEdit = (unit: IngredientsUnit) => {
        showLoading();
        router.push(`/ingredientsUnit/manage/edit/${unit.id}`);
        setTimeout(() => hideLoading(), 1000);
    };

    const handleDelete = (unit: IngredientsUnit) => {
        Modal.confirm({
            title: 'ยืนยันการลบหน่วยวัตถุดิบ',
            content: `คุณต้องการลบหน่วยวัตถุดิบ "${unit.display_name}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            onOk: async () => {
                await execute(async () => {
                    const response = await fetch(`/api/ingredientsUnit/delete/${unit.id}`, {
                        method: 'DELETE',
                    });
                    if (!response.ok) {
                        throw new Error('ไม่สามารถลบหน่วยวัตถุดิบได้');
                    }
                    message.success(`ลบหน่วยวัตถุดิบ "${unit.display_name}" สำเร็จ`);
                }, "กำลังลบหน่วยวัตถุดิบ...");
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
                <Text type="danger">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กำลังพากลับหน้าแรก...</Text>
            </div>
        );
    }

    const activeUnits = ingredientsUnits.filter(u => u.is_active);
    const inactiveUnits = ingredientsUnits.filter(u => !u.is_active);

    return (
        <div className="ingredients-unit-page" style={pageStyles.container}>
            <IngredientsUnitPageStyles />
            
            {/* Header */}
            <PageHeader 
                onRefresh={fetchIngredientsUnits}
                onAdd={handleAdd}
            />
            
            {/* Stats Card */}
            <StatsCard 
                totalUnits={ingredientsUnits.length}
                activeUnits={activeUnits.length}
                inactiveUnits={inactiveUnits.length}
            />

            {/* Units List */}
            <div style={pageStyles.listContainer}>
                {ingredientsUnits.length > 0 ? (
                    <>
                        <div style={pageStyles.sectionTitle}>
                            <ExperimentOutlined style={{ fontSize: 18, color: '#722ed1' }} />
                            <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>
                                รายการหน่วยวัตถุดิบ
                            </span>
                            <div style={{
                                background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 600
                            }}>
                                {ingredientsUnits.length} รายการ
                            </div>
                        </div>

                        {ingredientsUnits.map((unit, index) => (
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
