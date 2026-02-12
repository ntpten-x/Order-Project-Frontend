'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { message, Modal, Typography, Button, Input, Space, Segmented, Tag, Switch } from 'antd';
import {
    TableOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    CheckCircleFilled
} from '@ant-design/icons';
import { Tables, TableStatus } from '../../../../types/api/pos/tables';
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from '../../../../contexts/pos/GlobalLoadingContext';
import { useAsyncAction } from '../../../../hooks/useAsyncAction';
import { useSocket } from '../../../../hooks/useSocket';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { useRealtimeList } from '../../../../utils/pos/realtime';
import { readCache, writeCache } from '../../../../utils/pos/cache';
import { pageStyles, globalStyles } from '../../../../theme/pos/tables/style';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import PageContainer from '../../../../components/ui/page/PageContainer';
import PageSection from '../../../../components/ui/page/PageSection';
import PageStack from '../../../../components/ui/page/PageStack';
import UIPageHeader from '../../../../components/ui/page/PageHeader';
import UIEmptyState from '../../../../components/ui/states/EmptyState';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';

const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';
type TableStateFilter = 'all' | TableStatus.Available | TableStatus.Unavailable;

interface StatsCardProps {
    total: number;
    active: number;
    inactive: number;
    available: number;
    unavailable: number;
}

interface TableCardProps {
    table: Tables;
    onEdit: (table: Tables) => void;
    onDelete: (table: Tables) => void;
    onToggleActive: (table: Tables, next: boolean) => void;
    updatingStatusId: string | null;
}

const formatDate = (raw: string | Date) => {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
};

const getTableStatusLabel = (status: TableStatus) => {
    return status === TableStatus.Available ? 'ว่าง' : 'ไม่ว่าง';
};

const StatsCard = ({ total, active, inactive, available, unavailable }: StatsCardProps) => (
    <div style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: 8,
        padding: 14
    }}>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', display: 'block' }}>{total}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ทั้งหมด</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#7C3AED', display: 'block' }}>{active}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ใช้งาน</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#b91c1c', display: 'block' }}>{inactive}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ปิดใช้งาน</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#059669', display: 'block' }}>{available}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>สถานะว่าง</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#d97706', display: 'block' }}>{unavailable}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>สถานะไม่ว่าง</Text>
        </div>
    </div>
);

const TableCard = ({ table, onEdit, onDelete, onToggleActive, updatingStatusId }: TableCardProps) => {
    const isAvailable = table.status === TableStatus.Available;

    return (
        <div
            className="table-card"
            style={{
                ...pageStyles.tableCard(table.is_active),
                borderRadius: 16,
            }}
            onClick={() => onEdit(table)}
        >
            <div style={pageStyles.tableCardInner}>
                <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: isAvailable
                        ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
                        : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: isAvailable
                        ? '0 4px 10px rgba(5, 150, 105, 0.18)'
                        : '0 4px 10px rgba(217, 119, 6, 0.18)'
                }}>
                    <TableOutlined style={{
                        fontSize: 22,
                        color: isAvailable ? '#059669' : '#b45309'
                    }} />
                </div>

                <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text
                            strong
                            style={{
                                fontSize: 16,
                                color: '#0f172a'
                            }}
                            ellipsis={{ tooltip: table.table_name }}
                        >
                            {table.table_name}
                        </Text>
                        {table.is_active && <CheckCircleFilled style={{ color: '#10B981', fontSize: 14 }} />}
                        <Tag color={table.is_active ? 'green' : 'default'}>
                            {table.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </Tag>
                    </div>

                    <Tag color={isAvailable ? 'green' : 'orange'} style={{ margin: 0, borderRadius: 6 }}>
                        {getTableStatusLabel(table.status)}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
                        อัปเดตล่าสุด {formatDate(table.update_date)}
                    </Text>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Switch
                        size="small"
                        checked={table.is_active}
                        loading={updatingStatusId === table.id}
                        onClick={(checked, event) => {
                            event?.stopPropagation();
                            onToggleActive(table, checked);
                        }}
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(table);
                        }}
                        style={{
                            borderRadius: 10,
                            color: '#7C3AED',
                            background: '#f5f3ff',
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
                            borderRadius: 10,
                            background: '#fef2f2',
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
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [tableStateFilter, setTableStateFilter] = useState<TableStateFilter>('all');
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard();

    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    useEffect(() => {
        const cached = readCache<Tables[]>('pos:tables', 5 * 60 * 1000);
        if (cached && cached.length > 0) {
            setTables(cached);
        }
    }, []);

    const fetchTables = useCallback(async () => {
        execute(async () => {
            const response = await fetch('/api/pos/tables?limit=200');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลโต๊ะได้');
            }
            const payload = await response.json();
            const data = Array.isArray(payload) ? payload : payload?.data;
            if (!Array.isArray(data)) throw new Error('รูปแบบข้อมูลไม่ถูกต้อง');
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
        { create: RealtimeEvents.tables.create, update: RealtimeEvents.tables.update, delete: RealtimeEvents.tables.delete },
        setTables
    );

    useEffect(() => {
        if (tables.length > 0) {
            writeCache('pos:tables', tables);
        }
    }, [tables]);

    const filteredTables = useMemo(() => {
        let result = tables;

        if (statusFilter === 'active') {
            result = result.filter((item) => item.is_active);
        } else if (statusFilter === 'inactive') {
            result = result.filter((item) => !item.is_active);
        }

        if (tableStateFilter !== 'all') {
            result = result.filter((item) => item.status === tableStateFilter);
        }

        const keyword = searchText.trim().toLowerCase();
        if (keyword) {
            result = result.filter((item) =>
                item.table_name.toLowerCase().includes(keyword) ||
                (item.active_order_status || '').toLowerCase().includes(keyword)
            );
        }

        return result;
    }, [tables, searchText, statusFilter, tableStateFilter]);

    const handleAdd = () => {
        showLoading('กำลังเปิดหน้าจัดการโต๊ะ...');
        router.push('/pos/tables/manager/add');
    };

    const handleEdit = (table: Tables) => {
        showLoading('กำลังเปิดหน้าแก้ไขโต๊ะ...');
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
                    setTables((prev) => prev.filter((item) => item.id !== table.id));
                    message.success(`ลบโต๊ะ "${table.table_name}" สำเร็จ`);
                }, 'กำลังลบโต๊ะ...');
            },
        });
    };

    const handleToggleActive = async (table: Tables, next: boolean) => {
        setUpdatingStatusId(table.id);
        try {
            const csrfToken = await getCsrfTokenCached();
            const response = await fetch(`/api/pos/tables/update/${table.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({ is_active: next })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถเปลี่ยนสถานะโต๊ะได้');
            }

            const updated = await response.json();
            setTables((prev) => prev.map((item) => item.id === table.id ? updated : item));
            message.success(next ? 'เปิดใช้งานโต๊ะแล้ว' : 'ปิดใช้งานโต๊ะแล้ว');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถเปลี่ยนสถานะโต๊ะได้');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กำลังพากลับ..." tone="danger" />;
    }

    const activeCount = tables.filter((t) => t.is_active).length;
    const inactiveCount = tables.filter((t) => !t.is_active).length;
    const availableCount = tables.filter((t) => t.status === TableStatus.Available).length;
    const unavailableCount = tables.filter((t) => t.status === TableStatus.Unavailable).length;

    return (
        <div className="tables-page" style={pageStyles.container}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="โต๊ะ"
                subtitle={`ทั้งหมด ${tables.length} รายการ`}
                icon={<TableOutlined />}
                actions={
                    <Space size={8} wrap>
                        <Button icon={<ReloadOutlined />} onClick={fetchTables} />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                            เพิ่มโต๊ะ
                        </Button>
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <StatsCard
                        total={tables.length}
                        active={activeCount}
                        inactive={inactiveCount}
                        available={availableCount}
                        unavailable={unavailableCount}
                    />

                    <PageSection title="ค้นหาและตัวกรอง">
                        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr', alignItems: 'center' }}>
                            <Input
                                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                                allowClear
                                placeholder="ค้นหาจากชื่อโต๊ะหรือสถานะออเดอร์..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                            <Segmented<StatusFilter>
                                options={[
                                    { label: `ทั้งหมด (${tables.length})`, value: 'all' },
                                    { label: `ใช้งาน (${activeCount})`, value: 'active' },
                                    { label: `ปิดใช้งาน (${inactiveCount})`, value: 'inactive' }
                                ]}
                                value={statusFilter}
                                onChange={(value) => setStatusFilter(value)}
                            />
                            <Segmented<TableStateFilter>
                                options={[
                                    { label: `ทุกสถานะ (${tables.length})`, value: 'all' },
                                    { label: `ว่าง (${availableCount})`, value: TableStatus.Available },
                                    { label: `ไม่ว่าง (${unavailableCount})`, value: TableStatus.Unavailable }
                                ]}
                                value={tableStateFilter}
                                onChange={(value) => setTableStateFilter(value)}
                            />
                        </div>
                    </PageSection>

                    <PageSection
                        title="รายการโต๊ะ"
                        extra={<span style={{ fontWeight: 600 }}>{filteredTables.length}</span>}
                    >
                        {filteredTables.length > 0 ? (
                            filteredTables.map((table) => (
                                <TableCard
                                    key={table.id}
                                    table={table}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onToggleActive={handleToggleActive}
                                    updatingStatusId={updatingStatusId}
                                />
                            ))
                        ) : (
                            <UIEmptyState
                                title={
                                    searchText.trim()
                                        ? 'ไม่พบโต๊ะตามคำค้น'
                                        : 'ยังไม่มีโต๊ะในระบบ'
                                }
                                description={
                                    searchText.trim()
                                        ? 'ลองเปลี่ยนคำค้น หรือตัวกรองสถานะ'
                                        : 'เพิ่มโต๊ะแรกเพื่อเริ่มใช้งาน'
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
