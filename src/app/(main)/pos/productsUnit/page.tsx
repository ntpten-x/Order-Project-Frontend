'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Typography, Button, Empty, Input } from 'antd';
import { 
    UnorderedListOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { ProductsUnit } from "../../../../types/api/pos/productsUnit";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { getCsrfTokenCached } from "../../../../utils/pos/csrf";
import { useRoleGuard } from "../../../../utils/pos/accessControl";
import { useRealtimeList } from "../../../../utils/pos/realtime";
import { readCache, writeCache } from "../../../../utils/pos/cache";
import { pageStyles, globalStyles } from '../../../../theme/pos/productsUnit/style';
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
                    <UnorderedListOutlined style={{ fontSize: 24, color: 'white' }} />
                </div>
                <div>
                    <Text style={{ 
                        color: 'rgba(255,255,255,0.85)', 
                        fontSize: 13,
                        display: 'block',
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                        จัดการข้อมูล
                    </Text>
                    <Title level={4} style={{ 
                        color: 'white', 
                        margin: 0,
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        หน่วยสินค้า
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
                    <span className="hidden sm:inline">เพิ่มหน่วย</span>
                </Button>
            </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginTop: 24, padding: '0 4px' }}>
            <Input 
                prefix={<SearchOutlined style={{ color: '#fff', opacity: 0.7 }} />}
                placeholder="ค้นหาหน่วยสินค้า..."
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
    totalUnits: number;
    activeUnits: number;
    inactiveUnits: number;
}

const StatsCard = ({ totalUnits, activeUnits, inactiveUnits }: StatsCardProps) => (
    <div style={pageStyles.statsCard}>
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#0891B2' }}>{totalUnits}</span>
            <Text style={pageStyles.statLabel}>ทั้งหมด</Text>
        </div>
        <div style={{ width: 1, height: 24, background: '#f0f0f0', alignSelf: 'center' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#10B981' }}>{activeUnits}</span>
            <Text style={pageStyles.statLabel}>ใช้งาน</Text>
        </div>
        <div style={{ width: 1, height: 24, background: '#f0f0f0', alignSelf: 'center' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#EF4444' }}>{inactiveUnits}</span>
            <Text style={pageStyles.statLabel}>ไม่ใช้งาน</Text>
        </div>
    </div>
);

// ============ UNIT CARD COMPONENT ============

interface UnitCardProps {
    unit: ProductsUnit;
    index: number;
    onEdit: (unit: ProductsUnit) => void;
    onDelete: (unit: ProductsUnit) => void;
}

const UnitCard = ({ unit, index, onEdit, onDelete }: UnitCardProps) => {
    return (
        <div
            className="unit-card"
            style={{
                ...pageStyles.unitCard(unit.is_active),
                animationDelay: `${index * 0.05}s`
            }}
            onClick={() => onEdit(unit)}
        >
            <div style={pageStyles.unitCardInner}>
                {/* Icon */}
                <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: unit.is_active 
                        ? 'linear-gradient(135deg, #CFFAFE 0%, #A5F3FC 100%)' 
                        : '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: unit.is_active ? '0 4px 10px rgba(8, 145, 178, 0.1)' : 'none'
                }}>
                    <UnorderedListOutlined style={{ 
                        fontSize: 24, 
                        color: unit.is_active ? '#0891B2' : '#94A3B8' 
                    }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text 
                            strong 
                            style={{ 
                                fontSize: 16, 
                                color: unit.is_active ? '#1E293B' : '#64748B' 
                            }}
                            ellipsis={{ tooltip: unit.display_name }}
                        >
                            {unit.display_name}
                        </Text>
                        {unit.is_active ? (
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
                        ellipsis={{ tooltip: unit.unit_name }}
                    >
                        {unit.unit_name}
                    </Text>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(unit);
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
                            onDelete(unit);
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
                    {isSearch ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีหน่วยสินค้า'}
                </Text>
                <br />
                {!isSearch && (
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        เริ่มต้นเพิ่มหน่วยแรกของคุณได้เลย
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
                เพิ่มหน่วยสินค้า
            </Button>
        )}
    </Empty>
);

export default function ProductsUnitPage() {
    const router = useRouter();
    const [units, setUnits] = useState<ProductsUnit[]>([]);
    const [filteredUnits, setFilteredUnits] = useState<ProductsUnit[]>([]);
    const [searchText, setSearchText] = useState('');
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard({ requiredRole: "Admin" });

    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    useEffect(() => {
        const cached = readCache<ProductsUnit[]>("pos:products-units", 10 * 60 * 1000);
        if (cached && cached.length > 0) {
            setUnits(cached);
        }
    }, []);

    const fetchUnits = useCallback(async () => {
        execute(async () => {
            const response = await fetch('/api/pos/productsUnit');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลหน่วยสินค้าได้');
            }
            const data = await response.json();
            setUnits(data);
        }, 'กำลังโหลดข้อมูลหน่วยสินค้า...');
    }, [execute]);

    useEffect(() => {
        if (isAuthorized) {
            fetchUnits();
        }
    }, [isAuthorized, fetchUnits]);

    useRealtimeList(
        socket,
        { create: "productsUnit:create", update: "productsUnit:update", delete: "productsUnit:delete" },
        setUnits
    );

    // Centralized filtering logic
    useEffect(() => {
        if (searchText) {
            const lower = searchText.toLowerCase();
            const filtered = units.filter((u: ProductsUnit) => 
                u.display_name.toLowerCase().includes(lower) || 
                u.unit_name.toLowerCase().includes(lower)
            );
            setFilteredUnits(filtered);
        } else {
            setFilteredUnits(units);
        }
    }, [units, searchText]);

    useEffect(() => {
        if (units.length > 0) {
            writeCache("pos:products-units", units);
        }
    }, [units]);

    const handleSearch = (value: string) => {
        setSearchText(value);
    };

    const handleAdd = () => {
        showLoading("กำลังเปิดหน้าจัดการหน่วยสินค้า...");
        router.push('/pos/productsUnit/manager/add');
    };

    const handleEdit = (unit: ProductsUnit) => {
        showLoading("กำลังเปิดหน้าแก้ไขหน่วยสินค้า...");
        router.push(`/pos/productsUnit/manager/edit/${unit.id}`);
    };

    const handleDelete = (unit: ProductsUnit) => {
        Modal.confirm({
            title: 'ยืนยันการลบหน่วยสินค้า',
            content: `คุณต้องการลบหน่วย "${unit.display_name}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            maskClosable: true,
            onOk: async () => {
                await execute(async () => {
                    const csrfToken = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/productsUnit/delete/${unit.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) {
                        throw new Error('ไม่สามารถลบหน่วยสินค้าได้');
                    }
                    message.success(`ลบหน่วย "${unit.display_name}" สำเร็จ`);
                }, "กำลังลบหน่วยสินค้า...");
            },
        });
    };

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กำลังพากลับ..." tone="danger" />;
    }

    const activeUnits = units.filter(u => u.is_active);
    const inactiveUnits = units.filter(u => !u.is_active);

    return (
        <div className="unit-page" style={pageStyles.container}>
            <style>{globalStyles}</style>
            <style jsx global>{`
                .search-input-placeholder-white input::placeholder {
                    color: rgba(255, 255, 255, 0.6) !important;
                }
                .search-input-placeholder-white input {
                    color: white !important;
                }
                .unit-card {
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                }
            `}</style>
            
            {/* Header */}
            <PageHeader 
                onRefresh={fetchUnits}
                onAdd={handleAdd}
                onSearch={handleSearch}
            />
            
            {/* Stats Card */}
            <div style={{ marginTop: -32, padding: '0 16px', position: 'relative', zIndex: 10 }}>
                <StatsCard 
                    totalUnits={units.length}
                    activeUnits={activeUnits.length}
                    inactiveUnits={inactiveUnits.length}
                />
            </div>

            {/* Units List */}
            <div style={pageStyles.listContainer}>
                {filteredUnits.length > 0 ? (
                    <>
                        <div style={pageStyles.sectionTitle}>
                            <div style={{ 
                                width: 4, 
                                height: 16, 
                                background: '#0891B2', 
                                borderRadius: 2 
                            }} />
                            <span style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
                                รายการหน่วยสินค้า
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
                                {filteredUnits.length}
                            </div>
                        </div>

                        {filteredUnits.map((unit, index) => (
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
                    <EmptyState onAdd={handleAdd} isSearch={!!searchText} />
                )}
            </div>
            
            {/* Bottom padding */}
            <div style={{ height: 40 }} />
        </div>
    );
}
