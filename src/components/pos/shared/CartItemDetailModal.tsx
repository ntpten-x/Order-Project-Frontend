"use client";

import React, { useState } from "react";
import { Button, Input, InputNumber, Modal, Typography } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { posColors, posComponentStyles } from "./style";

const { Text } = Typography;

export interface CartItemDetailModalProps {
  item: { id: string; name: string; details: { detail_name: string; extra_price: number }[] } | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: { detail_name: string; extra_price: number }[]) => void;
}

export function CartItemDetailModal({ item, isOpen, onClose, onSave }: CartItemDetailModalProps) {
  const [details, setDetails] = useState<{ detail_name: string; extra_price: number }[]>([]);

  React.useEffect(() => {
    if (item && isOpen) {
      setDetails(item.details ? [...item.details.map((d) => ({ ...d }))] : []);
    }
  }, [item, isOpen]);

  const handleAddDetail = () => {
    setDetails([...details, { detail_name: "", extra_price: 0 }]);
  };

  const handleRemoveDetail = (index: number) => {
    setDetails(details.filter((_, i) => i !== index));
  };

  const handleUpdateDetail = (index: number, field: string, value: unknown) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setDetails(newDetails);
  };

  const handleSave = () => {
    onSave(details.filter((d) => d.detail_name.trim() !== ""));
    onClose();
  };

  return (
    <Modal
      title={
        <div style={posComponentStyles.modalTitleRow}>
          <div style={{ ...posComponentStyles.modalIconBase, background: posColors.successLight }}>
            <PlusOutlined style={{ color: posColors.success, fontSize: 16 }} />
          </div>
          <span>รายละเอียดเพิ่มเติม: {item?.name}</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} style={{ borderRadius: 10, height: 42 }}>ยกเลิก</Button>,
        <Button key="save" type="primary" onClick={handleSave} style={{ background: posColors.success, borderRadius: 10, height: 42 }}>บันทึก</Button>,
      ]}
      width={520}
      centered
    >
      <div style={{ padding: "16px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Text strong style={{ color: posColors.textSecondary }}>รายการเพิ่มเติม</Text>
          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={handleAddDetail} style={{ borderRadius: 8 }}>
            เพิ่มรายการ
          </Button>
        </div>

        {details.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px",
              background: "#F8FAFC",
              borderRadius: 12,
              color: posColors.textSecondary,
            }}
          >
            <PlusOutlined style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }} />
            <div>ไม่มีรายการเพิ่มเติม</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {details.map((detail, index) => (
              <div key={index} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Input
                  placeholder="ชื่อรายการ"
                  value={detail.detail_name}
                  onChange={(e) => handleUpdateDetail(index, "detail_name", e.target.value)}
                  style={{ flex: 2, borderRadius: 8, height: 42 }}
                />
                <InputNumber<number>
                  placeholder="ราคา"
                  value={detail.extra_price}
                  onChange={(val: number | null) => handleUpdateDetail(index, "extra_price", val || 0)}
                  style={{ flex: 1, height: 42 }}
                  inputMode="decimal"
                  controls={false}
                  min={0}
                  precision={2}
                  formatter={(value: number | undefined | string) => {
                    if (value === undefined || value === null || value === "") return "";
                    return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                  }}
                  parser={(value: string | undefined) => {
                    const cleaned = (value ?? "").replace(/[^\d.]/g, "");
                    const parsed = Number.parseFloat(cleaned);
                    return Number.isFinite(parsed) ? parsed : 0;
                  }}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter", "."];
                    if (!/^[0-9]$/.test(e.key) && !allowedKeys.includes(e.key)) {
                      e.preventDefault();
                    }
                    if (e.key === "." && detail.extra_price.toString().includes(".")) {
                      e.preventDefault();
                    }
                  }}
                />
                <Button
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveDetail(index)}
                  style={{ borderRadius: 8, height: 42, width: 42 }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
