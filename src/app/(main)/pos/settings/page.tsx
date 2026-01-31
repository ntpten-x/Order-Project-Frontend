'use client';

import React, { useCallback, useEffect, useState } from "react";
import { Typography, Card, Button, Spin, Divider, Row, Col, App, Tag, Select, Space } from "antd";
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
                            <Select 
                                size="large" 
                                style={{ width: '100%' }}
                                placeholder="-- เลือกบัญชีรับเงิน --"
                                value={activeAccount?.id}
                                onChange={handleActivate}
                                dropdownRender={(menu) => (
                                    <>
                                        {menu}
                                        <Divider style={{ margin: '8px 0' }} />
                                        <div style={{ padding: '0 8px 4px' }}>
                                            <Button 
                                                type="link" 
                                                block 
                                                icon={<PlusOutlined />} 
                                                onClick={() => window.location.href = '/pos/settings/payment-accounts/manage'}
                                            >
                                                จัดการบัญชีเพิ่มเติม
                                            </Button>
                                        </div>
                                    </>
                                )}
                            >
                                {accounts.map(acc => (
                                    <Option key={acc.id} value={acc.id}>
                                        <Space>
                                            {acc.account_type === 'PromptPay' ? <QrcodeOutlined style={{ color: '#eb2f96' }} /> : <BankOutlined style={{ color: '#1890ff' }} />}
                                            <Text strong>{acc.account_name}</Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>({acc.account_number})</Text>
                                            {acc.is_active && <Tag color="success" style={{ marginLeft: 8 }}>ใช้งานอยู่</Tag>}
                                        </Space>
                                    </Option>
                                ))}
                            </Select>
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
                                        <Space direction="vertical" size={0}>
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
