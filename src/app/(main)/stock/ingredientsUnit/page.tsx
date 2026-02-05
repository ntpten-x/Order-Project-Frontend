'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Spin, Typography, Button, Space } from 'antd';
import { ExperimentOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import { IngredientsUnit } from "../../../../types/api/stock/ingredientsUnit";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { useRealtimeList } from "../../../../utils/pos/realtime";
import { RealtimeEvents } from "../../../../utils/realtimeEvents";
import { useAuth } from "../../../../contexts/AuthContext";
import {
    IngredientsUnitPageStyles,
    pageStyles,
    StatsCard,
    UnitCard,
} from './style';
import PageContainer from "@/components/ui/page/PageContainer";
import PageSection from "@/components/ui/page/PageSection";
import PageStack from "@/components/ui/page/PageStack";
import UIPageHeader from "@/components/ui/page/PageHeader";
import UIEmptyState from "@/components/ui/states/EmptyState";

const { Text } = Typography;

import { authService } from "../../../../services/auth.service";

export default function IngredientsUnitPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [ingredientsUnits, setIngredientsUnits] = useState<IngredientsUnit[]>([]);
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

    const fetchIngredientsUnits = useCallback(async () => {
        execute(async () => {
            const response = await fetch('/api/stock/ingredientsUnit/getAll');
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

        socket.on(RealtimeEvents.ingredientsUnit.create, (newItem: IngredientsUnit) => {
            setIngredientsUnits((prev) => [...prev, newItem]);
            message.success(`เพิ่มหน่วยวัตถุดิบ ${newItem.unit_name} แล้ว`);
        });

        socket.on(RealtimeEvents.ingredientsUnit.update, (updatedItem: IngredientsUnit) => {
            setIngredientsUnits((prev) =>
                prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
            );
        });

        socket.on(RealtimeEvents.ingredientsUnit.delete, ({ id }: { id: string }) => {
            setIngredientsUnits((prev) => prev.filter((item) => item.id !== id));
        });

        return () => {
            socket.off(RealtimeEvents.ingredientsUnit.create);
            socket.off(RealtimeEvents.ingredientsUnit.update);
            socket.off(RealtimeEvents.ingredientsUnit.delete);
        };
    }, [socket]);

    const handleAdd = () => {
        showLoading();
        router.push('/stock/ingredientsUnit/manage/add');
        setTimeout(() => hideLoading(), 1000);
    };

    const handleEdit = (unit: IngredientsUnit) => {
        showLoading();
        router.push(`/stock/ingredientsUnit/manage/edit/${unit.id}`);
        setTimeout(() => hideLoading(), 1000);
    };

    const handleDelete = (unit: IngredientsUnit) => {
        Modal.confirm({
            title: 'ยืนยันการลบหน่วยวัตถุดิบ',
            content: `คุณต้องการลบหน่วยวัตถุดิบ "${unit.display_name}" หรือไม่?`,
            okText: '??',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            onOk: async () => {
                await execute(async () => {
                    const response = await fetch(`/api/stock/ingredientsUnit/delete/${unit.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
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
            
            <UIPageHeader
                title="หน่วยวัตถุดิบ"
                subtitle={`${ingredientsUnits.length} รายการ`}
                icon={<ExperimentOutlined />}
                actions={
                    <Space size={8} wrap>
                        <Button icon={<ReloadOutlined />} onClick={fetchIngredientsUnits}>รีเฟรช</Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>เพิ่มหน่วยวัตถุดิบ</Button>
                    </Space>
                }
            />
            
            <PageContainer>
                <PageStack>
                    <StatsCard 
                        totalUnits={ingredientsUnits.length}
                        activeUnits={activeUnits.length}
                        inactiveUnits={inactiveUnits.length}
                    />

                    <PageSection
                        title="รายการหน่วยวัตถุดิบ"
                        extra={<span style={{ fontWeight: 600 }}>{ingredientsUnits.length}</span>}
                    >
                        {ingredientsUnits.length > 0 ? (
                            <div style={pageStyles.listContainer}>
                                {ingredientsUnits.map((unit, index) => (
                                    <UnitCard
                                        key={unit.id}
                                        unit={unit}
                                        index={index}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        ) : (
                            <UIEmptyState
                                title="ยังไม่มีหน่วยวัตถุดิบ"
                                description="เริ่มต้นด้วยการเพิ่มหน่วยวัตถุดิบแรกของคุณ"
                                action={
                                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                        เพิ่มหน่วยวัตถุดิบ
                                    </Button>
                                }
                            />
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
