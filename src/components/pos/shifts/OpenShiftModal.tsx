"use client";

import React, { useEffect, useState } from "react";
import { Modal, InputNumber, Button, Typography, Form } from "antd";
import { DollarOutlined } from "@ant-design/icons";
import { usePathname } from "next/navigation";

import { useShift } from "../../../contexts/pos/ShiftContext";
import { useEffectivePermissions } from "../../../hooks/useEffectivePermissions";
import {
    clearShiftPromptSuppressed,
    isShiftPromptSuppressed,
    setShiftPromptSuppressed,
} from "../../../utils/pos/shiftPrompt";

const { Title, Text } = Typography;

interface OpenShiftModalProps {
    open?: boolean;
    onCancel?: () => void;
}

function isGuardedShiftPath(pathname: string): boolean {
    return (
        pathname === "/pos/channels/delivery" ||
        pathname === "/pos/channels/dine-in" ||
        pathname === "/pos/channels/takeaway" ||
        pathname === "/pos/orders" ||
        pathname === "/pos/items" ||
        pathname === "/pos/kitchen"
    );
}

export default function OpenShiftModal({ open, onCancel }: OpenShiftModalProps = {}) {
    const { currentShift, loading, openShift } = useShift();
    const { can, loading: permissionLoading } = useEffectivePermissions();
    const [submitting, setSubmitting] = useState(false);
    const [dismissedGlobal, setDismissedGlobal] = useState(false);
    const [form] = Form.useForm();
    const pathname = usePathname();
    const canCreateShift = can("shifts.page", "create");

    useEffect(() => {
        if (!currentShift) return;
        setDismissedGlobal(false);
        clearShiftPromptSuppressed();
    }, [currentShift]);

    const isControlled = open !== undefined;
    const suppressed = isShiftPromptSuppressed();
    const isVisible = isControlled
        ? Boolean(open) && canCreateShift
        : (!loading &&
            !permissionLoading &&
            canCreateShift &&
            !dismissedGlobal &&
            !currentShift &&
            !suppressed &&
            pathname !== "/pos/shift" &&
            !isGuardedShiftPath(pathname));

    const handleCancel = () => {
        if (isControlled) {
            onCancel?.();
            return;
        }

        setDismissedGlobal(true);
        setShiftPromptSuppressed();
    };

    const handleOpenShift = async (values: { startAmount: number }) => {
        setSubmitting(true);
        try {
            await openShift(values.startAmount);
            clearShiftPromptSuppressed();
            setDismissedGlobal(false);
            form.resetFields();
        } catch {
            // Error handled in caller/context.
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || permissionLoading) return null;
    if (!canCreateShift) return null;

    return (
        <Modal
            open={isVisible}
            onCancel={handleCancel}
            title={null}
            centered
            closable
            maskClosable
            footer={null}
            width={400}
            className="soft-modal"
            styles={{
                body: { padding: 0, borderRadius: 24, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.1)" },
            }}
        >
            <div className="modal-header">
                <div className="icon-wrapper">
                    <DollarOutlined style={{ fontSize: 32, color: "#10b981" }} />
                </div>
                <Title level={3} style={{ margin: 0, color: "#1f1f1f", fontWeight: 700 }}>
                    เปิดการขาย
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    เปิดกะเพื่อเริ่มรับออเดอร์
                </Text>
            </div>

            <div style={{ padding: "0 32px 32px 32px" }}>
                <Form form={form} layout="vertical" onFinish={handleOpenShift} initialValues={{ startAmount: 0 }}>
                    <Form.Item
                        name="startAmount"
                        label={<span style={{ fontSize: 16, fontWeight: 500, color: "#4b5563" }}>ระบุเงินทอนเริ่มต้น (บาท)</span>}
                        rules={[{ required: true, message: "กรุณาระบุจำนวนเงิน" }]}
                    >
                        <InputNumber<number>
                            style={{ width: "100%", height: "80px", borderRadius: 16, border: "2px solid #e5e7eb" }}
                            size="large"
                            min={0}
                            precision={2}
                            placeholder="0.00"
                            autoFocus
                            controls={false}
                            inputMode="decimal"
                            className="huge-input"
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
                                    if ((e.keyCode === 190 || e.keyCode === 110) && (e.target as HTMLInputElement).value?.includes(".")) {
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

                    <Button
                        onClick={handleCancel}
                        block
                        size="large"
                        disabled={submitting}
                        style={{
                            height: 48,
                            borderRadius: 16,
                            fontWeight: 600,
                        }}
                    >
                        ปิด
                    </Button>

                    <Button
                        type="primary"
                        htmlType="submit"
                        block
                        size="large"
                        loading={submitting}
                        style={{
                            height: 56,
                            borderRadius: 16,
                            fontSize: 18,
                            fontWeight: 600,
                            background: "#10b981",
                            boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                            border: "none",
                            marginTop: 12,
                        }}
                    >
                        ยืนยันการเปิด
                    </Button>
                </Form>
            </div>

            <style jsx global>{`
                .soft-modal .ant-modal-content {
                    padding: 0 !important;
                }
                .modal-header {
                    background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
                    padding: 40px 24px 24px 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    text-align: center;
                }
                .icon-wrapper {
                    width: 72px;
                    height: 72px;
                    background: #d1fae5;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 8px;
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
                }
                .huge-input input {
                    font-size: 36px !important;
                    font-weight: 700 !important;
                    text-align: center !important;
                    color: #10b981 !important;
                    height: 100% !important;
                }
                .huge-input:focus-within {
                    border-color: #10b981 !important;
                    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1) !important;
                }
            `}</style>
        </Modal>
    );
}
