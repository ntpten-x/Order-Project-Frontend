'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Typography, Button, Input, Space } from 'antd';
import { 
    TagsOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { Category } from "../../../../types/api/pos/category";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { getCsrfTokenCached } from "../../../../utils/pos/csrf";
import { useRoleGuard } from "../../../../utils/pos/accessControl";
import { useRealtimeList } from "../../../../utils/pos/realtime";
import { readCache, writeCache } from "../../../../utils/pos/cache";
import { pageStyles, globalStyles } from '../../../../theme/pos/category/style';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import PageContainer from "../../../../components/ui/page/PageContainer";
import PageSection from "../../../../components/ui/page/PageSection";
import PageStack from "../../../../components/ui/page/PageStack";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import UIEmptyState from "../../../../components/ui/states/EmptyState";
import { RealtimeEvents } from "../../../../utils/realtimeEvents";

const { Text } = Typography;

// ============ STATS CARD COMPONENT ============

interface StatsCardProps {
    totalCategories: number;
    activeCategories: number;
    inactiveCategories: number;
}

const StatsCard = ({ totalCategories, activeCategories, inactiveCategories }: StatsCardProps) => (
    <div style={pageStyles.statsCard}>
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#7C3AED' }}>{totalCategories}</span>
            <Text style={pageStyles.statLabel}>ทั้งหมด</Text>
        </div>
        <div style={{ width: 1, height: 24, background: '#f0f0f0', alignSelf: 'center' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#10B981' }}>{activeCategories}</span>
            <Text style={pageStyles.statLabel}>ใช้งาน</Text>
        </div>
        <div style={{ width: 1, height: 24, background: '#f0f0f0', alignSelf: 'center' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#EF4444' }}>{inactiveCategories}</span>
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
                animationDelay: `${index * 0.05}s`
            }}
            onClick={() => onEdit(category)}
        >
            <div style={pageStyles.categoryCardInner}>
                {/* Icon */}
                <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: category.is_active 
                        ? 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)' 
                        : '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: category.is_active ? '0 4px 10px rgba(124, 58, 237, 0.1)' : 'none'
                }}>
                    <TagsOutlined style={{ 
                        fontSize: 24, 
                        color: category.is_active ? '#7C3AED' : '#94A3B8' 
                    }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text 
                            strong 
                            style={{ 
                                fontSize: 16, 
                                color: category.is_active ? '#1E293B' : '#64748B' 
                            }}
                            ellipsis={{ tooltip: category.display_name }}
                        >
                            {category.display_name}
                        </Text>
                        {category.is_active ? (
                            <div style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: '#10B981',
                                boxShadow: '0 0 0 2px #ecfdf5'
                            }} />
                        ) : (
                            <div style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: '#CBD5E1'
                            }} />
                        )}
                    </div>
                    <Text 
                        type="secondary" 
                        style={{ fontSize: 13, display: 'block', color: '#64748B' }}
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
                            borderRadius: 12,
                            color: '#7C3AED',
                            background: '#F3E8FF',
                            width: 36,
                            height: 36
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
                            borderRadius: 12,
                            background: '#FEF2F2',
                            width: 36,
                            height: 36
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default function CategoryPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [searchText, setSearchText] = useState('');
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard({ allowedRoles: ["Admin", "Manager"] });

    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    useEffect(() => {
        const cached = readCache<Category[]>("pos:categories", 5 * 60 * 1000);
        if (cached && cached.length > 0) {
            setCategories(cached);
        }
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
        { create: RealtimeEvents.categories.create, update: RealtimeEvents.categories.update, delete: RealtimeEvents.categories.delete },
        setCategories
    );

    // Centralized filtering logic
    useEffect(() => {
        if (searchText) {
            const lower = searchText.toLowerCase();
            const filtered = categories.filter((c: Category) => 
                c.display_name.toLowerCase().includes(lower) || 
                c.category_name.toLowerCase().includes(lower)
            );
            setFilteredCategories(filtered);
        } else {
            setFilteredCategories(categories);
        }
    }, [categories, searchText]);

    useEffect(() => {
        if (categories.length > 0) {
            writeCache("pos:categories", categories);
        }
    }, [categories]);

    const handleSearch = (value: string) => {
        setSearchText(value);
    };

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
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            maskClosable: true,
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
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กำลังพากลับ..." tone="danger" />;
    }

    const activeCategories = categories.filter(c => c.is_active);
    const inactiveCategories = categories.filter(c => !c.is_active);

    return (
        <div className="category-page" style={pageStyles.container}>
            <style>{globalStyles}</style>
            <style jsx global>{`
                .search-input-placeholder-white input::placeholder {
                    color: rgba(255, 255, 255, 0.6) !important;
                }
                .search-input-placeholder-white input {
                    color: white !important;
                }
                .category-card {
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                }
            `}</style>
            
            {/* Header */}
            <UIPageHeader
                title="หมวดหมู่สินค้า"
                subtitle={`${categories.length} รายการ`}
                icon={<TagsOutlined />}
                actions={
                    <Space size={8} wrap>
                        <Input
                            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                            allowClear
                            placeholder="ค้นหาหมวดหมู่..."
                            onChange={(e) => handleSearch(e.target.value)}
                            style={{ minWidth: 220 }}
                        />
                        <Button icon={<ReloadOutlined />} onClick={fetchCategories} />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                            เพิ่มหมวดหมู่
                        </Button>
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <StatsCard
                        totalCategories={categories.length}
                        activeCategories={activeCategories.length}
                        inactiveCategories={inactiveCategories.length}
                    />

                    <PageSection
                        title="รายการหมวดหมู่"
                        extra={<span style={{ fontWeight: 600 }}>{filteredCategories.length}</span>}
                    >
                        {filteredCategories.length > 0 ? (
                            filteredCategories.map((category, index) => (
                                <CategoryCard
                                    key={category.id}
                                    category={category}
                                    index={index}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))
                        ) : (
                            <UIEmptyState
                                title={
                                    searchText.trim()
                                        ? "ไม่พบหมวดหมู่ที่ค้นหา"
                                        : "ยังไม่มีหมวดหมู่"
                                }
                                description={
                                    searchText.trim()
                                        ? "ลองค้นหาด้วยคำอื่นหรือล้างการค้นหา"
                                        : "เพิ่มหมวดหมู่แรกเพื่อเริ่มต้นใช้งาน"
                                }
                                action={
                                    !searchText.trim() ? (
                                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                            เพิ่มหมวดหมู่
                                        </Button>
                                    ) : null
                                }
                            />
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>

        </div>
    );
}
