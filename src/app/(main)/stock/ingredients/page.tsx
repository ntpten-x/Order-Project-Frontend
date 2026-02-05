'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Spin, Typography, Button, Space } from 'antd';
import { ExperimentOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import { Ingredients } from "../../../../types/api/stock/ingredients";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { useAuth } from "../../../../contexts/AuthContext";
import { useRealtimeList } from "../../../../utils/pos/realtime";
import { RealtimeEvents } from "../../../../utils/realtimeEvents";
import {
    IngredientsPageStyles,
    pageStyles,
    StatsCard,
    IngredientCard,
} from './style';

const { Text } = Typography;

import { authService } from "../../../../services/auth.service";
import PageContainer from "@/components/ui/page/PageContainer";
import PageSection from "@/components/ui/page/PageSection";
import PageStack from "@/components/ui/page/PageStack";
import UIPageHeader from "@/components/ui/page/PageHeader";
import UIEmptyState from "@/components/ui/states/EmptyState";

export default function IngredientsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [ingredients, setIngredients] = useState<Ingredients[]>([]);
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

    const fetchIngredients = useCallback(async () => {
        execute(async () => {
            const response = await fetch('/api/stock/ingredients');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลวัตถุดิบได้');
            }
            const data = await response.json();
            setIngredients(data);
        }, 'กำลังโหลดข้อมูลวัตถุดิบ...');
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
                    router.replace('/stock/items');
                }, 1000); 
            } else {
                setIsAuthorized(true);
                fetchIngredients();
            }
        }
    }, [user, authLoading, router, fetchIngredients]);

    useRealtimeList(
        socket,
        {
            create: RealtimeEvents.ingredients.create,
            update: RealtimeEvents.ingredients.update,
            delete: RealtimeEvents.ingredients.delete,
        },
        setIngredients
    );

    const handleAdd = () => {
        showLoading();
        router.push('/stock/ingredients/manage/add');
        setTimeout(() => hideLoading(), 1000);
    };

    const handleEdit = (ingredient: Ingredients) => {
        showLoading();
        router.push(`/stock/ingredients/manage/edit/${ingredient.id}`);
        setTimeout(() => hideLoading(), 1000);
    };

    const handleDelete = (ingredient: Ingredients) => {
        Modal.confirm({
            title: 'ยืนยันการลบวัตถุดิบ',
            content: `คุณต้องการลบวัตถุดิบ "${ingredient.display_name}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            onOk: async () => {
                await execute(async () => {
                    const response = await fetch(`/api/stock/ingredients/delete/${ingredient.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) {
                        throw new Error('ไม่สามารถลบวัตถุดิบได้');
                    }
                    message.success(`ลบวัตถุดิบ "${ingredient.display_name}" สำเร็จ`);
                }, "กำลังลบวัตถุดิบ...");
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

    const activeIngredients = ingredients.filter(i => i.is_active);
    const inactiveIngredients = ingredients.filter(i => !i.is_active);

    return (
        <div className="ingredients-page" style={pageStyles.container}>
            <IngredientsPageStyles />
            
            <UIPageHeader
                title="วัตถุดิบ"
                subtitle={`${ingredients.length} รายการ`}
                icon={<ExperimentOutlined />}
                actions={
                    <Space size={8} wrap>
                        <Button icon={<ReloadOutlined />} onClick={fetchIngredients}>รีเฟรช</Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>เพิ่มวัตถุดิบ</Button>
                    </Space>
                }
            />
            
            <PageContainer>
                <PageStack>
                    {/* Stats Card */}
                    <StatsCard 
                        totalIngredients={ingredients.length}
                        activeIngredients={activeIngredients.length}
                        inactiveIngredients={inactiveIngredients.length}
                    />

                    {/* Ingredients List */}
                    <PageSection
                        title="รายการวัตถุดิบ"
                        extra={<span style={{ fontWeight: 600 }}>{ingredients.length}</span>}
                    >
                        {ingredients.length > 0 ? (
                            <div style={pageStyles.listContainer}>
                                {ingredients.map((ingredient, index) => (
                                    <IngredientCard
                                        key={ingredient.id}
                                        ingredient={ingredient}
                                        index={index}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        ) : (
                            <UIEmptyState
                                title="ยังไม่มีวัตถุดิบ"
                                description="เริ่มต้นด้วยการเพิ่มวัตถุดิบแรกของคุณ"
                                action={
                                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                        เพิ่มวัตถุดิบ
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
