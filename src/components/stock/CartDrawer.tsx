"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
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

import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/stock/CartContext";
import { useEffectivePermissions } from "../../hooks/useEffectivePermissions";
import { authService } from "../../services/auth.service";
import { ordersService } from "../../services/stock/orders.service";
import StockImageThumb from "./StockImageThumb";

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
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [items]
  );

  const notedItemsCount = useMemo(
    () => items.filter((item) => item.note?.trim()).length,
    [items]
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

    const mergedRemark = [remark.trim(), noteLines.length ? `หมายเหตุรายสินค้า\n- ${noteLines.join("\n- ")}` : ""]
      .filter(Boolean)
      .join("\n\n");

    setSubmitting(true);
    try {
      await ordersService.createOrder(
        {
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

  const confirmClearCart = () => {
    Modal.confirm({
      title: "ล้างรายการทั้งหมด",
      content: "ต้องการล้างรายการที่จดไว้ทั้งหมดหรือไม่",
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
      <div className="stock-cart-fab-wrap">
        <Badge count={itemCount} size="small" overflowCount={99}>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<ShoppingCartOutlined />}
            className="stock-cart-fab"
            onClick={() => setOpen(true)}
            data-testid="stock-cart-open"
          />
        </Badge>
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        placement={isMobile ? "bottom" : "right"}
        width={isMobile ? undefined : 460}
        height={isMobile ? "88vh" : undefined}
        rootClassName="stock-cart-drawer"
        title={
          <Space direction="vertical" size={0}>
            <Title level={5} style={{ margin: 0 }}>
              รายการที่ต้องซื้อ
            </Title>
            <Text type="secondary">
              {items.length} รายการ • รวม {totalRequired.toLocaleString()} หน่วย
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
        styles={{
          body: {
            padding: isMobile ? 12 : 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            overflowX: "hidden",
          },
        }}
        footer={
          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            <Card size="small" className="stock-cart-summary-card">
              <div className="stock-cart-summary-row">
                <div>
                  <Text type="secondary">สรุปรายการ</Text>
                  <div className="stock-cart-summary-main">
                    {itemCount.toLocaleString()} ชิ้น / {items.length.toLocaleString()} รายการ
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Text type="secondary">รวมที่ต้องซื้อ</Text>
                  <div className="stock-cart-summary-main">
                    {totalRequired.toLocaleString()} หน่วย
                  </div>
                </div>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                หมายเหตุรายสินค้า {notedItemsCount.toLocaleString()} รายการ
              </Text>
            </Card>

            <Input.TextArea
              rows={3}
              placeholder="หมายเหตุรวมของใบซื้อ เช่น ร้านที่ตั้งใจไปซื้อ หรือข้อกำชับเพิ่มเติม"
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              maxLength={600}
              showCount
              data-testid="stock-cart-remark"
            />

            <Button
              type="primary"
              block
              size="large"
              loading={submitting}
              disabled={items.length === 0 || !canCreateOrders}
              onClick={() => void createOrder()}
              className="stock-cart-submit"
              data-testid="stock-cart-submit"
            >
              สร้างใบซื้อ
            </Button>
          </Space>
        }
      >
        <div data-testid="stock-cart-drawer-content">
        {items.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="ยังไม่มีรายการ กรุณาเลือกวัตถุดิบที่ต้องซื้อ"
            style={{ marginTop: 48 }}
          />
        ) : (
          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            {items.map((item) => {
              const unitLabel = item.ingredient.unit?.display_name || "หน่วย";

              return (
                <Card key={item.ingredient.id} size="small" className="stock-cart-item-card">
                  <div className="stock-cart-item-row">
                    <StockImageThumb
                      src={item.ingredient.img_url}
                      alt={item.ingredient.display_name}
                      size={56}
                      borderRadius={14}
                    />

                    <div className="stock-cart-item-content">
                      <div className="stock-cart-item-head">
                        <div>
                          <Text strong>{item.ingredient.display_name}</Text>
                          <div className="stock-cart-item-subtitle">
                            หน่วย: {unitLabel}
                          </div>
                        </div>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => updateQuantity(item.ingredient.id, 0)}
                        />
                      </div>

                      {item.note?.trim() ? (
                        <div className="stock-cart-item-note">{item.note}</div>
                      ) : null}

                      <Divider style={{ margin: "10px 0" }} />

                      <div className="stock-cart-item-actions">
                        <Space.Compact>
                          <Button
                            icon={<MinusOutlined />}
                            onClick={() => updateQuantity(item.ingredient.id, item.quantity - 1)}
                          />
                          <InputNumber
                            min={1}
                            value={item.quantity}
                            onChange={(value) =>
                              updateQuantity(item.ingredient.id, Number(value || 1))
                            }
                            controls={false}
                            style={{ width: isMobile ? 82 : 90 }}
                            formatter={(value) => `${value}`.replace(/[^0-9]/g, "")}
                            parser={(value) => value?.replace(/[^0-9]/g, "") as unknown as number}
                          />
                          <Button
                            icon={<PlusOutlined />}
                            onClick={() => updateQuantity(item.ingredient.id, item.quantity + 1)}
                          />
                        </Space.Compact>

                        <Button
                          icon={<EditOutlined />}
                          onClick={() => openNoteModal(item.ingredient.id, item.note)}
                        >
                          {item.note?.trim() ? "แก้หมายเหตุ" : "เพิ่มหมายเหตุ"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </Space>
        )}
        </div>
      </Drawer>

      <Modal
        open={noteModalOpen}
        onCancel={closeNoteModal}
        onOk={saveNote}
        okText="บันทึก"
        cancelText="ยกเลิก"
        title="หมายเหตุรายสินค้า"
        centered
      >
        <Input.TextArea
          rows={4}
          placeholder="เช่น ร้านที่ต้องการ คุณภาพที่ต้องการ หรือข้อจำกัดของสินค้ารายการนี้"
          value={noteInput}
          onChange={(event) => setNoteInput(event.target.value)}
          maxLength={240}
          showCount
        />
      </Modal>
    </>
  );
}
