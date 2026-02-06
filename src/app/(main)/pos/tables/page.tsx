'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { message, Modal, Typography, Button, Input, Tag, Space } from 'antd';
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
import PageContainer from "../../../../components/ui/page/PageContainer";
import PageSection from "../../../../components/ui/page/PageSection";
import PageStack from "../../../../components/ui/page/PageStack";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import UIEmptyState from "../../../../components/ui/states/EmptyState";
import { RealtimeEvents } from "../../../../utils/realtimeEvents";

const { Text } = Typography;

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

export default function TablesPage() {
    const router = useRouter();
    const [tables, setTables] = useState<Tables[]>([]);
    const [filteredTables, setFilteredTables] = useState<Tables[]>([]);
    const [searchText, setSearchText] = useState("");
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard({ allowedRoles: ["Admin", "Manager"] });

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
        { create: RealtimeEvents.tables.create, update: RealtimeEvents.tables.update, delete: RealtimeEvents.tables.delete },
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
            <UIPageHeader
                title="โต๊ะ"
                subtitle={`${tables.length} รายการ`}
                icon={<TableOutlined />}
                actions={
                    <Space size={8} wrap>
                        <Input
                            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                            allowClear
                            placeholder="ค้นหาโต๊ะ..."
                            onChange={(e) => handleSearch(e.target.value)}
                            style={{ minWidth: 220 }}
                        />
                        <Button icon={<ReloadOutlined />} onClick={fetchTables} />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                            เพิ่มโต๊ะ
                        </Button>
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <StatsCard tables={tables} />

                    <PageSection
                        title="รายการโต๊ะ"
                        extra={<span style={{ fontWeight: 600 }}>{filteredTables.length}</span>}
                    >
                        {filteredTables.length > 0 ? (
                            filteredTables.map((table, index) => (
                                <TableCard
                                    key={table.id}
                                    table={table}
                                    index={index}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))
                        ) : (
                            <UIEmptyState
                                title={
                                    searchText.trim() ? "ไม่พบโต๊ะที่ค้นหา" : "ยังไม่มีโต๊ะในระบบ"
                                }
                                description={
                                    searchText.trim()
                                        ? "ลองค้นหาด้วยคำอื่นหรือล้างการค้นหา"
                                        : "เริ่มต้นด้วยการเพิ่มโต๊ะแรกเพื่อใช้งาน"
                                }
                                action={
                                    !searchText.trim() ? (
                                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                            เพิ่มโต๊ะ
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
