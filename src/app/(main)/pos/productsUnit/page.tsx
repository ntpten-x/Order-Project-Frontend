'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Typography, Button, Input, Space } from 'antd';
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
import { RealtimeEvents } from "../../../../utils/realtimeEvents";
import { pageStyles, globalStyles } from '../../../../theme/pos/productsUnit/style';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import PageContainer from "../../../../components/ui/page/PageContainer";
import PageSection from "../../../../components/ui/page/PageSection";
import PageStack from "../../../../components/ui/page/PageStack";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import UIEmptyState from "../../../../components/ui/states/EmptyState";

const { Text } = Typography;

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

export default function ProductsUnitPage() {
    const router = useRouter();
    const [units, setUnits] = useState<ProductsUnit[]>([]);
    const [filteredUnits, setFilteredUnits] = useState<ProductsUnit[]>([]);
    const [searchText, setSearchText] = useState('');
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard({ allowedRoles: ["Admin", "Manager"] });

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
        { create: RealtimeEvents.productsUnit.create, update: RealtimeEvents.productsUnit.update, delete: RealtimeEvents.productsUnit.delete },
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
            <UIPageHeader
                title="หน่วยสินค้า"
                subtitle={`${units.length} รายการ`}
                icon={<UnorderedListOutlined />}
                actions={
                    <Space size={8} wrap>
                        <Input
                            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                            allowClear
                            placeholder="ค้นหาหน่วยสินค้า..."
                            onChange={(e) => handleSearch(e.target.value)}
                            style={{ minWidth: 220 }}
                        />
                        <Button icon={<ReloadOutlined />} onClick={fetchUnits} />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                            เพิ่มหน่วยสินค้า
                        </Button>
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <StatsCard
                        totalUnits={units.length}
                        activeUnits={activeUnits.length}
                        inactiveUnits={inactiveUnits.length}
                    />

                    <PageSection
                        title="รายการหน่วยสินค้า"
                        extra={<span style={{ fontWeight: 600 }}>{filteredUnits.length}</span>}
                    >
                        {filteredUnits.length > 0 ? (
                            filteredUnits.map((unit, index) => (
                                <UnitCard
                                    key={unit.id}
                                    unit={unit}
                                    index={index}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))
                        ) : (
                            <UIEmptyState
                                title={
                                    searchText.trim()
                                        ? "ไม่พบหน่วยสินค้าที่ค้นหา"
                                        : "ยังไม่มีหน่วยสินค้า"
                                }
                                description={
                                    searchText.trim()
                                        ? "ลองค้นหาด้วยคำอื่นหรือล้างการค้นหา"
                                        : "เพิ่มหน่วยสินค้าตัวแรกเพื่อเริ่มต้นใช้งาน"
                                }
                                action={
                                    !searchText.trim() ? (
                                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                            เพิ่มหน่วยสินค้า
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
