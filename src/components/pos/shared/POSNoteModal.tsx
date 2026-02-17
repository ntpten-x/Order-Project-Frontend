"use client";

import React from "react";
import { EditOutlined } from "@ant-design/icons";
import { Input, Modal, Typography } from "antd";
import { posColors, posComponentStyles } from "./style";

const { Text } = Typography;

type POSNoteModalProps = {
  open: boolean;
  itemName?: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function POSNoteModal({ open, itemName, value, onChange, onSave, onCancel }: POSNoteModalProps) {
  return (
    <Modal
      title={
        <div style={posComponentStyles.modalTitleRow}>
          <div style={{ ...posComponentStyles.modalIconBase, background: posColors.warningLight }}>
            <EditOutlined style={{ color: posColors.warning, fontSize: 16 }} />
          </div>
          <span>ระบุรายละเอียด: {itemName}</span>
        </div>
      }
      open={open}
      onOk={onSave}
      onCancel={onCancel}
      okText="บันทึก"
      cancelText="ยกเลิก"
      centered
      okButtonProps={{ style: { ...posComponentStyles.modalButton, background: posColors.primary } }}
      cancelButtonProps={{ style: posComponentStyles.modalButton }}
    >
      <div style={{ padding: "16px 0" }}>
        <Text style={{ display: "block", marginBottom: 10, color: posColors.textSecondary }}>
          รายละเอียด / หมายเหตุ
        </Text>
        <Input.TextArea
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="เช่น ไม่ใส่ผัก, หวานน้อย, แยกน้ำ..."
          maxLength={200}
          showCount
          style={{ borderRadius: 10 }}
        />
      </div>
    </Modal>
  );
}
