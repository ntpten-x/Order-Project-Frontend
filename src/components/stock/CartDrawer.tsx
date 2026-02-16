"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Drawer,
  Empty,
  Grid,
  Input,
  InputNumber,
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
import { useEffectivePermissions } from "../../hooks/useEffectivePermissions";
import { authService } from "../../services/auth.service";
import { ordersService } from "../../services/stock/orders.service";
import { resolveImageSource } from "../../utils/image/source";

const { Text, Title } = Typography;

export default function CartDrawer() {
  const router = useRouter();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const { user } = useAuth();
  const { can } = useEffectivePermissions({ enabled: Boolean(user?.id) });
  const canCreateOrders = can("stock.orders.page", "create");
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
    [items],
  );

  const createOrder = async () => {
    if (!canCreateOrders) {
      message.error("คุณไม่มีสิทธิ์สร้างใบซื้อ");
      return;
    }
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

    const mergedRemark = [
      remark.trim(),
      noteLines.length ? `หมายเหตุรายสินค้า\n- ${noteLines.join("\n- ")}` : "",
    ]
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
        csrfToken,
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

  const confirmClearCart = () => {
    Modal.confirm({
      title: "ล้างรายการทั้งหมด",
      content: "ต้องการล้างรายการที่จดซื้อทั้งหมดหรือไม่",
      okText: "ล้างรายการ",
      okButtonProps: { danger: true },
      cancelText: "ยกเลิก",
      centered: true,
      onOk: clearCart,
    });
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

  const closeNoteModal = () => {
    setNoteModalOpen(false);
    setEditingIngredientId(null);
    setNoteInput("");
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          right: isMobile ? 16 : 20,
          bottom: isMobile ? "calc(84px + env(safe-area-inset-bottom))" : 96,
          zIndex: 1000,
        }}
      >
        <Badge count={itemCount} size="small" overflowCount={99}>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<ShoppingCartOutlined />}
            style={{ width: isMobile ? 56 : 58, height: isMobile ? 56 : 58 }}
            onClick={() => setOpen(true)}
          />
        </Badge>
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        placement={isMobile ? "bottom" : "right"}
        width={isMobile ? undefined : 460}
        height={isMobile ? "86vh" : undefined}
        title={
          <Space direction="vertical" size={0}>
            <Title level={5} style={{ margin: 0 }}>
              รายการที่ต้องซื้อ
            </Title>
            <Text type="secondary">
              {items.length} รายการ | รวม {totalRequired.toLocaleString()} หน่วย
            </Text>
          </Space>
        }
        extra={
          items.length > 0 ? (
            <Button danger type="text" onClick={confirmClearCart}>
              ล้างทั้งหมด
            </Button>
          ) : null
        }
        bodyStyle={{
          padding: isMobile ? 12 : 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          overflowX: "hidden",
        }}
        footer={
          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            <Card size="small" styles={{ body: { padding: "10px 12px" } }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text type="secondary">รวมทั้งหมด</Text>
                <Text strong style={{ fontSize: 16 }}>
                  {totalRequired.toLocaleString()} หน่วย
                </Text>
              </div>
            </Card>
            <Input.TextArea
              rows={3}
              placeholder="หมายเหตุเพิ่มเติมของใบซื้อ (ถ้ามี)"
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              maxLength={600}
              showCount
            />
            <Button
              type="primary"
              block
              size="large"
              loading={submitting}
              disabled={items.length === 0 || !canCreateOrders}
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
            style={{ marginTop: 40 }}
          />
        ) : (
          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            {items.map((item) => {
              const itemNote = item.note?.trim();
              const unitLabel = item.ingredient.unit?.display_name || "หน่วย";

              return (
                <Card key={item.ingredient.id} size="small" style={{ borderRadius: 12 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Avatar
                      src={resolveImageSource(item.ingredient.img_url) || undefined}
                      shape="square"
                      size={54}
                      icon={<ShoppingCartOutlined />}
                      style={{ borderRadius: 10, flexShrink: 0 }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text strong style={{ display: "block" }} ellipsis={{ tooltip: item.ingredient.display_name }}>
                        {item.ingredient.display_name}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        หน่วย: {unitLabel}
                      </Text>

                      {itemNote ? (
                        <div style={{ marginTop: 4 }}>
                          <Text style={{ fontSize: 12 }}>หมายเหตุ: {itemNote}</Text>
                        </div>
                      ) : null}

                      <Divider style={{ margin: "10px 0" }} />

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Space.Compact>
                          <Button
                            icon={<MinusOutlined />}
                            onClick={() => updateQuantity(item.ingredient.id, item.quantity - 1)}
                          />
                          <InputNumber
                            min={1}
                            value={item.quantity}
                            onChange={(value) => updateQuantity(item.ingredient.id, Number(value || 1))}
                            controls={false}
                            style={{ width: isMobile ? 88 : 92 }}
                          />
                          <Button
                            icon={<PlusOutlined />}
                            onClick={() => updateQuantity(item.ingredient.id, item.quantity + 1)}
                          />
                        </Space.Compact>

                        <Space size={6} wrap>
                          <Button
                            icon={<EditOutlined />}
                            onClick={() => openNoteModal(item.ingredient.id, item.note)}
                          >
                            โน้ต
                          </Button>
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => updateQuantity(item.ingredient.id, 0)}
                          >
                            ลบ
                          </Button>
                        </Space>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </Space>
        )}
      </Drawer>

      <Modal
        open={noteModalOpen}
        onCancel={closeNoteModal}
        onOk={saveNote}
        okText="บันทึก"
        cancelText="ยกเลิก"
        title="หมายเหตุรายการ"
        centered
      >
        <Input.TextArea
          rows={4}
          placeholder="เช่น ยี่ห้อที่ต้องการ / คุณภาพ / ข้อจำกัด"
          value={noteInput}
          onChange={(event) => setNoteInput(event.target.value)}
          maxLength={240}
          showCount
        />
      </Modal>
    </>
  );
}
