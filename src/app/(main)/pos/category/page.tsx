'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Spin, Typography } from 'antd';
import { TagsOutlined } from '@ant-design/icons';
import { Category } from "../../../../types/api/pos/category";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { useAuth } from "../../../../contexts/AuthContext";
import {
    CategoryPageStyles,
    pageStyles,
    PageHeader,
    StatsCard,
    CategoryCard,
    EmptyState
} from './style';

const { Text } = Typography;

import { authService } from "../../../../services/auth.service";

export default function CategoryPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
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

    const fetchCategories = useCallback(async () => {
        execute(async () => {
            const response = await fetch('/api/pos/category');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลหมวดหมู่ได้');
            }
            const data = await response.json();
            setCategories(data);
        }, 'กำลังโหลดข้อมูลหมวดหมู่...');
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
                fetchCategories();
            }
        }
    }, [user, authLoading, router, fetchCategories]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        if (!socket) return;

        socket.on('category:create', (newItem: Category) => {
            setCategories((prev) => [...prev, newItem]);
        });

        socket.on('category:update', (updatedItem: Category) => {
            setCategories((prev) =>
                prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
            );
        });

        socket.on('category:delete', ({ id }: { id: string }) => {
            setCategories((prev) => prev.filter((item) => item.id !== id));
        });

        return () => {
            socket.off('category:create');
            socket.off('category:update');
            socket.off('category:delete');
        };
    }, [socket]);

    const handleAdd = () => {
        showLoading();
        router.push('/pos/category/manager/add');
        setTimeout(() => hideLoading(), 1000);
    };

    const handleEdit = (category: Category) => {
        showLoading();
        router.push(`/pos/category/manager/edit/${category.id}`);
        setTimeout(() => hideLoading(), 1000);
    };

    const handleDelete = (category: Category) => {
        Modal.confirm({
            title: 'ยืนยันการลบหมวดหมู่',
            content: `คุณต้องการลบหมวดหมู่ "${category.display_name}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            onOk: async () => {
                await execute(async () => {
                    const response = await fetch(`/api/pos/category/delete/${category.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) {
                        throw new Error('ไม่สามารถลบหมวดหมู่ได้');
                    }
                    message.success(`ลบหมวดหมู่ "${category.display_name}" สำเร็จ`);
                }, "กำลังลบหมวดหมู่...");
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

    const activeCategories = categories.filter(c => c.is_active);
    const inactiveCategories = categories.filter(c => !c.is_active);

    return (
        <div className="category-page" style={pageStyles.container}>
            <CategoryPageStyles />
            
            {/* Header */}
            <PageHeader 
                onRefresh={fetchCategories}
                onAdd={handleAdd}
            />
            
            {/* Stats Card */}
            <StatsCard 
                totalCategories={categories.length}
                activeCategories={activeCategories.length}
                inactiveCategories={inactiveCategories.length}
            />

            {/* Categories List */}
            <div style={pageStyles.listContainer}>
                {categories.length > 0 ? (
                    <>
                        <div style={pageStyles.sectionTitle}>
                            <TagsOutlined style={{ fontSize: 18, color: '#722ed1' }} />
                            <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>
                                รายการหมวดหมู่
                            </span>
                            <div style={{
                                background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 600
                            }}>
                                {categories.length} รายการ
                            </div>
                        </div>

                        {categories.map((category, index) => (
                            <CategoryCard
                                key={category.id}
                                category={category}
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
