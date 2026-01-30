'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Spin, Typography, Button, Empty } from 'antd';
import { 
    TagsOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleFilled,
    CloseCircleFilled
} from '@ant-design/icons';
import { Category } from "../../../../types/api/pos/category";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { getCsrfTokenCached } from "../../../../utils/pos/csrf";
import { useRoleGuard } from "../../../../utils/pos/accessControl";
import { useRealtimeList } from "../../../../utils/pos/realtime";
import { pageStyles, globalStyles } from '../../../../theme/pos/category/style';

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
                    <TagsOutlined style={{ fontSize: 24, color: 'white' }} />
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
                        หมวดหมู่สินค้า
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
                        color: '#722ed1',
                        borderRadius: 12,
                        height: 40,
                        fontWeight: 600,
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                >
                    เพิ่มหมวดหมู่
                </Button>
            </div>
        </div>
    </div>
);

// ============ STATS CARD COMPONENT ============

interface StatsCardProps {
    totalCategories: number;
    activeCategories: number;
    inactiveCategories: number;
}

const StatsCard = ({ totalCategories, activeCategories, inactiveCategories }: StatsCardProps) => (
    <div style={pageStyles.statsCard}>
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#722ed1' }}>{totalCategories}</span>
            <Text style={pageStyles.statLabel}>ทั้งหมด</Text>
        </div>
        <div style={{ width: 1, background: '#f0f0f0' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#52c41a' }}>{activeCategories}</span>
            <Text style={pageStyles.statLabel}>ใช้งาน</Text>
        </div>
        <div style={{ width: 1, background: '#f0f0f0' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#ff4d4f' }}>{inactiveCategories}</span>
            <Text style={pageStyles.statLabel}>ไม่ใช้งาน</Text>
        </div>
    </div>
);

// ============ CATEGORY CARD COMPONENT ============

interface CategoryCardProps {
    category: Category;
    index: number;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
}

const CategoryCard = ({ category, index, onEdit, onDelete }: CategoryCardProps) => {
    return (
        <div
            className="category-card"
            style={{
                ...pageStyles.categoryCard(category.is_active),
                animationDelay: `${index * 0.03}s`
            }}
        >
            <div style={pageStyles.categoryCardInner}>
                {/* Icon */}
                <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <TagsOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text 
                            strong 
                            style={{ fontSize: 16, color: '#1a1a2e' }}
                            ellipsis={{ tooltip: category.display_name }}
                        >
                            {category.display_name}
                        </Text>
                        {category.is_active ? (
                            <CheckCircleFilled style={{ color: '#52c41a', fontSize: 14 }} />
                        ) : (
                            <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 14 }} />
                        )}
                    </div>
                    <Text 
                        type="secondary" 
                        style={{ fontSize: 13, display: 'block' }}
                        ellipsis={{ tooltip: category.category_name }}
                    >
                        {category.category_name}
                    </Text>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(category);
                        }}
                        style={{
                            borderRadius: 10,
                            color: '#722ed1',
                            background: '#f9f0ff'
                        }}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(category);
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
                    ยังไม่มีหมวดหมู่
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                    เริ่มต้นเพิ่มหมวดหมู่แรกของคุณ
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
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd} style={{ background: '#722ed1' }}>
            เพิ่มหมวดหมู่
        </Button>
    </Empty>
);


export default function CategoryPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard({ requiredRole: "Admin" });

    useEffect(() => {
        getCsrfTokenCached();
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
        if (isAuthorized) {
            fetchCategories();
        }
    }, [isAuthorized, fetchCategories]);

    useRealtimeList(
        socket,
        { create: "category:create", update: "category:update", delete: "category:delete" },
        setCategories
    );

    const handleAdd = () => {
        showLoading("กำลังเปิดหน้าจัดการหมวดหมู่...");
        router.push('/pos/category/manager/add');
    };

    const handleEdit = (category: Category) => {
        showLoading("กำลังเปิดหน้าแก้ไขหมวดหมู่...");
        router.push(`/pos/category/manager/edit/${category.id}`);
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
                    const csrfToken = await getCsrfTokenCached();
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

    if (isChecking) {
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

    if (!isAuthorized) {
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
            <style>{globalStyles}</style>
            
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
