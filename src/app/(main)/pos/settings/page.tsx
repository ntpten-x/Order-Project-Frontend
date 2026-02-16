'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Typography, Button, Space, Tag, message, Input, Segmented, Grid, Skeleton, Card } from 'antd';
import {
    SettingOutlined,
    CheckCircleOutlined,
    PlusOutlined,
    QrcodeOutlined,
    ReloadOutlined,
    EditOutlined,
    SearchOutlined,
    SwapOutlined
} from '@ant-design/icons';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { paymentAccountService } from '../../../../services/pos/paymentAccount.service';
import { ShopPaymentAccount } from '../../../../types/api/pos/shopPaymentAccount';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';
import { useSocket } from '../../../../hooks/useSocket';
import { useRealtimeRefresh } from '../../../../utils/pos/realtime';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { useAuth } from '../../../../contexts/AuthContext';
import { useEffectivePermissions } from '../../../../hooks/useEffectivePermissions';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import PageContainer from '../../../../components/ui/page/PageContainer';
import PageSection from '../../../../components/ui/page/PageSection';
import PageStack from '../../../../components/ui/page/PageStack';
import UIPageHeader from '../../../../components/ui/page/PageHeader';
import UIEmptyState from '../../../../components/ui/states/EmptyState';
import { RealtimeEvents } from '../../../../utils/realtimeEvents';
import { pageStyles } from '../../../../theme/pos/settings/style';
import { useDebouncedValue } from '../../../../utils/useDebouncedValue';

const { Text } = Typography;

type StatusFilter = 'all' | 'active' | 'inactive';

type ServiceError = Error & { status?: number; code?: string };

const getFriendlyErrorMessage = (error: unknown, fallback: string) => {
    const err = error as ServiceError | undefined;
    const status = err?.status;
    const code = err?.code;
    const raw = err?.message || '';
    const lower = raw.toLowerCase();

    if (code === 'DUPLICATE_ENTRY' || lower.includes('duplicate') || lower.includes('already exists')) {
        if (lower.includes('active')) return 'มีบัญชีหลักอยู่แล้ว กรุณาเปลี่ยนบัญชีหลักจากรายการ';
        return 'เลขพร้อมเพย์นี้ถูกใช้งานแล้ว กรุณาตรวจสอบและลองใหม่';
    }

    if (status === 409 && code === 'DATABASE_ERROR') {
        return 'เกิดข้อผิดพลาดฐานข้อมูลจากฝั่งเซิร์ฟเวอร์ (ไม่ใช่เลขซ้ำ) กรุณาลองใหม่หรือตรวจสอบ backend';
    }

    if (status === 409) {
        return raw || 'เกิดข้อขัดแย้งของข้อมูล กรุณารีเฟรชแล้วลองใหม่';
    }

    if (status === 400) return raw || 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
    if (status === 403) return 'สิทธิ์ไม่เพียงพอ หรือ CSRF token หมดอายุ กรุณารีเฟรชหน้าแล้วลองใหม่';
    if (status === 404) return 'ไม่พบบัญชีที่ต้องการใช้งาน';

    if (raw) return raw;
    return fallback;
};

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div style={{
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            background: '#fff',
            padding: 12,
            textAlign: 'center'
        }}>
            <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
        </div>
    );
}

function SectionLoadingSkeleton({ compact = false }: { compact?: boolean }) {
    return (
        <div style={{ display: 'grid', gap: compact ? 8 : 12 }}>
            <Skeleton.Input active block style={{ height: compact ? 30 : 36 }} />
            <Skeleton.Input active block style={{ height: compact ? 30 : 36 }} />
            <Skeleton.Button active block style={{ height: compact ? 40 : 44 }} />
        </div>
    );
}

export default function POSSettingsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { socket } = useSocket();
    const { user } = useAuth();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const { isAuthorized, isChecking } = useRoleGuard();
    const { can } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreateAccounts = can('payment_accounts.page', 'create');
    const canUpdateAccounts = can('payment_accounts.page', 'update');
    const isUrlReadyRef = useRef(false);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [accounts, setAccounts] = useState<ShopPaymentAccount[]>([]);
    const [activatingId, setActivatingId] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const debouncedSearch = useDebouncedValue(searchText, 300);

    useEffect(() => {
        if (isUrlReadyRef.current) return;

        const qParam = searchParams.get('q') || '';
        const statusParam = searchParams.get('status');
        const nextStatus: StatusFilter =
            statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all';

        setSearchText(qParam);
        setStatusFilter(nextStatus);
        isUrlReadyRef.current = true;
    }, [searchParams]);

    useEffect(() => {
        if (!isUrlReadyRef.current) return;

        const params = new URLSearchParams();
        if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
        if (statusFilter !== 'all') params.set('status', statusFilter);

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, [router, pathname, debouncedSearch, statusFilter]);

    const fetchAccounts = useCallback(async (silent = false) => {
        try {
            if (silent) setRefreshing(true);
            else setLoading(true);

            const accountsList = await paymentAccountService.getByShopId();
            setAccounts(accountsList);
        } catch (error) {
            console.error(error);
            message.error(getFriendlyErrorMessage(error, 'ไม่สามารถดึงข้อมูลบัญชีพร้อมเพย์ได้'));
        } finally {
            if (silent) setRefreshing(false);
            else setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    useRealtimeRefresh({
        socket,
        events: [
            RealtimeEvents.paymentAccounts.create,
            RealtimeEvents.paymentAccounts.update,
            RealtimeEvents.paymentAccounts.delete,
        ],
        onRefresh: () => fetchAccounts(true),
        intervalMs: 30000,
    });

    const promptPayAccounts = useMemo(
        () => accounts.filter((item) => item.account_type === 'PromptPay'),
        [accounts]
    );

    const activeAccount = useMemo(
        () => promptPayAccounts.find((acc) => acc.is_active) || null,
        [promptPayAccounts]
    );

    const stats = useMemo(() => {
        const total = promptPayAccounts.length;
        const active = promptPayAccounts.filter((acc) => acc.is_active).length;
        const inactive = total - active;
        return { total, active, inactive };
    }, [promptPayAccounts]);

    const filteredAccounts = useMemo(() => {
        let result = promptPayAccounts;

        if (statusFilter === 'active') {
            result = result.filter((item) => item.is_active);
        } else if (statusFilter === 'inactive') {
            result = result.filter((item) => !item.is_active);
        }

        const keyword = debouncedSearch.trim().toLowerCase();
        if (keyword) {
            result = result.filter((item) =>
                item.account_name.toLowerCase().includes(keyword) ||
                item.account_number.toLowerCase().includes(keyword)
            );
        }

        return result;
    }, [promptPayAccounts, statusFilter, debouncedSearch]);

    const handleActivate = async (id: string, accountName: string) => {
        if (!canUpdateAccounts) {
            message.error('คุณไม่มีสิทธิ์เปลี่ยนบัญชีหลัก (ต้องมีสิทธิ์ payment_accounts.page:update)');
            return;
        }
        setActivatingId(id);
        try {
            const csrfToken = await getCsrfTokenCached();
            await paymentAccountService.activate(id, undefined, undefined, csrfToken);
            message.success(`ตั้ง "${accountName}" เป็นบัญชีหลักสำเร็จ`);
            await fetchAccounts(true);
        } catch (error) {
            console.error(error);
            message.error(getFriendlyErrorMessage(error, 'ไม่สามารถเปลี่ยนบัญชีหลักได้'));
        } finally {
            setActivatingId(null);
        }
    };

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <div style={pageStyles.container}>
            <UIPageHeader
                title="ตั้งค่าบัญชีพร้อมเพย์"
                subtitle="กำหนดบัญชีหลักและจัดการช่องทางรับชำระด้วยพร้อมเพย์"
                icon={<SettingOutlined />}
                onBack={() => router.back()}
                actions={
                    <Space size={8} wrap>
                        <Button icon={<ReloadOutlined />} onClick={() => fetchAccounts(false)} loading={refreshing || loading} />
                        <Button
                            icon={<EditOutlined />}
                            disabled={!canUpdateAccounts}
                            onClick={() => router.push('/pos/settings/payment-accounts/manage')}
                        >
                            จัดการทั้งหมด
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            disabled={!canCreateAccounts}
                            onClick={() => router.push('/pos/settings/payment-accounts/add')}
                        >
                            เพิ่มพร้อมเพย์
                        </Button>
                    </Space>
                }
            />

            <PageContainer maxWidth={1040}>
                <PageStack>
                    <PageSection title="ภาพรวมบัญชีพร้อมเพย์">
                        {loading ? (
                            <SectionLoadingSkeleton compact={isMobile} />
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
                                gap: isMobile ? 8 : 10
                            }}>
                                <StatCard label="ทั้งหมด" value={stats.total} color="#1e293b" />
                                <StatCard label="บัญชีหลัก" value={stats.active} color="#16a34a" />
                                <StatCard label="ไม่ใช้งาน" value={stats.inactive} color="#b91c1c" />
                            </div>
                        )}
                    </PageSection>

                    <PageSection title="บัญชีหลักปัจจุบัน">
                        {loading ? (
                            <SectionLoadingSkeleton compact={isMobile} />
                        ) : activeAccount ? (
                            <div style={{
                                borderRadius: 14,
                                border: '1px solid #bbf7d0',
                                background: '#f0fdf4',
                                padding: isMobile ? 10 : 14,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 12,
                                flexWrap: 'wrap'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                    <div style={{
                                        width: isMobile ? 38 : 44,
                                        height: isMobile ? 38 : 44,
                                        borderRadius: 10,
                                        background: '#fdf2f8',
                                        color: '#db2777',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <QrcodeOutlined />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <Text strong style={{ display: 'block' }}>{activeAccount.account_name}</Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>{activeAccount.account_number}</Text>
                                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Tag color="green" style={{ margin: 0, borderRadius: 6 }}>
                                                <CheckCircleOutlined /> บัญชีหลัก
                                            </Tag>
                                            <Tag style={{ margin: 0, borderRadius: 6 }}>พร้อมเพย์</Tag>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    icon={<SwapOutlined />}
                                    disabled={!canUpdateAccounts}
                                    onClick={() => router.push('/pos/settings/payment-accounts/manage')}
                                >
                                    เปลี่ยนบัญชีหลัก
                                </Button>
                            </div>
                        ) : (
                            <UIEmptyState
                                title="ยังไม่มีบัญชีพร้อมเพย์หลัก"
                                description="เพิ่มบัญชีพร้อมเพย์แรกเพื่อเริ่มใช้งานการรับชำระ"
                                action={
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        disabled={!canCreateAccounts}
                                        onClick={() => router.push('/pos/settings/payment-accounts/add')}
                                    >
                                        เพิ่มบัญชีแรก
                                    </Button>
                                }
                            />
                        )}
                    </PageSection>

                    <PageSection title="ค้นหาและตัวกรอง">
                        {loading ? (
                            <SectionLoadingSkeleton compact={isMobile} />
                        ) : (
                            <div style={{ display: 'grid', gap: isMobile ? 8 : 10 }}>
                                <Input
                                    size={isMobile ? 'middle' : 'large'}
                                    prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                                    placeholder="ค้นหาจากชื่อบัญชี หรือเลขพร้อมเพย์..."
                                    allowClear
                                    value={searchText}
                                    onChange={(event) => setSearchText(event.target.value)}
                                />
                                <Segmented<StatusFilter>
                                    options={[
                                        { label: `ทั้งหมด (${promptPayAccounts.length})`, value: 'all' },
                                        { label: `ใช้งาน (${stats.active})`, value: 'active' },
                                        { label: `ไม่ใช้งาน (${stats.inactive})`, value: 'inactive' },
                                    ]}
                                    block={isMobile}
                                    size={isMobile ? 'small' : 'middle'}
                                    value={statusFilter}
                                    onChange={(value) => setStatusFilter(value)}
                                />
                            </div>
                        )}
                    </PageSection>

                    <PageSection title="รายการบัญชีพร้อมเพย์" extra={<span style={{ fontWeight: 600 }}>{filteredAccounts.length}</span>}>
                        {loading ? (
                            <div style={{ display: 'grid', gap: isMobile ? 8 : 10 }}>
                                {Array.from({ length: 3 }).map((_, index) => (
                                    <Card key={index} size="small" style={{ borderRadius: 12 }}>
                                        <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
                                    </Card>
                                ))}
                            </div>
                        ) : filteredAccounts.length > 0 ? (
                            <div style={{ display: 'grid', gap: isMobile ? 8 : 10 }}>
                                {filteredAccounts.map((account) => (
                                    <div
                                        key={account.id}
                                        style={{
                                            borderRadius: 14,
                                            border: `1px solid ${account.is_active ? '#86efac' : '#e2e8f0'}`,
                                            background: account.is_active ? '#f0fdf4' : '#fff',
                                            padding: isMobile ? 10 : 12,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 12,
                                            flexWrap: 'wrap'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                            <div style={{
                                                width: isMobile ? 34 : 38,
                                                height: isMobile ? 34 : 38,
                                                borderRadius: 10,
                                                background: '#fdf2f8',
                                                color: '#db2777',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <QrcodeOutlined />
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <Text strong style={{ display: 'block' }}>{account.account_name}</Text>
                                                <Text type="secondary" style={{ fontSize: 12 }}>{account.account_number}</Text>
                                            </div>
                                        </div>
                                        <Space size={8} wrap>
                                            <Tag color={account.is_active ? 'green' : 'default'} style={{ borderRadius: 6, margin: 0 }}>
                                                {account.is_active ? 'บัญชีหลัก' : 'พร้อมเพย์'}
                                            </Tag>
                                            {!account.is_active ? (
                                                <Button
                                                    type="primary"
                                                    size="small"
                                                    loading={activatingId === account.id}
                                                    disabled={!canUpdateAccounts}
                                                    onClick={() => handleActivate(account.id, account.account_name)}
                                                >
                                                    ตั้งเป็นบัญชีหลัก
                                                </Button>
                                            ) : null}
                                            <Button
                                                size="small"
                                                disabled={!canUpdateAccounts}
                                                onClick={() => router.push(`/pos/settings/payment-accounts/edit/${account.id}`)}
                                            >
                                                แก้ไข
                                            </Button>
                                        </Space>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <UIEmptyState
                                title={debouncedSearch.trim() ? 'ไม่พบบัญชีตามคำค้น' : 'ยังไม่มีบัญชีพร้อมเพย์'}
                                description={
                                    debouncedSearch.trim()
                                        ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง'
                                        : 'เพิ่มบัญชีพร้อมเพย์เพื่อเริ่มใช้งานการชำระเงิน'
                                }
                                action={
                                    !debouncedSearch.trim() ? (
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                            onClick={() => router.push('/pos/settings/payment-accounts/add')}
                                        >
                                            เพิ่มบัญชีพร้อมเพย์
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
