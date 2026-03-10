
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Typography,
    Button,
    Input,
    Space,
    Tag,
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
import { useAuth } from '../../../../../../contexts/AuthContext';
import { useEffectivePermissions } from '../../../../../../hooks/useEffectivePermissions';
import { useSocket } from '../../../../../../hooks/useSocket';
import { useRealtimeRefresh } from '../../../../../../utils/pos/realtime';
import { RealtimeEvents } from '../../../../../../utils/realtimeEvents';
import PageContainer from '../../../../../../components/ui/page/PageContainer';
import PageSection from '../../../../../../components/ui/page/PageSection';
import PageStack from '../../../../../../components/ui/page/PageStack';
import UIPageHeader from '../../../../../../components/ui/page/PageHeader';
import UIEmptyState from '../../../../../../components/ui/states/EmptyState';
import ListPagination from '../../../../../../components/ui/pagination/ListPagination';
import { ModalSelector } from "../../../../../../components/ui/select/ModalSelector";
import { SearchInput } from "../../../../../../components/ui/input/SearchInput";
import { SearchBar } from "../../../../../../components/ui/page/SearchBar";
import { useListState } from '../../../../../../hooks/pos/useListState';

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
                    {accountNumber || 'เลขพร้อมเพย์ (PromptPay)'}
                </Text>
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
    const { socket, isConnected } = useSocket();
    const { user } = useAuth();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const { isAuthorized, isChecking } = useRoleGuard();
    const { can } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canCreateAccounts = can('payment_accounts.page', 'create');
    const canUpdateAccounts = can('payment_accounts.page', 'update');
    const canDeleteAccounts = can('payment_accounts.page', 'delete');

    const [form] = Form.useForm<PaymentAccountFormValues>();
    const [submitting, setSubmitting] = useState(false);
    const [activatingId, setActivatingId] = useState<string | null>(null);
    const [initializedEditId, setInitializedEditId] = useState<string | null>(null);

    const {
        page, setPage,
        pageSize, setPageSize,
        total, setTotal,
        searchText, setSearchText,
        debouncedSearch,
        filters, updateFilter,
        getQueryParams,
        isUrlReady
    } = useListState({
        defaultPageSize: 10,
        defaultFilters: {
            status: 'all' as StatusFilter,
        }
    });

    const statusFilter = filters.status;
    const setStatusFilter = (val: StatusFilter) => updateFilter('status', val);

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

    // URL sync and state management are now handled by useListState
    const accountsListQuery = useQuery<{ data: ShopPaymentAccount[]; total: number; page: number; last_page: number }>({
        queryKey: ['paymentAccounts', 'manage', page, pageSize, debouncedSearch, statusFilter],
        queryFn: async () => {
            const result = await paymentAccountService.getByShopId(undefined, undefined, getQueryParams());
            return {
                ...result,
                data: result.data.filter((item) => item.account_type === 'PromptPay'),
            };
        },
        enabled: isAuthorized && isUrlReady && isManage,
        placeholderData: (previous) => previous,
        staleTime: 20_000,
        refetchOnWindowFocus: false,
    });

    const accountsCatalogQuery = useQuery<{ data: ShopPaymentAccount[]; total: number; page: number; last_page: number }>({
        queryKey: ['paymentAccounts', 'catalog'],
        queryFn: () =>
            paymentAccountService.getByShopId(
                undefined,
                undefined,
                new URLSearchParams({
                    page: '1',
                    limit: '200',
                    sort_created: 'new',
                })
            ),
        enabled: isAuthorized && isUrlReady && (isAdd || isEdit),
        staleTime: 20_000,
        refetchOnWindowFocus: false,
    });

    const editAccountQuery = useQuery<ShopPaymentAccount>({
        queryKey: ['paymentAccounts', 'single', editId],
        queryFn: () => paymentAccountService.getOne(editId!),
        enabled: isAuthorized && isUrlReady && isEdit,
        staleTime: 20_000,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (!isValidRoute) {
            router.replace('/pos/settings/payment-accounts/manage');
        }
    }, [isValidRoute, router]);

    useRealtimeRefresh({
        socket,
        events: [
            RealtimeEvents.paymentAccounts.create,
            RealtimeEvents.paymentAccounts.update,
            RealtimeEvents.paymentAccounts.delete,
        ],
        onRefresh: () => {
            if (isManage) {
                void accountsListQuery.refetch();
                return;
            }

            void accountsCatalogQuery.refetch();
            if (isEdit && editId) {
                void editAccountQuery.refetch();
            }
        },
        intervalMs: isConnected ? undefined : 45000,
        debounceMs: 500,
        enabled: isAuthorized && isUrlReady,
    });

    const editingAccount = useMemo(
        () => (isEdit ? editAccountQuery.data ?? null : null),
        [editAccountQuery.data, isEdit]
    );

    const isEditingPrimaryAccount = Boolean(isEdit && editingAccount?.is_active);

    const manageAccounts = accountsListQuery.data?.data || [];
    const catalogAccounts = accountsCatalogQuery.data?.data || [];
    const isManageLoading = accountsListQuery.isLoading;
    const isFormLoading = isEdit ? editAccountQuery.isLoading : accountsCatalogQuery.isLoading;

    useEffect(() => {
        if (accountsListQuery.data?.total !== undefined) {
            setTotal(accountsListQuery.data.total);
        }
    }, [accountsListQuery.data, setTotal]);

    useEffect(() => {
        if (!isManage) return;
        const lastPage = accountsListQuery.data?.last_page;
        if (!lastPage) return;
        if (page > 1 && manageAccounts.length === 0 && lastPage < page) {
            setPage(lastPage);
        }
    }, [accountsListQuery.data?.last_page, isManage, manageAccounts.length, page, setPage]);

    useEffect(() => {
        const error = accountsListQuery.error || accountsCatalogQuery.error || editAccountQuery.error;
        if (!error) return;
        console.error(error);
        message.error(getFriendlyErrorMessage(error, 'ไม่สามารถโหลดข้อมูลบัญชีพร้อมเพย์ได้'));
    }, [
        accountsCatalogQuery.error,
        accountsCatalogQuery.errorUpdatedAt,
        accountsListQuery.error,
        accountsListQuery.errorUpdatedAt,
        editAccountQuery.error,
        editAccountQuery.errorUpdatedAt,
    ]);

    useEffect(() => {
        if (!isAdd) return;
        form.resetFields();
        form.setFieldsValue({
            account_name: '',
            account_number: '',
            phone: '',
            address: '',
            is_active: (accountsCatalogQuery.data?.total || 0) === 0,
        });
        setInitializedEditId(null);
    }, [accountsCatalogQuery.data?.total, form, isAdd]);

    useEffect(() => {
        if (!isEdit || !editId) return;

        if (!editingAccount) {
            if (editAccountQuery.isLoading) return;
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
    }, [editAccountQuery.isLoading, editId, editingAccount, form, initializedEditId, isEdit, router]);


    const handleActivate = async (account: ShopPaymentAccount) => {
        if (account.is_active) return;
        if (!canUpdateAccounts) {
            message.error('คุณไม่มีสิทธิ์ตั้งบัญชีหลัก (ต้องมีสิทธิ์ payment_accounts.page:update)');
            return;
        }

        setActivatingId(account.id);
        try {
            const csrfToken = await getCsrfTokenCached();
            await paymentAccountService.activate(account.id, undefined, undefined, csrfToken);
            message.success(`ตั้ง "${account.account_name}" เป็นบัญชีหลักแล้ว`);
            if (!isConnected) {
                const refetches = [];
                if (isManage) {
                    refetches.push(accountsListQuery.refetch());
                } else {
                    refetches.push(accountsCatalogQuery.refetch());
                }
                if (isEdit && editId) {
                    refetches.push(editAccountQuery.refetch());
                }
                await Promise.all(refetches);
            }
        } catch (error) {
            console.error(error);
            message.error(getFriendlyErrorMessage(error, 'ไม่สามารถตั้งบัญชีหลักได้'));
        } finally {
            setActivatingId(null);
        }
    };

    const handleDelete = (account: ShopPaymentAccount) => {
        if (!canDeleteAccounts) {
            message.error('คุณไม่มีสิทธิ์ลบบัญชี (ต้องมีสิทธิ์ payment_accounts.page:delete)');
            return;
        }

        Modal.confirm({
            title: 'ยืนยันการลบบัญชีพร้อมเพย์',
            content: account.is_active
                ? 'บัญชีหลักไม่สามารถลบได้ กรุณาเปลี่ยนบัญชีหลักก่อน'
                : `คุณต้องการลบบัญชี ${account.account_name} หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            icon: <DeleteOutlined style={{ color: '#EF4444' }} />,
            okButtonProps: { disabled: account.is_active || !canDeleteAccounts },
            onOk: async () => {
                if (account.is_active) {
                    message.warning('ลบบัญชีหลักไม่ได้ กรุณาเปลี่ยนบัญชีหลักก่อน');
                    return;
                }

                try {
                    const csrfToken = await getCsrfTokenCached();
                    await paymentAccountService.delete(account.id, undefined, undefined, csrfToken);
                    message.success(`ลบบัญชี "${account.account_name}" สำเร็จ`);
                    if (!isConnected) {
                        const refetches = [];
                        if (isManage) {
                            refetches.push(accountsListQuery.refetch());
                        } else {
                            refetches.push(accountsCatalogQuery.refetch());
                        }
                        await Promise.all(refetches);
                    }

                    if (isEdit) {
                        router.replace('/pos/settings/payment-accounts/manage');
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
            if (isEdit && !canUpdateAccounts) {
                throw new Error('คุณไม่มีสิทธิ์แก้ไขบัญชี (ต้องมีสิทธิ์ payment_accounts.page:update)');
            }
            if (!isEdit && !canCreateAccounts) {
                throw new Error('คุณไม่มีสิทธิ์เพิ่มบัญชี (ต้องมีสิทธิ์ payment_accounts.page:create)');
            }

            const normalizedAccountNumber = normalizeDigits(values.account_number || '');
            const normalizedPhone = normalizeDigits(values.phone || '');

            if (normalizedAccountNumber.length !== 10) {
                throw new Error('เลขพร้อมเพย์ต้องมีความยาว 10 หลัก');
            }

            if (normalizedPhone && normalizedPhone.length !== 10) {
                throw new Error('เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก');
            }

            const duplicatedAccount = catalogAccounts.find((item) =>
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

            if (!isConnected) {
                const refetches = [];
                if (isManage) {
                    refetches.push(accountsListQuery.refetch());
                } else {
                    refetches.push(accountsCatalogQuery.refetch());
                }
                if (isEdit && editId) {
                    refetches.push(editAccountQuery.refetch());
                }
                await Promise.all(refetches);
            }
            router.replace('/pos/settings/payment-accounts/manage');
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
    return (
        <div style={pageStyles.container}>
            <UIPageHeader
                title={modeTitle}
                icon={<SettingOutlined />}
                onBack={() => router.push('/pos/settings')}
                actions={
                    isManage ? (
                        <Space size={10} wrap>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => {
                                    void accountsListQuery.refetch();
                                }}
                                loading={accountsListQuery.isFetching}
                            />
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                disabled={!canCreateAccounts}
                                onClick={() => router.push('/pos/settings/payment-accounts/add')}
                            >
                                เพิ่มบัญชี
                            </Button>
                        </Space>
                    ) : (
                        <Space size={10} wrap>
                            {isEdit && editingAccount ? (
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDelete(editingAccount)}
                                    disabled={editingAccount.is_active || !canDeleteAccounts}
                                >
                                    ลบ
                                </Button>
                            ) : null}
                        </Space>
                    )
                }
            />

            <PageContainer maxWidth={1100}>
                {isManage ? (
                    <PageStack>

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
                                        { label: `ใช้งาน (หลัก)`, value: 'active' },
                                        { label: `ไม่ใช้งาน`, value: 'inactive' }
                                    ]}
                                    value={statusFilter}
                                    onChange={(value) => setStatusFilter(value)}
                                    style={{ minWidth: 120 }}
                                />
                            </Space>
                        </SearchBar>

                        <PageSection title="รายการบัญชีพร้อมเพย์" extra={<span style={{ fontWeight: 600 }}>{total} รายการ</span>}>
                            {isManageLoading ? (
                                <div style={{ display: 'grid', gap: isMobile ? 8 : 10 }}>
                                    {Array.from({ length: 3 }).map((_, index) => (
                                        <Card key={index} size="small" style={{ borderRadius: 12 }}>
                                            <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
                                        </Card>
                                    ))}
                                </div>
                            ) : accountsListQuery.isError ? (
                                <UIEmptyState
                                    title="โหลดข้อมูลบัญชีพร้อมเพย์ไม่สำเร็จ"
                                    description="กดรีเฟรชเพื่อโหลดข้อมูลอีกครั้ง"
                                />
                            ) : manageAccounts.length > 0 ? (
                                <div style={{ display: 'grid', gap: isMobile ? 8 : 10 }}>
                                    {manageAccounts.map((account) => (
                                        <div
                                            key={account.id}
                                            style={{
                                                borderRadius: 16,
                                                border: `1px solid ${account.is_active ? '#86efac' : '#e2e8f0'}`,
                                                background: account.is_active ? '#f0fdf4' : '#fff',
                                                padding: isMobile ? '10px 12px' : '12px 16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: 12,
                                                flexWrap: isMobile ? 'wrap' : 'nowrap'
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

                                            <Space size={8} style={{ marginLeft: 'auto' }}>
                                                {!account.is_active ? (
                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        icon={<SwapOutlined />}
                                                        loading={activatingId === account.id}
                                                        disabled={!canUpdateAccounts}
                                                        onClick={() => handleActivate(account)}
                                                        style={{ borderRadius: 10, height: 36, fontSize: 13 }}
                                                    >
                                                        ตั้งเป็นบัญชีหลัก
                                                    </Button>
                                                ) : null}
                                                <Button
                                                    type="text"
                                                    icon={<EditOutlined />}
                                                    disabled={!canUpdateAccounts}
                                                    onClick={() => router.push(`/pos/settings/payment-accounts/edit/${account.id}`)}
                                                    style={{
                                                        borderRadius: 10,
                                                        color: '#0369a1',
                                                        background: '#e0f2fe',
                                                        width: 36,
                                                        height: 36,
                                                        padding: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                />
                                                <Button
                                                    type="text"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => handleDelete(account)}
                                                    disabled={account.is_active || !canDeleteAccounts}
                                                    style={{
                                                        borderRadius: 10,
                                                        background: '#fef2f2',
                                                        width: 36,
                                                        height: 36,
                                                        padding: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                />
                                            </Space>
                                        </div>
                                    ))}

                                    <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
                                        <ListPagination
                                            page={page}
                                            total={total}
                                            pageSize={pageSize}
                                            onPageChange={setPage}
                                            onPageSizeChange={setPageSize}
                                            activeColor="#7C3AED"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <UIEmptyState
                                    title={debouncedSearch.trim() ? 'ไม่พบบัญชีตามคำค้น' : 'ยังไม่มีบัญชีพร้อมเพย์'}
                                    description={
                                        debouncedSearch.trim()
                                            ? 'ลองเปลี่ยนคำค้นหาหรือฟิลเตอร์'
                                            : 'เพิ่มบัญชีแรกเพื่อเริ่มรับชำระเงินผ่านระบบ POS'
                                    }
                                />
                            )}
                        </PageSection>
                    </PageStack>
                ) : (
                    <PageSection style={{ background: 'transparent', border: 'none' }}>
                        {isFormLoading ? (
                            <Row gutter={[20, 20]}>
                                <Col xs={24} lg={15}><SectionLoadingSkeleton compact={isMobile} rows={7} /></Col>
                                <Col xs={24} lg={9}><SectionLoadingSkeleton compact={isMobile} rows={4} /></Col>
                            </Row>
                        ) : isEdit && editAccountQuery.isError ? (
                            <UIEmptyState
                                title="โหลดข้อมูลบัญชีพร้อมเพย์ไม่สำเร็จ"
                                description="กดรีเฟรชแล้วลองเปิดรายการอีกครั้ง"
                            />
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
                                                style={{ marginBottom: 16 }}
                                            />

                                            <Form.Item
                                                name="account_name"
                                                label={<span style={{ fontWeight: 600, color: '#334155' }}>ชื่อบัญชี <span style={{ color: '#ff4d4f' }}>*</span></span>}
                                                rules={[
                                                    { required: true, message: 'กรุณากรอกชื่อบัญชี' },
                                                    { max: 100, message: 'ความยาวต้องไม่เกิน 100 ตัวอักษร' }
                                                ]}
                                            >
                                                <Input
                                                    size={isMobile ? 'middle' : 'large'}
                                                    placeholder=""
                                                    style={{ borderRadius: 12, height: 46, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                                    maxLength={100}
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                name="account_number"
                                                label={<span style={{ fontWeight: 600, color: '#334155' }}>เลขพร้อมเพย์ <span style={{ color: '#ff4d4f' }}>*</span></span>}
                                                validateTrigger={['onBlur', 'onSubmit']}
                                                rules={[
                                                    { required: true, message: 'กรุณากรอกเลขพร้อมเพย์' },
                                                    {
                                                        validator: async (_, value: string) => {
                                                            const normalized = normalizeDigits(value || '');
                                                            if (!normalized) return;

                                                            if (normalized.length !== 10) {
                                                                throw new Error('เลขพร้อมเพย์ต้องมีความยาว 10 หลัก');
                                                            }

                                                            const duplicated = catalogAccounts.some((item) =>
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
                                                    placeholder=""
                                                    style={{ borderRadius: 12, height: 46, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                                                    maxLength={10}
                                                    onChange={(event) => {
                                                        form.setFieldValue('account_number', normalizeDigits(event.target.value).slice(0, 10));
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
                                                    placeholder=""
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
                                                    placeholder=""
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
                                                    disabled={(isEdit && !canUpdateAccounts) || (!isEdit && !canCreateAccounts)}
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
