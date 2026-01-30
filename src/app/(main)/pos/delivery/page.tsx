'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { message, Modal, Spin, Typography, Tag, Button, Empty, Input, Pagination } from 'antd';
import Image from "next/image";
import { 
    CarOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleFilled,
    CloseCircleFilled
} from '@ant-design/icons';
import { Delivery } from "../../../../types/api/pos/delivery";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { getCsrfTokenCached } from "../../../../utils/pos/csrf";
import { useRoleGuard } from "../../../../utils/pos/accessControl";
import { useRealtimeRefresh } from "../../../../utils/pos/realtime";
import { readCache, writeCache } from "../../../../utils/pos/cache";
import { deliveryService } from "../../../../services/pos/delivery.service";
import { pageStyles, globalStyles } from '../../../../theme/pos/delivery/style';

const { Text, Title } = Typography;

const DELIVERY_LIMIT = 50;
const DELIVERY_CACHE_KEY = "pos:delivery-providers";
const DELIVERY_CACHE_TTL = 5 * 60 * 1000;

// ============ TYPES ============

interface HeaderProps {
    onRefresh: () => void;
    onAdd: () => void;
    searchValue: string;
    onSearchChange: (value: string) => void;
    page: number;
    total: number;
    lastPage: number;
    setPage: (page: number) => void;
}

type DeliveryCacheResult = {
    data: Delivery[];
    total: number;
    page: number;
    last_page: number;
};

// ============ HEADER COMPONENT ============

const PageHeader = ({ 
    onRefresh, 
    onAdd, 
    searchValue, 
    onSearchChange,
    page,
    total,
    lastPage,
    setPage
}: HeaderProps) => (
    <div style={pageStyles.header}>
        <div style={pageStyles.headerDecoCircle1} />
        <div style={pageStyles.headerDecoCircle2} />
        
        <div style={pageStyles.headerContent}>
            <div style={pageStyles.headerLeft}>
                <div style={pageStyles.headerIconBox}>
                    <CarOutlined style={{ fontSize: 24, color: 'white' }} />
                </div>
                <div>
                    <Text style={{ 
                        color: 'rgba(255,255,255,0.85)', 
                        fontSize: 13,
                        display: 'block'
                    }}>
                        จัดการผู้ให้บริการเดลิเวอรี่
                    </Text>
                    <Title level={4} style={{ 
                        color: 'white', 
                        margin: 0,
                        fontWeight: 700,
                        letterSpacing: '0.5px'
                    }}>
                        บริการเดลิเวอรี่
                    </Title>
                </div>
            </div>
            <div style={pageStyles.headerActions}>
                <Input
                    allowClear
                    placeholder="ค้นหาบริการส่ง..."
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    style={{ width: 220, borderRadius: 10 }}
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
                        color: '#13c2c2',
                        borderRadius: 12,
                        height: 40,
                        fontWeight: 600,
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                >
                    เพิ่มบริการส่งใหม่
                </Button>
            </div>
            {lastPage > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                    <Pagination
                        current={page}
                        pageSize={DELIVERY_LIMIT}
                        total={total}
                        onChange={(value) => setPage(value)}
                        size="small"
                    />
                </div>
            )}
        </div>
    </div>
);

// ============ STATS CARD COMPONENT ============

interface StatsCardProps {
    totalDelivery: number;
    activeDelivery: number;
    inactiveDelivery: number;
}

const StatsCard = ({ totalDelivery, activeDelivery, inactiveDelivery }: StatsCardProps) => (
    <div style={pageStyles.statsCard}>
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#13c2c2' }}>{totalDelivery}</span>
            <Text style={pageStyles.statLabel}>ทั้งหมด</Text>
        </div>
        <div style={{ width: 1, background: '#f0f0f0' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#52c41a' }}>{activeDelivery}</span>
            <Text style={pageStyles.statLabel}>เปิดใช้งาน</Text>
        </div>
        <div style={{ width: 1, background: '#f0f0f0' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#ff4d4f' }}>{inactiveDelivery}</span>
            <Text style={pageStyles.statLabel}>ปิดใช้งาน</Text>
        </div>
    </div>
);

// ============ DELIVERY CARD COMPONENT ============

interface DeliveryCardProps {
    delivery: Delivery;
    index: number;
    onEdit: (delivery: Delivery) => void;
    onDelete: (delivery: Delivery) => void;
}

const DeliveryCard = ({ delivery, index, onEdit, onDelete }: DeliveryCardProps) => {
    return (
        <div
            className="delivery-card"
            style={{
                ...pageStyles.deliveryCard(delivery.is_active),
                animationDelay: `${index * 0.03}s`
            }}
        >
            <div style={pageStyles.deliveryCardInner}>
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
                    background: delivery.is_active 
                        ? 'linear-gradient(135deg, #e6fffb 0%, #b5f5ec 100%)'
                        : 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {delivery.logo ? (
                        <Image 
                            src={delivery.logo} 
                            alt={delivery.delivery_name} 
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            style={{ 
                                objectFit: 'contain',
                                background: 'white',
                                opacity: delivery.is_active ? 1 : 0.6
                            }} 
                        />
                    ) : (
                        <CarOutlined style={{ 
                            fontSize: 28, 
                            color: delivery.is_active ? '#13c2c2' : '#ff4d4f' 
                        }} />
                    )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text 
                            strong 
                            style={{ fontSize: 16, color: '#1a1a2e' }}
                        >
                            {delivery.delivery_name}
                        </Text>
                        {delivery.is_active ? (
                            <CheckCircleFilled style={{ color: '#52c41a', fontSize: 14 }} />
                        ) : (
                            <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 14 }} />
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Tag 
                            color={delivery.is_active ? 'processing' : 'default'}
                            style={{ 
                                borderRadius: 8, 
                                margin: 0,
                                fontSize: 11 
                            }}
                        >
                            {delivery.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </Tag>
                        {delivery.delivery_prefix && (
                            <Tag 
                                color="purple"
                                style={{ 
                                    borderRadius: 8, 
                                    margin: 0,
                                    fontSize: 11 
                                }}
                            >
                                Prefix: {delivery.delivery_prefix}
                            </Tag>
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
                            onEdit(delivery);
                        }}
                        style={{
                            borderRadius: 10,
                            color: '#13c2c2',
                            background: '#e6fffb'
                        }}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(delivery);
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
                    ยังไม่มีบริการส่ง
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                    เริ่มต้นเพิ่มบริการส่งแรกของคุณ
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
                background: 'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)',
                border: 'none'
            }}
        >
            เพิ่มบริการส่ง
        </Button>
    </Empty>
);

// ============ MAIN PAGE ============

export default function DeliveryPage() {
    const router = useRouter();
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [lastPage, setLastPage] = useState(1);
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
            setPage(1);
        }, 400);
        return () => clearTimeout(handler);
    }, [searchValue]);

    useEffect(() => {
        if (debouncedSearch || page !== 1) return;
        const cached = readCache<DeliveryCacheResult>(DELIVERY_CACHE_KEY, DELIVERY_CACHE_TTL);
        if (cached?.data?.length) {
            setDeliveries(cached.data);
            setTotal(cached.total);
            setLastPage(cached.last_page);
        }
    }, [debouncedSearch, page]);

    const fetchDeliveries = useCallback(async () => {
        execute(async () => {
            const params = new URLSearchParams();
            params.set("page", page.toString());
            params.set("limit", DELIVERY_LIMIT.toString());
            if (debouncedSearch) {
                params.set("q", debouncedSearch);
            }
            const result = await deliveryService.getAll(undefined, params);
            setDeliveries(result.data);
            setTotal(result.total);
            setLastPage(result.last_page);
            if (!debouncedSearch && page === 1) {
                writeCache(DELIVERY_CACHE_KEY, result);
            }
        }, 'กำลังโหลดข้อมูล...');
    }, [debouncedSearch, execute, page]);

    useEffect(() => {
        if (isAuthorized) {
            fetchDeliveries();
        }
    }, [isAuthorized, fetchDeliveries]);

    useRealtimeRefresh({
        socket,
        events: ["delivery:create", "delivery:update", "delivery:delete"],
        onRefresh: () => fetchDeliveries(),
        intervalMs: 20000,
        debounceMs: 1000,
    });

    const handleAdd = () => {
        showLoading("กำลังเปิดหน้าจัดการบริการส่ง...");
        router.push('/pos/delivery/manager/add');
    };

    const handleEdit = (delivery: Delivery) => {
        showLoading("กำลังเปิดหน้าแก้ไขบริการส่ง...");
        router.push(`/pos/delivery/manager/edit/${delivery.id}`);
    };

    const handleDelete = (delivery: Delivery) => {
        Modal.confirm({
            title: 'ยืนยันการลบบริการส่ง',
            content: `คุณต้องการลบบริการส่ง "${delivery.delivery_name}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            onOk: async () => {
                await execute(async () => {
                    const csrfToken = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/delivery/delete/${delivery.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) {
                        throw new Error('ไม่สามารถลบบริการส่งได้');
                    }
                    message.success(`ลบบริการส่ง "${delivery.delivery_name}" สำเร็จ`);
                }, "กำลังลบบริการส่ง...");
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

    const activeDeliveries = deliveries.filter(d => d.is_active);
    const inactiveDeliveries = deliveries.filter(d => !d.is_active);

    return (
        <div className="delivery-page" style={pageStyles.container}>
            <style>{globalStyles}</style>
            
            {/* Header */}
            <PageHeader 
                onRefresh={fetchDeliveries}
                onAdd={handleAdd}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                page={page}
                total={total}
                lastPage={lastPage}
                setPage={setPage}
            />
            
            {/* Stats Card */}
            <StatsCard 
                totalDelivery={deliveries.length}
                activeDelivery={activeDeliveries.length}
                inactiveDelivery={inactiveDeliveries.length}
            />

            {/* Deliveries List */}
            <div style={pageStyles.listContainer}>
                {deliveries.length > 0 ? (
                    <>
                        <div style={pageStyles.sectionTitle}>
                            <CarOutlined style={{ fontSize: 18, color: '#13c2c2' }} />
                            <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>
                                รายการบริการส่ง
                            </span>
                            <div style={{
                                background: 'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 600
                            }}>
                                {deliveries.length} รายการ
                            </div>
                        </div>

                        {deliveries.map((delivery, index) => (
                            <DeliveryCard
                                key={delivery.id}
                                delivery={delivery}
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
