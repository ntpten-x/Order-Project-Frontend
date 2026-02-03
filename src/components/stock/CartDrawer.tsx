"use client";

import React, { useState } from "react";
import { 
  Drawer, 
  Button, 
  Space, 
  Typography, 
  Badge, 
  Avatar, 
  message, 
  Modal,
  Card,
  Tag,
  Input,
} from "antd";
import { 
  ShoppingCartOutlined, 
  MinusOutlined, 
  PlusOutlined, 
  DeleteOutlined,
  CheckCircleOutlined,
  ShoppingOutlined
} from "@ant-design/icons";
import { useCart } from "../../contexts/stock/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/auth.service";
import { ordersService } from "../../services/stock/orders.service";
import { useRouter } from "next/navigation";

const { Text, Title } = Typography;

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, updateQuantity, clearCart, itemCount, updateItemNote } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>("");
  
  // Note Editing State
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [currentNoteItem, setCurrentNoteItem] = useState<{ id: string; name: string; note: string } | null>(null);
  const [noteInput, setNoteInput] = useState("");

  React.useEffect(() => {
    const fetchCsrf = async () => {
        const token = await authService.getCsrfToken();
        setCsrfToken(token);
    };
    if (open) fetchCsrf();
  }, [open]);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const openNoteModal = (id: string, name: string, note: string) => {
    setCurrentNoteItem({ id, name, note });
    setNoteInput(note || "");
    setIsNoteModalVisible(true);
  };

  const handleSaveNote = () => {
    if (currentNoteItem) {
      updateItemNote(currentNoteItem.id, noteInput);
      setIsNoteModalVisible(false);
      setCurrentNoteItem(null);
      message.success("บันทึกโน๊ตเรียบร้อยแล้ว");
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      message.error("กรุณาเข้าสู่ระบบก่อนสั่งซื้อ");
      return;
    }
    
    if (items.length === 0) {
      message.warning("ไม่มีสินค้าในตะกร้า");
      return;
    }

    setLoading(true);
    try {
      const orderItems = items.map(item => ({
        ingredient_id: item.ingredient.id,
        quantity_ordered: item.quantity
      }));

      await ordersService.createOrder({
          ordered_by_id: user.id,
          items: orderItems,
          remark: "สั่งซื้อผ่านเว็บ"
      }, undefined, csrfToken);

      message.success("🎉 สั่งออเดอร์สำเร็จ!");
      clearCart();
      setOpen(false);
      router.push("/stock/items");
    } catch (error: unknown) {
      console.error("Order failed:", error);
      message.error((error as Error).message || "การสั่งซื้อล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Cart Button */}
      <div 
        style={{ 
          position: "fixed", 
          bottom: 100, 
          right: 24, 
          zIndex: 1000,
        }}
      >
        <Badge 
          count={itemCount} 
          offset={[-8, 8]}
          style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            border: '2px solid #fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            fontWeight: 600,
          }}
        >
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<ShoppingCartOutlined style={{ fontSize: 28 }} />}
            style={{ 
              width: 64, 
              height: 64, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.5)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onClick={showDrawer}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1) translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.5)';
            }}
          />
        </Badge>
      </div>

      <Drawer
        title={
          <Space align="center" size={12}>
            <div 
              style={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingCartOutlined style={{ color: '#fff', fontSize: 20 }} />
            </div>
            <div>
              <Title level={5} style={{ margin: 0, fontSize: 18 }}>ตะกร้าสินค้า</Title>
              <Text type="secondary" style={{ fontSize: 13 }}>{itemCount} รายการ</Text>
            </div>
          </Space>
        }
        placement="right"
        onClose={onClose}
        open={open}
        styles={{
          wrapper: { width: 420 },
          header: {
            background: '#fafbff',
            borderBottom: '1px solid #f0f0f0',
            padding: '16px 24px',
          },
          body: {
            padding: 0,
            background: '#f8f9fc',
          },
          footer: {
            padding: '16px 24px',
            background: '#fff',
            borderTop: '1px solid #f0f0f0',
          }
        }}
        extra={
          items.length > 0 && (
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => Modal.confirm({ 
                title: 'ล้างตะกร้า', 
                content: 'ยืนยันลบรายการทั้งหมด?',
                okText: 'ยืนยัน',
                cancelText: 'ยกเลิก',
                okButtonProps: {
                  style: { background: '#ff4d4f' }
                },
                onOk: clearCart 
              })}
              style={{ fontWeight: 500 }}
            >
              ล้าง
            </Button>
          )
        }
        footer={
          <div>
            <Button 
              type="primary" 
              block 
              size="large" 
              onClick={handlePlaceOrder}
              loading={loading}
              disabled={items.length === 0}
              icon={<CheckCircleOutlined />}
              style={{
                height: 56,
                borderRadius: 14,
                fontSize: 17,
                fontWeight: 600,
                background: items.length === 0 
                  ? '#d9d9d9' 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                boxShadow: items.length === 0 
                  ? 'none' 
                  : '0 6px 20px rgba(102, 126, 234, 0.4)',
              }}
            >
              ยืนยันการสั่งซื้อ ({itemCount} รายการ)
            </Button>
          </div>
        }
      >
        <div style={{ padding: '16px 24px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: 80 }}>
              <div 
                style={{
                  width: 120,
                  height: 120,
                  margin: '0 auto 24px',
                  background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShoppingOutlined style={{ fontSize: 56, color: '#667eea' }} />
              </div>
              <Title level={4} style={{ color: '#666', marginBottom: 8 }}>
                ตะกร้าว่างเปล่า
              </Title>
              <Text type="secondary" style={{ fontSize: 15 }}>
                เลือกวัตถุดิบที่ต้องการสั่งซื้อ
              </Text>
            </div>
          ) : (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {items.map((item) => {
                // Mock data for display purposes to match the design requirements
                // In a real scenario, these would come from the item or ingredient data
                const categoryName = item.ingredient.unit?.display_name || 'หมวดหมู่ทั่วไป';
                const price = (item.ingredient as { price?: number }).price || 129; // Mock price
                const totalPrice = price * item.quantity;
                const addons = (item as unknown as { details?: { detail_name: string; extra_price: number }[] }).details || [
                    /* Mock addons for visualization if needed, or empty */
                    // { detail_name: 'ไข่ดาว', extra_price: 10 } 
                ];

                return (
                <Card
                  key={item.ingredient.id}
                  size="small"
                  style={{
                    borderRadius: 16,
                    border: 'none',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    marginBottom: 12
                  }}
                  styles={{ body: { padding: '16px' } }}
                >
                  <div style={{ display: 'flex', gap: 16 }}>
                    {/* Left: Image */}
                    <div style={{ flexShrink: 0 }}>
                        <Avatar 
                            src={item.ingredient.img_url} 
                            shape="square" 
                            size={80}
                            style={{ 
                                borderRadius: 12,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            }}
                        />
                    </div>

                    {/* Middle: Info */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                             <div style={{ flex: 1 }}>
                                <Text strong style={{ fontSize: 16, color: '#1F2937', display: 'block', lineHeight: 1.2 }}>
                                    {item.ingredient.display_name}
                                </Text>
                                <Tag 
                                    style={{ 
                                        margin: '4px 0 0', 
                                        border: 'none', 
                                        background: '#F3F4F6', 
                                        color: '#6B7280',
                                        fontSize: 11,
                                        borderRadius: 6,
                                        padding: '0 6px'
                                    }}
                                >
                                    {categoryName}
                                </Tag>
                             </div>
                             <Text strong style={{ fontSize: 18, color: '#10B981', lineHeight: 1 }}>
                                ฿{totalPrice.toLocaleString()}
                             </Text>
                        </div>

                        {/* Notes */}
                        {item.note && (
                            <div style={{ marginTop: 4, background: "#fef2f2", padding: "2px 6px", borderRadius: 4, display: "inline-block", border: '1px solid #fecaca' }}>
                                <Text style={{ fontSize: 11, color: "#ef4444" }}>
                                    📝 {item.note}
                                </Text>
                            </div>
                        )}

                        {/* Addons/Details */}
                        {addons.length > 0 && (
                            <div style={{ marginTop: 6, marginBottom: 8 }}>
                                {addons.map((addon: { detail_name: string; extra_price: number }, idx: number) => (
                                    <Text key={idx} style={{ display: 'block', fontSize: 12, color: '#10B981', lineHeight: 1.4 }}>
                                        + {addon.detail_name} <span style={{ opacity: 0.8 }}>(+฿{addon.extra_price})</span>
                                    </Text>
                                ))}
                            </div>
                        )}
                        
                        {/* Controls Row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 8 }}>
                             {/* Quantity */}
                             <div style={{ 
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 gap: 8,
                                 background: '#F9FAFB',
                                 padding: '2px',
                                 borderRadius: 8,
                                 border: '1px solid #F3F4F6'
                             }}>
                                <Button 
                                  size="small" 
                                  type="text"
                                  icon={<MinusOutlined style={{ fontSize: 10 }} />}
                                  onClick={() => updateQuantity(item.ingredient.id, item.quantity - 1)}
                                  style={{ width: 24, height: 24, minWidth: 24 }}
                                />
                                <Text strong style={{ fontSize: 14, minWidth: 16, textAlign: 'center' }}>{item.quantity}</Text>
                                <Button 
                                  size="small" 
                                  type="text"
                                  icon={<PlusOutlined style={{ fontSize: 10 }} />}
                                  onClick={() => updateQuantity(item.ingredient.id, item.quantity + 1)}
                                  style={{ 
                                      width: 24, 
                                      height: 24, 
                                      minWidth: 24,
                                      background: '#10B981', 
                                      color: 'white'
                                  }}
                                />
                             </div>

                             {/* Actions */}
                             <Space size={4}>
                                <Button 
                                    type="text" 
                                    size="small"
                                    icon={<span style={{ fontSize: 14 }}>📝</span>}
                                    onClick={() => openNoteModal(item.ingredient.id, item.ingredient.display_name, item.note || "")}
                                    style={{ color: '#ef4444', background: '#fef2f2' }}
                                />
                                <Button 
                                    type="text" 
                                    size="small"
                                    icon={<PlusOutlined />} 
                                    style={{ color: '#10B981', background: '#ECQF9' }}
                                />
                                <Button 
                                    type="text" 
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => updateQuantity(item.ingredient.id, 0)}
                                    style={{ background: '#FEF2F2' }}
                                />
                             </Space>
                        </div>
                    </div>
                  </div>
                </Card>
              )})}
            </Space>
          )}
        </div>
      </Drawer>
      {/* Note Modal */}
      <Modal
        title={
          <Space>
            <span style={{ fontSize: 20 }}>📝</span>
            <Text strong style={{ fontSize: 18 }}>เพิ่มโน๊ต: {currentNoteItem?.name}</Text>
          </Space>
        }
        open={isNoteModalVisible}
        onOk={handleSaveNote}
        onCancel={() => setIsNoteModalVisible(false)}
        okText="บันทึก"
        cancelText="ยกเลิก"
        okButtonProps={{
          style: { 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            height: 40,
            borderRadius: 8,
            padding: '0 24px'
          }
        }}
        cancelButtonProps={{
          style: { 
            height: 40,
            borderRadius: 8
          }
        }}
      >
        <div style={{ paddingTop: 12 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>รายละเอียดเพิ่มเติมที่ต้องการแจ้ง</Text>
          <Input.TextArea
            rows={4}
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="เช่น ไม่เผ็ดมาก, แยกน้ำ, ฯลฯ"
            style={{ borderRadius: 12, padding: 12 }}
          />
        </div>
      </Modal>
    </>
  );
}

