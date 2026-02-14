"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  Empty,
  Input,
  InputNumber,
  List,
  Modal,
  Space,
  Typography,
  message,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  MinusOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useCart } from "../../contexts/stock/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/auth.service";
import { ordersService } from "../../services/stock/orders.service";

const { Text, Title } = Typography;

export default function CartDrawer() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, clearCart, itemCount, updateItemNote, updateQuantity } = useCart();

  const [open, setOpen] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [remark, setRemark] = useState("");

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");

  useEffect(() => {
    if (!open) return;

    const run = async () => {
      try {
        const token = await authService.getCsrfToken();
        setCsrfToken(token);
      } catch {
        message.error("โหลดโทเคนความปลอดภัยไม่สำเร็จ");
      }
    };

    void run();
  }, [open]);

  const totalRequired = useMemo(
    () => items.reduce((acc, item) => acc + Number(item.quantity || 0), 0),
    [items]
  );

  const createOrder = async () => {
    if (!user) {
      message.warning("กรุณาเข้าสู่ระบบก่อนสร้างใบซื้อ");
      return;
    }

    if (items.length === 0) {
      message.warning("ยังไม่มีรายการที่ต้องซื้อ");
      return;
    }

    const noteLines = items
      .filter((item) => item.note?.trim())
      .map((item) => `${item.ingredient.display_name}: ${item.note?.trim()}`);

    const mergedRemark = [remark.trim(), noteLines.length ? `หมายเหตุรายสินค้า\n- ${noteLines.join("\n- ")}` : ""]
      .filter(Boolean)
      .join("\n\n");

    setSubmitting(true);
    try {
      await ordersService.createOrder(
        {
          ordered_by_id: user.id,
          items: items.map((item) => ({
            ingredient_id: item.ingredient.id,
            quantity_ordered: Number(item.quantity || 0),
          })),
          remark: mergedRemark || undefined,
        },
        undefined,
        csrfToken
      );

      message.success("สร้างใบซื้อเรียบร้อย");
      clearCart();
      setRemark("");
      setOpen(false);
      router.push("/stock/items");
    } catch (error: unknown) {
      message.error((error as Error)?.message || "สร้างใบซื้อไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const openNoteModal = (ingredientId: string, currentNote?: string) => {
    setEditingIngredientId(ingredientId);
    setNoteInput(currentNote || "");
    setNoteModalOpen(true);
  };

  const saveNote = () => {
    if (!editingIngredientId) return;
    updateItemNote(editingIngredientId, noteInput.trim());
    setNoteModalOpen(false);
    setEditingIngredientId(null);
    setNoteInput("");
    message.success("บันทึกหมายเหตุแล้ว");
  };

  return (
    <>
      <div style={{ position: "fixed", right: 20, bottom: 96, zIndex: 1000 }}>
        <Badge count={itemCount} size="small">
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<ShoppingCartOutlined />}
            style={{ width: 58, height: 58 }}
            onClick={() => setOpen(true)}
          />
        </Badge>
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        placement="right"
        width={420}
        title={
          <Space direction="vertical" size={0}>
            <Title level={5} style={{ margin: 0 }}>รายการที่ต้องซื้อ</Title>
            <Text type="secondary">{items.length} รายการ | รวม {totalRequired.toLocaleString()} หน่วย</Text>
          </Space>
        }
        extra={
          items.length > 0 ? (
            <Button
              danger
              type="text"
              onClick={() => {
                Modal.confirm({
                  title: "ล้างรายการทั้งหมด",
                  content: "ต้องการล้างรายการที่จดซื้อทั้งหมดหรือไม่",
                  okText: "ล้างรายการ",
                  okButtonProps: { danger: true },
                  cancelText: "ยกเลิก",
                  onOk: clearCart,
                });
              }}
            >
              ล้างทั้งหมด
            </Button>
          ) : null
        }
        footer={
          <Space direction="vertical" style={{ width: "100%" }}>
            <Input.TextArea
              rows={3}
              placeholder="หมายเหตุเพิ่มเติมของใบซื้อ (ถ้ามี)"
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
            />
            <Button
              type="primary"
              block
              size="large"
              loading={submitting}
              disabled={items.length === 0}
              onClick={() => void createOrder()}
            >
              สร้างใบซื้อ
            </Button>
          </Space>
        }
      >
        {items.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="ยังไม่มีรายการ กรุณาเลือกวัตถุดิบที่ต้องซื้อ"
            style={{ marginTop: 48 }}
          />
        ) : (
          <List
            dataSource={items}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Space key="qty" size={4}>
                    <Button
                      icon={<MinusOutlined />}
                      onClick={() => updateQuantity(item.ingredient.id, item.quantity - 1)}
                    />
                    <InputNumber
                      min={1}
                      value={item.quantity}
                      onChange={(value) => updateQuantity(item.ingredient.id, Number(value || 1))}
                      controls={false}
                    />
                    <Button
                      icon={<PlusOutlined />}
                      onClick={() => updateQuantity(item.ingredient.id, item.quantity + 1)}
                    />
                  </Space>,
                  <Button
                    key="note"
                    icon={<EditOutlined />}
                    onClick={() => openNoteModal(item.ingredient.id, item.note)}
                  >
                    โน้ต
                  </Button>,
                  <Button
                    key="delete"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => updateQuantity(item.ingredient.id, 0)}
                  >
                    ลบ
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar src={item.ingredient.img_url || undefined} shape="square" />}
                  title={item.ingredient.display_name}
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">หน่วย: {item.ingredient.unit?.display_name || "หน่วย"}</Text>
                      {item.note ? <Text style={{ fontSize: 12 }}>หมายเหตุ: {item.note}</Text> : null}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>

      <Modal
        open={noteModalOpen}
        onCancel={() => setNoteModalOpen(false)}
        onOk={saveNote}
        okText="บันทึก"
        cancelText="ยกเลิก"
        title="หมายเหตุรายการ"
      >
        <Input.TextArea
          rows={4}
          placeholder="เช่น ยี่ห้อที่ต้องการ / คุณภาพ / ข้อจำกัด"
          value={noteInput}
          onChange={(event) => setNoteInput(event.target.value)}
        />
      </Modal>
    </>
  );
}
