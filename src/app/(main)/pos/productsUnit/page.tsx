'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { message, Modal, Typography, Button, Space, Tag, Switch } from 'antd';
import {
    UnorderedListOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { ProductsUnit } from '../../../../types/api/pos/productsUnit';
import { useRouter } from 'next/navigation';
import { useGlobalLoading } from '../../../../contexts/pos/GlobalLoadingContext';
import { useAsyncAction } from '../../../../hooks/useAsyncAction';
import { useSocket } from '../../../../hooks/useSocket';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { useRealtimeList } from '../../../../utils/pos/realtime';
import { readCache, writeCache } from '../../../../utils/pos/cache';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { pageStyles, globalStyles } from '../../../../theme/pos/productsUnit/style';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import PageContainer from '../../../../components/ui/page/PageContainer';
import PageSection from '../../../../components/ui/page/PageSection';
import PageStack from '../../../../components/ui/page/PageStack';
import UIPageHeader from '../../../../components/ui/page/PageHeader';
import UIEmptyState from '../../../../components/ui/states/EmptyState';
import ListPagination, { type CreatedSort } from '../../../../components/ui/pagination/ListPagination';
import { ModalSelector } from "../../../../components/ui/select/ModalSelector";
import { StatsGroup } from "../../../../components/ui/card/StatsGroup";
import { SearchInput } from "../../../../components/ui/input/SearchInput";
import { SearchBar } from "../../../../components/ui/page/SearchBar";
import { useEffectivePermissions } from "../../../../hooks/useEffectivePermissions";
import { useListState } from '../../../../hooks/pos/useListState';

const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';

interface UnitCardProps {
    unit: ProductsUnit;
    canUpdate: boolean;
    canDelete: boolean;
    onEdit: (unit: ProductsUnit) => void;
    onDelete: (unit: ProductsUnit) => void;
    onToggleActive: (unit: ProductsUnit, next: boolean) => void;
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

const UnitCard = ({ unit, canUpdate, canDelete, onEdit, onDelete, onToggleActive, updatingStatusId }: UnitCardProps) => {
    return (
        <div
            className="unit-card"
            style={{
                ...pageStyles.unitCard(unit.is_active),
                borderRadius: 16,
            }}
            onClick={() => {
                if (!canUpdate) return;
                onEdit(unit);
            }}
        >
            <div style={pageStyles.unitCardInner}>
                <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: unit.is_active
                        ? 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)'
                        : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: unit.is_active ? '0 4px 10px rgba(14, 116, 144, 0.18)' : 'none'
                }}>
                    <UnorderedListOutlined style={{
                        fontSize: 22,
                        color: unit.is_active ? '#0e7490' : '#94a3b8'
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
                            ellipsis={{ tooltip: unit.display_name }}
                        >
                            {unit.display_name}
                        </Text>
                        <Tag color={unit.is_active ? 'green' : 'default'}>
                            {unit.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                        </Tag>
                    </div>
                    <Text
                        type="secondary"
                        style={{ fontSize: 13, display: 'block', color: '#334155' }}
                        ellipsis={{ tooltip: unit.unit_name }}
                    >
                        {unit.unit_name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                        อัปเดตล่าสุด {formatDate(unit.update_date)}
                    </Text>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Switch
                        size="small"
                        checked={unit.is_active}
                        loading={updatingStatusId === unit.id}
                        disabled={!canUpdate}
                        onClick={(checked, event) => {
                            event?.stopPropagation();
                            onToggleActive(unit, checked);
                        }}
                    />
                    {canUpdate ? (
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(unit);
                            }}
                            style={{
                                borderRadius: 10,
                                color: '#0e7490',
                                background: '#ecfeff',
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
                                onDelete(unit);
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

export default function ProductsUnitPage() {
    const router = useRouter();
    const {
        searchText,
        setSearchText,
        debouncedSearch,
        page,
        setPage,
        pageSize,
        setPageSize,
        createdSort,
        setCreatedSort,
        filters,
        updateFilter,
        total,
        setTotal,
    } = useListState<{ status: StatusFilter }>({
        defaultPageSize: 10,
        defaultFilters: { status: 'all' }
    });

    const [units, setUnits] = useState<ProductsUnit[]>([]);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking, user } = useRoleGuard();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreateUnits = can("products_unit.page", "create");
    const canUpdateUnits = can("products_unit.page", "update");
    const canDeleteUnits = can("products_unit.page", "delete");

    useEffect(() => {
        getCsrfTokenCached();
        const cached = readCache<ProductsUnit[]>('pos:products-units', 10 * 60 * 1000);
        if (cached && cached.length > 0) {
            setUnits(cached);
        }
    }, []);

    const fetchUnits = useCallback(async () => {
        execute(async () => {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', String(pageSize));
            if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
            if (filters.status !== 'all') params.set('status', filters.status);
            params.set('sort_created', createdSort);
            const response = await fetch(`/api/pos/productsUnit?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถดึงข้อมูลหน่วยสินค้าได้');
            }
            const payload = await response.json();
            const data = Array.isArray(payload?.data) ? payload.data : [];
            setUnits(data);
            setTotal(payload?.total || 0);
        }, 'กำลังโหลดข้อมูลหน่วยสินค้า...');
    }, [execute, page, pageSize, debouncedSearch, filters.status, createdSort, setTotal]);

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

    const filteredUnits = useMemo(() => units, [units]);

    useEffect(() => {
        if (units.length > 0) {
            writeCache('pos:products-units', units);
        }
    }, [units]);

    const handleAdd = () => {
        if (!canCreateUnits) {
            message.error('คุณไม่มีสิทธิ์เพิ่มหน่วยสินค้า');
            return;
        }
        showLoading('กำลังเปิดหน้าจัดการหน่วยสินค้า...');
        router.push('/pos/productsUnit/manager/add');
    };

    const handleEdit = (unit: ProductsUnit) => {
        if (!canUpdateUnits) {
            message.error('คุณไม่มีสิทธิ์แก้ไขหน่วยสินค้า');
            return;
        }
        showLoading('กำลังเปิดหน้าแก้ไขหน่วยสินค้า...');
        router.push(`/pos/productsUnit/manager/edit/${unit.id}`);
    };

    const handleDelete = (unit: ProductsUnit) => {
        if (!canDeleteUnits) {
            message.error('คุณไม่มีสิทธิ์ลบหน่วยสินค้า');
            return;
        }
        Modal.confirm({
            title: 'ยืนยันการลบหน่วยสินค้า',
            content: `คุณต้องการลบหน่วยสินค้า ${unit.display_name} หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
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
                    await fetchUnits();
                    message.success(`ลบหน่วย "${unit.display_name}" สำเร็จ`);
                }, 'กำลังลบหน่วยสินค้า...');
            },
        });
    };

    const handleToggleActive = async (unit: ProductsUnit, next: boolean) => {
        setUpdatingStatusId(unit.id);
        try {
            const csrfToken = await getCsrfTokenCached();
            const response = await fetch(`/api/pos/productsUnit/update/${unit.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({ is_active: next })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'ไม่สามารถเปลี่ยนสถานะหน่วยสินค้าได้');
            }

            await fetchUnits();
            message.success(next ? 'เปิดใช้งานหน่วยสินค้าแล้ว' : 'ปิดใช้งานหน่วยสินค้าแล้ว');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถเปลี่ยนสถานะหน่วยสินค้าได้');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    if (isChecking || permissionLoading) {
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

            <UIPageHeader
                title="หน่วยสินค้า"
                icon={<UnorderedListOutlined />}
                actions={
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} onClick={() => { void fetchUnits(); }} />
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={!canCreateUnits}>
                            เพิ่มหน่วยสินค้า
                        </Button>
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <StatsGroup
                        stats={[
                            { label: 'ทั้งหมด', value: total, color: '#0f172a' },
                            { label: 'ใช้งาน', value: activeUnits.length, color: '#0e7490' },
                            { label: 'ปิดใช้งาน', value: inactiveUnits.length, color: '#b91c1c' },
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
                        title="รายการหน่วยสินค้า"
                        extra={<span style={{ fontWeight: 600 }}>{filteredUnits.length} รายการ</span>}
                    >
                        {filteredUnits.length > 0 ? (
                            filteredUnits.map((unit) => (
                                <UnitCard
                                    key={unit.id}
                                    unit={unit}
                                    canUpdate={canUpdateUnits}
                                    canDelete={canDeleteUnits}
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
                                        ? 'ไม่พบหน่วยสินค้าตามคำค้น'
                                        : 'ยังไม่มีหน่วยสินค้า'
                                }
                                description={
                                    searchText.trim()
                                        ? 'ลองเปลี่ยนคำค้น หรือตัวกรองสถานะ'
                                        : 'เพิ่มหน่วยสินค้าแรกเพื่อเริ่มใช้งาน'
                                }
                            />
                        )}
                        <div style={{ marginTop: 12 }}>
                            <ListPagination
                                page={page}
                                pageSize={pageSize}
                                total={total}
                                onPageChange={setPage}
                                onPageSizeChange={setPageSize}
                                activeColor="#d97706"
                            />
                        </div>
                    </PageSection>
                </PageStack>
            </PageContainer>

        </div>
    );
}
