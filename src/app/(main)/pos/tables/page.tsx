'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { message, Modal, Typography, Button, Space, Tag, Switch } from 'antd';
import {
    TableOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleFilled
} from '@ant-design/icons';
import { Tables, TableStatus } from '../../../../types/api/pos/tables';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
import { useDebouncedValue } from '../../../../utils/useDebouncedValue';
import type { CreatedSort } from '../../../../components/ui/pagination/ListPagination';
import { DEFAULT_CREATED_SORT, parseCreatedSort } from '../../../../lib/list-sort';
import { ModalSelector } from "../../../../components/ui/select/ModalSelector";
import { StatsGroup } from "../../../../components/ui/card/StatsGroup";
import { SearchInput } from "../../../../components/ui/input/SearchInput";
import { SearchBar } from "../../../../components/ui/page/SearchBar";
import { useEffectivePermissions } from "../../../../hooks/useEffectivePermissions";

const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';
type TableStateFilter = 'all' | TableStatus.Available | TableStatus.Unavailable;

interface TableCardProps {
    table: Tables;
    canUpdate: boolean;
    canDelete: boolean;
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



const TableCard = ({ table, canUpdate, canDelete, onEdit, onDelete, onToggleActive, updatingStatusId }: TableCardProps) => {
    const isAvailable = table.status === TableStatus.Available;

    return (
        <div
            className="table-card"
            style={{
                ...pageStyles.tableCard(table.is_active),
                borderRadius: 16,
                cursor: canUpdate ? "pointer" : "default",
            }}
            onClick={() => {
                if (!canUpdate) return;
                onEdit(table);
            }}
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
                        disabled={!canUpdate}
                        onClick={(checked, event) => {
                            if (!canUpdate) return;
                            event?.stopPropagation();
                            onToggleActive(table, checked);
                        }}
                    />
                    {canUpdate ? (
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
                    ) : null}
                    {canDelete ? (
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
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default function TablesPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isUrlReadyRef = useRef(false);
    const [tables, setTables] = useState<Tables[]>([]);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [tableStateFilter, setTableStateFilter] = useState<TableStateFilter>('all');
    const [createdSort, setCreatedSort] = useState<CreatedSort>(DEFAULT_CREATED_SORT);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const debouncedSearch = useDebouncedValue(searchText, 300);
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const canCreateTables = can("tables.page", "create");
    const canUpdateTables = can("tables.page", "update");
    const canDeleteTables = can("tables.page", "delete");

    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    useEffect(() => {
        if (isUrlReadyRef.current) return;

        const qParam = searchParams.get('q') || '';
        const statusParam = searchParams.get('status');
        const tableStateParam = searchParams.get('table_state');
        const sortParam = searchParams.get('sort_created');

        const nextStatus: StatusFilter =
            statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all';
        const nextTableState: TableStateFilter =
            tableStateParam === TableStatus.Available || tableStateParam === TableStatus.Unavailable
                ? tableStateParam
                : 'all';

        setSearchText(qParam);
        setStatusFilter(nextStatus);
        setTableStateFilter(nextTableState);
        setCreatedSort(parseCreatedSort(sortParam));
        isUrlReadyRef.current = true;
    }, [searchParams]);

    useEffect(() => {
        if (!isUrlReadyRef.current) return;

        const params = new URLSearchParams();
        if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (tableStateFilter !== 'all') params.set('table_state', tableStateFilter);
        if (createdSort !== DEFAULT_CREATED_SORT) params.set('sort_created', createdSort);

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, [router, pathname, debouncedSearch, statusFilter, tableStateFilter, createdSort]);

    useEffect(() => {
        if (createdSort !== DEFAULT_CREATED_SORT) return;
        const cached = readCache<Tables[]>('pos:tables', 5 * 60 * 1000);
        if (cached && cached.length > 0) {
            setTables(cached);
        }
    }, [createdSort]);

    const fetchTables = useCallback(async () => {
        execute(async () => {
            const params = new URLSearchParams();
            params.set('limit', '200');
            params.set('sort_created', createdSort);
            const response = await fetch(`/api/pos/tables?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลโต๊ะได้');
            }
            const payload = await response.json();
            const data = Array.isArray(payload) ? payload : payload?.data;
            if (!Array.isArray(data)) throw new Error('รูปแบบข้อมูลไม่ถูกต้อง');
            setTables(data);
        }, 'กำลังโหลดข้อมูลโต๊ะ...');
    }, [execute, createdSort]);

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
        if (createdSort === DEFAULT_CREATED_SORT && tables.length > 0) {
            writeCache('pos:tables', tables);
        }
    }, [tables, createdSort]);

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

        const keyword = debouncedSearch.trim().toLowerCase();
        if (keyword) {
            result = result.filter((item) =>
                item.table_name.toLowerCase().includes(keyword) ||
                (item.active_order_status || '').toLowerCase().includes(keyword)
            );
        }

        return result;
    }, [tables, debouncedSearch, statusFilter, tableStateFilter]);

    const handleAdd = () => {
        if (!canCreateTables) {
            message.error("คุณไม่มีสิทธิ์เพิ่มโต๊ะ");
            return;
        }
        showLoading('กำลังเปิดหน้าจัดการโต๊ะ...');
        router.push('/pos/tables/manager/add');
    };

    const handleEdit = (table: Tables) => {
        if (!canUpdateTables) {
            message.error("คุณไม่มีสิทธิ์แก้ไขโต๊ะ");
            return;
        }
        showLoading('กำลังเปิดหน้าแก้ไขโต๊ะ...');
        router.push(`/pos/tables/manager/edit/${table.id}`);
    };

    const handleDelete = (table: Tables) => {
        if (!canDeleteTables) {
            message.error("คุณไม่มีสิทธิ์ลบโต๊ะ");
            return;
        }
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
        if (!canUpdateTables) {
            message.error("คุณไม่มีสิทธิ์แก้ไขโต๊ะ");
            return;
        }
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

    if (permissionLoading) {
        return <AccessGuardFallback message="กำลังโหลดสิทธิ์ผู้ใช้งาน..." />;
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
                        {canCreateTables ? (
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                เพิ่มโต๊ะ
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <StatsGroup
                        stats={[
                            { label: 'ทั้งหมด', value: tables.length, color: '#0f172a' },
                            { label: 'ใช้งาน', value: activeCount, color: '#7C3AED' },
                            { label: 'ปิดใช้งาน', value: inactiveCount, color: '#b91c1c' },
                            { label: 'สถานะว่าง', value: availableCount, color: '#059669' },
                            { label: 'สถานะไม่ว่าง', value: unavailableCount, color: '#d97706' },
                        ]}
                    />

                    <SearchBar>
                        <SearchInput
                            placeholder="ค้นหาจากชื่อโต๊ะหรือสถานะออเดอร์..."
                            value={searchText}
                            onChange={(val) => {
                                setSearchText(val);
                            }}
                        />
                        <ModalSelector<StatusFilter>
                            title="เลือกสถานะ"
                            options={[
                                { label: `ทั้งหมด (${tables.length})`, value: 'all' },
                                { label: `ใช้งาน (${activeCount})`, value: 'active' },
                                { label: `ปิดใช้งาน (${inactiveCount})`, value: 'inactive' }
                            ]}
                            value={statusFilter}
                            onChange={(value) => setStatusFilter(value)}
                            style={{ minWidth: 120 }}
                        />
                        <ModalSelector<TableStateFilter>
                            title="สถานะโต๊ะ"
                            options={[
                                { label: `ทุกสถานะ (${tables.length})`, value: 'all' },
                                { label: `ว่าง (${availableCount})`, value: TableStatus.Available },
                                { label: `ไม่ว่าง (${unavailableCount})`, value: TableStatus.Unavailable }
                            ]}
                            value={tableStateFilter}
                            onChange={(value) => setTableStateFilter(value)}
                            style={{ minWidth: 120 }}
                        />
                        <ModalSelector<CreatedSort>
                            title="เรียงลำดับ"
                            options={[
                                { label: 'เรียงจากเก่าก่อน', value: 'old' },
                                { label: 'เรียงจากใหม่ก่อน', value: 'new' },
                            ]}
                            value={createdSort}
                            onChange={(value) => setCreatedSort(value)}
                            style={{ minWidth: 120 }}
                        />
                    </SearchBar>

                    <PageSection
                        title="รายการโต๊ะ"
                        extra={<span style={{ fontWeight: 600 }}>{filteredTables.length}</span>}
                    >
                        {filteredTables.length > 0 ? (
                            filteredTables.map((table) => (
                                <TableCard
                                    key={table.id}
                                    table={table}
                                    canUpdate={canUpdateTables}
                                    canDelete={canDeleteTables}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onToggleActive={handleToggleActive}
                                    updatingStatusId={updatingStatusId}
                                />
                            ))
                        ) : (
                            <UIEmptyState
                                title={
                                    debouncedSearch.trim()
                                        ? 'ไม่พบโต๊ะตามคำค้น'
                                        : 'ยังไม่มีโต๊ะในระบบ'
                                }
                                description={
                                    debouncedSearch.trim()
                                        ? 'ลองเปลี่ยนคำค้น หรือตัวกรองสถานะ'
                                        : 'เพิ่มโต๊ะแรกเพื่อเริ่มใช้งาน'
                                }
                                action={
                                    !debouncedSearch.trim() && canCreateTables ? (
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
