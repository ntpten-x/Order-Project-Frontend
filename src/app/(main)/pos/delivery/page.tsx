'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Typography, Button, Empty, Input, Tag } from 'antd';
import Image from "next/image";
import { 
    CarOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { Delivery } from "../../../../types/api/pos/delivery";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { getCsrfTokenCached } from "../../../../utils/pos/csrf";
import { useRoleGuard } from "../../../../utils/pos/accessControl";
import { useRealtimeList } from "../../../../utils/pos/realtime";
import { readCache, writeCache } from "../../../../utils/pos/cache";
import { pageStyles, globalStyles } from '../../../../theme/pos/delivery/style';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';

const { Text, Title } = Typography;

// ============ HEADER COMPONENT ============

interface HeaderProps {
    onRefresh: () => void;
    onAdd: () => void;
    onSearch: (value: string) => void;
}

const PageHeader = ({ onRefresh, onAdd, onSearch }: HeaderProps) => (
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
                        display: 'block',
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                        จัดการผู้ให้บริการเดลิเวอรี่
                    </Text>
                    <Title level={4} style={{ 
                        color: 'white', 
                        margin: 0,
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        บริการเดลิเวอรี่
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
                        backdropFilter: 'blur(4px)',
                        borderRadius: 12,
                        height: 40,
                        width: 40,
                        border: '1px solid rgba(255,255,255,0.3)'
                    }}
                />
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={onAdd}
                    style={{
                        background: 'white',
                        color: '#0891B2',
                        borderRadius: 12,
                        height: 40,
                        fontWeight: 600,
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                >
                    <span className="hidden sm:inline">เพิ่มบริการส่ง</span>
                </Button>
            </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginTop: 24, padding: '0 4px' }}>
            <Input 
                prefix={<SearchOutlined style={{ color: '#fff', opacity: 0.7 }} />}
                placeholder="ค้นหาบริการส่ง (ชื่อ หรือ Prefix)..."
                onChange={(e) => onSearch(e.target.value)}
                bordered={false}
                style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: 14,
                    padding: '8px 16px',
                    color: 'white',
                    fontSize: 15,
                }}
                className="search-input-placeholder-white"
            />
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
            <span style={{ ...pageStyles.statNumber, color: '#0891B2' }}>{totalDelivery}</span>
            <Text style={pageStyles.statLabel}>ทั้งหมด</Text>
        </div>
        <div style={{ width: 1, height: 24, background: '#f0f0f0', alignSelf: 'center' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#10B981' }}>{activeDelivery}</span>
            <Text style={pageStyles.statLabel}>เปิดใช้งาน</Text>
        </div>
        <div style={{ width: 1, height: 24, background: '#f0f0f0', alignSelf: 'center' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#EF4444' }}>{inactiveDelivery}</span>
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
            onClick={() => onEdit(delivery)}
        >
            <div style={pageStyles.deliveryCardInner}>
                {/* Icon */}
                <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: delivery.is_active 
                        ? 'linear-gradient(135deg, #CFFAFE 0%, #A5F3FC 100%)' 
                        : '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: delivery.is_active ? '0 4px 10px rgba(8, 145, 178, 0.1)' : 'none'
                }}>
                    {delivery.logo ? (
                        <Image 
                            src={delivery.logo} 
                            alt={delivery.delivery_name} 
                            fill
                            sizes="56px"
                            style={{ 
                                objectFit: 'contain',
                                padding: 8,
                                opacity: delivery.is_active ? 1 : 0.6
                            }} 
                        />
                    ) : (
                        <CarOutlined style={{ 
                            fontSize: 24, 
                            color: delivery.is_active ? '#0891B2' : '#94A3B8' 
                        }} />
                    )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text 
                            strong 
                            style={{ 
                                fontSize: 16, 
                                color: delivery.is_active ? '#1E293B' : '#64748B' 
                            }}
                            ellipsis={{ tooltip: delivery.delivery_name }}
                        >
                            {delivery.delivery_name}
                        </Text>
                        {delivery.is_active ? (
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
                    
                    {delivery.delivery_prefix && (
                         <div style={{ display: 'flex' }}>
                            <Tag 
                                style={{ 
                                    borderRadius: 6, 
                                    margin: 0,
                                    fontSize: 10,
                                    color: '#0891B2',
                                    background: '#CFFAFE',
                                    border: 'none',
                                    fontWeight: 600,
                                    padding: '0 6px',
                                    lineHeight: '18px',
                                    height: 18
                                }}
                            >
                                {delivery.delivery_prefix}
                            </Tag>
                        </div>
                    )}
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
                            borderRadius: 12,
                            color: '#0891B2',
                            background: '#CFFAFE',
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
                            onDelete(delivery);
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

// ============ EMPTY STATE COMPONENT ============

const EmptyState = ({ onAdd, isSearch }: { onAdd: () => void, isSearch?: boolean }) => (
    <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
            <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 15 }}>
                    {isSearch ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีบริการส่ง'}
                </Text>
                <br />
                {!isSearch && (
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        เริ่มต้นเพิ่มบริการส่งแรกของคุณได้เลย
                    </Text>
                )}
            </div>
        }
        style={{
            padding: '60px 20px',
            background: 'white',
            borderRadius: 24,
            margin: '24px 16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
        }}
    >
        {!isSearch && (
            <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={onAdd} 
                size="large"
                style={{ 
                    background: '#0891B2', 
                    borderRadius: 12,
                    height: 48,
                    padding: '0 32px',
                    boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)'
                }}
            >
                เพิ่มบริการส่ง
            </Button>
        )}
    </Empty>
);

// ============ MAIN PAGE ============

export default function DeliveryPage() {
    const router = useRouter();
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([]);
    const [searchText, setSearchText] = useState("");
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard({ requiredRole: "Admin" });

    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    useEffect(() => {
        const cached = readCache<Delivery[]>("pos:delivery-providers", 10 * 60 * 1000);
        // Note: readCache returns null or the data. If data, we use it.
        // But the previous implementation stored {data: [], total: ...} structure for pagination.
        // We are simplifying to client-side search/filter for better UX on small lists.
        // If the cache structure doesn't match, we might need to be careful.
        // Assuming we want to fetch all for client side filtering as usually delivery providers are few (<50).
        if (cached && Array.isArray(cached)) {
             setDeliveries(cached);
        }
    }, []);

    const fetchDeliveries = useCallback(async () => {
        execute(async () => {
            // Fetch all without pagination for client-side filtering/search
            const result = await fetch('/api/pos/delivery?limit=100'); 
            if (!result.ok) throw new Error("Failed to fetch deliveries");
            const data = await result.json();
            
            // Handle both paginated reference and flat array if API varies
            const list = data.data || data; 
            
            if (Array.isArray(list)) {
                setDeliveries(list);
                writeCache("pos:delivery-providers", list);
            }
        }, 'กำลังโหลดข้อมูล...');
    }, [execute]);

    useEffect(() => {
        if (isAuthorized) {
            fetchDeliveries();
        }
    }, [isAuthorized, fetchDeliveries]);

    useRealtimeList(
        socket,
        { create: "delivery:create", update: "delivery:update", delete: "delivery:delete" },
        setDeliveries
    );

    // Centralized filtering logic
    useEffect(() => {
        if (searchText) {
            const lower = searchText.toLowerCase();
            const filtered = deliveries.filter((d: Delivery) => 
                d.delivery_name.toLowerCase().includes(lower) || 
                (d.delivery_prefix && d.delivery_prefix.toLowerCase().includes(lower))
            );
            setFilteredDeliveries(filtered);
        } else {
            setFilteredDeliveries(deliveries);
        }
    }, [deliveries, searchText]);

    const handleSearch = (value: string) => {
        setSearchText(value);
    };

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
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            maskClosable: true,
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
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กำลังพากลับ..." tone="danger" />;
    }

    const activeDeliveries = deliveries.filter(d => d.is_active);
    const inactiveDeliveries = deliveries.filter(d => !d.is_active);

    return (
        <div className="delivery-page" style={pageStyles.container}>
            <style>{globalStyles}</style>
            <style jsx global>{`
                .search-input-placeholder-white input::placeholder {
                    color: rgba(255, 255, 255, 0.6) !important;
                }
                .search-input-placeholder-white input {
                    color: white !important;
                }
                .delivery-card {
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                }
            `}</style>
            
            {/* Header */}
            <PageHeader 
                onRefresh={fetchDeliveries}
                onAdd={handleAdd}
                onSearch={handleSearch}
            />
            
            {/* Stats Card */}
            <div style={{ marginTop: -32, padding: '0 16px', position: 'relative', zIndex: 10 }}>
                <StatsCard 
                    totalDelivery={deliveries.length}
                    activeDelivery={activeDeliveries.length}
                    inactiveDelivery={inactiveDeliveries.length}
                />
            </div>

            {/* Deliveries List */}
            <div style={pageStyles.listContainer}>
                {filteredDeliveries.length > 0 ? (
                    <>
                        <div style={pageStyles.sectionTitle}>
                            <div style={{ 
                                width: 4, 
                                height: 16, 
                                background: '#0891B2', 
                                borderRadius: 2 
                            }} />
                            <span style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
                                รายการบริการส่ง
                            </span>
                            <div style={{
                                background: '#CFFAFE',
                                color: '#0891B2',
                                padding: '2px 10px',
                                borderRadius: 12,
                                fontSize: 12,
                                fontWeight: 700,
                                marginLeft: 'auto'
                            }}>
                                {filteredDeliveries.length}
                            </div>
                        </div>

                        {filteredDeliveries.map((delivery, index) => (
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
                    <EmptyState onAdd={handleAdd} isSearch={!!searchText} />
                )}
            </div>
            
            {/* Bottom padding */}
            <div style={{ height: 40 }} />
        </div>
    );
}
