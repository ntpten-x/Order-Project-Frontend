
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Typography,
    Button,
    Input,
    Space,
    Tag,
    Segmented,
    message,
    Modal,
    Card,
    Row,
    Col,
    Form,
    Switch,
    Alert,
    Skeleton,
    Grid
} from 'antd';
import {
    PlusOutlined,
    QrcodeOutlined,
    DeleteOutlined,
    EditOutlined,
    ReloadOutlined,
    SearchOutlined,
    SaveOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
    SettingOutlined,
    SwapOutlined,
    CheckCircleFilled
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { pageStyles } from './style';
import { paymentAccountService } from '../../../../../../services/pos/paymentAccount.service';
import { getCsrfTokenCached } from '../../../../../../utils/pos/csrf';
import { CreatePaymentAccountDto, ShopPaymentAccount } from '../../../../../../types/api/pos/shopPaymentAccount';
import { useRoleGuard } from '../../../../../../utils/pos/accessControl';
import { AccessGuardFallback } from '../../../../../../components/pos/AccessGuard';
import { useSocket } from '../../../../../../hooks/useSocket';
import { useRealtimeList, useRealtimeRefresh } from '../../../../../../utils/pos/realtime';
import { RealtimeEvents } from '../../../../../../utils/realtimeEvents';
import PageContainer from '../../../../../../components/ui/page/PageContainer';
import PageSection from '../../../../../../components/ui/page/PageSection';
import PageStack from '../../../../../../components/ui/page/PageStack';
import UIPageHeader from '../../../../../../components/ui/page/PageHeader';
import UIEmptyState from '../../../../../../components/ui/states/EmptyState';

const { Title, Text } = Typography;
const { TextArea } = Input;

type PaymentAccountRouteMode = 'manage' | 'add' | 'edit';
type StatusFilter = 'all' | 'active' | 'inactive';

type PaymentAccountFormValues = {
    account_name: string;
    account_number: string;
    phone?: string;
    address?: string;
    is_active: boolean;
};

type ServiceError = Error & { status?: number; code?: string };

const normalizeDigits = (value: string) => value.replace(/\D/g, '');

const formatDate = (raw?: string) => {
    if (!raw) return '-';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
};

const getFriendlyErrorMessage = (error: unknown, fallback: string) => {
    const err = error as ServiceError | undefined;
    const status = err?.status;
    const code = err?.code;
    const raw = err?.message || '';
    const lower = raw.toLowerCase();

    if (code === 'DUPLICATE_ENTRY' || lower.includes('duplicate') || lower.includes('already exists')) {
        if (lower.includes('active account') || lower.includes('cannot delete')) {
            return 'ลบบัญชีหลักไม่ได้ กรุณาเปลี่ยนบัญชีหลักก่อน';
        }
        return 'เลขพร้อมเพย์นี้ถูกใช้งานแล้ว กรุณาตรวจสอบและลองใหม่';
    }

    if (status === 409 && code === 'DATABASE_ERROR') {
        return 'เซิร์ฟเวอร์แจ้งข้อผิดพลาดฐานข้อมูล (ไม่ใช่เลขซ้ำ) กรุณาลองใหม่หรือตรวจสอบ backend';
    }

    if (status === 409) {
        return raw || 'เกิดข้อขัดแย้งของข้อมูล กรุณารีเฟรชแล้วลองใหม่';
    }

    if (status === 400) return raw || 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
    if (status === 403) return 'สิทธิ์ไม่เพียงพอ หรือ CSRF token หมดอายุ กรุณารีเฟรชแล้วลองใหม่';
    if (status === 404) return 'ไม่พบข้อมูลบัญชีที่ต้องการ';

    if (raw) return raw;
    return fallback;
};

const StatsCard = ({ total, active, inactive }: { total: number; active: number; inactive: number }) => (
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
            <span style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', display: 'block' }}>{total}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ทั้งหมด</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#16a34a', display: 'block' }}>{active}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>บัญชีหลัก</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#b91c1c', display: 'block' }}>{inactive}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ไม่ใช้งาน</Text>
        </div>
    </div>
);

const SectionLoadingSkeleton = ({ compact = false, rows = 3 }: { compact?: boolean; rows?: number }) => (
    <div style={{ display: 'grid', gap: compact ? 8 : 12 }}>
        {Array.from({ length: rows }).map((_, index) => (
            <Skeleton.Input key={index} active block style={{ height: compact ? 32 : 38 }} />
        ))}
    </div>
);

const PaymentAccountPreviewCard = ({
    accountName,
    accountNumber,
    isActive
}: {
    accountName: string;
    accountNumber: string;
    isActive: boolean;
}) => (
    <div style={{
        background: 'white',
        borderRadius: 20,
        padding: 20,
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        border: '1px solid #F1F5F9'
    }}>
        <Title level={5} style={{ color: '#db2777', marginBottom: 16, fontWeight: 700 }}>ตัวอย่างการแสดงผล</Title>

        <div style={{
            borderRadius: 16,
            border: `1px solid ${isActive ? '#bbf7d0' : '#e2e8f0'}`,
            padding: 14,
            background: isActive ? '#f0fdf4' : '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16
        }}>
            <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: '#fdf2f8',
                color: '#db2777',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: 20
            }}>
                <QrcodeOutlined />
            </div>
            <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong style={{ fontSize: 16, color: '#0f172a' }} ellipsis>
                        {accountName || 'ชื่อบัญชีพร้อมเพย์'}
                    </Text>
                    {isActive && <CheckCircleFilled style={{ color: '#16a34a', fontSize: 14 }} />}
                </div>
                <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                    {accountNumber || 'เลขพร้อมเพย์'}
                </Text>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>พร้อมเพย์ (PromptPay)</Text>
            </div>
        </div>

        <Alert
            type={isActive ? 'success' : 'info'}
            showIcon
            message={isActive ? 'บัญชีนี้จะเป็นบัญชีหลักสำหรับรับเงิน' : 'บัญชีนี้ยังไม่ถูกตั้งเป็นบัญชีหลัก'}
        />
    </div>
);

export default function PaymentAccountManagementPage({ params }: { params: { mode?: string[] } }) {
    const router = useRouter();
    const { socket } = useSocket();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const { isAuthorized, isChecking } = useRoleGuard();

    const [form] = Form.useForm<PaymentAccountFormValues>();
    const [accounts, setAccounts] = useState<ShopPaymentAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [fetchedOnce, setFetchedOnce] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activatingId, setActivatingId] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [initializedEditId, setInitializedEditId] = useState<string | null>(null);

    const modeSegment = params.mode?.[0];
    const routeMode: PaymentAccountRouteMode | null = modeSegment === 'manage' || modeSegment === 'add' || modeSegment === 'edit'
        ? modeSegment
        : null;
    const editId = params.mode?.[1] ?? null;
    const isValidRoute = routeMode !== null && (routeMode !== 'edit' || Boolean(editId));
    const isManage = routeMode === 'manage';
    const isAdd = routeMode === 'add';
    const isEdit = routeMode === 'edit' && Boolean(editId);

    const watchedAccountName = Form.useWatch('account_name', form) ?? '';
    const watchedAccountNumber = Form.useWatch('account_number', form) ?? '';
    const watchedIsActive = Form.useWatch('is_active', form) ?? false;

    const fetchAccounts = useCallback(async (silent = false) => {
        try {
            if (silent) setRefreshing(true);
            else setLoading(true);

            const data = await paymentAccountService.getByShopId();
            setAccounts(data.filter((item) => item.account_type === 'PromptPay'));
        } catch (error) {
            console.error(error);
            message.error(getFriendlyErrorMessage(error, 'ไม่สามารถโหลดข้อมูลบัญชีพร้อมเพย์ได้'));
        } finally {
            if (silent) setRefreshing(false);
            else setLoading(false);
            setFetchedOnce(true);
        }
    }, []);

    useEffect(() => {
        if (isAuthorized) {
            fetchAccounts();
        }
    }, [isAuthorized, fetchAccounts]);

    useEffect(() => {
        if (!isValidRoute) {
            router.replace('/pos/settings/payment-accounts/manage');
        }
    }, [isValidRoute, router]);

    useRealtimeList(
        socket,
        { create: RealtimeEvents.paymentAccounts.create, update: RealtimeEvents.paymentAccounts.update, delete: RealtimeEvents.paymentAccounts.delete },
        setAccounts,
        (item) => item.id,
        (item) => item.account_type === 'PromptPay'
    );

    useRealtimeRefresh({
        socket,
        events: [
            RealtimeEvents.paymentAccounts.create,
            RealtimeEvents.paymentAccounts.update,
            RealtimeEvents.paymentAccounts.delete,
        ],
        onRefresh: () => fetchAccounts(true),
        intervalMs: 45000,
        enabled: isAuthorized,
    });

    const editingAccount = useMemo(
        () => (isEdit && editId ? accounts.find((item) => item.id === editId) ?? null : null),
        [accounts, editId, isEdit]
    );

    const isEditingPrimaryAccount = Boolean(isEdit && editingAccount?.is_active);

    useEffect(() => {
        if (!isAdd) return;
        form.resetFields();
        form.setFieldsValue({
            account_name: '',
            account_number: '',
            phone: '',
            address: '',
            is_active: accounts.length === 0,
        });
        setInitializedEditId(null);
    }, [accounts.length, form, isAdd]);

    useEffect(() => {
        if (!isEdit || !editId || !fetchedOnce) return;

        if (!editingAccount) {
            message.error('ไม่พบบัญชีพร้อมเพย์ที่ต้องการแก้ไข');
            router.replace('/pos/settings/payment-accounts/manage');
            return;
        }

        if (initializedEditId === editId) return;

        form.setFieldsValue({
            account_name: editingAccount.account_name,
            account_number: editingAccount.account_number,
            phone: editingAccount.phone || '',
            address: editingAccount.address || '',
            is_active: editingAccount.is_active,
        });

        setInitializedEditId(editId);
    }, [editId, editingAccount, fetchedOnce, form, initializedEditId, isEdit, router]);

    const stats = useMemo(() => {
        const total = accounts.length;
        const active = accounts.filter((item) => item.is_active).length;
        const inactive = total - active;
        return { total, active, inactive };
    }, [accounts]);

    const filteredAccounts = useMemo(() => {
        let result = accounts;

        if (statusFilter === 'active') {
            result = result.filter((item) => item.is_active);
        } else if (statusFilter === 'inactive') {
            result = result.filter((item) => !item.is_active);
        }

        const keyword = searchText.trim().toLowerCase();
        if (keyword) {
            result = result.filter((item) =>
                item.account_name.toLowerCase().includes(keyword) ||
                item.account_number.toLowerCase().includes(keyword)
            );
        }

        return result;
    }, [accounts, searchText, statusFilter]);

    const handleActivate = async (account: ShopPaymentAccount) => {
        if (account.is_active) return;

        setActivatingId(account.id);
        try {
            const csrfToken = await getCsrfTokenCached();
            await paymentAccountService.activate(account.id, undefined, undefined, csrfToken);
            message.success(`ตั้ง "${account.account_name}" เป็นบัญชีหลักแล้ว`);
            await fetchAccounts(true);
        } catch (error) {
            console.error(error);
            message.error(getFriendlyErrorMessage(error, 'ไม่สามารถตั้งบัญชีหลักได้'));
        } finally {
            setActivatingId(null);
        }
    };

    const handleDelete = (account: ShopPaymentAccount) => {
        Modal.confirm({
            title: 'ยืนยันการลบบัญชีพร้อมเพย์',
            content: account.is_active
                ? 'บัญชีหลักไม่สามารถลบได้ กรุณาเปลี่ยนบัญชีหลักก่อน'
                : `คุณต้องการลบบัญชี "${account.account_name}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            okButtonProps: { disabled: account.is_active },
            onOk: async () => {
                if (account.is_active) {
                    message.warning('ลบบัญชีหลักไม่ได้ กรุณาเปลี่ยนบัญชีหลักก่อน');
                    return;
                }

                try {
                    const csrfToken = await getCsrfTokenCached();
                    await paymentAccountService.delete(account.id, undefined, undefined, csrfToken);
                    message.success(`ลบบัญชี "${account.account_name}" สำเร็จ`);
                    await fetchAccounts(true);

                    if (isEdit) {
                        router.push('/pos/settings/payment-accounts/manage');
                    }
                } catch (error) {
                    console.error(error);
                    message.error(getFriendlyErrorMessage(error, 'ไม่สามารถลบบัญชีพร้อมเพย์ได้'));
                }
            },
        });
    };

    const handleSubmit = async (values: PaymentAccountFormValues) => {
        setSubmitting(true);

        try {
            const normalizedAccountNumber = normalizeDigits(values.account_number || '');
            const normalizedPhone = normalizeDigits(values.phone || '');

            if (normalizedAccountNumber.length !== 10 && normalizedAccountNumber.length !== 13) {
                throw new Error('เลขพร้อมเพย์ต้องมีความยาว 10 หรือ 13 หลัก');
            }

            if (normalizedPhone && normalizedPhone.length !== 10) {
                throw new Error('เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก');
            }

            const duplicatedAccount = accounts.find((item) =>
                normalizeDigits(item.account_number) === normalizedAccountNumber &&
                (!isEdit || item.id !== editId)
            );

            if (duplicatedAccount) {
                throw new Error(`เลขพร้อมเพย์นี้ถูกใช้งานแล้ว โดยบัญชี \"${duplicatedAccount.account_name}\"`);
            }

            const payload: CreatePaymentAccountDto = {
                account_name: values.account_name.trim(),
                account_number: normalizedAccountNumber,
                account_type: 'PromptPay',
                bank_name: undefined,
                phone: normalizedPhone || undefined,
                address: values.address?.trim() || undefined,
                is_active: isEditingPrimaryAccount ? true : Boolean(values.is_active),
            };

            const csrfToken = await getCsrfTokenCached();

            if (isEdit && editId) {
                await paymentAccountService.update(editId, payload, undefined, undefined, csrfToken);
                message.success(`อัปเดตบัญชี "${payload.account_name}" สำเร็จ`);
            } else {
                await paymentAccountService.create(payload, undefined, undefined, csrfToken);
                message.success(`เพิ่มบัญชี "${payload.account_name}" สำเร็จ`);
            }

            router.push('/pos/settings/payment-accounts/manage');
            await fetchAccounts(true);
        } catch (error) {
            console.error(error);
            message.error(getFriendlyErrorMessage(error, 'ไม่สามารถบันทึกข้อมูลได้'));
        } finally {
            setSubmitting(false);
        }
    };

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    if (!isValidRoute) {
        return null;
    }

    const modeTitle = isManage ? 'จัดการบัญชีพร้อมเพย์' : isEdit ? 'แก้ไขบัญชีพร้อมเพย์' : 'เพิ่มบัญชีพร้อมเพย์';
    const modeSubtitle = isManage
        ? 'จัดการรายการพร้อมเพย์ ตั้งบัญชีหลัก และแก้ไขข้อมูล'
        : isEdit
            ? 'ปรับแก้ข้อมูลบัญชีพร้อมเพย์ที่มีอยู่'
            : 'เพิ่มบัญชีพร้อมเพย์ใหม่สำหรับรับชำระใน POS';

    return (
        <div style={pageStyles.container}>
            <UIPageHeader
                title={modeTitle}
                subtitle={modeSubtitle}
                icon={<SettingOutlined />}
                onBack={() => router.push('/pos/settings')}
                actions={
                    isManage ? (
                        <Space size={8} wrap>
                            <Button icon={<ReloadOutlined />} onClick={() => fetchAccounts(false)} loading={loading || refreshing} />
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/pos/settings/payment-accounts/add')}>
                                เพิ่มพร้อมเพย์
                            </Button>
                        </Space>
                    ) : (
                        <Space size={8} wrap>
                            {isEdit && editingAccount ? (
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDelete(editingAccount)}
                                    disabled={editingAccount.is_active}
                                >
                                    ลบ
                                </Button>
                            ) : null}
                            <Button onClick={() => router.push('/pos/settings/payment-accounts/manage')}>
                                กลับหน้ารายการ
                            </Button>
                        </Space>
                    )
                }
            />

            <PageContainer maxWidth={1100}>
                {isManage ? (
                    <PageStack>
                        <PageSection title="ภาพรวมบัญชีพร้อมเพย์">
                            {loading ? (
                                <SectionLoadingSkeleton compact={isMobile} rows={2} />
                            ) : (
                                <StatsCard total={stats.total} active={stats.active} inactive={stats.inactive} />
                            )}
                        </PageSection>

                        <PageSection title="ค้นหาและตัวกรอง">
                            {loading ? (
                                <SectionLoadingSkeleton compact={isMobile} rows={3} />
                            ) : (
                                <div style={{ display: 'grid', gap: isMobile ? 8 : 10 }}>
                                    <Input
                                        size={isMobile ? 'middle' : 'large'}
                                        prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                                        allowClear
                                        placeholder="ค้นหาจากชื่อบัญชี หรือเลขพร้อมเพย์..."
                                        value={searchText}
                                        onChange={(event) => setSearchText(event.target.value)}
                                    />
                                    <Segmented<StatusFilter>
                                        options={[
                                            { label: `ทั้งหมด (${accounts.length})`, value: 'all' },
                                            { label: `บัญชีหลัก (${stats.active})`, value: 'active' },
                                            { label: `ไม่ใช้งาน (${stats.inactive})`, value: 'inactive' }
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
                                                borderRadius: 16,
                                                border: `1px solid ${account.is_active ? '#86efac' : '#e2e8f0'}`,
                                                background: account.is_active ? '#f0fdf4' : '#fff',
                                                padding: isMobile ? 10 : 14,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: 10,
                                                flexWrap: 'wrap'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                                <div style={{
                                                    width: isMobile ? 38 : 44,
                                                    height: isMobile ? 38 : 44,
                                                    borderRadius: 12,
                                                    background: '#fdf2f8',
                                                    color: '#db2777',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: 18
                                                }}>
                                                    <QrcodeOutlined />
                                                </div>

                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                        <Text strong style={{ fontSize: 15 }}>{account.account_name}</Text>
                                                        <Tag color={account.is_active ? 'green' : 'default'} style={{ margin: 0, borderRadius: 6 }}>
                                                            {account.is_active ? 'บัญชีหลัก' : 'พร้อมเพย์'}
                                                        </Tag>
                                                    </div>
                                                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{account.account_number}</Text>
                                                </div>
                                            </div>

                                            <Space size={8} wrap>
                                                {!account.is_active ? (
                                                    <Button
                                                        type="primary"
                                                        icon={<SwapOutlined />}
                                                        loading={activatingId === account.id}
                                                        onClick={() => handleActivate(account)}
                                                    >
                                                        ตั้งเป็นบัญชีหลัก
                                                    </Button>
                                                ) : null}
                                                <Button icon={<EditOutlined />} onClick={() => router.push(`/pos/settings/payment-accounts/edit/${account.id}`)}>
                                                    แก้ไข
                                                </Button>
                                                <Button
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => handleDelete(account)}
                                                    disabled={account.is_active}
                                                >
                                                    ลบ
                                                </Button>
                                            </Space>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <UIEmptyState
                                    title={searchText.trim() ? 'ไม่พบบัญชีตามคำค้น' : 'ยังไม่มีบัญชีพร้อมเพย์'}
                                    description={
                                        searchText.trim()
                                            ? 'ลองเปลี่ยนคำค้นหาหรือฟิลเตอร์'
                                            : 'เพิ่มบัญชีแรกเพื่อเริ่มรับชำระเงินผ่านระบบ POS'
                                    }
                                    action={
                                        !searchText.trim() ? (
                                            <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/pos/settings/payment-accounts/add')}>
                                                เพิ่มบัญชีแรก
                                            </Button>
                                        ) : null
                                    }
                                />
                            )}
                        </PageSection>
                    </PageStack>
                ) : (
                    <PageSection style={{ background: 'transparent', border: 'none' }}>
                        {loading && isEdit ? (
                            <Row gutter={[20, 20]}>
                                <Col xs={24} lg={15}><SectionLoadingSkeleton compact={isMobile} rows={7} /></Col>
                                <Col xs={24} lg={9}><SectionLoadingSkeleton compact={isMobile} rows={4} /></Col>
                            </Row>
                        ) : (
                            <Row gutter={[20, 20]}>
                                <Col xs={24} lg={15}>
                                    <Card
                                        bordered={false}
                                        style={{
                                            borderRadius: 20,
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                            overflow: 'hidden'
                                        }}
                                        styles={{ body: { padding: isMobile ? 14 : 24 } }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                            <SettingOutlined style={{ fontSize: 20, color: '#db2777' }} />
                                            <Title level={5} style={{ margin: 0 }}>ข้อมูลบัญชีพร้อมเพย์</Title>
                                        </div>

                                        <Form<PaymentAccountFormValues>
                                            form={form}
                                            layout="vertical"
                                            onFinish={handleSubmit}
                                            requiredMark={false}
                                            autoComplete="off"
                                            initialValues={{ is_active: false }}
                                        >
                                            <Alert
                                                showIcon
                                                type="info"
                                                icon={<InfoCircleOutlined />}
                                                message="รองรับเฉพาะพร้อมเพย์"
                                                description="หน้าจอนี้รองรับการเพิ่ม/แก้ไขบัญชีพร้อมเพย์เท่านั้น"
                                                style={{ marginBottom: 16 }}
                                            />

                                            <Form.Item
                                                name="account_name"
                                                label={<span style={{ fontWeight: 600, color: '#334155' }}>ชื่อบัญชี</span>}
                                                rules={[
                                                    { required: true, message: 'กรุณากรอกชื่อบัญชี' },
                                                    { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' }
                                                ]}
                                            >
                                                <Input
                                                    size={isMobile ? 'middle' : 'large'}
                                                    placeholder="เช่น ร้านกาแฟสาขาหลัก"
                                                    style={{ borderRadius: 12, height: 46, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                                    maxLength={100}
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                name="account_number"
                                                label={<span style={{ fontWeight: 600, color: '#334155' }}>เลขพร้อมเพย์</span>}
                                                validateTrigger={['onBlur', 'onSubmit']}
                                                rules={[
                                                    { required: true, message: 'กรุณากรอกเลขพร้อมเพย์' },
                                                    {
                                                        validator: async (_, value: string) => {
                                                            const normalized = normalizeDigits(value || '');
                                                            if (!normalized) return;

                                                            if (normalized.length !== 10 && normalized.length !== 13) {
                                                                throw new Error('เลขพร้อมเพย์ต้องมีความยาว 10 หรือ 13 หลัก');
                                                            }

                                                            const duplicated = accounts.some((item) =>
                                                                normalizeDigits(item.account_number) === normalized &&
                                                                (!isEdit || item.id !== editId)
                                                            );

                                                            if (duplicated) {
                                                                throw new Error('เลขพร้อมเพย์นี้ถูกใช้งานแล้ว');
                                                            }
                                                        }
                                                    }
                                                ]}
                                            >
                                                <Input
                                                    size={isMobile ? 'middle' : 'large'}
                                                    placeholder="08xxxxxxxx หรือเลข 13 หลัก"
                                                    style={{ borderRadius: 12, height: 46, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                                    maxLength={13}
                                                    onChange={(event) => {
                                                        form.setFieldValue('account_number', normalizeDigits(event.target.value).slice(0, 13));
                                                    }}
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                name="phone"
                                                label={<span style={{ fontWeight: 600, color: '#334155' }}>เบอร์โทรติดต่อ (ไม่บังคับ)</span>}
                                                rules={[
                                                    {
                                                        validator: async (_, value: string) => {
                                                            if (!value) return;
                                                            const normalized = normalizeDigits(value);
                                                            if (normalized.length !== 10) {
                                                                throw new Error('เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก');
                                                            }
                                                        }
                                                    }
                                                ]}
                                            >
                                                <Input
                                                    size={isMobile ? 'middle' : 'large'}
                                                    placeholder="08xxxxxxxx"
                                                    style={{ borderRadius: 12, height: 46, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                                    maxLength={10}
                                                    onChange={(event) => {
                                                        form.setFieldValue('phone', normalizeDigits(event.target.value).slice(0, 10));
                                                    }}
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                name="address"
                                                label={<span style={{ fontWeight: 600, color: '#334155' }}>ที่อยู่/หมายเหตุ (ไม่บังคับ)</span>}
                                                rules={[{ max: 255, message: 'ความยาวต้องไม่เกิน 255 ตัวอักษร' }]}
                                            >
                                                <TextArea
                                                    rows={3}
                                                    placeholder="เช่น ใช้สำหรับหน้าร้านชั้น 1"
                                                    maxLength={255}
                                                    style={{ borderRadius: 12, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                                />
                                            </Form.Item>

                                            <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 14, marginTop: 16, marginBottom: 18 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                                    <div>
                                                        <Text strong style={{ fontSize: 15, display: 'block' }}>ตั้งเป็นบัญชีหลัก</Text>
                                                        <Text type="secondary" style={{ fontSize: 13 }}>เปิดเพื่อใช้บัญชีนี้เป็นบัญชีหลักรับชำระเงิน</Text>
                                                    </div>
                                                    <Form.Item name="is_active" valuePropName="checked" noStyle>
                                                        <Switch disabled={isEditingPrimaryAccount} style={{ background: watchedIsActive ? '#10B981' : undefined }} />
                                                    </Form.Item>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                                                <Button
                                                    size={isMobile ? 'middle' : 'large'}
                                                    onClick={() => router.push('/pos/settings/payment-accounts/manage')}
                                                    style={{ flex: 1, borderRadius: 12, height: 46, fontWeight: 600 }}
                                                >
                                                    ยกเลิก
                                                </Button>
                                                <Button
                                                    type="primary"
                                                    htmlType="submit"
                                                    loading={submitting}
                                                    icon={<SaveOutlined />}
                                                    size={isMobile ? 'middle' : 'large'}
                                                    style={{
                                                        flex: 2,
                                                        borderRadius: 12,
                                                        height: 46,
                                                        fontWeight: 600,
                                                        background: '#db2777',
                                                        boxShadow: '0 4px 12px rgba(219, 39, 119, 0.25)'
                                                    }}
                                                >
                                                    บันทึกข้อมูล
                                                </Button>
                                            </div>
                                        </Form>
                                    </Card>
                                </Col>

                                <Col xs={24} lg={9}>
                                    <div style={{ display: 'grid', gap: 14 }}>
                                        <PaymentAccountPreviewCard
                                            accountName={watchedAccountName}
                                            accountNumber={watchedAccountNumber}
                                            isActive={watchedIsActive}
                                        />

                                        {isEdit && editingAccount ? (
                                            <Card style={{ borderRadius: 16 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                                    <ExclamationCircleOutlined style={{ color: '#0369a1' }} />
                                                    <Text strong>รายละเอียดรายการ</Text>
                                                </div>
                                                <div style={{ display: 'grid', gap: 8 }}>
                                                    <Text type="secondary">ID: {editingAccount.id}</Text>
                                                    <Text type="secondary">สร้างเมื่อ: {formatDate(editingAccount.created_at)}</Text>
                                                    <Text type="secondary">อัปเดตเมื่อ: {formatDate(editingAccount.updated_at)}</Text>
                                                    <Text type="secondary">สถานะ: {editingAccount.is_active ? 'บัญชีหลัก' : 'ยังไม่ใช้งาน'}</Text>
                                                </div>
                                            </Card>
                                        ) : null}
                                    </div>
                                </Col>
                            </Row>
                        )}
                    </PageSection>
                )}
            </PageContainer>
        </div>
    );
}
