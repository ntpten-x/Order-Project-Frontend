"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button, Form, InputNumber, Modal, Space, Typography } from "antd";
import { DollarOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { usePathname } from "next/navigation";

import { useShift } from "../../../contexts/pos/ShiftContext";
import { useEffectivePermissions } from "../../../hooks/useEffectivePermissions";
import { Shift } from "../../../types/api/pos/shifts";
import {
    clearShiftPromptSuppressed,
    isShiftPromptSuppressed,
    setShiftPromptSuppressed,
} from "../../../utils/pos/shiftPrompt";

const { Title, Text } = Typography;

interface OpenShiftModalProps {
    open?: boolean;
    onCancel?: () => void;
    onSuccess?: (shift: Shift) => void;
}

function isGuardedShiftPath(pathname: string): boolean {
    return (
        pathname === "/pos/channels/delivery" ||
        pathname === "/pos/channels/dine-in" ||
        pathname === "/pos/channels/takeaway" ||
        pathname === "/pos/orders" ||
        pathname === "/pos/items"
    );
}

function sanitizeNumericInput(raw?: string) {
    return raw?.replace(/\$\s?|(,*)/g, "").replace(/[^0-9.]/g, "") as unknown as number;
}

export default function OpenShiftModal({ open, onCancel, onSuccess }: OpenShiftModalProps = {}) {
    const { currentShift, loading, openShift } = useShift();
    const { can, loading: permissionLoading } = useEffectivePermissions();
    const pathname = usePathname();
    const [submitting, setSubmitting] = useState(false);
    const [dismissedGlobal, setDismissedGlobal] = useState(false);
    const [form] = Form.useForm();
    const canCreateShift = can("shifts.open.feature", "create");
    const isControlled = open !== undefined;

    useEffect(() => {
        if (!currentShift) return;
        setDismissedGlobal(false);
        clearShiftPromptSuppressed();
    }, [currentShift]);

    const isVisible = useMemo(() => {
        if (!canCreateShift) return false;
        if (isControlled) {
            return Boolean(open);
        }

        return (
            !loading &&
            !permissionLoading &&
            !dismissedGlobal &&
            !currentShift &&
            !isShiftPromptSuppressed() &&
            pathname !== "/pos/shift" &&
            !isGuardedShiftPath(pathname)
        );
    }, [
        canCreateShift,
        currentShift,
        dismissedGlobal,
        isControlled,
        loading,
        open,
        pathname,
        permissionLoading,
    ]);

    const closeModal = () => {
        form.resetFields();
        onCancel?.();
    };

    const handleCancel = () => {
        if (isControlled) {
            closeModal();
            return;
        }

        setDismissedGlobal(true);
        setShiftPromptSuppressed();
        closeModal();
    };

    const handleOpenShift = async (values: { startAmount: number }) => {
        setSubmitting(true);
        try {
            const shift = await openShift(Number(values.startAmount || 0));
            clearShiftPromptSuppressed();
            setDismissedGlobal(false);
            form.resetFields();
            onSuccess?.(shift);
            if (isControlled) {
                onCancel?.();
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || permissionLoading || !canCreateShift) {
        return null;
    }

    return (
        <Modal
            open={isVisible}
            onCancel={handleCancel}
            title={null}
            centered
            closable={!submitting}
            maskClosable={!submitting}
            footer={null}
            width={420}
            destroyOnClose
            className="soft-modal"
            styles={{
                body: {
                    padding: 0,
                    borderRadius: 28,
                    overflow: "hidden",
                },
                mask: {
                    backdropFilter: "blur(6px)",
                },
            }}
        >
            <div className="open-shift-hero">
                <div className="open-shift-hero__icon">
                    <DollarOutlined />
                </div>
                <Title level={3} style={{ margin: 0 }}>
                    เปิดกะการขาย
                </Title>
                <Text type="secondary" style={{ textAlign: "center" }}>
                    กำหนดเงินสดตั้งต้นของกะนี้ก่อนเริ่มรับออเดอร์
                </Text>
            </div>

            <div style={{ padding: 24 }}>
                <div className="open-shift-note">
                    <SafetyCertificateOutlined style={{ color: "#0f766e" }} />
                    <Text style={{ color: "#0f172a" }}>
                        เงินสดตั้งต้นจะถูกใช้เป็นฐานสำหรับสรุปยอดเงินสดในลิ้นชักตอนปิดกะ
                    </Text>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleOpenShift}
                    initialValues={{ startAmount: 0 }}
                    style={{ marginTop: 18 }}
                >
                    <Form.Item
                        name="startAmount"
                        label={
                            <span style={{ fontSize: 15, fontWeight: 600, color: "#334155" }}>
                                เงินสดตั้งต้น (บาท)
                            </span>
                        }
                        rules={[{ required: true, message: "กรุณาระบุเงินสดตั้งต้น" }]}
                    >
                        <InputNumber<number>
                            autoFocus
                            min={0}
                            precision={2}
                            controls={false}
                            size="large"
                            inputMode="decimal"
                            placeholder="0.00"
                            className="open-shift-input"
                            style={{ width: "100%", height: 78 }}
                            formatter={(value) =>
                                `${value ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={sanitizeNumericInput}
                        />
                    </Form.Item>

                    <Space direction="vertical" size={10} style={{ width: "100%", marginTop: 8 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            size="large"
                            loading={submitting}
                            style={{
                                height: 54,
                                borderRadius: 16,
                                fontWeight: 700,
                                background:
                                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                border: "none",
                                boxShadow: "0 14px 30px rgba(16, 185, 129, 0.22)",
                            }}
                        >
                            ยืนยันเปิดกะ
                        </Button>
                        <Button
                            block
                            size="large"
                            onClick={handleCancel}
                            disabled={submitting}
                            style={{
                                height: 50,
                                borderRadius: 16,
                                fontWeight: 600,
                                borderColor: "#dbe4ee",
                            }}
                        >
                            ภายหลัง
                        </Button>
                    </Space>
                </Form>
            </div>

            <style jsx global>{`
                .soft-modal .ant-modal-content {
                    padding: 0 !important;
                    overflow: hidden;
                    border-radius: 28px;
                }

                .open-shift-hero {
                    display: grid;
                    place-items: center;
                    gap: 10px;
                    padding: 28px 24px 22px;
                    background:
                        radial-gradient(circle at top, rgba(16, 185, 129, 0.18), transparent 55%),
                        linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
                    text-align: center;
                }

                .open-shift-hero__icon {
                    width: 72px;
                    height: 72px;
                    border-radius: 22px;
                    display: grid;
                    place-items: center;
                    font-size: 30px;
                    color: #059669;
                    background: rgba(255, 255, 255, 0.92);
                    box-shadow: 0 18px 40px rgba(16, 185, 129, 0.14);
                }

                .open-shift-note {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    border: 1px solid #d1fae5;
                    border-radius: 16px;
                    padding: 12px 14px;
                    background: #f8fffb;
                }

                .open-shift-input {
                    border-radius: 18px !important;
                    border: 2px solid #dbe4ee !important;
                    box-shadow: none !important;
                }

                .open-shift-input input {
                    height: 100% !important;
                    text-align: center !important;
                    font-size: 32px !important;
                    font-weight: 800 !important;
                    color: #059669 !important;
                }

                .open-shift-input.ant-input-number-focused,
                .open-shift-input:focus-within {
                    border-color: #10b981 !important;
                    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.12) !important;
                }
            `}</style>
        </Modal>
    );
}
