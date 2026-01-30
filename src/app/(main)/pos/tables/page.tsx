'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Spin, Typography, Tag, Button, Empty } from 'antd';
import { 
    TableOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleFilled,
    CloseCircleFilled,
    SmileOutlined,
    StopOutlined
} from '@ant-design/icons';
import { Tables, TableStatus } from "../../../../types/api/pos/tables";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { getCsrfTokenCached } from "../../../../utils/pos/csrf";
import { useRoleGuard } from "../../../../utils/pos/accessControl";
import { useRealtimeList } from "../../../../utils/pos/realtime";
import { pageStyles, globalStyles } from '../../../../theme/pos/tables/style';

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
                    <TableOutlined style={{ fontSize: 24, color: 'white' }} />
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
                        โต๊ะ
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
                    เพิ่มโต๊ะ
                </Button>
            </div>
        </div>
    </div>
);

// ============ STATS CARD COMPONENT ============

interface StatsCardProps {
    totalTables: number;
    availableTables: number;
    unavailableTables: number;
    activeTables: number;
    inactiveTables: number;
}

const StatsCard = ({ totalTables, availableTables, unavailableTables, activeTables, inactiveTables }: StatsCardProps) => (
    <div style={pageStyles.statsCard}>
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#722ed1' }}>{totalTables}</span>
            <Text style={pageStyles.statLabel}>ทั้งหมด</Text>
        </div>
        <div style={{ width: 1, background: '#f0f0f0' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#52c41a' }}>{availableTables}</span>
            <Text style={pageStyles.statLabel}>ว่าง</Text>
        </div>
        <div style={{ width: 1, background: '#f0f0f0' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#fa8c16' }}>{unavailableTables}</span>
            <Text style={pageStyles.statLabel}>ไม่ว่าง</Text>
        </div>
        <div style={{ width: 1, background: '#f0f0f0' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#1890ff' }}>{activeTables}</span>
            <Text style={pageStyles.statLabel}>ใช้งาน</Text>
        </div>
        <div style={{ width: 1, background: '#f0f0f0' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#ff4d4f' }}>{inactiveTables}</span>
            <Text style={pageStyles.statLabel}>ปิดใช้งาน</Text>
        </div>
    </div>
);

// ============ TABLE CARD COMPONENT ============

interface TableCardProps {
    table: Tables;
    index: number;
    onEdit: (table: Tables) => void;
    onDelete: (table: Tables) => void;
}

const TableCard = ({ table, index, onEdit, onDelete }: TableCardProps) => {
    const isAvailable = table.status === TableStatus.Available;
    
    return (
        <div
            className="table-card"
            style={{
                ...pageStyles.tableCard(table.is_active),
                animationDelay: `${index * 0.03}s`
            }}
        >
            <div style={pageStyles.tableCardInner}>
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
                    background: isAvailable 
                        ? 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)'
                        : 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {isAvailable ? (
                        <SmileOutlined style={{ fontSize: 28, color: '#52c41a' }} />
                    ) : (
                        <StopOutlined style={{ fontSize: 28, color: '#fa8c16' }} />
                    )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text 
                            strong 
                            style={{ fontSize: 16, color: '#1a1a2e' }}
                        >
                            {table.table_name}
                        </Text>
                        {table.is_active ? (
                            <CheckCircleFilled style={{ color: '#52c41a', fontSize: 14 }} />
                        ) : (
                            <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 14 }} />
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Tag 
                            color={isAvailable ? 'success' : 'warning'}
                            style={{ 
                                borderRadius: 8, 
                                margin: 0,
                                fontSize: 11 
                            }}
                        >
                            {isAvailable ? 'ว่าง' : 'ไม่ว่าง'}
                        </Tag>
                        <Tag 
                            color={table.is_active ? 'processing' : 'default'}
                            style={{ 
                                borderRadius: 8, 
                                margin: 0,
                                fontSize: 11 
                            }}
                        >
                            {table.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </Tag>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(table);
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
                            onDelete(table);
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
                    ยังไม่มีโต๊ะ
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>
                    เริ่มต้นเพิ่มโต๊ะแรกของคุณ
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
                background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
                border: 'none'
            }}
        >
            เพิ่มโต๊ะ
        </Button>
    </Empty>
);

export default function TablesPage() {
    const router = useRouter();
    const [tables, setTables] = useState<Tables[]>([]);
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard({ requiredRole: "Admin" });


    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    const fetchTables = useCallback(async () => {
        execute(async () => {
            const response = await fetch('/api/pos/tables');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลโต๊ะได้');
            }
            const data = await response.json();
            setTables(data);
        }, 'กำลังโหลดข้อมูลโต๊ะ...');
    }, [execute]);

    useEffect(() => {
        if (isAuthorized) {
            fetchTables();
        }
    }, [isAuthorized, fetchTables]);

    useRealtimeList(
        socket,
        { create: "tables:create", update: "tables:update", delete: "tables:delete" },
        setTables
    );

    const handleAdd = () => {
        showLoading("กำลังเปิดหน้าจัดการโต๊ะ...");
        router.push('/pos/tables/manager/add');
    };

    const handleEdit = (table: Tables) => {
        showLoading("กำลังเปิดหน้าแก้ไขโต๊ะ...");
        router.push(`/pos/tables/manager/edit/${table.id}`);
    };

    const handleDelete = (table: Tables) => {
        Modal.confirm({
            title: 'ยืนยันการลบโต๊ะ',
            content: `คุณต้องการลบโต๊ะ "${table.table_name}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            onOk: async () => {
                await execute(async () => {
                    const csrfToken = await getCsrfTokenCached();
                    const response = await fetch(`/api/pos/tables/delete/${table.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) {
                        throw new Error('ไม่สามารถลบโต๊ะได้');
                    }
                    message.success(`ลบโต๊ะ "${table.table_name}" สำเร็จ`);
                }, "กำลังลบโต๊ะ...");
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

    const activeTables = tables.filter(t => t.is_active);
    const inactiveTables = tables.filter(t => !t.is_active);
    const availableTables = tables.filter(t => t.status === TableStatus.Available);
    const unavailableTables = tables.filter(t => t.status === TableStatus.Unavailable);

    return (
        <div className="tables-page" style={pageStyles.container}>
            <style>{globalStyles}</style>
            
            {/* Header */}
            <PageHeader 
                onRefresh={fetchTables}
                onAdd={handleAdd}
            />
            
            {/* Stats Card */}
            <StatsCard 
                totalTables={tables.length}
                availableTables={availableTables.length}
                unavailableTables={unavailableTables.length}
                activeTables={activeTables.length}
                inactiveTables={inactiveTables.length}
            />

            {/* Tables List */}
            <div style={pageStyles.listContainer}>
                {tables.length > 0 ? (
                    <>
                        <div style={pageStyles.sectionTitle}>
                            <TableOutlined style={{ fontSize: 18, color: '#722ed1' }} />
                            <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>
                                รายการโต๊ะ
                            </span>
                            <div style={{
                                background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 600
                            }}>
                                {tables.length} รายการ
                            </div>
                        </div>

                        {tables.map((table, index) => (
                            <TableCard
                                key={table.id}
                                table={table}
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
