'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Spin, Typography, Button, Empty } from 'antd';
import { 
    UnorderedListOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleFilled,
    CloseCircleFilled
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
                    <UnorderedListOutlined style={{ fontSize: 24, color: 'white' }} />
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
                    เพิ่มหน่วย
                </Button>
            </div>
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
            <span style={{ ...pageStyles.statNumber, color: '#13c2c2' }}>{totalUnits}</span>
            <Text style={pageStyles.statLabel}>ทั้งหมด</Text>
        </div>
        <div style={{ width: 1, background: '#f0f0f0' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#52c41a' }}>{activeUnits}</span>
            <Text style={pageStyles.statLabel}>ใช้งาน</Text>
        </div>
        <div style={{ width: 1, background: '#f0f0f0' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#ff4d4f' }}>{inactiveUnits}</span>
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
                animationDelay: `${index * 0.03}s`
            }}
        >
            <div style={pageStyles.unitCardInner}>
                {/* Icon */}
                <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #e6fffb 0%, #b5f5ec 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <UnorderedListOutlined style={{ fontSize: 24, color: '#13c2c2' }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text 
                            strong 
                            style={{ fontSize: 16, color: '#1a1a2e' }}
                            ellipsis={{ tooltip: unit.display_name }}
                        >
                            {unit.display_name}
                        </Text>
                        {unit.is_active ? (
                            <CheckCircleFilled style={{ color: '#52c41a', fontSize: 14 }} />
                        ) : (
                            <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 14 }} />
                        )}
                    </div>
                    <Text 
                        type="secondary" 
                        style={{ fontSize: 13, display: 'block' }}
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
                            onDelete(unit);
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
                    ยังไม่มีหน่วยสินค้า
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                    เริ่มต้นเพิ่มหน่วยแรกของคุณ
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
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd} style={{ background: '#13c2c2' }}>
            เพิ่มหน่วยสินค้า
        </Button>
    </Empty>
);

export default function ProductsUnitPage() {
    const router = useRouter();
    const [units, setUnits] = useState<ProductsUnit[]>([]);
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

    useEffect(() => {
        if (units.length > 0) {
            writeCache("pos:products-units", units);
        }
    }, [units]);

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

    const activeUnits = units.filter(u => u.is_active);
    const inactiveUnits = units.filter(u => !u.is_active);

    return (
        <div className="unit-page" style={pageStyles.container}>
            <style>{globalStyles}</style>
            
            {/* Header */}
            <PageHeader 
                onRefresh={fetchUnits}
                onAdd={handleAdd}
            />
            
            {/* Stats Card */}
            <StatsCard 
                totalUnits={units.length}
                activeUnits={activeUnits.length}
                inactiveUnits={inactiveUnits.length}
            />

            {/* Units List */}
            <div style={pageStyles.listContainer}>
                {units.length > 0 ? (
                    <>
                        <div style={pageStyles.sectionTitle}>
                            <UnorderedListOutlined style={{ fontSize: 18, color: '#13c2c2' }} />
                            <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>
                                รายการหน่วยสินค้า
                            </span>
                            <div style={{
                                background: 'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 600
                            }}>
                                {units.length} รายการ
                            </div>
                        </div>

                        {units.map((unit, index) => (
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
                    <EmptyState onAdd={handleAdd} />
                )}
            </div>
        </div>
    );
}
