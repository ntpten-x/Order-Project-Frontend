"use client";

import React, { useEffect, useState } from "react";
import { App, Button, Card, Col, List, Row, Space, Tag, Typography, theme } from "antd";
import { CheckCircleOutlined, CloudSyncOutlined, DeleteOutlined, DisconnectOutlined, HomeOutlined, ReloadOutlined, WifiOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

import PageContainer from "../../components/ui/page/PageContainer";
import UIPageHeader from "../../components/ui/page/PageHeader";
import { offlineQueueService, type OfflineAction } from "../../services/pos/offline.queue.service";
import { useNetwork } from "../../hooks/useNetwork";

const { Title, Text } = Typography;

const ACTION_LABELS: Record<OfflineAction["type"], string> = {
    CREATE_ORDER: "เธชเธฃเนเธฒเธเธญเธญเน€เธ”เธญเธฃเน",
    UPDATE_ORDER: "เนเธเนเนเธเธญเธญเน€เธ”เธญเธฃเน",
    ADD_ITEM: "เน€เธเธดเนเธกเธชเธดเธเธเนเธฒ",
    UPDATE_ITEM: "เนเธเนเนเธเธชเธดเธเธเนเธฒ",
    DELETE_ITEM: "เธฅเธเธชเธดเธเธเนเธฒ",
    PAYMENT: "เธเธฑเธเธ—เธถเธเธเธฒเธฃเธเธณเธฃเธฐเน€เธเธดเธ",
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
            message.warning("เธขเธฑเธเนเธกเนเธกเธตเธชเธฑเธเธเธฒเธ“เธญเธดเธเน€เธ—เธญเธฃเนเน€เธเนเธ•");
            return;
        }
        router.push("/pos");
    };

    const handleClearQueue = () => {
        offlineQueueService.clearQueue();
        message.success("เธฅเนเธฒเธเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเธเนเธฒเธเนเธเน€เธเธฃเธทเนเธญเธเนเธฅเนเธง");
    };

    return (
        <>
            <UIPageHeader
                title="เธเธณเธฅเธฑเธเธญเธญเธเนเธฅเธเน"
                subtitle="เธ•เธฃเธงเธเธชเธญเธเธชเธ–เธฒเธเธฐเน€เธเธฃเธทเธญเธเนเธฒเธขเนเธฅเธฐเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเธฃเธญเธเธดเธเธเน"
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
                                        {isOnline ? "เธญเธญเธเนเธฅเธเนเนเธฅเนเธง" : "เธเธณเธฅเธฑเธเธญเธญเธเนเธฅเธเน"}
                                    </Tag>
                                    <Tag bordered={false}>
                                        เธฃเธฒเธขเธเธฒเธฃเธฃเธญเธเธดเธเธเน {stats.total.toLocaleString()} เธฃเธฒเธขเธเธฒเธฃ
                                    </Tag>
                                </Space>
                                <Title level={2} style={{ margin: "10px 0 6px" }}>
                                    {isOnline
                                        ? "เน€เธเธทเนเธญเธกเธ•เนเธญเธเธฅเธฑเธเธกเธฒเนเธฅเนเธง"
                                        : "เธฃเธฐเธเธเธเธฐเน€เธเนเธเธฃเธฒเธขเธเธฒเธฃเนเธงเนเนเธเน€เธเธฃเธทเนเธญเธเธเธฑเนเธงเธเธฃเธฒเธง"}
                                </Title>
                                <Text type="secondary">
                                    {isOnline
                                        ? "เธเธฅเธฑเธเนเธเธซเธเนเธฒ POS เน€เธเธทเนเธญเนเธซเนเธฃเธฐเธเธเธเธดเธเธเนเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเธเนเธฒเธเธญเธฑเธ•เนเธเธกเธฑเธ•เธด"
                                        : "เธเธธเธ“เธขเธฑเธเธ”เธนเธชเธ–เธฒเธเธฐเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเธเนเธฒเธเธญเธขเธนเนเนเธ”เน เนเธฅเธฐเน€เธกเธทเนเธญเน€เธเธทเนเธญเธกเธ•เนเธญเธเธฅเธฑเธเธกเธฒ เธฃเธฐเธเธเธเธฐเธเธดเธเธเนเนเธซเนเธญเธฑเธ•เนเธเธกเธฑเธ•เธด"}
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
                                {isOnline ? "เธเธฅเธฑเธเนเธเธซเธเนเธฒ POS" : "เธฅเธญเธเน€เธเธทเนเธญเธกเธ•เนเธญเธญเธตเธเธเธฃเธฑเนเธ"}
                            </Button>
                            <Button
                                icon={<HomeOutlined />}
                                size="large"
                                onClick={() => router.push("/")}
                                style={{ borderRadius: 16, height: 48, paddingInline: 24 }}
                            >
                                เธเธฅเธฑเธเธซเธเนเธฒเนเธฃเธ
                            </Button>
                            {queue.length > 0 ? (
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    size="large"
                                    onClick={handleClearQueue}
                                    style={{ borderRadius: 16, height: 48, paddingInline: 24 }}
                                >
                                    เธฅเนเธฒเธเธเธดเธงเนเธเน€เธเธฃเธทเนเธญเธ
                                </Button>
                            ) : null}
                        </Space>
                    </Card>

                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}>
                            <InfoCard
                                title="เธฃเธฒเธขเธเธฒเธฃเธ—เธฑเนเธเธซเธกเธ”"
                                value={stats.total.toLocaleString()}
                                caption="เน€เธเนเธเธญเธขเธนเนเนเธเน€เธเธฃเธทเนเธญเธ"
                                icon={<CloudSyncOutlined />}
                                color="#1d4ed8"
                            />
                        </Col>
                        <Col xs={24} md={8}>
                            <InfoCard
                                title="เธเธฃเนเธญเธกเธเธดเธเธเน"
                                value={stats.retriable.toLocaleString()}
                                caption="เธเธฐเธชเนเธเธเธถเนเธเธฃเธฐเธเธเน€เธกเธทเนเธญเธญเธญเธเนเธฅเธเน"
                                icon={<CheckCircleOutlined />}
                                color="#059669"
                            />
                        </Col>
                        <Col xs={24} md={8}>
                            <InfoCard
                                title="เธฃเธฒเธขเธเธฒเธฃเธฅเนเธฒเธชเธธเธ”"
                                value={stats.latestTimestamp ? formatTimestamp(stats.latestTimestamp) : "-"}
                                caption="เน€เธงเธฅเธฒเธ—เธตเนเธเธฑเธเธ—เธถเธเธฅเนเธฒเธชเธธเธ”"
                                icon={<ReloadOutlined />}
                                color="#7c3aed"
                            />
                        </Col>
                    </Row>

                    <Card title="เธเธฃเธฐเน€เธ เธ—เธเธญเธเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเธเนเธฒเธเธญเธขเธนเน" style={{ borderRadius: 24 }}>
                        <Space wrap size={[10, 10]}>
                            {Object.entries(stats.byType)
                                .filter(([, count]) => count > 0)
                                .map(([type, count]) => (
                                    <Tag key={type} style={{ borderRadius: 999, padding: "6px 10px" }}>
                                        {ACTION_LABELS[type as OfflineAction["type"]]} {count}
                                    </Tag>
                                ))}
                            {stats.total === 0 ? <Text type="secondary">เนเธกเนเธกเธตเธฃเธฒเธขเธเธฒเธฃเธเนเธฒเธเนเธเน€เธเธฃเธทเนเธญเธ</Text> : null}
                        </Space>
                    </Card>

                    <Card title="เธ•เธฑเธงเธญเธขเนเธฒเธเธฃเธฒเธขเธเธฒเธฃเธ—เธตเนเธฃเธญเธเธดเธเธเน" style={{ borderRadius: 24 }}>
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
                                                    เธฅเนเธฒเธชเธธเธ”: {item.lastError}
                                                </Text>
                                            ) : (
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    เธฃเธญเธเธดเธเธเนเน€เธกเธทเนเธญเน€เธเธฃเธทเธญเธเนเธฒเธขเธเธฅเธฑเธเธกเธฒ
                                                </Text>
                                            )}
                                        </div>
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <Text type="secondary">เธขเธฑเธเนเธกเนเธกเธตเธฃเธฒเธขเธเธฒเธฃเธเนเธฒเธเนเธเน€เธเธฃเธทเนเธญเธ</Text>
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

