'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Typography, Button, Empty, Input, Tag } from 'antd';
import { 
    TableOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleFilled,
    CloseCircleFilled,
    SearchOutlined
} from '@ant-design/icons';
import { Tables, TableStatus } from "../../../../types/api/pos/tables";
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { getCsrfTokenCached } from "../../../../utils/pos/csrf";
import { useRoleGuard } from "../../../../utils/pos/accessControl";
import { useRealtimeList } from "../../../../utils/pos/realtime";
import { readCache, writeCache } from "../../../../utils/pos/cache";
import { pageStyles, globalStyles } from '../../../../theme/pos/tables/style';
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
                    <TableOutlined style={{ fontSize: 24, color: 'white' }} />
                </div>
                <div>
                    <Text style={{ 
                        color: 'rgba(255,255,255,0.85)', 
                        fontSize: 13,
                        display: 'block',
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                        จัดการและติดตามสถานะโต๊ะทั้งหมด
                    </Text>
                    <Title level={4} style={{ 
                        color: 'white', 
                        margin: 0,
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        รายการโต๊ะ
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
                        color: '#7C3AED',
                        borderRadius: 12,
                        height: 40,
                        fontWeight: 600,
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                >
                    <span className="hidden sm:inline">เพิ่มโต๊ะใหม่</span>
                </Button>
            </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginTop: 24, padding: '0 4px' }}>
            <Input 
                prefix={<SearchOutlined style={{ color: '#fff', opacity: 0.7 }} />}
                placeholder="ค้นหาโต๊ะ (ชื่อ)..."
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
    tables: Tables[];
}

const StatsCard = ({ tables }: StatsCardProps) => {
    const total = tables.length;
    const available = tables.filter(t => t.status === TableStatus.Available).length;
    const unavailable = tables.filter(t => t.status === TableStatus.Unavailable).length;
    
    return (
        <div style={pageStyles.statsCard}>
            <div style={pageStyles.statItem}>
                <span style={{ ...pageStyles.statNumber, color: '#7C3AED' }}>{total}</span>
                <Text style={pageStyles.statLabel}>ทั้งหมด</Text>
            </div>
            <div style={{ width: 1, height: 24, background: '#f0f0f0', alignSelf: 'center' }} />
            <div style={pageStyles.statItem}>
                <span style={{ ...pageStyles.statNumber, color: '#10B981' }}>{available}</span>
                <Text style={pageStyles.statLabel}>ว่าง</Text>
            </div>
            <div style={{ width: 1, height: 24, background: '#f0f0f0', alignSelf: 'center' }} />
            <div style={pageStyles.statItem}>
                <span style={{ ...pageStyles.statNumber, color: '#F59E0B' }}>{unavailable}</span>
                <Text style={pageStyles.statLabel}>ไม่ว่าง</Text>
            </div>
        </div>
    );
};

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
            onClick={() => onEdit(table)}
        >
            <div style={pageStyles.tableCardInner}>
                {/* Icon/Status Ring */}
                <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: isAvailable 
                        ? 'linear-gradient(135deg, #A7F3D0 0%, #6EE7B7 100%)' 
                        : 'linear-gradient(135deg, #FDE68A 0%, #FCD34D 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    position: 'relative',
                    boxShadow: isAvailable 
                        ? '0 4px 10px rgba(16, 185, 129, 0.2)' 
                        : '0 4px 10px rgba(245, 158, 11, 0.2)'
                }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <TableOutlined style={{ 
                            fontSize: 22, 
                            color: isAvailable ? '#10B981' : '#F59E0B' 
                        }} />
                    </div>
                    {/* Status Dot */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: isAvailable ? '#10B981' : '#F59E0B',
                        border: '2px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0, paddingRight: 8, paddingLeft: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text 
                            strong 
                            style={{ 
                                fontSize: 16, 
                                color: table.is_active ? '#1E293B' : '#64748B' 
                            }}
                        >
                            {table.table_name}
                        </Text>
                         {table.is_active ? (
                            <div style={{
                                padding: '2px 6px',
                                background: '#F0FDF4',
                                borderRadius: 6,
                                border: '1px solid #DCFCE7'
                            }}>
                                <CheckCircleFilled style={{ color: '#10B981', fontSize: 10 }} />
                            </div>
                        ) : (
                            <div style={{
                                padding: '2px 6px',
                                background: '#F8FAFC',
                                borderRadius: 6,
                                border: '1px solid #E2E8F0'
                            }}>
                                <CloseCircleFilled style={{ color: '#94A3B8', fontSize: 10 }} />
                            </div>
                        )}
                    </div>
                    
                    <div style={{ display: 'flex' }}>
                         <Tag 
                            style={{ 
                                borderRadius: 6, 
                                margin: 0,
                                fontSize: 10,
                                color: isAvailable ? '#10B981' : '#B45309',
                                background: isAvailable ? '#ECFDF5' : '#FEF3C7',
                                border: 'none',
                                fontWeight: 600,
                                padding: '0 8px',
                                lineHeight: '18px',
                                height: 18
                            }}
                        >
                            {isAvailable ? 'ว่าง' : 'ไม่ว่าง'}
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
                            borderRadius: 12,
                            color: '#7C3AED',
                            background: '#F5F3FF',
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
                            onDelete(table);
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
                    {isSearch ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีโต๊ะ'}
                </Text>
                <br />
                {!isSearch && (
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        เริ่มต้นเพิ่มโต๊ะแรกของคุณได้เลย
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
                    background: '#7C3AED', 
                    borderRadius: 12,
                    height: 48,
                    padding: '0 32px',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                }}
            >
                เพิ่มโต๊ะใหม่
            </Button>
        )}
    </Empty>
);

// ============ MAIN PAGE ============

export default function TablesPage() {
    const router = useRouter();
    const [tables, setTables] = useState<Tables[]>([]);
    const [filteredTables, setFilteredTables] = useState<Tables[]>([]);
    const [searchText, setSearchText] = useState("");
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard({ requiredRole: "Admin" });

    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    useEffect(() => {
        const cached = readCache<Tables[]>("pos:tables", 10 * 60 * 1000);
        // Similarly simplifying to client side filtering
        if (cached && Array.isArray(cached)) {
             setTables(cached);
        }
    }, []);

    const fetchTables = useCallback(async () => {
        execute(async () => {
            const result = await fetch('/api/pos/tables?limit=100'); 
            if (!result.ok) throw new Error("Failed to fetch tables");
            const data = await result.json();
            
            const list = data.data || data; 
            
            if (Array.isArray(list)) {
                setTables(list);
                writeCache("pos:tables", list);
            }
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

    // Centralized filtering logic
    useEffect(() => {
        if (searchText) {
            const lower = searchText.toLowerCase();
            const filtered = tables.filter((t: Tables) => 
                t.table_name.toLowerCase().includes(lower)
            );
            setFilteredTables(filtered);
        } else {
            setFilteredTables(tables);
        }
    }, [tables, searchText]);

    const handleSearch = (value: string) => {
        setSearchText(value);
    };

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
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            maskClosable: true,
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
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กำลังพากลับ..." tone="danger" />;
    }

    return (
        <div className="tables-page" style={pageStyles.container}>
            <style>{globalStyles}</style>
            <style jsx global>{`
                .search-input-placeholder-white input::placeholder {
                    color: rgba(255, 255, 255, 0.6) !important;
                }
                .search-input-placeholder-white input {
                    color: white !important;
                }
                .table-card {
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                }
            `}</style>
            
            {/* Header */}
            <PageHeader 
                onRefresh={fetchTables}
                onAdd={handleAdd}
                onSearch={handleSearch}
            />
            
            {/* Stats Card */}
            <div style={{ marginTop: -32, padding: '0 16px', position: 'relative', zIndex: 10 }}>
                <StatsCard tables={tables} />
            </div>

            {/* Tables List */}
            <div style={pageStyles.listContainer}>
                {filteredTables.length > 0 ? (
                    <>
                        <div style={pageStyles.sectionTitle}>
                            <div style={{ 
                                width: 4, 
                                height: 16, 
                                background: '#7C3AED', 
                                borderRadius: 2 
                            }} />
                            <span style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
                                รายการโต๊ะ
                            </span>
                            <div style={{
                                background: '#F5F3FF',
                                color: '#7C3AED',
                                padding: '2px 10px',
                                borderRadius: 12,
                                fontSize: 12,
                                fontWeight: 700,
                                marginLeft: 'auto'
                            }}>
                                {filteredTables.length}
                            </div>
                        </div>

                        {filteredTables.map((table, index) => (
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
                    <EmptyState onAdd={handleAdd} isSearch={!!searchText} />
                )}
            </div>
            
            {/* Bottom padding */}
            <div style={{ height: 40 }} />
        </div>
    );
}
