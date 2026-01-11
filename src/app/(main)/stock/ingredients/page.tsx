'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Spin, Typography } from 'antd';
import { ExperimentOutlined } from '@ant-design/icons';
import { Ingredients } from "../../../../types/api/stock/ingredients";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { useAuth } from "../../../../contexts/AuthContext";
import {
    IngredientsPageStyles,
    pageStyles,
    PageHeader,
    StatsCard,
    IngredientCard,
    EmptyState
} from './style';

const { Text } = Typography;

import { authService } from "../../../../services/auth.service";

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

    useEffect(() => {
        fetchIngredients();
    }, [fetchIngredients]);

    useEffect(() => {
        if (!socket) return;

        socket.on('ingredients:create', (newItem: Ingredients) => {
            setIngredients((prev) => [...prev, newItem]);
        });

        socket.on('ingredients:update', (updatedItem: Ingredients) => {
            setIngredients((prev) =>
                prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
            );
        });

        socket.on('ingredients:delete', ({ id }: { id: string }) => {
            setIngredients((prev) => prev.filter((item) => item.id !== id));
        });

        return () => {
            socket.off('ingredients:create');
            socket.off('ingredients:update');
            socket.off('ingredients:delete');
        };
    }, [socket]);

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
            
            {/* Header */}
            <PageHeader 
                onRefresh={fetchIngredients}
                onAdd={handleAdd}
            />
            
            {/* Stats Card */}
            <StatsCard 
                totalIngredients={ingredients.length}
                activeIngredients={activeIngredients.length}
                inactiveIngredients={inactiveIngredients.length}
            />

            {/* Ingredients List */}
            <div style={pageStyles.listContainer}>
                {ingredients.length > 0 ? (
                    <>
                        <div style={pageStyles.sectionTitle}>
                            <ExperimentOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                            <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>
                                รายการวัตถุดิบ
                            </span>
                            <div style={{
                                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 600
                            }}>
                                {ingredients.length} รายการ
                            </div>
                        </div>

                        {ingredients.map((ingredient, index) => (
                            <IngredientCard
                                key={ingredient.id}
                                ingredient={ingredient}
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
