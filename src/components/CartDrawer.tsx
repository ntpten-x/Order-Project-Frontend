import React, { useState } from "react";
import { Drawer, Button, List, Space, Typography, Badge, Avatar, message, Modal } from "antd";
import { ShoppingCartOutlined, MinusOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const { Text } = Typography;

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, updateQuantity, clearCart, itemCount } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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

      const response = await fetch("/api/orders", {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify({
              ordered_by_id: user.id,
              items: orderItems,
              remark: "สั่งซื้อผ่านเว็บ"
          })
      });

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || "การสั่งซื้อล้มเหลว");
      }

      message.success("สั่งออเดอร์สำเร็จ!");
      clearCart();
      setOpen(false);
      router.push("/items");
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error("Order failed:", error);
      message.error(error.message || "การสั่งซื้อล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ position: "fixed", bottom: 100, right: 24, zIndex: 1000 }}>
        <Badge count={itemCount} offset={[-5, 5]}>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<ShoppingCartOutlined style={{ fontSize: 24 }} />}
            style={{ width: 60, height: 60, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
            onClick={showDrawer}
          />
        </Badge>
      </div>

      <Drawer
        title={
          <Space>
            <ShoppingCartOutlined />
            <span>ตะกร้าสินค้า</span>
          </Space>
        }
        placement="right"
        onClose={onClose}
        open={open}
        width={380}
        extra={
            items.length > 0 && (
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => Modal.confirm({ title: 'ล้างตะกร้า', content: 'ยืนยันลบรายการทั้งหมด?', onOk: clearCart })}>
                    ล้าง
                </Button>
            )
        }
        footer={
          <div style={{ padding: "16px 0" }}>
            <Button 
                type="primary" 
                block 
                size="large" 
                onClick={handlePlaceOrder}
                loading={loading}
                disabled={items.length === 0}
            >
              ยืนยันการสั่งซื้อ ({itemCount} รายการ)
            </Button>
          </div>
        }
      >
        {items.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: 60, color: "#999" }}>
            <ShoppingCartOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <p>ยังไม่มีสินค้าในตะกร้า</p>
          </div>
        ) : (
          <List
            dataSource={items}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Space key="actions">
                    <Button 
                        size="small" 
                        shape="circle" 
                        icon={<MinusOutlined />} 
                        onClick={() => updateQuantity(item.ingredient.id, item.quantity - 1)}
                    />
                    <Text strong style={{ minWidth: 20, textAlign: 'center' }}>{item.quantity}</Text>
                    <Button 
                        size="small" 
                        shape="circle" 
                        icon={<PlusOutlined />} 
                        onClick={() => updateQuantity(item.ingredient.id, item.quantity + 1)}
                    />
                  </Space>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar src={item.ingredient.img_url} shape="square" size="large" />}
                  title={<Text strong>{item.ingredient.display_name}</Text>}
                  description={<Text type="secondary">{item.ingredient.unit?.display_name || '-'}</Text>}
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </>
  );
}
