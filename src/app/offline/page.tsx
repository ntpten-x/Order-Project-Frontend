"use client";

import React, { useEffect, useState } from "react";
import {
    App,
    Button,
    Card,
    Col,
    List,
    Row,
    Space,
    Tag,
    Typography,
    theme,
} from "antd";
import {
    CheckCircleOutlined,
    CloudSyncOutlined,
    DeleteOutlined,
    DisconnectOutlined,
    HomeOutlined,
    ReloadOutlined,
    WifiOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

import PageContainer from "../../components/ui/page/PageContainer";
import UIPageHeader from "../../components/ui/page/PageHeader";
import { useNetwork } from "../../hooks/useNetwork";
import { offlineQueueService, type OfflineAction } from "../../services/pos/offline.queue.service";

const { Title, Text } = Typography;

const ACTION_LABELS: Record<OfflineAction["type"], string> = {
    CREATE_ORDER: "สร้างออเดอร์",
    UPDATE_ORDER: "แก้ไขออเดอร์",
    ADD_ITEM: "เพิ่มสินค้า",
    UPDATE_ITEM: "แก้ไขสินค้า",
    DELETE_ITEM: "ลบสินค้า",
    PAYMENT: "บันทึกการชำระเงิน",
};

function formatTimestamp(value: number) {
    return new Intl.DateTimeFormat("th-TH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

export default function OfflinePage() {
    const router = useRouter();
    const isOnline = useNetwork();
    const { token } = theme.useToken();
    const { message } = App.useApp();
    const [queue, setQueue] = useState<OfflineAction[]>([]);

    useEffect(() => {
        setQueue(offlineQueueService.getQueue());
        return offlineQueueService.subscribe(() => {
            setQueue(offlineQueueService.getQueue());
        });
    }, []);

    const stats = offlineQueueService.getStats();
    const queuePreview = queue.slice(0, 6);

    const handleRefresh = () => {
        if (!isOnline) {
            message.warning("ยังไม่มีสัญญาณอินเทอร์เน็ต");
            return;
        }
        router.push("/pos");
    };

    const handleClearQueue = () => {
        offlineQueueService.clearQueue();
        message.success("ล้างรายการที่ค้างในเครื่องแล้ว");
    };

    return (
        <>
            <UIPageHeader
                title="กำลังออฟไลน์"
                subtitle="ตรวจสอบสถานะเครือข่ายและรายการที่รอซิงก์"
            />

            <PageContainer
                maxWidth={1180}
                style={{
                    minHeight: "100vh",
                    paddingTop: 12,
                    paddingBottom: 32,
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gap: 16,
                    }}
                >
                    <Card
                        style={{
                            borderRadius: 28,
                            overflow: "hidden",
                            border: "1px solid #e2e8f0",
                            background:
                                "radial-gradient(circle at top right, rgba(14,165,233,0.18), transparent 32%), linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
                        }}
                    >
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "auto 1fr",
                                gap: 18,
                                alignItems: "center",
                            }}
                        >
                            <div
                                style={{
                                    width: 84,
                                    height: 84,
                                    borderRadius: 28,
                                    display: "grid",
                                    placeItems: "center",
                                    background: isOnline ? "#dcfce7" : token.colorWarningBg,
                                    color: isOnline ? "#16a34a" : token.colorWarning,
                                    boxShadow: `0 20px 40px ${isOnline ? "rgba(22,163,74,0.12)" : token.colorWarningBg}`,
                                    fontSize: 36,
                                }}
                            >
                                {isOnline ? <WifiOutlined /> : <DisconnectOutlined />}
                            </div>

                            <div>
                                <Space wrap size={8}>
                                    <Tag color={isOnline ? "success" : "warning"}>
                                        {isOnline ? "ออนไลน์แล้ว" : "กำลังออฟไลน์"}
                                    </Tag>
                                    <Tag bordered={false}>
                                        รายการรอซิงก์ {stats.total.toLocaleString()} รายการ
                                    </Tag>
                                </Space>
                                <Title level={2} style={{ margin: "10px 0 6px" }}>
                                    {isOnline
                                        ? "เชื่อมต่อกลับมาแล้ว"
                                        : "ระบบจะเก็บรายการไว้ในเครื่องชั่วคราว"}
                                </Title>
                                <Text type="secondary">
                                    {isOnline
                                        ? "กลับไปหน้า POS เพื่อให้ระบบซิงก์รายการที่ค้างอัตโนมัติ"
                                        : "คุณยังดูสถานะรายการที่ค้างอยู่ได้ และเมื่อเชื่อมต่อกลับมา ระบบจะซิงก์ให้อัตโนมัติ"}
                                </Text>
                            </div>
                        </div>

                        <Space wrap size={12} style={{ marginTop: 20 }}>
                            <Button
                                type="primary"
                                icon={isOnline ? <CheckCircleOutlined /> : <ReloadOutlined />}
                                size="large"
                                onClick={handleRefresh}
                                style={{ borderRadius: 16, height: 48, paddingInline: 24 }}
                            >
                                {isOnline ? "กลับไปหน้า POS" : "ลองเชื่อมต่ออีกครั้ง"}
                            </Button>
                            <Button
                                icon={<HomeOutlined />}
                                size="large"
                                onClick={() => router.push("/")}
                                style={{ borderRadius: 16, height: 48, paddingInline: 24 }}
                            >
                                กลับหน้าแรก
                            </Button>
                            {queue.length > 0 ? (
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    size="large"
                                    onClick={handleClearQueue}
                                    style={{ borderRadius: 16, height: 48, paddingInline: 24 }}
                                >
                                    ล้างคิวในเครื่อง
                                </Button>
                            ) : null}
                        </Space>
                    </Card>

                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}>
                            <InfoCard
                                title="รายการทั้งหมด"
                                value={stats.total.toLocaleString()}
                                caption="เก็บอยู่ในเครื่อง"
                                icon={<CloudSyncOutlined />}
                                color="#1d4ed8"
                            />
                        </Col>
                        <Col xs={24} md={8}>
                            <InfoCard
                                title="พร้อมซิงก์"
                                value={stats.retriable.toLocaleString()}
                                caption="จะส่งขึ้นระบบเมื่อออนไลน์"
                                icon={<CheckCircleOutlined />}
                                color="#059669"
                            />
                        </Col>
                        <Col xs={24} md={8}>
                            <InfoCard
                                title="รายการล่าสุด"
                                value={stats.latestTimestamp ? formatTimestamp(stats.latestTimestamp) : "-"}
                                caption="เวลาที่บันทึกล่าสุด"
                                icon={<ReloadOutlined />}
                                color="#7c3aed"
                            />
                        </Col>
                    </Row>

                    <Card title="ประเภทของรายการที่ค้างอยู่" style={{ borderRadius: 24 }}>
                        <Space wrap size={[10, 10]}>
                            {Object.entries(stats.byType)
                                .filter(([, count]) => count > 0)
                                .map(([type, count]) => (
                                    <Tag key={type} style={{ borderRadius: 999, padding: "6px 10px" }}>
                                        {ACTION_LABELS[type as OfflineAction["type"]]} {count}
                                    </Tag>
                                ))}
                            {stats.total === 0 ? <Text type="secondary">ไม่มีรายการค้างในเครื่อง</Text> : null}
                        </Space>
                    </Card>

                    <Card title="ตัวอย่างรายการที่รอซิงก์" style={{ borderRadius: 24 }}>
                        {queuePreview.length > 0 ? (
                            <List
                                dataSource={queuePreview}
                                renderItem={(item) => (
                                    <List.Item>
                                        <div style={{ width: "100%", display: "grid", gap: 4 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                                <Space wrap>
                                                    <Text strong>{ACTION_LABELS[item.type]}</Text>
                                                    <Tag color={item.retryCount > 0 ? "orange" : "default"}>
                                                        retry {item.retryCount}
                                                    </Tag>
                                                </Space>
                                                <Text type="secondary">{formatTimestamp(item.timestamp)}</Text>
                                            </div>
                                            {item.lastError ? (
                                                <Text type="danger" style={{ fontSize: 12 }}>
                                                    ล่าสุด: {item.lastError}
                                                </Text>
                                            ) : (
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    รอซิงก์เมื่อเครือข่ายกลับมา
                                                </Text>
                                            )}
                                        </div>
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <Text type="secondary">ยังไม่มีรายการค้างในเครื่อง</Text>
                        )}
                    </Card>
                </div>
            </PageContainer>
        </>
    );
}

function InfoCard({
    title,
    value,
    caption,
    icon,
    color,
}: {
    title: string;
    value: string;
    caption: string;
    icon: React.ReactNode;
    color: string;
}) {
    return (
        <Card style={{ borderRadius: 24, height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: 14,
                        display: "grid",
                        placeItems: "center",
                        background: `${color}12`,
                        color,
                    }}
                >
                    {icon}
                </div>
                <Text type="secondary">{title}</Text>
            </div>
            <Title level={4} style={{ margin: 0, color }}>
                {value}
            </Title>
            <Text type="secondary">{caption}</Text>
        </Card>
    );
}
