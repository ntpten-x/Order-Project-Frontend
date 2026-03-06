"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Button,
    Form,
    InputNumber,
    List,
    Modal,
    Space,
    Tag,
    Typography,
    message,
} from "antd";
import {
    CheckCircleOutlined,
    DollarOutlined,
    ExclamationCircleOutlined,
    WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

import { useShift } from "../../../contexts/pos/ShiftContext";
import { shiftsService } from "../../../services/pos/shifts.service";
import type { ShiftClosePreview, ShiftSummary } from "../../../types/api/pos/shifts";
import { BackendHttpError } from "../../../utils/api/backendResponse";
import {
    closePrintWindow,
    getPrintSettings,
    peekPrintSettings,
    primePrintResources,
    printShiftSummaryDocument,
    reservePrintWindow,
} from "../../../utils/print-settings/runtime";

const { Title, Text } = Typography;

type PendingOrderByType = {
    orderType: string;
    label: string;
    count: number;
};

type ShiftCloseBlockedDetails = {
    reason: "PENDING_ORDERS";
    totalPendingOrders: number;
    byOrderType: PendingOrderByType[];
};

type VarianceStatus = "SHORT" | "OVER" | "MATCH";

interface CloseShiftModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess?: () => void;
}

function parsePendingCloseShiftError(error: unknown): { message: string; details: ShiftCloseBlockedDetails } | null {
    if (!(error instanceof BackendHttpError)) return null;

    const payload = error.payload as {
        error?: {
            message?: string;
            details?: {
                reason?: string;
                totalPendingOrders?: unknown;
                byOrderType?: Array<{
                    orderType?: unknown;
                    label?: unknown;
                    count?: unknown;
                }>;
            };
        };
    } | undefined;

    const details = payload?.error?.details;
    if (!details || details.reason !== "PENDING_ORDERS") return null;

    const normalized: ShiftCloseBlockedDetails = {
        reason: "PENDING_ORDERS",
        totalPendingOrders: Number(details.totalPendingOrders || 0),
        byOrderType: Array.isArray(details.byOrderType)
            ? details.byOrderType
                  .map((item) => ({
                      orderType: typeof item.orderType === "string" ? item.orderType : "Unknown",
                      label: typeof item.label === "string" ? item.label : "ไม่ระบุประเภท",
                      count: Number(item.count || 0),
                  }))
                  .filter((item) => item.count > 0)
            : [],
    };

    return {
        message: payload?.error?.message || "ไม่สามารถปิดการขายได้ เนื่องจากยังมีออเดอร์ค้างในระบบ",
        details: normalized,
    };
}

function formatMoney(value: number): string {
    return `฿${Number(value || 0).toLocaleString("th-TH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function getVarianceMeta(preview: ShiftClosePreview): {
    status: VarianceStatus;
    color: string;
    tagColor: "red" | "green" | "blue";
    title: string;
    summary: string;
} {
    if (preview.varianceStatus === "SHORT") {
        return {
            status: "SHORT",
            color: "#dc2626",
            tagColor: "red",
            title: `พบว่าเงินขาดไป ${formatMoney(Math.abs(preview.diffAmount))}`,
            summary: "ยอดเงินนับจริงน้อยกว่ายอดที่ควรมี แต่ยังสามารถยืนยันปิดการขายได้",
        };
    }

    if (preview.varianceStatus === "OVER") {
        return {
            status: "OVER",
            color: "#16a34a",
            tagColor: "green",
            title: `พบว่าเงินเกินมา ${formatMoney(Math.abs(preview.diffAmount))}`,
            summary: "ยอดเงินนับจริงมากกว่ายอดที่ควรมี แต่ยังสามารถยืนยันปิดการขายได้",
        };
    }

    return {
        status: "MATCH",
        color: "#2563eb",
        tagColor: "blue",
        title: "ยอดพอดีตามที่ควรมี",
        summary: "ยอดเงินนับจริงตรงกับยอดที่ระบบคำนวณ",
    };
}

export default function CloseShiftModal({ open, onCancel, onSuccess }: CloseShiftModalProps) {
    const { currentShift, closeShift } = useShift();
    const router = useRouter();

    const [form] = Form.useForm();
    const [previewLoading, setPreviewLoading] = useState(false);
    const [closeLoading, setCloseLoading] = useState(false);
    const [blockedInfo, setBlockedInfo] = useState<{ message: string; details: ShiftCloseBlockedDetails } | null>(null);
    const [closePreview, setClosePreview] = useState<ShiftClosePreview | null>(null);

    useEffect(() => {
        if (!open) {
            setBlockedInfo(null);
            setClosePreview(null);
            setPreviewLoading(false);
            setCloseLoading(false);
            form.resetFields();
        }
    }, [open, form]);

    useEffect(() => {
        primePrintResources();
    }, []);

    const pendingSummaryText = useMemo(() => {
        if (!blockedInfo?.details.byOrderType.length) return "";
        return blockedInfo.details.byOrderType.map((item) => `${item.label} ${item.count} รายการ`).join(", ");
    }, [blockedInfo]);

    const varianceMeta = closePreview ? getVarianceMeta(closePreview) : null;

    const handleRequestClose = async (values: { endAmount: number }) => {
        setPreviewLoading(true);
        setBlockedInfo(null);

        try {
            const preview = await shiftsService.previewCloseShift(Number(values.endAmount));
            setClosePreview(preview);
        } catch (error) {
            const parsed = parsePendingCloseShiftError(error);
            if (parsed) {
                setBlockedInfo(parsed);
            } else {
                message.error(error instanceof Error ? error.message : "ตรวจสอบก่อนปิดการขายไม่สำเร็จ");
            }
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleConfirmClose = async () => {
        if (!closePreview) return;

        setCloseLoading(true);
        setBlockedInfo(null);

        const cachedPrintSettings = peekPrintSettings();
        const reservedPrintWindow =
            !cachedPrintSettings || cachedPrintSettings.automation.auto_print_order_summary_after_close_shift
                ? reservePrintWindow("Shift Summary")
                : null;

        try {
            const closedShift = await closeShift(Number(closePreview.endAmount));
            const printSettings = await getPrintSettings();
            if (printSettings.automation.auto_print_order_summary_after_close_shift) {
                try {
                    const summary = (await shiftsService.getSummary(closedShift.id)) as ShiftSummary;
                    await printShiftSummaryDocument({
                        summary,
                        shift: closedShift,
                        settings: printSettings,
                        targetWindow: reservedPrintWindow,
                    });
                } catch (printError) {
                    closePrintWindow(reservedPrintWindow);
                    console.error("Close shift auto print failed", printError);
                    message.warning("ปิดกะสำเร็จ แต่เปิดหน้าพิมพ์สรุปกะไม่สำเร็จ");
                }
            } else {
                closePrintWindow(reservedPrintWindow);
            }
            setClosePreview(null);
            onCancel();
            if (onSuccess) onSuccess();
            router.push("/");
        } catch (error) {
            closePrintWindow(reservedPrintWindow);
            const parsed = parsePendingCloseShiftError(error);
            if (parsed) {
                setClosePreview(null);
                setBlockedInfo(parsed);
            } else {
                message.error(error instanceof Error ? error.message : "ปิดการขายไม่สำเร็จ");
            }
        } finally {
            setCloseLoading(false);
        }
    };

    return (
        <>
            <Modal
                open={open}
                onCancel={onCancel}
                title={null}
                centered
                footer={null}
                width={500}
                className="soft-modal"
                styles={{
                    body: {
                        padding: 0,
                        borderRadius: 24,
                        overflow: "hidden",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
                    },
                    mask: { backdropFilter: "blur(5px)" },
                }}
            >
                <div className="modal-header-close">
                    <div className="icon-wrapper-close">
                        <DollarOutlined style={{ fontSize: 32, color: "#ef4444" }} />
                    </div>
                    <Title level={3} style={{ margin: 0, color: "#1f1f1f", fontWeight: 700 }}>
                        ปิดการขาย
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        ระบุยอดเงินสดที่นับได้จริงก่อนปิดการขาย
                    </Text>
                </div>

                <div style={{ padding: "0 32px 32px 32px" }}>
                    {currentShift ? (
                        <>
                            <div className="info-card">
                                <div className="info-row">
                                    <Text type="secondary">เวลาเปิดการขาย</Text>
                                    <Text strong>{dayjs(currentShift.open_time).format("DD/MM/YYYY HH:mm")}</Text>
                                </div>
                                <div className="info-divider" />
                                <div className="info-row">
                                    <Text type="secondary">เงินเริ่มต้น</Text>
                                    <Text strong>{formatMoney(Number(currentShift.start_amount || 0))}</Text>
                                </div>
                            </div>

                            <Form form={form} layout="vertical" onFinish={handleRequestClose}>
                                <Form.Item
                                    name="endAmount"
                                    label={<span style={{ fontSize: 16, fontWeight: 500, color: "#4b5563" }}>ยอดเงินสดที่นับได้ (บาท)</span>}
                                    rules={[{ required: true, message: "กรุณาระบุจำนวนเงิน" }]}
                                >
                                    <InputNumber<number>
                                        style={{ width: "100%", height: 80, borderRadius: 16, border: "2px solid #e5e7eb" }}
                                        size="large"
                                        min={0}
                                        precision={2}
                                        placeholder="0.00"
                                        autoFocus
                                        controls={false}
                                        inputMode="decimal"
                                        className="huge-input-close"
                                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                        parser={(value) => value?.replace(/\$\s?|(,*)/g, "").replace(/[^0-9.]/g, "") as unknown as number}
                                        onKeyDown={(e) => {
                                            // Allow: backspace, delete, tab, escape, enter
                                            if (
                                                [8, 46, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                                                // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                                                (e.ctrlKey === true && [65, 67, 86, 88].indexOf(e.keyCode) !== -1) ||
                                                // Allow: home, end, left, right
                                                (e.keyCode >= 35 && e.keyCode <= 39)
                                            ) {
                                                // Special handling for decimal point (prevent multiple dots)
                                                // Note: InputNumber might not expose valid value directly via target.value in all cases, 
                                                // but for standard inputs it usually works or we proceed. 
                                                // For Antd InputNumber, better to just allow the key and let formatter handle or use a more complex check if needed.
                                                // But usually preventing 2nd dot is enough check via logic or just let parser handle it.
                                                // Here we replicate the OpenShiftModal logic for consistency.
                                                const valueStr = `${(e.target as HTMLInputElement).value}`; 
                                                if ((e.keyCode === 190 || e.keyCode === 110) && valueStr.includes(".")) {
                                                    e.preventDefault();
                                                }
                                                return;
                                            }
                                            // Ensure that it is a number and stop the keypress
                                            if (
                                                (e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) &&
                                                (e.keyCode < 96 || e.keyCode > 105)
                                            ) {
                                                e.preventDefault();
                                            }
                                        }}
                                    />
                                </Form.Item>

                                <Text type="secondary" style={{ display: "block", marginTop: -6, marginBottom: 12 }}>
                                    ระบบจะตรวจสอบออเดอร์ค้าง และสรุปผลต่างเงินให้ก่อนยืนยันปิดการขายอีกครั้ง
                                </Text>

                                <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                                    <Button
                                        block
                                        size="large"
                                        onClick={onCancel}
                                        disabled={previewLoading}
                                        style={{
                                            height: 56,
                                            borderRadius: 16,
                                            fontSize: 16,
                                            fontWeight: 600,
                                            background: "#f3f4f6",
                                            border: "none",
                                            color: "#4b5563",
                                        }}
                                    >
                                        ยกเลิก
                                    </Button>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        block
                                        size="large"
                                        loading={previewLoading}
                                        style={{
                                            height: 56,
                                            borderRadius: 16,
                                            fontSize: 16,
                                            fontWeight: 600,
                                            background: "#ef4444",
                                            border: "none",
                                            boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
                                        }}
                                    >
                                        ยืนยันปิดการขาย
                                    </Button>
                                </div>
                            </Form>
                        </>
                    ) : null}
                </div>

                <style jsx global>{`
                    .modal-header-close {
                        background: linear-gradient(180deg, #fef2f2 0%, #ffffff 100%);
                        padding: 32px 24px 24px 24px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 8px;
                        text-align: center;
                    }
                    .icon-wrapper-close {
                        width: 64px;
                        height: 64px;
                        background: #fee2e2;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 8px;
                        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
                    }
                    .info-card {
                        background: #f8fafc;
                        border-radius: 16px;
                        padding: 16px;
                        margin-bottom: 24px;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .info-divider {
                        height: 1px;
                        background: #e2e8f0;
                        margin: 12px 0;
                    }
                    .huge-input-close input {
                        font-size: 34px !important;
                        font-weight: 700 !important;
                        text-align: center !important;
                        color: #ef4444 !important;
                        height: 100% !important;
                    }
                    .huge-input-close:focus-within {
                        border-color: #ef4444 !important;
                        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1) !important;
                    }
                `}</style>
            </Modal>

            <Modal
                open={Boolean(closePreview)}
                centered
                closable={!closeLoading}
                maskClosable={!closeLoading}
                title={
                    <Space>
                        {varianceMeta?.status === "MATCH" ? (
                            <CheckCircleOutlined style={{ color: "#2563eb" }} />
                        ) : (
                            <WarningOutlined style={{ color: varianceMeta?.color || "#d97706" }} />
                        )}
                        ยืนยันปิดการขาย
                    </Space>
                }
                onCancel={() => {
                    if (closeLoading) return;
                    setClosePreview(null);
                }}
                footer={[
                    <Button key="back" onClick={() => setClosePreview(null)} disabled={closeLoading}>
                        กลับไปแก้ยอด
                    </Button>,
                    <Button key="confirm" type="primary" danger loading={closeLoading} onClick={handleConfirmClose}>
                        ยืนยันปิดการขายอีกครั้ง
                    </Button>,
                ]}
            >
                {closePreview && varianceMeta ? (
                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                        <Alert
                            type={varianceMeta.status === "MATCH" ? "info" : varianceMeta.status === "SHORT" ? "warning" : "success"}
                            showIcon
                            message={varianceMeta.title}
                            description={varianceMeta.summary}
                        />

                        <div
                            style={{
                                border: "1px solid #e2e8f0",
                                borderRadius: 12,
                                padding: 12,
                                background: "#fafcff",
                            }}
                        >
                            <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                    <Text type="secondary">เงินเริ่มต้น</Text>
                                    <Text strong>{formatMoney(closePreview.startAmount)}</Text>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                    <Text type="secondary">ยอดเงินสดจากการขาย</Text>
                                    <Text strong>{formatMoney(closePreview.cashSales)}</Text>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                    <Text type="secondary">ยอดเงินที่ควรมี</Text>
                                    <Text strong>{formatMoney(closePreview.expectedAmount)}</Text>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                    <Text type="secondary">ยอดที่นับได้จริง</Text>
                                    <Text strong>{formatMoney(closePreview.endAmount)}</Text>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                    <Text type="secondary">ส่วนต่าง</Text>
                                    <Text strong style={{ color: varianceMeta.color }}>
                                        {closePreview.diffAmount > 0 ? "+" : ""}
                                        {formatMoney(closePreview.diffAmount)}
                                    </Text>
                                </div>
                            </Space>
                        </div>
                        <Tag color={varianceMeta.tagColor} style={{ margin: 0, borderRadius: 999, width: "fit-content" }}>
                            {varianceMeta.status}
                        </Tag>
                    </Space>
                ) : null}
            </Modal>

            <Modal
                open={Boolean(blockedInfo)}
                centered
                title={
                    <Space>
                        <ExclamationCircleOutlined style={{ color: "#d97706" }} />
                        ยังปิดการขายไม่ได้
                    </Space>
                }
                onCancel={() => setBlockedInfo(null)}
                footer={[
                    <Button key="close" onClick={() => setBlockedInfo(null)}>
                        ปิด
                    </Button>,
                    <Button
                        key="go-orders"
                        type="primary"
                        onClick={() => {
                            setBlockedInfo(null);
                            router.push("/pos/orders");
                        }}
                    >
                        ไปหน้าออเดอร์ค้าง
                    </Button>,
                ]}
            >
                {blockedInfo ? (
                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                        <Alert
                            type="warning"
                            showIcon
                            message={`ยังมีออเดอร์ค้าง ${blockedInfo.details.totalPendingOrders} รายการ`}
                            description={blockedInfo.message}
                        />

                        {pendingSummaryText ? (
                            <Text>
                                ค้างจาก: <Text strong>{pendingSummaryText}</Text>
                            </Text>
                        ) : null}

                        <List
                            size="small"
                            bordered
                            dataSource={blockedInfo.details.byOrderType}
                            renderItem={(item) => (
                                <List.Item>
                                    <Space style={{ width: "100%", justifyContent: "space-between" }}>
                                        <Text>{item.label}</Text>
                                        <Tag color="orange">{item.count} รายการ</Tag>
                                    </Space>
                                </List.Item>
                            )}
                        />

                        <Text type="secondary">
                            กรุณาจัดการออเดอร์ให้เสร็จสิ้นหรือยกเลิกให้ครบทั้งหมดก่อน แล้วจึงปิดการขายอีกครั้ง
                        </Text>
                    </Space>
                ) : null}
            </Modal>
        </>
    );
}
