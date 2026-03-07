"use client";

import React from "react";
import { Card, Col, Divider, Empty, Grid, Modal, Row, Space, Spin, Tag, Typography } from "antd";

import { ShiftSummary } from "../../../types/api/pos/shifts";
import PageState from "../../ui/states/PageState";

const { Text, Title } = Typography;

function toNumber(value: number | string | null | undefined): number {
    return Number(value || 0);
}

function formatMoney(
    value: number | string | null | undefined,
    options?: { dashWhenNull?: boolean },
): string {
    if (options?.dashWhenNull && (value === null || value === undefined || value === "")) {
        return "-";
    }
    return `฿${toNumber(value).toLocaleString("th-TH")}`;
}

function formatDateTime(value?: string | null): string {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("th-TH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

type ShiftSummaryModalProps = {
    open: boolean;
    onClose: () => void;
    summary: ShiftSummary | null;
    loading?: boolean;
    error?: unknown;
    onRetry?: () => void;
};

export default function ShiftSummaryModal({
    open,
    onClose,
    summary,
    loading = false,
    error = null,
    onRetry,
}: ShiftSummaryModalProps) {
    const screens = Grid.useBreakpoint();
    const diffAmount = summary?.shift_info?.diff_amount;
    const diffNumber =
        diffAmount === null || diffAmount === undefined ? null : toNumber(diffAmount);
    const diffColor =
        diffNumber === null ? "#64748b" : diffNumber >= 0 ? "#059669" : "#dc2626";
    const orderTypeEntries = Object.entries(summary?.summary.order_types || {}).filter(
        ([, value]) => toNumber(value) > 0,
    );
    const categoryEntries = Object.entries(summary?.categories || {}).sort(
        (a, b) => b[1] - a[1],
    );

    return (
        <Modal
            open={open}
            title="สรุปข้อมูลกะ"
            onCancel={onClose}
            footer={null}
            width={screens.md ? 880 : "calc(100vw - 24px)"}
            destroyOnClose
        >
            {loading ? (
                <div style={{ padding: "48px 0", textAlign: "center" }}>
                    <Spin />
                </div>
            ) : error ? (
                <PageState
                    status="error"
                    title="โหลดสรุปกะไม่สำเร็จ"
                    error={error}
                    onRetry={onRetry}
                />
            ) : summary ? (
                <div style={{ display: "grid", gap: 14 }}>
                    <Card
                        style={{
                            borderRadius: 20,
                            background:
                                "radial-gradient(circle at top right, rgba(14,165,233,0.12), transparent 35%), linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
                        }}
                    >
                        <Space
                            direction={screens.md ? "horizontal" : "vertical"}
                            size={14}
                            style={{ width: "100%", justifyContent: "space-between" }}
                        >
                            <div>
                                <Space wrap size={8}>
                                    <Tag color={summary.shift_info.status === "CLOSED" ? "default" : "green"}>
                                        {summary.shift_info.status === "CLOSED" ? "ปิดกะแล้ว" : "กำลังเปิดกะ"}
                                    </Tag>
                                    <Tag bordered={false}>Shift #{summary.shift_info.id?.slice(0, 8) || "-"}</Tag>
                                </Space>
                                <Title level={4} style={{ margin: "10px 0 4px" }}>
                                    {formatMoney(summary.summary.total_sales)}
                                </Title>
                                <Text type="secondary">ยอดขายรวมของกะนี้</Text>
                            </div>

                            <Space size={20} wrap>
                                <MetaPair label="เวลาเปิดกะ" value={formatDateTime(summary.shift_info.open_time)} />
                                <MetaPair label="เวลาปิดกะ" value={formatDateTime(summary.shift_info.close_time)} />
                            </Space>
                        </Space>
                    </Card>

                    <Row gutter={[12, 12]}>
                        <Col xs={24} md={12} xl={8}>
                            <MetricCard label="เงินสดตั้งต้น" value={formatMoney(summary.shift_info.start_amount)} color="#0f172a" />
                        </Col>
                        <Col xs={24} md={12} xl={8}>
                            <MetricCard
                                label="ยอดที่ระบบคาดไว้"
                                value={formatMoney(summary.shift_info.expected_amount, { dashWhenNull: true })}
                                color="#0369a1"
                            />
                        </Col>
                        <Col xs={24} md={12} xl={8}>
                            <MetricCard
                                label="ยอดนับจริง"
                                value={formatMoney(summary.shift_info.end_amount, { dashWhenNull: true })}
                                color="#0f766e"
                            />
                        </Col>
                        <Col xs={24} md={12} xl={8}>
                            <MetricCard label="ต้นทุนรวม" value={formatMoney(summary.summary.total_cost)} color="#7c3aed" />
                        </Col>
                        <Col xs={24} md={12} xl={8}>
                            <MetricCard label="กำไรสุทธิ" value={formatMoney(summary.summary.net_profit)} color="#059669" />
                        </Col>
                        <Col xs={24} md={12} xl={8}>
                            <MetricCard
                                label="ผลต่าง"
                                value={formatMoney(summary.shift_info.diff_amount, { dashWhenNull: true })}
                                color={diffColor}
                            />
                        </Col>
                    </Row>

                    <Row gutter={[12, 12]}>
                        <Col xs={24} lg={12}>
                            <Card size="small" title="วิธีชำระเงิน" style={{ borderRadius: 18 }}>
                                <div style={{ display: "grid", gap: 10 }}>
                                    {Object.entries(summary.summary.payment_methods || {}).length > 0 ? (
                                        Object.entries(summary.summary.payment_methods || {}).map(([method, amount]) => (
                                            <div
                                                key={method}
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    gap: 12,
                                                    padding: "10px 12px",
                                                    border: "1px solid #e2e8f0",
                                                    borderRadius: 12,
                                                }}
                                            >
                                                <Text>{method}</Text>
                                                <Text strong>{formatMoney(amount)}</Text>
                                            </div>
                                        ))
                                    ) : (
                                        <Empty
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            description="ไม่พบข้อมูลวิธีชำระเงิน"
                                        />
                                    )}
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} lg={12}>
                            <Card size="small" title="ยอดขายตามช่องทาง" style={{ borderRadius: 18 }}>
                                <div style={{ display: "grid", gap: 10 }}>
                                    {orderTypeEntries.length > 0 ? (
                                        orderTypeEntries.map(([type, amount]) => (
                                            <div
                                                key={type}
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    gap: 12,
                                                    padding: "10px 12px",
                                                    border: "1px solid #e2e8f0",
                                                    borderRadius: 12,
                                                }}
                                            >
                                                <Text>{translateOrderType(type)}</Text>
                                                <Text strong>{formatMoney(amount)}</Text>
                                            </div>
                                        ))
                                    ) : (
                                        <Empty
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            description="ไม่พบข้อมูลช่องทางการขาย"
                                        />
                                    )}
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={[12, 12]}>
                        <Col xs={24} lg={14}>
                            <Card size="small" title="สินค้าขายดี" style={{ borderRadius: 18 }}>
                                {summary.top_products.length > 0 ? (
                                    <div style={{ display: "grid", gap: 10 }}>
                                        {summary.top_products.map((item, index) => (
                                            <div
                                                key={`${item.id}-${index}`}
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    gap: 12,
                                                    padding: "12px 14px",
                                                    border: "1px solid #e2e8f0",
                                                    borderRadius: 14,
                                                    background: index === 0 ? "#fffdf0" : "#fff",
                                                }}
                                            >
                                                <div style={{ minWidth: 0 }}>
                                                    <Text strong style={{ display: "block" }}>
                                                        {index + 1}. {item.name}
                                                    </Text>
                                                    <Text type="secondary">
                                                        จำนวน {item.quantity} {item.unit || "หน่วย"}
                                                    </Text>
                                                </div>
                                                <Text strong>{formatMoney(item.revenue)}</Text>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่พบข้อมูลสินค้าขายดี" />
                                )}
                            </Card>
                        </Col>

                        <Col xs={24} lg={10}>
                            <Card size="small" title="หมวดหมู่ขายดี" style={{ borderRadius: 18 }}>
                                {categoryEntries.length > 0 ? (
                                    <div style={{ display: "grid", gap: 10 }}>
                                        {categoryEntries.slice(0, 6).map(([category, qty]) => (
                                            <div key={category}>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        gap: 12,
                                                    }}
                                                >
                                                    <Text>{category}</Text>
                                                    <Text strong>{qty.toLocaleString()}</Text>
                                                </div>
                                                <Divider style={{ margin: "8px 0 0" }} />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description="ไม่พบข้อมูลหมวดหมู่สินค้า"
                                    />
                                )}
                            </Card>
                        </Col>
                    </Row>
                </div>
            ) : (
                <Text type="secondary">ไม่พบข้อมูลสรุปกะ</Text>
            )}
        </Modal>
    );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div
            style={{
                border: "1px solid #e2e8f0",
                borderRadius: 18,
                padding: "14px 16px",
                background: "#fff",
                height: "100%",
            }}
        >
            <Text type="secondary">{label}</Text>
            <div style={{ fontSize: 24, fontWeight: 800, color, marginTop: 6 }}>{value}</div>
        </div>
    );
}

function MetaPair({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                {label}
            </Text>
            <Text strong>{value}</Text>
        </div>
    );
}

function translateOrderType(type: string) {
    if (type === "DineIn") return "ทานที่ร้าน";
    if (type === "TakeAway") return "สั่งกลับบ้าน";
    if (type === "Delivery") return "เดลิเวอรี่";
    return type;
}
