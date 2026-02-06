'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { message, Modal, Typography, Button, Input, Space, Segmented, Tag, Switch } from 'antd';
import {
    UnorderedListOutlined,
    PlusOutlined,
    ReloadOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined
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

const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';

interface StatsCardProps {
    totalUnits: number;
    activeUnits: number;
    inactiveUnits: number;
}

const StatsCard = ({ totalUnits, activeUnits, inactiveUnits }: StatsCardProps) => (
    <div style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 8,
        padding: 14
    }}>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', display: 'block' }}>{totalUnits}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ทั้งหมด</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#0e7490', display: 'block' }}>{activeUnits}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ใช้งาน</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#b91c1c', display: 'block' }}>{inactiveUnits}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ปิดใช้งาน</Text>
        </div>
    </div>
);

interface UnitCardProps {
    unit: ProductsUnit;
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

const UnitCard = ({ unit, onEdit, onDelete, onToggleActive, updatingStatusId }: UnitCardProps) => {
    return (
        <div
            className="unit-card"
            style={{
                ...pageStyles.unitCard(unit.is_active),
                borderRadius: 16,
            }}
            onClick={() => onEdit(unit)}
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
                        onClick={(checked, event) => {
                            event?.stopPropagation();
                            onToggleActive(unit, checked);
                        }}
                    />
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
                </div>
            </div>
        </div>
    );
};

export default function ProductsUnitPage() {
    const router = useRouter();
    const [units, setUnits] = useState<ProductsUnit[]>([]);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const { execute } = useAsyncAction();
    const { showLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard({ allowedRoles: ['Admin', 'Manager'] });

    useEffect(() => {
        getCsrfTokenCached();
    }, []);

    useEffect(() => {
        const cached = readCache<ProductsUnit[]>('pos:products-units', 10 * 60 * 1000);
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
            const payload = await response.json();
            const data = Array.isArray(payload) ? payload : payload?.data;
            if (!Array.isArray(data)) throw new Error('รูปแบบข้อมูลไม่ถูกต้อง');
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

    const filteredUnits = useMemo(() => {
        let result = units;

        if (statusFilter === 'active') {
            result = result.filter((item) => item.is_active);
        } else if (statusFilter === 'inactive') {
            result = result.filter((item) => !item.is_active);
        }

        const keyword = searchText.trim().toLowerCase();
        if (keyword) {
            result = result.filter((item) =>
                item.display_name.toLowerCase().includes(keyword) ||
                item.unit_name.toLowerCase().includes(keyword)
            );
        }

        return result;
    }, [units, searchText, statusFilter]);

    useEffect(() => {
        if (units.length > 0) {
            writeCache('pos:products-units', units);
        }
    }, [units]);

    const handleAdd = () => {
        showLoading('กำลังเปิดหน้าจัดการหน่วยสินค้า...');
        router.push('/pos/productsUnit/manager/add');
    };

    const handleEdit = (unit: ProductsUnit) => {
        showLoading('กำลังเปิดหน้าแก้ไขหน่วยสินค้า...');
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
                    setUnits((prev) => prev.filter((item) => item.id !== unit.id));
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

            const updated = await response.json();
            setUnits((prev) => prev.map((item) => item.id === unit.id ? updated : item));
            message.success(next ? 'เปิดใช้งานหน่วยสินค้าแล้ว' : 'ปิดใช้งานหน่วยสินค้าแล้ว');
        } catch (error) {
            console.error(error);
            message.error(error instanceof Error ? error.message : 'ไม่สามารถเปลี่ยนสถานะหน่วยสินค้าได้');
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

    const activeUnits = units.filter(u => u.is_active);
    const inactiveUnits = units.filter(u => !u.is_active);

    return (
        <div className="unit-page" style={pageStyles.container}>
            <style>{globalStyles}</style>

            <UIPageHeader
                title="หน่วยสินค้า"
                subtitle={`ทั้งหมด ${units.length} รายการ`}
                icon={<UnorderedListOutlined />}
                actions={
                    <Space size={8} wrap>
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

                    <PageSection title="ค้นหาและตัวกรอง">
                        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr', alignItems: 'center' }}>
                            <Input
                                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                                allowClear
                                placeholder="ค้นหาจากชื่อแสดงหรือชื่อระบบ..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                            <Segmented<StatusFilter>
                                options={[
                                    { label: `ทั้งหมด (${units.length})`, value: 'all' },
                                    { label: `ใช้งาน (${activeUnits.length})`, value: 'active' },
                                    { label: `ปิดใช้งาน (${inactiveUnits.length})`, value: 'inactive' }
                                ]}
                                value={statusFilter}
                                onChange={(value) => setStatusFilter(value)}
                            />
                        </div>
                    </PageSection>

                    <PageSection
                        title="รายการหน่วยสินค้า"
                        extra={<span style={{ fontWeight: 600 }}>{filteredUnits.length}</span>}
                    >
                        {filteredUnits.length > 0 ? (
                            filteredUnits.map((unit) => (
                                <UnitCard
                                    key={unit.id}
                                    unit={unit}
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
