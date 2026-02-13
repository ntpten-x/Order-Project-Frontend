"use client";

import React from "react";
import { Modal, Card, Typography, Spin } from "antd";
import { ShiftSummary } from "../../../types/api/pos/shifts";
import PageState from "../../ui/states/PageState";

const { Text } = Typography;

function toNumber(value: number | string | null | undefined): number {
    return Number(value || 0);
}

function formatMoney(value: number | string | null | undefined, options?: { dashWhenNull?: boolean }): string {
    if (options?.dashWhenNull && (value === null || value === undefined || value === "")) return "-";
    return `฿${toNumber(value).toLocaleString("th-TH")}`;
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
    const diffAmount = summary?.shift_info?.diff_amount;
    const diffColor =
        diffAmount === null || diffAmount === undefined
            ? "#64748b"
            : toNumber(diffAmount) >= 0
                ? "#059669"
                : "#dc2626";

    return (
        <Modal open={open} title="สรุปข้อมูลกะ" onCancel={onClose} footer={null} width={760}>
            {loading ? (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
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
                <div style={{ display: "grid", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                        <ModalMetric label="ยอดขายรวม" value={formatMoney(summary.summary.total_sales)} color="#10b981" />
                        <ModalMetric label="กำไรสุทธิ" value={formatMoney(summary.summary.net_profit)} color="#0369a1" />
                        <ModalMetric label="เงินเริ่มต้น" value={formatMoney(summary.shift_info.start_amount)} color="#334155" />
                        <ModalMetric label="ยอดคาดหวัง" value={formatMoney(summary.shift_info.expected_amount, { dashWhenNull: true })} color="#0f766e" />
                        <ModalMetric label="ยอดนับจริง" value={formatMoney(summary.shift_info.end_amount, { dashWhenNull: true })} color="#0369a1" />
                        <ModalMetric label="ผลต่าง" value={formatMoney(summary.shift_info.diff_amount, { dashWhenNull: true })} color={diffColor} />
                    </div>

                    <Card size="small" title="วิธีชำระเงิน">
                        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
                            {Object.entries(summary.summary.payment_methods || {}).length > 0 ? (
                                Object.entries(summary.summary.payment_methods || {}).map(([method, amount]) => (
                                    <div key={method} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 10px" }}>
                                        <Text type="secondary">{method}</Text>
                                        <div style={{ fontWeight: 700 }}>{formatMoney(amount)}</div>
                                    </div>
                                ))
                            ) : (
                                <Text type="secondary">ไม่พบข้อมูลวิธีชำระเงิน</Text>
                            )}
                        </div>
                    </Card>

                    <Card size="small" title="สินค้าขายดี">
                        {summary.top_products.length > 0 ? (
                            <div style={{ display: "grid", gap: 8 }}>
                                {summary.top_products.map((item, idx) => (
                                    <div
                                        key={`${item.id}-${idx}`}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            border: "1px solid #e2e8f0",
                                            borderRadius: 10,
                                            padding: "8px 10px",
                                        }}
                                    >
                                        <Text strong>
                                            {idx + 1}. {item.name}
                                        </Text>
                                        <Text>
                                            {item.quantity} {item.unit || "หน่วย"} | {formatMoney(item.revenue)}
                                        </Text>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Text type="secondary">ไม่พบข้อมูลสินค้าขายดี</Text>
                        )}
                    </Card>
                </div>
            ) : (
                <Text type="secondary">ไม่พบข้อมูลสรุปกะ</Text>
            )}
        </Modal>
    );
}

function ModalMetric({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px" }}>
            <Text type="secondary">{label}</Text>
            <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
        </div>
    );
}