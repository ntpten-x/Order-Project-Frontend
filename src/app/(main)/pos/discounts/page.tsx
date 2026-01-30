'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Spin, Typography, Tag, Button, Empty, Input } from 'antd';
import { 
    PercentageOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleFilled,
    CloseCircleFilled,
    DollarOutlined
} from '@ant-design/icons';
import { Discounts, DiscountType } from "../../../../types/api/pos/discounts";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { getCsrfTokenCached } from "../../../../utils/pos/csrf";
import { useRoleGuard } from "../../../../utils/pos/accessControl";
import { useRealtimeList } from "../../../../utils/pos/realtime";
import { readCache, writeCache } from "../../../../utils/pos/cache";
import { pageStyles, globalStyles } from '../../../../theme/pos/discounts/style';

const { Text, Title } = Typography;

// ============ HEADER COMPONENT ============

interface HeaderProps {
    onRefresh: () => void;
    onAdd: () => void;
    searchValue: string;
    onSearchChange: (value: string) => void;
}

const PageHeader = ({ onRefresh, onAdd, searchValue, onSearchChange }: HeaderProps) => (
    <div style={pageStyles.header}>
        <div style={pageStyles.headerDecoCircle1} />
        <div style={pageStyles.headerDecoCircle2} />
        
        <div style={pageStyles.headerContent}>
            <div style={pageStyles.headerLeft}>
                <div style={pageStyles.headerIconBox}>
                    <PercentageOutlined style={{ fontSize: 24, color: 'white' }} />
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
                        ส่วนลด
                    </Title>
                </div>
        </div>
        <div style={pageStyles.headerActions}>
            <Input
                allowClear
                placeholder="ค้นหาส่วนลด..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{ width: 240, borderRadius: 10 }}
            />
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
                        color: '#fa8c16',
                        borderRadius: 12,
                        height: 40,
                        fontWeight: 600,
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                >
                    เพิ่มส่วนลด
                </Button>
            </div>
        </div>
    </div>
);

// ============ STATS CARD COMPONENT ============

interface StatsCardProps {
    totalDiscounts: number;
    fixedDiscounts: number;
    percentageDiscounts: number;
    activeDiscounts: number;
    inactiveDiscounts: number;
}

const StatsCard = ({ 
    totalDiscounts, 
    fixedDiscounts, 
    percentageDiscounts, 
    activeDiscounts, 
    inactiveDiscounts 
}: StatsCardProps) => (
    <div style={pageStyles.statsCard}>
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#fa8c16' }}>{totalDiscounts}</span>
            <Text style={pageStyles.statLabel}>ทั้งหมด</Text>
        </div>
        <div style={{ width: 1, background: '#f0f0f0' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#1890ff' }}>{fixedDiscounts}</span>
            <Text style={pageStyles.statLabel}>คงที่ (บาท)</Text>
        </div>
        <div style={{ width: 1, background: '#f0f0f0' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#722ed1' }}>{percentageDiscounts}</span>
            <Text style={pageStyles.statLabel}>เปอร์เซ็นต์</Text>
        </div>
        <div style={{ width: 1, background: '#f0f0f0' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#52c41a' }}>{activeDiscounts}</span>
            <Text style={pageStyles.statLabel}>เปิดใช้งาน</Text>
        </div>
        <div style={{ width: 1, background: '#f0f0f0' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#ff4d4f' }}>{inactiveDiscounts}</span>
            <Text style={pageStyles.statLabel}>ปิดใช้งาน</Text>
        </div>
    </div>
);

// ============ DISCOUNT CARD COMPONENT ============

interface DiscountCardProps {
    discount: Discounts;
    index: number;
    onEdit: (discount: Discounts) => void;
    onDelete: (discount: Discounts) => void;
}

const DiscountCard = ({ discount, index, onEdit, onDelete }: DiscountCardProps) => {
    const isFixed = discount.discount_type === DiscountType.Fixed;
    
    return (
        <div
            className="discount-card"
            style={{
                ...pageStyles.discountCard(discount.is_active),
                animationDelay: `${index * 0.03}s`
            }}
        >
            <div style={pageStyles.discountCardInner}>
                {/* Icon */}
                <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 14,
                    border: '2px solid #f0f0f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    flexShrink: 0,
                    overflow: 'hidden',
                    position: 'relative',
                    background: isFixed 
                        ? 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)'
                        : 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {isFixed ? (
                        <DollarOutlined style={{ fontSize: 28, color: '#1890ff' }} />
                    ) : (
                        <PercentageOutlined style={{ fontSize: 28, color: '#722ed1' }} />
                    )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text 
                            strong 
                            style={{ fontSize: 16, color: '#1a1a2e' }}
                        >
                            {discount.display_name || discount.discount_name}
                        </Text>
                        {discount.is_active ? (
                            <CheckCircleFilled style={{ color: '#52c41a', fontSize: 14 }} />
                        ) : (
                            <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 14 }} />
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Tag 
                            color={isFixed ? 'blue' : 'purple'}
                            style={{ 
                                borderRadius: 8, 
                                margin: 0,
                                fontSize: 11 
                            }}
                        >
                            {isFixed ? `฿${discount.discount_amount}` : `${discount.discount_amount}%`}
                        </Tag>
                        <Tag 
                            color={discount.is_active ? 'success' : 'default'}
                            style={{ 
                                borderRadius: 8, 
                                margin: 0,
                                fontSize: 11 
                            }}
                        >
                            {discount.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </Tag>
                        {discount.description && (
                            <Text type="secondary" style={{ fontSize: 11 }} ellipsis>
                                {discount.description}
                            </Text>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(discount);
                        }}
                        style={{
                            borderRadius: 10,
                            color: '#fa8c16',
                            background: '#fff7e6'
                        }}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(discount);
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
                    ยังไม่มีส่วนลด
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                    เริ่มต้นเพิ่มส่วนลดแรกของคุณ
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
        <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={onAdd}
            style={{
                background: 'linear-gradient(135deg, #fa8c16 0%, #d48806 100%)',
                border: 'none'
            }}
        >
            เพิ่มส่วนลด
        </Button>
    </Empty>
);

export default function DiscountsPage() {
    const router = useRouter();
    const [discounts, setDiscounts] = useState<Discounts[]>([]);
    const [searchValue, setSearchValue] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard({ requiredRole: "Admin" });


    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchValue.trim());
        }, 400);
        return () => clearTimeout(handler);
    }, [searchValue]);

    useEffect(() => {
        if (debouncedSearch) return;
        const cached = readCache<Discounts[]>("pos:discounts", 5 * 60 * 1000);
        if (cached && cached.length > 0) {
            setDiscounts(cached);
        }
    }, [debouncedSearch]);

    const fetchDiscounts = useCallback(async (query?: string) => {
        execute(async () => {
            const params = new URLSearchParams();
            if (query) params.set("q", query);
            const url = params.toString() ? `/api/pos/discounts?${params.toString()}` : '/api/pos/discounts';
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลส่วนลดได้');
            }
            const data = await response.json();
            setDiscounts(data);
        }, 'กำลังโหลดข้อมูลส่วนลด...');
    }, [execute]);

    useEffect(() => {
        if (isAuthorized) {
            fetchDiscounts(debouncedSearch || undefined);
        }
    }, [isAuthorized, fetchDiscounts, debouncedSearch]);

    const normalizedQuery = debouncedSearch.trim().toLowerCase();
    const shouldIncludeDiscount = useCallback((item: Discounts) => {
        if (!normalizedQuery) return true;
        const haystack = `${item.display_name || ""} ${item.discount_name || ""} ${item.description || ""}`.toLowerCase();
        return haystack.includes(normalizedQuery);
    }, [normalizedQuery]);

    useRealtimeList(
        socket,
        { create: "discounts:create", update: "discounts:update", delete: "discounts:delete" },
        setDiscounts,
        (item) => item.id,
        shouldIncludeDiscount
    );

    useEffect(() => {
        if (!debouncedSearch && discounts.length > 0) {
            writeCache("pos:discounts", discounts);
        }
    }, [discounts, debouncedSearch]);

    const handleAdd = () => {
        showLoading("กำลังเปิดหน้าจัดการส่วนลด...");
        router.push('/pos/discounts/manager/add');
    };

    const handleEdit = (discount: Discounts) => {
        showLoading("กำลังเปิดหน้าแก้ไขส่วนลด...");
        router.push(`/pos/discounts/manager/edit/${discount.id}`);
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
                    const csrfToken = await getCsrfTokenCached();
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

    const activeDiscounts = discounts.filter(d => d.is_active);
    const inactiveDiscounts = discounts.filter(d => !d.is_active);
    const fixedDiscounts = discounts.filter(d => d.discount_type === DiscountType.Fixed);
    const percentageDiscounts = discounts.filter(d => d.discount_type === DiscountType.Percentage);

    return (
        <div className="discount-page" style={pageStyles.container}>
            <style>{globalStyles}</style>
            
            {/* Header */}
            <PageHeader 
                onRefresh={() => fetchDiscounts(debouncedSearch || undefined)}
                onAdd={handleAdd}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
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
