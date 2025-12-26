"use client";

import React, { useEffect, useState } from "react";
import { Table, Tag, Typography, Card, Space, Button, message, Modal } from "antd";
import { ReloadOutlined, EditOutlined, StopOutlined, EyeOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { Order, OrderStatus } from "@/types/api/orders";
import EditOrderModal from "@/components/EditOrderModal";
import OrderDetailModal from "@/components/OrderDetailModal";
import { ordersService } from "@/services/orders.service";
import { useSocket } from "@/hooks/useSocket";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

export default function ItemsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const router = useRouter();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersService.getAllOrders();
      // Filter only pending items (conceptually based on user requirement "Waiting to buy")
      // But typically "Items" page might show all, let's filter for PENDING first or show all sorted.
      // User said "Pending items" -> "Wait to buy".
      // Let's show all for now but sorted by date.
      setOrders(data.filter((order) => order.status === OrderStatus.PENDING));
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      message.error("ไม่สามารถโหลดรายการออเดอร์ได้");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Handle real-time updates without full refetch
    socket.on("orders_updated", (payload: { action: string, data?: Order, id?: string, orderId?: string }) => {
        const { action, data, id, orderId } = payload;
        
        switch (action) {
            case "create":
                if (data) {
                    setOrders(prev => [data, ...prev]);
                    message.success("มีออเดอร์ใหม่เข้ามา");
                }
                break;
            case "update_status":
                if (data) {
                    setOrders(prev => prev.map(order => order.id === data.id ? data : order));
                    message.info(`อัปเดตสถานะออเดอร์ ${data.id.substring(0,8)}`);
                }
                break;
            case "delete":
                if (id) {
                    setOrders(prev => prev.filter(order => order.id !== id));
                    message.warning("ลบออเดอร์แล้ว");
                }
                break;
            case "update_item_detail":
                 // For item detail updates, we might need to update the specific item inside the order.
                 // The payload data is OrdersDetail, but the UI shows OrdersItems.
                 // Since OrdersDetail is linked to OrdersItem, and we likely need to refresh the whole order structure or update carefully.
                 // For simplicity and accuracy of nested relations, functionality: "Refetch specific order or all" is safer.
                 // Let's refetch all for complex nested updates to avoid consistency issues, OR refetch just that order.
                 if (orderId) {
                     // Optimistic update is hard for deep nested without full object. 
                     // Let's refetch to be safe for this complex case, but keep others optimistic.
                     fetchOrders(); 
                 }
                 break;
            default:
                fetchOrders();
                break;
        }
    });

    return () => {
        socket.off("orders_updated");
    };
  }, [socket]);

  // ... inside component ...
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const handleCancelOrder = (order: Order) => {
    Modal.confirm({
        title: 'ยืนยันการยกเลิก',
        content: `คุณต้องการยกเลิกออเดอร์ ${order.id.substring(0, 8)} หรือไม่?`,
        onOk: async () => {
            try {
                await ordersService.updateStatus(order.id, OrderStatus.CANCELLED);
                message.success("ยกเลิกออเดอร์สำเร็จ");
            } catch (error) {
                message.error("ยกเลิกออเดอร์ล้มเหลว");
            }
        }
    });
  };

  const columns = [
    // ... existing columns ...
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <Text copyable>{id.substring(0, 8)}</Text>,
    },
    {
        title: 'ผู้สั่ง',
        dataIndex: ['ordered_by', 'username'],
        key: 'ordered_by',
        render: (text: string) => text || 'Unknown',
    },
    {
      title: 'รายการสินค้า',
      dataIndex: 'ordersItems',
      key: 'items',
      render: (items: any[]) => (
        <Space direction="vertical">
          {items.map((item) => (
            <div key={item.id}>
              <Text strong>{item.ingredient?.display_name}</Text>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                 x {item.quantity_ordered} {item.ingredient?.unit?.display_name}
              </Text>
            </div>
          ))}
        </Space>
      ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: (status: OrderStatus) => {
        let color = 'default';
        if (status === OrderStatus.PENDING) color = 'gold';
        if (status === OrderStatus.COMPLETED) color = 'green';
        if (status === OrderStatus.CANCELLED) color = 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'วันที่สั่ง',
      dataIndex: 'create_date',
      key: 'create_date',
      render: (date: string) => new Date(date).toLocaleString('th-TH'),
    },
    {
        title: 'จัดการ',
        key: 'actions',
        render: (_: any, record: Order) => (
            <Space>
                <Button 
                    size="small" 
                    icon={<EyeOutlined />} 
                    onClick={() => setViewingOrder(record)}
                >
                    ดู
                </Button>
                <Button
                    type="primary"
                    size="small"
                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    icon={<ShoppingCartOutlined />}
                    disabled={record.status !== OrderStatus.PENDING}
                    onClick={() => router.push(`/buying?orderId=${record.id}`)}
                >
                    สั่งซื้อ
                </Button>
                <Button 
                    type="primary" 
                    ghost 
                    size="small" 
                    icon={<EditOutlined />} 
                    disabled={record.status !== OrderStatus.PENDING}
                    onClick={() => setEditingOrder(record)}
                >
                    แก้ไข
                </Button>
                <Button 
                    danger 
                    size="small" 
                    icon={<StopOutlined />} 
                    disabled={record.status !== OrderStatus.PENDING}
                    onClick={() => handleCancelOrder(record)}
                >
                    ยกเลิก
                </Button>
            </Space>
        )
    }
  ];

  return (
    <div style={{ padding: 24, paddingBottom: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Title level={2} style={{ margin: 0 }}>รายการสั่งซื้อ (รอการซื้อ)</Title>
            <Button icon={<ReloadOutlined />} onClick={fetchOrders}>Refresh</Button>
        </div>
      
      <Card loading={loading}>
        <Table 
            dataSource={orders} 
            columns={columns} 
            rowKey="id" 
            pagination={{ pageSize: 10 }}
        />
      </Card>

      <EditOrderModal 
        open={!!editingOrder} 
        order={editingOrder} 
        onClose={() => setEditingOrder(null)} 
        onSuccess={fetchOrders}
      />
      
      <OrderDetailModal
        open={!!viewingOrder}
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
      />
    </div>
  );
}
