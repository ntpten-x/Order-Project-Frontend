"use client";

import { CheckCircleOutlined } from "@ant-design/icons";
import { Modal } from "antd";

type DiscountOption = {
    label: string;
    value: string;
};

type DiscountSelectionModalProps = {
    open: boolean;
    options: DiscountOption[];
    appliedDiscountId?: string | null;
    onSelect: (value?: string) => void;
    onCancel: () => void;
};

export default function DiscountSelectionModal({
    open,
    options,
    appliedDiscountId,
    onSelect,
    onCancel,
}: DiscountSelectionModalProps) {
    return (
        <Modal
            title="เลือกส่วนลด"
            open={open}
            onCancel={onCancel}
            footer={null}
            centered
            width="min(400px, calc(100vw - 16px))"
            zIndex={10001}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "60vh", overflowY: "auto" }}>
                {options.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 24, color: "#9ca3af" }}>
                        ไม่มีส่วนลดที่ใช้งานได้
                    </div>
                ) : (
                    options.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => onSelect(option.value)}
                            style={{
                                padding: "14px 18px",
                                border: "2px solid",
                                borderRadius: 12,
                                cursor: "pointer",
                                background: appliedDiscountId === option.value ? "#eff6ff" : "#fff",
                                borderColor: appliedDiscountId === option.value ? "#3b82f6" : "#e5e7eb",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                minHeight: 54,
                            }}
                        >
                            <span style={{ fontWeight: appliedDiscountId === option.value ? 600 : 400 }}>
                                {option.label}
                            </span>
                            {appliedDiscountId === option.value && (
                                <CheckCircleOutlined style={{ color: "#3b82f6", fontSize: 18 }} />
                            )}
                        </div>
                    ))
                )}
                <div
                    onClick={() => onSelect(undefined)}
                    style={{
                        padding: "14px 18px",
                        marginTop: 8,
                        textAlign: "center",
                        color: "#ef4444",
                        cursor: "pointer",
                        border: "2px dashed #ef4444",
                        borderRadius: 12,
                        minHeight: 54,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    ไม่ใช้ส่วนลด
                </div>
            </div>
        </Modal>
    );
}
