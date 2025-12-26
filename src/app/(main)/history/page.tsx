"use client";

import React, { useEffect, useState } from "react";
import { Table, Tag, Typography, Card, Space, Button, message, Modal } from "antd";
import { ReloadOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import { Order, OrderStatus } from "@/types/api/orders";
import OrderDetailModal from "@/components/OrderDetailModal";
import { ordersService } from "@/services/orders.service";
import { useSocket } from "@/hooks/useSocket";

const { Title, Text } = Typography;

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const { socket } = useSocket();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersService.getAllOrders();
      // Show only Completed or Cancelled
      setOrders(data.filter((order) => 
        order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED
      ));
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      message.error("ไม่สามารถโหลดประวัติออเดอร์ได้");
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteOrder = (order: Order) => {
    Modal.confirm({
        title: 'ยืนยันการลบ',
        content: `คุณต้องการลบประวัติออเดอร์ ${order.id.substring(0, 8)} หรือไม่? ข้อมูลที่เกี่ยวข้องทั้งหมดจะถูกลบด้วย`,
        okText: 'ลบ',
        okType: 'danger',
        cancelText: 'ยกเลิก',
        onOk: async () => {
            try {
                await ordersService.deleteOrder(order.id);
                message.success("ลบประวัติออเดอร์สำเร็จ");
                // Socket will handle update, or we can optimistic update
                setOrders(prev => prev.filter(o => o.id !== order.id));
            } catch (error) {
                message.error("ลบประวัติออเดอร์ล้มเหลว");
            }
        }
    });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    // Listen for updates to refresh history if a pending item becomes completed/cancelled
    socket.on("orders_updated", () => {
        fetchOrders();
    });

    return () => {
        socket.off("orders_updated");
    };
  }, [socket]);

  const columns = [
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
          {(items || []).map((item) => (
            <div key={item.id}>
              <Text strong>{item.ingredient?.display_name}</Text>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                 x {item.ordersDetail?.is_purchased ? item.ordersDetail.actual_quantity : item.quantity_ordered} {item.ingredient?.unit?.display_name}
              </Text>
              {item.ordersDetail?.is_purchased && item.ordersDetail.actual_quantity !== item.quantity_ordered && (
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                      (จากสั่ง {item.quantity_ordered})
                  </Text>
              )}
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
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteOrder(record)}
                >
                    ลบ
                </Button>
            </Space>
        )
    }
  ];

  return (
    <div style={{ padding: 24, paddingBottom: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Title level={2} style={{ margin: 0 }}>ประวัติการสั่งซื้อ</Title>
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
      
      <OrderDetailModal
        open={!!viewingOrder}
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
      />
    </div>
  );
}
