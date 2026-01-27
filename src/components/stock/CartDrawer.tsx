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
  const { items, updateQuantity, clearCart, itemCount } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>("");

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
              {items.map((item) => (
                <Card
                  key={item.ingredient.id}
                  size="small"
                  style={{
                    borderRadius: 16,
                    border: 'none',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                  }}
                  styles={{ body: { padding: '16px' } }}
                >
                  <Space align="start" size={16} style={{ width: '100%' }}>
                    <Avatar 
                      src={item.ingredient.img_url} 
                      shape="square" 
                      size={72}
                      style={{ 
                        borderRadius: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text 
                        strong 
                        style={{ 
                          fontSize: 16, 
                          display: 'block',
                          marginBottom: 4,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.ingredient.display_name}
                      </Text>
                      <Text 
                        type="secondary" 
                        style={{ 
                          fontSize: 13,
                          display: 'block',
                          marginBottom: 12,
                        }}
                      >
                        {item.ingredient.unit?.display_name || '-'}
                      </Text>
                      
                      {/* Quantity Controls */}
                      <Space size={12}>
                        <Button 
                          size="small" 
                          shape="circle"
                          danger={item.quantity === 1}
                          icon={item.quantity === 1 ? <DeleteOutlined /> : <MinusOutlined />}
                          onClick={() => updateQuantity(item.ingredient.id, item.quantity - 1)}
                          style={{
                            width: 36,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: item.quantity === 1 ? '1px solid #ff4d4f' : '1px solid #d9d9d9',
                          }}
                        />
                        <div 
                          style={{
                            minWidth: 48,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 16,
                            color: '#333',
                          }}
                        >
                          {item.quantity}
                        </div>
                        <Button 
                          size="small" 
                          shape="circle"
                          icon={<PlusOutlined />}
                          onClick={() => updateQuantity(item.ingredient.id, item.quantity + 1)}
                          style={{
                            width: 36,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            color: '#fff',
                          }}
                        />
                      </Space>
                    </div>
                  </Space>
                </Card>
              ))}
            </Space>
          )}
        </div>
      </Drawer>
    </>
  );
}

