'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Alert,
    Button,
    Card,
    Col,
    Descriptions,
    Form,
    Grid,
    Input,
    Modal,
    Row,
    Skeleton,
    Space,
    Tag,
    Typography,
    message,
} from 'antd';
import {
    CheckCircleOutlined,
    EditOutlined,
    PhoneOutlined,
    QrcodeOutlined,
    ReloadOutlined,
    SaveOutlined,
    SettingOutlined,
    ShopOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { paymentAccountService } from '../../../../services/pos/paymentAccount.service';
import { shopProfileService } from '../../../../services/pos/shopProfile.service';
import { ShopPaymentAccount } from '../../../../types/api/pos/shopPaymentAccount';
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
import { SETTINGS_CAPABILITIES, SETTINGS_ROLE_BLUEPRINT } from '../../../../lib/rbac/settings-capabilities';
import { getCsrfTokenCached } from '../../../../utils/pos/csrf';

const { Title, Text } = Typography;
const { TextArea } = Input;

type ServiceError = Error & { status?: number; code?: string };
type ProfileFormValues = {
    shop_name: string;
    address?: string;
    phone?: string;
};

const getFriendlyErrorMessage = (error: unknown, fallback: string) => {
    const err = error as ServiceError | undefined;
    if (err?.status === 403) return 'สิทธิ์ไม่เพียงพอสำหรับการตั้งค่าส่วนนี้';
    if (err?.status === 404) return 'ไม่พบข้อมูลที่ต้องการ';
    return err?.message || fallback;
};

const normalizeDigits = (value: string) => value.replace(/\D/g, '');

const formatPromptPay = (num?: string | null) => {
    const cleaned = String(num || '').replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return cleaned || '-';
};

const formatDate = (raw?: string | null) => {
    if (!raw) return '-';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

function SectionLoadingSkeleton() {
    return (
        <div style={{ display: 'grid', gap: 12 }}>
            <Skeleton.Input active block style={{ height: 36 }} />
            <Skeleton.Input active block style={{ height: 36 }} />
            <Skeleton.Input active block style={{ height: 36 }} />
        </div>
    );
}

export default function POSSettingsPage() {
    const router = useRouter();
    const { socket, isConnected } = useSocket();
    const { user } = useAuth();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const { isAuthorized, isChecking } = useRoleGuard({
        requiredPermission: { resourceKey: 'pos_settings.page', action: 'view' },
    });
    const { can } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const [editProfileOpen, setEditProfileOpen] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileForm] = Form.useForm<ProfileFormValues>();

    const currentRoleName = String(user?.role || '').trim().toLowerCase();
    const selectedRoleBlueprint = useMemo(
        () => SETTINGS_ROLE_BLUEPRINT.find((item) => item.roleName.toLowerCase() === currentRoleName) ?? null,
        [currentRoleName]
    );

    const canViewProfile = can('shop_profile.page', 'view');
    const canEditIdentity = can('shop_profile.identity.feature', 'update');
    const canEditContact = can('shop_profile.contact.feature', 'update');
    const canViewAccounts = can('payment_accounts.page', 'view');
    const canOpenAccountsWorkspace = can('payment_accounts.manager.feature', 'access');
    const canCreateAccount = can('payment_accounts.create.feature', 'create');
    const canEditAccount = can('payment_accounts.edit.feature', 'update');
    const canActivateAccount = can('payment_accounts.activate.feature', 'update');
    const canDeleteAccount = can('payment_accounts.delete.feature', 'delete');
    const canEditProfile = canEditIdentity || canEditContact;

    const profileQuery = useQuery({
        queryKey: ['shopProfile', 'settings-landing'],
        queryFn: () => shopProfileService.getProfile(),
        enabled: isAuthorized && canViewProfile,
        staleTime: 20_000,
        refetchOnWindowFocus: false,
    });

    const accountsQuery = useQuery<{ data: ShopPaymentAccount[]; total: number; page: number; last_page: number }>({
        queryKey: ['paymentAccounts', 'settings-landing'],
        queryFn: async () => {
            const result = await paymentAccountService.getByShopId();
            return {
                ...result,
                data: result.data.filter((item) => item.account_type === 'PromptPay'),
            };
        },
        enabled: isAuthorized && canViewAccounts,
        staleTime: 20_000,
        refetchOnWindowFocus: false,
    });

    useRealtimeRefresh({
        socket,
        events: [
            RealtimeEvents.shopProfile.update,
            RealtimeEvents.paymentAccounts.create,
            RealtimeEvents.paymentAccounts.update,
            RealtimeEvents.paymentAccounts.delete,
        ],
        onRefresh: () => {
            if (canViewProfile) void profileQuery.refetch();
            if (canViewAccounts) void accountsQuery.refetch();
        },
        intervalMs: isConnected ? undefined : 30_000,
        debounceMs: 500,
        enabled: isAuthorized,
    });

    useEffect(() => {
        const error = profileQuery.error || accountsQuery.error;
        if (!error) return;
        message.error(getFriendlyErrorMessage(error, 'ไม่สามารถโหลดข้อมูลการตั้งค่าได้'));
    }, [accountsQuery.error, accountsQuery.errorUpdatedAt, profileQuery.error, profileQuery.errorUpdatedAt]);

    useEffect(() => {
        if (!editProfileOpen || !profileQuery.data) return;
        profileForm.setFieldsValue({
            shop_name: profileQuery.data.shop_name || '',
            address: profileQuery.data.address || '',
            phone: profileQuery.data.phone || '',
        });
    }, [editProfileOpen, profileForm, profileQuery.data]);

    const activeAccount = useMemo(
        () => accountsQuery.data?.data.find((item) => item.is_active) ?? null,
        [accountsQuery.data]
    );
    const profileData = profileQuery.data ?? null;

    const capabilityMatrix = useMemo(
        () =>
            SETTINGS_CAPABILITIES.filter((item) => item.resourceKey !== 'shop_profile.page').map((item) => ({
                ...item,
                enabled: can(item.resourceKey, item.action),
            })),
        [can]
    );

    const enabledCapabilityCount = capabilityMatrix.filter((item) => item.enabled).length;

    const handleOpenProfileEditor = () => {
        if (!canEditProfile) {
            message.error('สิทธิ์ไม่เพียงพอสำหรับการแก้ไขข้อมูลสาขา');
            return;
        }
        setEditProfileOpen(true);
    };

    const handleSaveProfile = async () => {
        try {
            const values = await profileForm.validateFields();
            const payload: Record<string, string | undefined> = {};

            if (canEditIdentity) {
                payload.shop_name = values.shop_name.trim();
            }

            if (canEditContact) {
                payload.address = values.address?.trim() || undefined;
                payload.phone = normalizeDigits(values.phone || '').slice(0, 10) || undefined;
            }

            if (Object.keys(payload).length === 0) {
                message.error('ไม่มีสิทธิ์แก้ไขข้อมูลที่เลือก');
                return;
            }

            setSavingProfile(true);
            const csrfToken = await getCsrfTokenCached();
            await shopProfileService.updateProfile(payload, undefined, csrfToken);
            await profileQuery.refetch();
            setEditProfileOpen(false);
            message.success('บันทึกข้อมูลสาขาสำเร็จ');
        } catch (error) {
            if (error instanceof Error && error.message === 'Validate Error') return;
            message.error(getFriendlyErrorMessage(error, 'ไม่สามารถบันทึกข้อมูลสาขาได้'));
        } finally {
            setSavingProfile(false);
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
                title="POS Settings"
                icon={<SettingOutlined />}
                onBack={() => router.back()}
                actions={
                    <Space size={10} wrap>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => {
                                if (canViewProfile) void profileQuery.refetch();
                                if (canViewAccounts) void accountsQuery.refetch();
                            }}
                            loading={profileQuery.isFetching || accountsQuery.isFetching}
                        />
                        <Button
                            icon={<EditOutlined />}
                            disabled={!canEditProfile}
                            onClick={handleOpenProfileEditor}
                        >
                            แก้ไขข้อมูลสาขา
                        </Button>
                        <Button
                            type="primary"
                            icon={<QrcodeOutlined />}
                            disabled={!canOpenAccountsWorkspace}
                            onClick={() => router.push('/pos/settings/payment-accounts/manage')}
                        >
                            จัดการบัญชีรับเงิน
                        </Button>
                    </Space>
                }
            />

            <PageContainer maxWidth={1120}>
                <PageStack>
                    {selectedRoleBlueprint ? (
                        <Alert
                            type={selectedRoleBlueprint.roleName === 'Employee' ? 'info' : 'success'}
                            showIcon
                            message={selectedRoleBlueprint.title}
                            description={`${selectedRoleBlueprint.summary} | ทำได้: ${selectedRoleBlueprint.allowed.join(', ')}${selectedRoleBlueprint.denied.length > 0 ? ` | จำกัด: ${selectedRoleBlueprint.denied.join(', ')}` : ''}`}
                        />
                    ) : null}

                    <PageSection
                        title="Settings Capability Matrix"
                        extra={<Tag color="blue">{enabledCapabilityCount}/{capabilityMatrix.length} enabled</Tag>}
                    >
                        <Row gutter={[16, 16]}>
                            {capabilityMatrix.map((item) => (
                                <Col xs={24} md={12} xl={8} key={item.resourceKey}>
                                    <Card size="small" style={{ borderRadius: 18, height: '100%' }}>
                                        <Space direction="vertical" size={10} style={{ width: '100%' }}>
                                            <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
                                                <Text strong>{item.title}</Text>
                                                <Tag color={item.enabled ? 'green' : item.securityLevel === 'governance' ? 'red' : 'default'}>
                                                    {item.enabled ? 'Allowed' : 'Restricted'}
                                                </Tag>
                                            </Space>
                                            <Text type="secondary">{item.description}</Text>
                                            <Space wrap>
                                                <Tag>{item.action.toUpperCase()}</Tag>
                                                <Tag color={item.securityLevel === 'governance' ? 'red' : item.securityLevel === 'sensitive' ? 'gold' : 'blue'}>
                                                    {item.securityLevel}
                                                </Tag>
                                            </Space>
                                        </Space>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </PageSection>

                    <PageSection title="Branch Governance Overview">
                        <Row gutter={[16, 16]}>
                            <Col xs={24} lg={12}>
                                <Card style={{ borderRadius: 20, height: '100%' }}>
                                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                        <Space align="center">
                                            <ShopOutlined style={{ color: '#2563eb', fontSize: 20 }} />
                                            <Title level={5} style={{ margin: 0 }}>ข้อมูลสาขา</Title>
                                        </Space>

                                        {profileQuery.isLoading ? (
                                            <SectionLoadingSkeleton />
                                        ) : profileQuery.isError || !canViewProfile || !profileData ? (
                                            <UIEmptyState
                                                title="ไม่สามารถโหลดข้อมูลสาขา"
                                                description={canViewProfile ? 'ลองรีเฟรชหน้าอีกครั้ง' : 'บัญชีนี้ไม่มีสิทธิ์ดูข้อมูลโปรไฟล์สาขา'}
                                            />
                                        ) : (
                                            <>
                                                <Descriptions
                                                    column={1}
                                                    size="small"
                                                    labelStyle={{ width: 130, color: '#64748b' }}
                                                    contentStyle={{ color: '#0f172a', fontWeight: 600 }}
                                                >
                                                    <Descriptions.Item label="ชื่อร้าน">
                                                        {profileData.shop_name || '-'}
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="เบอร์โทร">
                                                        {profileData.phone || '-'}
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="ที่อยู่">
                                                        {profileData.address || '-'}
                                                    </Descriptions.Item>
                                                </Descriptions>

                                                <Alert
                                                    type="info"
                                                    showIcon
                                                    message="Branch identity governance"
                                                    description={
                                                        canEditProfile
                                                            ? 'บัญชีนี้สามารถแก้ไขข้อมูลชื่อร้านและข้อมูลติดต่อของสาขาได้'
                                                            : 'บัญชีนี้เปิดดูข้อมูลได้ แต่แก้ไขข้อมูลสาขาไม่ได้'
                                                    }
                                                />
                                            </>
                                        )}
                                    </Space>
                                </Card>
                            </Col>

                            <Col xs={24} lg={12}>
                                <Card style={{ borderRadius: 20, height: '100%' }}>
                                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                        <Space align="center">
                                            <QrcodeOutlined style={{ color: '#db2777', fontSize: 20 }} />
                                            <Title level={5} style={{ margin: 0 }}>บัญชีรับเงินหลัก</Title>
                                        </Space>

                                        {accountsQuery.isLoading ? (
                                            <SectionLoadingSkeleton />
                                        ) : accountsQuery.isError || !canViewAccounts ? (
                                            <UIEmptyState
                                                title="ไม่สามารถโหลดข้อมูลบัญชีรับเงิน"
                                                description={canViewAccounts ? 'ลองรีเฟรชหน้าอีกครั้ง' : 'บัญชีนี้ไม่มีสิทธิ์ดู workspace payment accounts'}
                                            />
                                        ) : activeAccount ? (
                                            <>
                                                <div style={{
                                                    borderRadius: 18,
                                                    border: '1px solid #fbcfe8',
                                                    background: 'linear-gradient(135deg, #fff1f2, #ffffff)',
                                                    padding: isMobile ? 16 : 20,
                                                }}>
                                                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                                                        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                                                            <Text strong>{activeAccount.account_name}</Text>
                                                            <Tag color="green" icon={<CheckCircleOutlined />}>Primary</Tag>
                                                        </Space>
                                                        <Text type="secondary">{formatPromptPay(activeAccount.account_number)}</Text>
                                                        <Space wrap>
                                                            <Tag color="pink">PromptPay</Tag>
                                                            <Tag icon={<PhoneOutlined />}>{activeAccount.phone || '-'}</Tag>
                                                        </Space>
                                                        <Text type="secondary">อัปเดตล่าสุด {formatDate(activeAccount.updated_at)}</Text>
                                                    </Space>
                                                </div>

                                                <Alert
                                                    type="warning"
                                                    showIcon
                                                    message="Payment account governance"
                                                    description={`สร้าง: ${canCreateAccount ? 'ได้' : 'ไม่ได้'} | แก้ไข: ${canEditAccount ? 'ได้' : 'ไม่ได้'} | ตั้งบัญชีหลัก: ${canActivateAccount ? 'ได้' : 'ไม่ได้'} | ลบ: ${canDeleteAccount ? 'ได้' : 'ไม่ได้'}`}
                                                />
                                            </>
                                        ) : (
                                            <UIEmptyState
                                                title="ยังไม่มีบัญชีหลัก"
                                                description="เพิ่มบัญชี PromptPay เพื่อเริ่มรับชำระเงินจากระบบ POS"
                                            />
                                        )}
                                    </Space>
                                </Card>
                            </Col>
                        </Row>
                    </PageSection>

                    <PageSection title="Settings Governance">
                        <Card style={{ borderRadius: 20 }}>
                            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                <Text strong>Scope นี้ถูกออกแบบให้เป็น branch governance</Text>
                                <Text type="secondary">
                                    หน้า settings แยกสิทธิ์ระหว่างการเปิดหน้า, การแก้ไขข้อมูลสาขา, การเปิด workspace บัญชีรับเงิน, การค้นหา/กรอง, การสร้าง, การแก้ไข, การตั้งบัญชีหลัก และการลบ
                                </Text>
                                <Space wrap>
                                    <Tag color={canEditIdentity ? 'green' : 'default'}>Identity</Tag>
                                    <Tag color={canEditContact ? 'green' : 'default'}>Contact</Tag>
                                    <Tag color={canOpenAccountsWorkspace ? 'green' : 'default'}>Payment Workspace</Tag>
                                    <Tag color={canCreateAccount ? 'green' : 'default'}>Create</Tag>
                                    <Tag color={canEditAccount ? 'green' : 'default'}>Edit</Tag>
                                    <Tag color={canActivateAccount ? 'green' : 'default'}>Activate</Tag>
                                    <Tag color={canDeleteAccount ? 'green' : 'red'}>Delete</Tag>
                                </Space>
                            </Space>
                        </Card>
                    </PageSection>
                </PageStack>
            </PageContainer>

            <Modal
                open={editProfileOpen}
                title="แก้ไขข้อมูลสาขา"
                onCancel={() => setEditProfileOpen(false)}
                onOk={handleSaveProfile}
                okText="บันทึกข้อมูล"
                cancelText="ยกเลิก"
                okButtonProps={{ icon: <SaveOutlined />, loading: savingProfile, disabled: !canEditProfile }}
                destroyOnHidden
            >
                <Form<ProfileFormValues>
                    form={profileForm}
                    layout="vertical"
                    requiredMark={false}
                    autoComplete="off"
                >
                    <Form.Item
                        name="shop_name"
                        label="ชื่อร้าน"
                        rules={[
                            { required: true, message: 'กรุณากรอกชื่อร้าน' },
                            { max: 200, message: 'ความยาวต้องไม่เกิน 200 ตัวอักษร' },
                        ]}
                    >
                        <Input disabled={!canEditIdentity} maxLength={200} />
                    </Form.Item>
                    <Form.Item
                        name="phone"
                        label="เบอร์โทร"
                        rules={[
                            {
                                validator: async (_, value: string) => {
                                    const normalized = normalizeDigits(value || '');
                                    if (!normalized) return;
                                    if (normalized.length !== 10) {
                                        throw new Error('เบอร์โทรต้องเป็นตัวเลข 10 หลัก');
                                    }
                                },
                            },
                        ]}
                    >
                        <Input
                            disabled={!canEditContact}
                            maxLength={10}
                            onChange={(event) => {
                                profileForm.setFieldValue('phone', normalizeDigits(event.target.value).slice(0, 10));
                            }}
                        />
                    </Form.Item>
                    <Form.Item
                        name="address"
                        label="ที่อยู่"
                        rules={[{ max: 500, message: 'ความยาวต้องไม่เกิน 500 ตัวอักษร' }]}
                    >
                        <TextArea rows={3} disabled={!canEditContact} maxLength={500} />
                    </Form.Item>
                    {!canEditProfile ? (
                        <Alert
                            type="warning"
                            showIcon
                            message="บัญชีนี้ไม่มีสิทธิ์แก้ไขข้อมูลสาขา"
                        />
                    ) : null}
                </Form>
            </Modal>
        </div>
    );
}
