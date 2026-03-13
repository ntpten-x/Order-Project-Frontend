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
import { useAuth } from "../../../contexts/AuthContext";
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

function parsePendingCloseShiftError(
    error: unknown,
): { message: string; details: ShiftCloseBlockedDetails } | null {
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

    return {
        message:
            payload?.error?.message ||
            "ไม่สามารถปิดกะได้ เนื่องจากยังมีออเดอร์ที่ต้องจัดการอยู่",
        details: {
            reason: "PENDING_ORDERS",
            totalPendingOrders: Number(details.totalPendingOrders || 0),
            byOrderType: Array.isArray(details.byOrderType)
                ? details.byOrderType
                      .map((item) => ({
                          orderType:
                              typeof item.orderType === "string"
                                  ? item.orderType
                                  : "Unknown",
                          label:
                              typeof item.label === "string"
                                  ? item.label
                                  : "ไม่ระบุประเภท",
                          count: Number(item.count || 0),
                      }))
                      .filter((item) => item.count > 0)
                : [],
        },
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
            title: `เงินสดขาด ${formatMoney(Math.abs(preview.diffAmount))}`,
            summary: "ยอดเงินสดที่นับได้ต่ำกว่ายอดที่ระบบคาดไว้ แต่ยังยืนยันปิดกะได้",
        };
    }

    if (preview.varianceStatus === "OVER") {
        return {
            status: "OVER",
            color: "#16a34a",
            tagColor: "green",
            title: `เงินสดเกิน ${formatMoney(Math.abs(preview.diffAmount))}`,
            summary: "ยอดเงินสดที่นับได้สูงกว่ายอดที่ระบบคาดไว้ แต่ยังยืนยันปิดกะได้",
        };
    }

    return {
        status: "MATCH",
        color: "#2563eb",
        tagColor: "blue",
        title: "ยอดเงินตรงกับที่ระบบคำนวณ",
        summary: "พร้อมยืนยันปิดกะได้ทันที",
    };
}

function sanitizeNumericInput(raw?: string) {
    return raw?.replace(/\$\s?|(,*)/g, "").replace(/[^0-9.]/g, "") as unknown as number;
}

export default function CloseShiftModal({
    open,
    onCancel,
    onSuccess,
}: CloseShiftModalProps) {
    const { currentShift, closeShift } = useShift();
    const { user } = useAuth();
    const router = useRouter();
    const [form] = Form.useForm();
    const [previewLoading, setPreviewLoading] = useState(false);
    const [closeLoading, setCloseLoading] = useState(false);
    const [blockedInfo, setBlockedInfo] = useState<{
        message: string;
        details: ShiftCloseBlockedDetails;
    } | null>(null);
    const [closePreview, setClosePreview] = useState<ShiftClosePreview | null>(null);

    useEffect(() => {
        if (!open) {
            setBlockedInfo(null);
            setClosePreview(null);
            setPreviewLoading(false);
            setCloseLoading(false);
            form.resetFields();
        }
    }, [form, open]);

    useEffect(() => {
        primePrintResources();
    }, []);

    useEffect(() => {
        if (open && !currentShift) {
            onCancel();
        }
    }, [currentShift, onCancel, open]);

    const pendingSummaryText = useMemo(() => {
        if (!blockedInfo?.details.byOrderType.length) return "";
        return blockedInfo.details.byOrderType
            .map((item) => `${item.label} ${item.count} รายการ`)
            .join(", ");
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
                setClosePreview(null);
                setBlockedInfo(parsed);
            } else {
                message.error(
                    error instanceof Error ? error.message : "ตรวจสอบยอดก่อนปิดกะไม่สำเร็จ",
                );
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
            !cachedPrintSettings ||
            cachedPrintSettings.automation.auto_print_order_summary_after_close_shift
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
                        shopProfile: {
                            branch_name: user?.branch?.branch_name,
                            branch_phone: user?.branch?.phone,
                        } as any,
                        targetWindow: reservedPrintWindow,
                    });
                } catch (printError) {
                    closePrintWindow(reservedPrintWindow);
                    console.error("Close shift auto print failed", printError);
                    message.warning("ปิดกะสำเร็จ แต่ไม่สามารถเปิดหน้าพิมพ์สรุปกะได้");
                }
            } else {
                closePrintWindow(reservedPrintWindow);
            }

            setClosePreview(null);
            onSuccess?.();
            onCancel();
            router.push("/pos");
        } catch (error) {
            closePrintWindow(reservedPrintWindow);
            const parsed = parsePendingCloseShiftError(error);
            if (parsed) {
                setClosePreview(null);
                setBlockedInfo(parsed);
            } else {
                message.error(error instanceof Error ? error.message : "ปิดกะไม่สำเร็จ");
            }
        } finally {
            setCloseLoading(false);
        }
    };

    return (
        <>
            <Modal
                open={open}
                onCancel={() => !previewLoading && onCancel()}
                title={null}
                centered
                footer={null}
                width={520}
                destroyOnClose
                closable={!previewLoading}
                maskClosable={!previewLoading}
                className="soft-modal"
                styles={{
                    body: {
                        padding: 0,
                        borderRadius: 28,
                        overflow: "hidden",
                    },
                    mask: { backdropFilter: "blur(6px)" },
                }}
            >
                <div className="close-shift-hero">
                    <div className="close-shift-hero__icon">
                        <DollarOutlined />
                    </div>
                    <Title level={3} style={{ margin: 0 }}>
                        ปิดกะการขาย
                    </Title>
                    <Text type="secondary" style={{ textAlign: "center" }}>
                        กรอกยอดเงินสดที่นับได้จริงก่อนตรวจสอบและยืนยันปิดกะ
                    </Text>
                </div>

                <div style={{ padding: 24 }}>
                    {currentShift ? (
                        <>
                            <div className="close-shift-summary">
                                <div className="close-shift-summary__row">
                                    <Text type="secondary">เวลาเปิดกะ</Text>
                                    <Text strong>
                                        {dayjs(currentShift.open_time).format("DD/MM/YYYY HH:mm")}
                                    </Text>
                                </div>
                                <div className="close-shift-summary__row">
                                    <Text type="secondary">เงินสดตั้งต้น</Text>
                                    <Text strong>
                                        {formatMoney(Number(currentShift.start_amount || 0))}
                                    </Text>
                                </div>
                            </div>

                            <Form form={form} layout="vertical" onFinish={handleRequestClose}>
                                <Form.Item
                                    name="endAmount"
                                    label={
                                        <span style={{ fontSize: 15, fontWeight: 600, color: "#334155" }}>
                                            เงินสดที่นับได้จริง (บาท)
                                        </span>
                                    }
                                    rules={[{ required: true, message: "กรุณาระบุจำนวนเงิน" }]}
                                >
                                    <InputNumber<number>
                                        autoFocus
                                        min={0}
                                        precision={2}
                                        controls={false}
                                        size="large"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        className="close-shift-input"
                                        style={{ width: "100%", height: 80 }}
                                        formatter={(value) =>
                                            `${value ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                                        }
                                        parser={sanitizeNumericInput}
                                    />
                                </Form.Item>

                                <Text type="secondary" style={{ display: "block", marginBottom: 18 }}>
                                    ระบบจะตรวจสอบออเดอร์ค้างและเปรียบเทียบยอดเงินสดให้ก่อนยืนยันอีกครั้ง
                                </Text>

                                <Space direction="vertical" size={10} style={{ width: "100%" }}>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        block
                                        size="large"
                                        loading={previewLoading}
                                        style={{
                                            height: 54,
                                            borderRadius: 16,
                                            fontWeight: 700,
                                            background:
                                                "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                                            border: "none",
                                            boxShadow: "0 14px 30px rgba(239, 68, 68, 0.22)",
                                        }}
                                    >
                                        ตรวจสอบก่อนปิดกะ
                                    </Button>
                                    <Button
                                        block
                                        size="large"
                                        onClick={onCancel}
                                        disabled={previewLoading}
                                        style={{
                                            height: 50,
                                            borderRadius: 16,
                                            fontWeight: 600,
                                            borderColor: "#dbe4ee",
                                        }}
                                    >
                                        ยกเลิก
                                    </Button>
                                </Space>
                            </Form>
                        </>
                    ) : null}
                </div>

                <style jsx global>{`
                    .soft-modal .ant-modal-content {
                        padding: 0 !important;
                        overflow: hidden;
                        border-radius: 28px;
                    }

                    .close-shift-hero {
                        display: grid;
                        place-items: center;
                        gap: 10px;
                        padding: 28px 24px 22px;
                        background:
                            radial-gradient(circle at top, rgba(239, 68, 68, 0.18), transparent 55%),
                            linear-gradient(180deg, #fef2f2 0%, #ffffff 100%);
                        text-align: center;
                    }

                    .close-shift-hero__icon {
                        width: 72px;
                        height: 72px;
                        border-radius: 22px;
                        display: grid;
                        place-items: center;
                        font-size: 30px;
                        color: #dc2626;
                        background: rgba(255, 255, 255, 0.92);
                        box-shadow: 0 18px 40px rgba(239, 68, 68, 0.14);
                    }

                    .close-shift-summary {
                        display: grid;
                        gap: 10px;
                        padding: 14px 16px;
                        margin-bottom: 18px;
                        border: 1px solid #fee2e2;
                        border-radius: 18px;
                        background: #fff8f8;
                    }

                    .close-shift-summary__row {
                        display: flex;
                        justify-content: space-between;
                        gap: 12px;
                    }

                    .close-shift-input {
                        border-radius: 18px !important;
                        border: 2px solid #dbe4ee !important;
                        box-shadow: none !important;
                    }

                    .close-shift-input input {
                        height: 100% !important;
                        text-align: center !important;
                        font-size: 32px !important;
                        font-weight: 800 !important;
                        color: #dc2626 !important;
                    }

                    .close-shift-input.ant-input-number-focused,
                    .close-shift-input:focus-within {
                        border-color: #ef4444 !important;
                        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.12) !important;
                    }
                `}</style>
            </Modal>

            <Modal
                open={Boolean(closePreview)}
                centered
                destroyOnClose
                closable={!closeLoading}
                maskClosable={!closeLoading}
                title={
                    <Space>
                        {varianceMeta?.status === "MATCH" ? (
                            <CheckCircleOutlined style={{ color: "#2563eb" }} />
                        ) : (
                            <WarningOutlined style={{ color: varianceMeta?.color || "#d97706" }} />
                        )}
                        ยืนยันปิดกะ
                    </Space>
                }
                onCancel={() => {
                    if (!closeLoading) {
                        setClosePreview(null);
                    }
                }}
                footer={[
                    <Button key="back" onClick={() => setClosePreview(null)} disabled={closeLoading}>
                        กลับไปแก้ยอด
                    </Button>,
                    <Button
                        key="confirm"
                        type="primary"
                        danger
                        loading={closeLoading}
                        onClick={handleConfirmClose}
                    >
                        ยืนยันปิดกะ
                    </Button>,
                ]}
            >
                {closePreview && varianceMeta ? (
                    <Space direction="vertical" size={12} style={{ width: "100%" }}>
                        <Alert
                            type={
                                varianceMeta.status === "MATCH"
                                    ? "info"
                                    : varianceMeta.status === "SHORT"
                                      ? "warning"
                                      : "success"
                            }
                            showIcon
                            message={varianceMeta.title}
                            description={varianceMeta.summary}
                        />

                        <div
                            style={{
                                border: "1px solid #e2e8f0",
                                borderRadius: 14,
                                padding: 14,
                                background: "#fafcff",
                            }}
                        >
                            <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                    <Text type="secondary">เงินสดตั้งต้น</Text>
                                    <Text strong>{formatMoney(closePreview.startAmount)}</Text>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                    <Text type="secondary">ยอดเงินสดจากการขาย</Text>
                                    <Text strong>{formatMoney(closePreview.cashSales)}</Text>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                    <Text type="secondary">ยอดที่ระบบคาดไว้</Text>
                                    <Text strong>{formatMoney(closePreview.expectedAmount)}</Text>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                    <Text type="secondary">ยอดที่นับได้จริง</Text>
                                    <Text strong>{formatMoney(closePreview.endAmount)}</Text>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                    <Text type="secondary">ผลต่าง</Text>
                                    <Text strong style={{ color: varianceMeta.color }}>
                                        {closePreview.diffAmount > 0 ? "+" : ""}
                                        {formatMoney(closePreview.diffAmount)}
                                    </Text>
                                </div>
                            </Space>
                        </div>

                        <Tag color={varianceMeta.tagColor} style={{ margin: 0, borderRadius: 999 }}>
                            {varianceMeta.status}
                        </Tag>
                    </Space>
                ) : null}
            </Modal>

            <Modal
                open={Boolean(blockedInfo)}
                centered
                destroyOnClose
                title={
                    <Space>
                        <ExclamationCircleOutlined style={{ color: "#d97706" }} />
                        ยังปิดกะไม่ได้
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
                        ไปหน้าออเดอร์
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
                            กรุณาจัดการออเดอร์ให้เสร็จสิ้นหรือยกเลิกให้ครบก่อน แล้วจึงปิดกะอีกครั้ง
                        </Text>
                    </Space>
                ) : null}
            </Modal>
        </>
    );
}
