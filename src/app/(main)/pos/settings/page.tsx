'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Space, Tag, message, Grid, Skeleton } from 'antd';
import {
    SettingOutlined,
    CheckCircleOutlined,
    QrcodeOutlined,
    ReloadOutlined,
    EditOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { paymentAccountService } from '../../../../services/pos/paymentAccount.service';
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

function SectionLoadingSkeleton({ compact = false }: { compact?: boolean }) {
    return (
        <div style={{ display: 'grid', gap: compact ? 8 : 12 }}>
            <Skeleton.Input active block style={{ height: compact ? 30 : 36 }} />
            <Skeleton.Input active block style={{ height: compact ? 30 : 36 }} />
            <Skeleton.Button active block style={{ height: compact ? 40 : 44 }} />
        </div>
    );
}

const formatPromptPay = (num: string) => {
    const cleaned = num.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 13) {
        return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10, 12)}-${cleaned.slice(12)}`;
    }
    return num;
};

export default function POSSettingsPage() {
    const router = useRouter();
    const { socket, isConnected } = useSocket();
    const { user } = useAuth();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const { isAuthorized, isChecking } = useRoleGuard();
    const { can } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canUpdateAccounts = can('payment_accounts.page', 'update');

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [accounts, setAccounts] = useState<ShopPaymentAccount[]>([]);


    const fetchAccounts = useCallback(async (silent = false) => {
        try {
            if (silent) setRefreshing(true);
            else setLoading(true);

            const response = await paymentAccountService.getByShopId();
            setAccounts(response.data);
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
        intervalMs: isConnected ? undefined : 30000,
    });

    const promptPayAccounts = useMemo(
        () => accounts.filter((item) => item.account_type === 'PromptPay'),
        [accounts]
    );

    const activeAccount = useMemo(
        () => promptPayAccounts.find((acc) => acc.is_active) || null,
        [promptPayAccounts]
    );



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
                icon={<SettingOutlined />}
                onBack={() => router.back()}
                actions={
                    <Space size={10} wrap>
                        <Button icon={<ReloadOutlined />} onClick={() => fetchAccounts(false)} loading={refreshing || loading} />
                        <Button
                            icon={<EditOutlined />}
                            disabled={!canUpdateAccounts}
                            onClick={() => router.push('/pos/settings/payment-accounts/manage')}
                        >
                            จัดการ
                        </Button>
                    </Space>
                }
            />

            <PageContainer maxWidth={1040}>
                <PageStack>

                    <PageSection title="บัญชีหลักปัจจุบัน">
                        {loading ? (
                            <SectionLoadingSkeleton compact={isMobile} />
                        ) : activeAccount ? (
                            <div style={{
                                position: 'relative',
                                overflow: 'hidden',
                                borderRadius: '4px 16px 16px 4px', // Passbook spine feel
                                background: '#f8fafc', // Paper-like background
                                padding: isMobile ? '24px 20px' : '32px 40px',
                                color: '#1e293b',
                                boxShadow: 'inset 4px 0 8px rgba(0,0,0,0.05), 0 8px 16px -4px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                                maxWidth: 480,
                                borderLeft: '12px solid #0369a1', // Spine color (Navy/Blue)
                                borderTop: '1px solid #e2e8f0',
                                borderRight: '1px solid #e2e8f0',
                                borderBottom: '1px solid #e2e8f0',
                            }}>
                                {/* Passbook page fold texture */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    bottom: 0,
                                    left: 12,
                                    width: 20,
                                    background: 'linear-gradient(to right, rgba(0,0,0,0.04) 0%, rgba(255,255,255,0.8) 20%, rgba(0,0,0,0.02) 100%)',
                                    zIndex: 0
                                }} />

                                {/* Bank Logo / Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'relative', zIndex: 1, borderBottom: '2px dotted #cbd5e1', paddingBottom: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 48,
                                            height: 32,
                                            borderRadius: 6,
                                            background: '#0284c7', // Promptpay/Bank Primary Color
                                            color: '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}>
                                            <QrcodeOutlined style={{ fontSize: 18 }} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.5, color: '#0f172a', lineHeight: 1.2 }}>
                                                บัญชีพร้อมเพย์
                                            </span>
                                        </div>
                                    </div>
                                    <Tag color="cyan" style={{ border: '1px solid #bae6fd', background: '#e0f2fe', color: '#0369a1', margin: 0, borderRadius: 12, padding: '2px 10px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <CheckCircleOutlined style={{ fontSize: 12 }} /> บัญชีหลัก
                                    </Tag>
                                </div>

                                {/* Account Details Printed on Paper */}
                                <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 16, paddingTop: 12 }}>
                                    
                                    {/* Branch / Type (Mock data for passbook feel) */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', fontWeight: 500 }}>
                                        <span>ประเภทบัญชี: พร้อมเพย์</span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 12 }}>
                                        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>ชื่อบัญชี ACCOUNT NAME</div>
                                        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.5, color: '#0f172a', fontFamily: 'serif' }}>
                                            {activeAccount.account_name}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 12 }}>
                                        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>เลขที่พร้อมเพย์ PROMPTPAY NO.</div>
                                        <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, letterSpacing: 4, fontFamily: 'monospace', color: '#0f172a', background: 'rgba(241,245,249,0.5)', padding: '4px 12px', borderRadius: 6, display: 'inline-block', width: 'fit-content', border: '1px dashed #cbd5e1' }}>
                                            {formatPromptPay(activeAccount.account_number)}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Watermark */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: -20,
                                    right: -20,
                                    opacity: 0.03,
                                    fontSize: 160,
                                    pointerEvents: 'none',
                                    zIndex: 0
                                }}>
                                    <QrcodeOutlined />
                                </div>
                            </div>
                        ) : (
                            <UIEmptyState
                                title="ยังไม่มีบัญชีพร้อมเพย์หลัก"
                                description="เพิ่มบัญชีพร้อมเพย์แรกเพื่อเริ่มใช้งานการรับชำระ"
                            />
                        )}
                    </PageSection>

                </PageStack>
            </PageContainer>
        </div>
    );
}
