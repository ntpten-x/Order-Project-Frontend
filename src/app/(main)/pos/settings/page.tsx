'use client';

import React, { useCallback, useEffect, useState } from "react";
import { Typography, Card, Button, Spin, Divider, Row, Col, App, Tag, Select, Space, Modal } from "antd";
import { SettingOutlined, BankOutlined, CheckCircleOutlined, PlusOutlined, QrcodeOutlined } from "@ant-design/icons";
import { paymentAccountService } from "../../../../services/pos/paymentAccount.service";
import { ShopPaymentAccount } from "../../../../types/api/pos/shopPaymentAccount";
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { pageStyles } from "../../../../theme/pos/settings/style";
import { getCsrfTokenCached } from "../../../../utils/pos/csrf";
import { useSocket } from "../../../../hooks/useSocket";
import { useRealtimeRefresh } from "../../../../utils/pos/realtime";
import { useRoleGuard } from "../../../../utils/pos/accessControl";
import { AccessGuardFallback } from "../../../../components/pos/AccessGuard";

const { Title, Text } = Typography;
const { Option } = Select;

export default function POSSettingsPage() {
    const { message } = App.useApp();
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: pageStyles.container.background as string }}>
                <Spin size="large" tip="กำลังโหลด..." />
            </div>
        );
    }

    return (
        <div style={pageStyles.container}>
            {/* Header */}
            <div style={{ ...pageStyles.heroParams, paddingBottom: 60 }}>
                <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div style={pageStyles.sectionTitle}>
                        <SettingOutlined style={{ fontSize: 28 }} />
                        <div>
                            <Title level={3} style={{ margin: 0, color: '#fff' }}>ตั้งค่าบัญชีรับเงิน (Payment Settings)</Title>
                            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>Manage your active payment account</Text>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={pageStyles.contentWrapper}>
                <Card variant="borderless" style={pageStyles.card}>
                    <div style={{ marginBottom: 32 }}>
                        <Divider titlePlacement="left" plain style={pageStyles.dividerTitle}>
                            บัญชีรับเงินที่ใช้งาน (Primary Payment Account)
                        </Divider>

                        <div style={{ marginBottom: 24 }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                                เลือกบัญชีที่จะให้ลูกค้าโอนเงินเข้า (ใช้สร้าง QR Code อัตโนมัติ)
                            </Text>
                            <div 
                                style={{
                                    border: '1px solid #d9d9d9',
                                    borderRadius: 12,
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    background: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    height: 50,
                                    transition: 'all 0.2s',
                                    boxShadow: '0 2px 0 rgba(0,0,0,0.02)'
                                }}
                                onClick={() => setModalVisible(true)}
                            >
                                {activeAccount ? (
                                    <Space>
                                        {activeAccount.account_type === 'PromptPay' ? <QrcodeOutlined style={{ color: '#eb2f96' }} /> : <BankOutlined style={{ color: '#1890ff' }} />}
                                        <Text strong>{activeAccount.account_name}</Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>({activeAccount.account_number})</Text>
                                        <Tag color="success" style={{ marginLeft: 8 }}>ใช้งานอยู่</Tag>
                                    </Space>
                                ) : (
                                    <Text type="secondary">-- เลือกบัญชีรับเงิน --</Text>
                                )}
                                <span style={{ color: '#bfbfbf' }}>▼</span>
                            </div>

                            <Modal
                                title="เลือกบัญชีรับเงิน"
                                open={modalVisible}
                                onCancel={() => setModalVisible(false)}
                                footer={
                                    <Button 
                                        type="dashed" 
                                        block 
                                        icon={<PlusOutlined />} 
                                        onClick={() => window.location.href = '/pos/settings/payment-accounts/manage'}
                                        style={{ height: 40, borderRadius: 10 }}
                                    >
                                        จัดการบัญชีเพิ่มเติม
                                    </Button>
                                }
                                centered
                                width={500}
                                zIndex={10001}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '60vh', overflowY: 'auto' }}>
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
                                                    padding: '16px',
                                                    border: `1px solid ${isActive ? '#10b981' : '#e5e7eb'}`,
                                                    borderRadius: 12,
                                                    cursor: isActive ? 'default' : 'pointer',
                                                    background: isActive ? '#ecfdf5' : '#fff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 10,
                                                        background: acc.account_type === 'PromptPay' ? '#fff0f6' : '#e6f7ff',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        {acc.account_type === 'PromptPay' 
                                                            ? <QrcodeOutlined style={{ color: '#eb2f96', fontSize: 20 }} /> 
                                                            : <BankOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                                                        }
                                                    </div>
                                                    <div>
                                                        <Text strong style={{ display: 'block', fontSize: 15 }}>{acc.account_name}</Text>
                                                        <Text type="secondary" style={{ fontSize: 13 }}>{acc.account_number}</Text>
                                                    </div>
                                                </div>
                                                {isActive && <CheckCircleOutlined style={{ color: '#10b981', fontSize: 20 }} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </Modal>
                        </div>

                        {activeAccount && (
                             <div style={pageStyles.activeAccountCard}>
                                <Row align="middle" gutter={16}>
                                    <Col>
                                        <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                                    </Col>
                                    <Col flex="1">
                                        <div style={{ marginBottom: 4 }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>กำลังใช้งานอยู่ในปัจจุบัน:</Text>
                                        </div>
                                        <Space orientation="vertical" size={0}>
                                            <Text strong style={{ fontSize: 18 }}>{activeAccount.account_name}</Text>
                                            <Space>
                                                <Text type="secondary">{activeAccount.account_type === 'PromptPay' ? 'พร้อมเพย์' : (activeAccount.bank_name || 'ธนาคาร')}: </Text>
                                                <Text strong>{activeAccount.account_number}</Text>
                                            </Space>
                                        </Space>
                                    </Col>
                                </Row>
                            </div>
                        )}

                        <Button 
                            block 
                            size="large" 
                            icon={<PlusOutlined />}
                            onClick={() => window.location.href = '/pos/settings/payment-accounts/manage'}
                            style={pageStyles.addButton}
                        >
                            เพิ่มหรือแก้ไขบัญชี (Manage Accounts)
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
