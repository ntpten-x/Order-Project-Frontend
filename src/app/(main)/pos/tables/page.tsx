'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { message, Modal, Typography, Button, Space, Tag, Switch } from 'antd';
import {
    TableOutlined,
    PlusOutlined,
    ReloadOutlined,
    QrcodeOutlined,
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
import type { CreatedSort } from '../../../../components/ui/pagination/ListPagination';
import { DEFAULT_CREATED_SORT } from '../../../../lib/list-sort';
import { ModalSelector } from "../../../../components/ui/select/ModalSelector";
import { StatsGroup } from "../../../../components/ui/card/StatsGroup";
import { SearchInput } from "../../../../components/ui/input/SearchInput";
import { SearchBar } from "../../../../components/ui/page/SearchBar";
import ListPagination from '../../../../components/ui/pagination/ListPagination';
import { useEffectivePermissions } from "../../../../hooks/useEffectivePermissions";
import { useListState } from '../../../../hooks/pos/useListState';

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
    const {
        page, setPage,
        pageSize, setPageSize,
        total, setTotal,
        searchText, setSearchText,
        debouncedSearch,
        createdSort, setCreatedSort,
        filters, updateFilter,
        getQueryParams,
        isUrlReady
    } = useListState({
        defaultPageSize: 10,
        defaultFilters: {
            status: 'all' as StatusFilter,
            table_state: 'all' as TableStateFilter
        }
    });

    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
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

    const fetchTables = useCallback(async () => {
        execute(async () => {
            const params = getQueryParams();
            const response = await fetch(`/api/pos/tables?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลโต๊ะได้');
            }
            const payload = await response.json();
            setTables(payload.data || []);
            setTotal(payload.total || 0);
        }, 'กำลังโหลดข้อมูลโต๊ะ...');
    }, [execute, getQueryParams, setTotal]);

    useEffect(() => {
        if (isUrlReady && isAuthorized) {
            fetchTables();
        }
    }, [isUrlReady, isAuthorized, fetchTables]);

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

    // No longer using client-side filtering as we do it on the server
    const displayTables = tables;

    const handleAdd = () => {
        if (!canCreateTables) {
            message.error("คุณไม่มีสิทธิ์เพิ่มโต๊ะ");
            return;
        }
        showLoading('กำลังเปิดหน้าจัดการโต๊ะ...');
        router.push('/pos/tables/manager/add');
    };

    const handleOpenQrCodes = () => {
        showLoading('กำลังเปิดหน้า QR โต๊ะ...');
        router.push('/pos/qr-code');
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
            content: `คุณต้องการลบโต๊ะ ${table.table_name} หรือไม่?`,
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
                    setTables((prev: Tables[]) => prev.filter((item: Tables) => item.id !== table.id));
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
            setTables((prev: Tables[]) => prev.map((item: Tables) => item.id === table.id ? updated : item));
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
                icon={<TableOutlined />}
                actions={
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} onClick={fetchTables} />
                        <Button icon={<QrcodeOutlined />} onClick={handleOpenQrCodes}>
                            QR โต๊ะ
                        </Button>
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
                            placeholder="ค้นหา"
                            value={searchText}
                            onChange={(val) => {
                                setSearchText(val);
                            }}
                        />
                        <Space wrap size={10}>
                            <ModalSelector<StatusFilter>
                                title="เลือกสถานะ"
                                options={[
                                    { label: `ทั้งหมด`, value: 'all' },
                                    { label: `ใช้งาน`, value: 'active' },
                                    { label: `ปิดใช้งาน`, value: 'inactive' }
                                ]}
                                value={filters.status}
                                onChange={(value) => updateFilter('status', value)}
                                style={{ minWidth: 120 }}
                            />
                            <ModalSelector<TableStateFilter>
                                title="สถานะโต๊ะ"
                                options={[
                                    { label: `ทุกสถานะ`, value: 'all' },
                                    { label: `ว่าง`, value: TableStatus.Available },
                                    { label: `ไม่ว่าง`, value: TableStatus.Unavailable }
                                ]}
                                value={filters.table_state}
                                onChange={(value) => updateFilter('table_state', value)}
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
                        </Space>
                    </SearchBar>

                    <PageSection
                        title="รายการโต๊ะ"
                        extra={<span style={{ fontWeight: 600 }}>{total} รายการ</span>}
                    >
                        {displayTables.length > 0 ? (
                            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                {displayTables.map((table) => (
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
                                ))}

                                <div style={{ marginTop: 12 }}>
                                    <ListPagination
                                        page={page}
                                        total={total}
                                        pageSize={pageSize}
                                        onPageChange={setPage}
                                        onPageSizeChange={setPageSize}
                                        activeColor="#7C3AED"
                                    />
                                </div>
                            </Space>
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
                            />
                        )}
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
