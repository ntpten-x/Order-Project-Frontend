"use client";

import React from "react";
import { Typography, Tag, Button, Empty } from "antd";
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
} from "@ant-design/icons";
import { Tables, TableStatus } from "../../../../types/api/pos/tables";

const { Text, Title } = Typography;

// ============ STYLES ============

export const pageStyles = {
    container: {
        paddingBottom: 100,
        backgroundColor: '#f8f9fc',
        minHeight: '100vh'
    },
    header: {
        background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
        padding: '20px 20px 60px 20px',
        position: 'relative' as const,
        overflow: 'hidden' as const
    },
    headerDecoCircle1: {
        position: 'absolute' as const,
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)'
    },
    headerDecoCircle2: {
        position: 'absolute' as const,
        bottom: -30,
        left: -30,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)'
    },
    headerContent: {
        position: 'relative' as const, 
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
    },
    headerIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        background: 'rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)'
    },
    headerActions: {
        display: 'flex',
        gap: 8
    },
    statsCard: {
        margin: '-40px 16px 0 16px',
        padding: '16px',
        background: 'white',
        borderRadius: 20,
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        display: 'flex',
        justifyContent: 'space-around',
        position: 'relative' as const,
        zIndex: 10
    },
    statItem: {
        textAlign: 'center' as const,
        flex: 1
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 700,
        display: 'block'
    },
    statLabel: {
        fontSize: 12,
        color: '#8c8c8c',
        marginTop: 2
    },
    listContainer: {
        padding: '20px 16px 0 16px'
    },
    sectionTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16
    },
    tableCard: (isActive: boolean) => ({
        marginBottom: 12,
        borderRadius: 20,
        border: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        background: isActive 
            ? 'white'
            : 'linear-gradient(to right, #fafafa, white)',
        opacity: isActive ? 1 : 0.7
    }),
    tableCardInner: {
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 14
    }
};

// ============ CSS ANIMATIONS ============

export const TablesPageStyles = () => (
    <style>{`
        @keyframes fadeSlideIn {
            from {
                opacity: 0;
                transform: translateY(12px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .table-card {
            animation: fadeSlideIn 0.4s ease both;
        }
        
        .table-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important;
        }
        
        .table-card:active {
            transform: scale(0.98);
        }
        
        .tables-page *::-webkit-scrollbar {
            width: 6px;
        }
        .tables-page *::-webkit-scrollbar-track {
            background: transparent;
        }
        .tables-page *::-webkit-scrollbar-thumb {
            background: #d9d9d9;
            border-radius: 3px;
        }
        .tables-page *::-webkit-scrollbar-thumb:hover {
            background: #bfbfbf;
        }
    `}</style>
);

// ============ HEADER COMPONENT ============

interface HeaderProps {
    onRefresh: () => void;
    onAdd: () => void;
}

export const PageHeader = ({ onRefresh, onAdd }: HeaderProps) => (
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

export const StatsCard = ({ totalTables, availableTables, unavailableTables, activeTables, inactiveTables }: StatsCardProps) => (
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

export const TableCard = ({ table, index, onEdit, onDelete }: TableCardProps) => {
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

export const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
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

export default TablesPageStyles;
