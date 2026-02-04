'use client';

import React, { useCallback, useEffect, useState } from "react";
import { Typography, Button, Spin, App, Modal } from "antd";
import { SettingOutlined, BankOutlined, CheckCircleOutlined, PlusOutlined, QrcodeOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { paymentAccountService } from "../../../../services/pos/paymentAccount.service";
import { ShopPaymentAccount } from "../../../../types/api/pos/shopPaymentAccount";
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { pageStyles } from "../../../../theme/pos/settings/style";
import { getCsrfTokenCached } from "../../../../utils/pos/csrf";
import { useSocket } from "../../../../hooks/useSocket";
import { useRealtimeRefresh } from "../../../../utils/pos/realtime";
import { useRoleGuard } from "../../../../utils/pos/accessControl";
import { AccessGuardFallback } from "../../../../components/pos/AccessGuard";
import PageContainer from "@/components/ui/page/PageContainer";
import PageSection from "@/components/ui/page/PageSection";
import UIPageHeader from "@/components/ui/page/PageHeader";

const { Text } = Typography;

export default function POSSettingsPage() {
    const { message } = App.useApp();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<ShopPaymentAccount[]>([]);
    const [activeAccount, setActiveAccount] = useState<ShopPaymentAccount | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const { showLoading, hideLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const { isAuthorized, isChecking } = useRoleGuard({ requiredRole: "Admin" });

    const fetchData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const accountsList = await paymentAccountService.getByShopId();
            setAccounts(accountsList);
            const active = accountsList.find(acc => acc.is_active);
            setActiveAccount(active || null);
        } catch {
            message.error("ไม่สามารถดึงข้อมูลบัญชีได้");
        } finally {
            if (!silent) setLoading(false);
        }
    }, [message]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useRealtimeRefresh({
        socket,
        events: ["payment-accounts:update", "payment-accounts:create", "payment-accounts:delete"],
        onRefresh: () => fetchData(true),
        intervalMs: 20000,
    });

    const handleActivate = async (id: string) => {
        try {
            showLoading("กำลังเปลี่ยนบัญชีรับเงิน...");
            
            // Optimistic update for UI feel (optional but good)
            const targetAcc = accounts.find(a => a.id === id);
            if (targetAcc) {
                setActiveAccount(targetAcc);
            }

            const csrfToken = await getCsrfTokenCached();
            await paymentAccountService.activate(id, undefined, undefined, csrfToken);
            message.success("เปลี่ยนบัญชีรับเงินหลักสำเร็จ");
            await fetchData(true); // Silent refresh to sync all state
        } catch {
            message.error("ไม่สามารถเปลี่ยนบัญชีได้");
            await fetchData(true); // Rollback on error
        } finally {
            hideLoading();
        }
    };


    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์..." />;
    }
    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", background: pageStyles.container.background as string }}>
                <UIPageHeader
                    title="ตั้งค่าบัญชีรับเงิน"
                    subtitle="Payment Settings"
                    icon={<SettingOutlined />}
                    onBack={() => router.back()}
                />
                <PageContainer maxWidth={900}>
                    <PageSection>
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                            <Spin size="large" tip="กำลังโหลด..." />
                        </div>
                    </PageSection>
                </PageContainer>
            </div>
        );
    }

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: '#F8FAFC', 
            paddingBottom: 80
        }}>
            <UIPageHeader
                title="ตั้งค่าบัญชีรับเงิน"
                subtitle="Payment Settings"
                icon={<SettingOutlined />}
                onBack={() => router.back()}
                actions={
                    <Button onClick={() => fetchData(false)} loading={loading}>
                        รีเฟรช
                    </Button>
                }
            />

            <PageContainer maxWidth={900}>
                <PageSection style={{ background: "transparent", border: "none" }}>

            {/* Account Selection Card */}
            <div style={{
                background: 'white',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
                <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
                    เลือกบัญชีรับเงินหลัก
                </Text>
                
                <div 
                    style={{
                        border: `2px solid ${activeAccount ? '#10b981' : '#E2E8F0'}`,
                        borderRadius: 12,
                        padding: 14,
                        cursor: 'pointer',
                        background: activeAccount ? '#F0FDF4' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                    }}
                    onClick={() => setModalVisible(true)}
                >
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: activeAccount?.account_type === 'PromptPay' ? '#FDF2F8' : '#EFF6FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        {activeAccount?.account_type === 'PromptPay' 
                            ? <QrcodeOutlined style={{ color: '#EC4899', fontSize: 18 }} /> 
                            : <BankOutlined style={{ color: '#3B82F6', fontSize: 18 }} />
                        }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {activeAccount ? (
                            <>
                                <Text strong style={{ fontSize: 15, display: 'block', color: '#1E293B' }}>
                                    {activeAccount.account_name}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {activeAccount.account_number}
                                </Text>
                            </>
                        ) : (
                            <Text type="secondary">กดเพื่อเลือกบัญชี</Text>
                        )}
                    </div>
                    <div style={{ 
                        background: '#10b981', 
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        flexShrink: 0
                    }}>
                        เปลี่ยน
                    </div>
                </div>
            </div>

            {/* Active Account Info */}
            {activeAccount && (
                <div style={{
                    background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                    border: '1px solid #A7F3D0',
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                }}>
                    <CheckCircleOutlined style={{ fontSize: 24, color: '#10B981', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 11, color: '#059669', display: 'block' }}>กำลังใช้งาน</Text>
                        <Text strong style={{ fontSize: 14, display: 'block', color: '#065F46' }}>
                            {activeAccount.account_name}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#047857' }}>
                            {activeAccount.account_type === 'PromptPay' ? 'พร้อมเพย์' : activeAccount.bank_name}: {activeAccount.account_number}
                        </Text>
                    </div>
                </div>
            )}

            {/* Manage Button */}
            <Button 
                block 
                size="large" 
                icon={<PlusOutlined />}
                onClick={() => router.push('/pos/settings/payment-accounts/manage')}
                style={{
                    borderRadius: 12,
                    height: 48,
                    fontSize: 14,
                    fontWeight: 600,
                    background: '#fff',
                    border: '2px dashed #6366f1',
                    color: '#6366f1',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
            >
                จัดการบัญชีทั้งหมด
            </Button>
                </PageSection>
            </PageContainer>

            {/* Account Selection Modal */}
            <Modal
                title="เลือกบัญชีรับเงิน"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                centered
                styles={{ body: { padding: 16 } }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {accounts.map(acc => {
                        const isActive = activeAccount?.id === acc.id;
                        return (
                            <div
                                key={acc.id}
                                onClick={() => {
                                    if (!isActive) {
                                        handleActivate(acc.id);
                                        setModalVisible(false);
                                    }
                                }}
                                style={{
                                    padding: 14,
                                    border: `2px solid ${isActive ? '#10b981' : '#E5E7EB'}`,
                                    borderRadius: 12,
                                    cursor: isActive ? 'default' : 'pointer',
                                    background: isActive ? '#F0FDF4' : '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12
                                }}
                            >
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 8,
                                    background: acc.account_type === 'PromptPay' ? '#FDF2F8' : '#EFF6FF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {acc.account_type === 'PromptPay' 
                                        ? <QrcodeOutlined style={{ color: '#EC4899', fontSize: 16 }} /> 
                                        : <BankOutlined style={{ color: '#3B82F6', fontSize: 16 }} />
                                    }
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Text strong style={{ fontSize: 14, display: 'block' }}>{acc.account_name}</Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>{acc.account_number}</Text>
                                </div>
                                {isActive && <CheckCircleOutlined style={{ color: '#10b981', fontSize: 18 }} />}
                            </div>
                        );
                    })}
                    
                    <Button 
                        type="dashed" 
                        block 
                        icon={<PlusOutlined />} 
                        onClick={() => router.push('/pos/settings/payment-accounts/manage')}
                        style={{ height: 44, borderRadius: 10, marginTop: 8 }}
                    >
                        เพิ่ม/แก้ไขบัญชี
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
