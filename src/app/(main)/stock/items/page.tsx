"use client";

import React, { useEffect, useState, useCallback } from "react";
import { 
  Table, 
  Tag, 
  Typography, 
  Card, 
  Space, 
  Button, 
  message, 
  Modal, 
  Badge,
  Empty,
  Tooltip,
  Skeleton,
  Row,
  Col,
  Statistic,
  Avatar
} from "antd";
import { 
  ReloadOutlined, 
  EditOutlined, 
  CloseCircleOutlined, 
  EyeOutlined, 
  ShoppingCartOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  UserOutlined,
  CalendarOutlined
} from "@ant-design/icons";
import { Order, OrderStatus } from "../../../../types/api/stock/orders";
import EditOrderModal from "../../../../components/stock/EditOrderModal";
import OrderDetailModal from "../../../../components/stock/OrderDetailModal";
import { useSocket } from "../../../../hooks/useSocket";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import { authService } from "../../../../services/auth.service";
import ItemsPageStyle from "./style";
import PageContainer from "@/components/ui/page/PageContainer";
import PageSection from "@/components/ui/page/PageSection";
import PageStack from "@/components/ui/page/PageStack";
import UIPageHeader from "@/components/ui/page/PageHeader";
import UIEmptyState from "@/components/ui/states/EmptyState";
import { LegacyRealtimeEvents, RealtimeEvents } from "../../../../utils/realtimeEvents";

const { Text } = Typography;

export default function ItemsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const router = useRouter();
  const { user } = useAuth();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/stock/orders?status=pending", { 
        cache: "no-store", 
        headers: { 'Content-Type': 'application/json' } 
      });
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      const data = await response.json();
      // Handle paginated response format: { data: [...], total, page, limit }
      setOrders(Array.isArray(data) ? data : (data.data || []));
    } catch {
      console.error("Failed to fetch orders");
      message.error("ไม่สามารถโหลดรายการออเดอร์ได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!socket) return;

    const handleCreate = (data: Order) => {
      if (data && data.status === OrderStatus.PENDING) {
        setOrders(prev => [data, ...prev]);
        message.success("New stock order received.");
      }
    };

    const handleUpdate = (data: Order) => {
      if (!data) return;
      if (data.status === OrderStatus.PENDING) {
        setOrders(prev => prev.map(order => order.id === data.id ? data : order));
      } else {
        setOrders(prev => prev.filter(order => order.id !== data.id));
      }
    };

    const handleStatus = (data: Order) => {
      if (!data) return;
      if (data.status === OrderStatus.PENDING) {
        setOrders(prev => prev.map(order => order.id === data.id ? data : order));
      } else {
        setOrders(prev => prev.filter(order => order.id !== data.id));
      }
      message.info("Order status updated.");
    };

    const handleDelete = (payload: { id?: string }) => {
      if (payload?.id) {
        setOrders(prev => prev.filter(order => order.id !== payload.id));
        message.warning("Order deleted.");
      }
    };

    const handleDetailUpdate = (payload: { orderId?: string }) => {
      if (payload?.orderId) {
        fetchOrders();
      }
    };

    const handleLegacyUpdate = (payload: { action: string; data?: Order; id?: string; orderId?: string }) => {
      const { action, data, id, orderId } = payload;
      switch (action) {
        case "create":
          if (data && data.status === OrderStatus.PENDING) {
            setOrders(prev => [data, ...prev]);
            message.success("New stock order received.");
          }
          break;
        case "update_status":
          if (data) {
            if (data.status === OrderStatus.PENDING) {
              setOrders(prev => prev.map(order => order.id === data.id ? data : order));
            } else {
              setOrders(prev => prev.filter(order => order.id !== data.id));
            }
            message.info("Order status updated.");
          }
          break;
        case "delete":
          if (id) {
            setOrders(prev => prev.filter(order => order.id !== id));
            message.warning("Order deleted.");
          }
          break;
        case "update_item_detail":
          if (orderId) {
            fetchOrders();
          }
          break;
        default:
          fetchOrders();
          break;
      }
    };

    socket.on(RealtimeEvents.stockOrders.create, handleCreate);
    socket.on(RealtimeEvents.stockOrders.update, handleUpdate);
    socket.on(RealtimeEvents.stockOrders.status, handleStatus);
    socket.on(RealtimeEvents.stockOrders.delete, handleDelete);
    socket.on(RealtimeEvents.stockOrders.detailUpdate, handleDetailUpdate);
    socket.on(LegacyRealtimeEvents.stockOrdersUpdated, handleLegacyUpdate);

    return () => {
      socket.off(RealtimeEvents.stockOrders.create, handleCreate);
      socket.off(RealtimeEvents.stockOrders.update, handleUpdate);
      socket.off(RealtimeEvents.stockOrders.status, handleStatus);
      socket.off(RealtimeEvents.stockOrders.delete, handleDelete);
      socket.off(RealtimeEvents.stockOrders.detailUpdate, handleDetailUpdate);
      socket.off(LegacyRealtimeEvents.stockOrdersUpdated, handleLegacyUpdate);
    };
  }, [socket, fetchOrders]);

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

    const [csrfToken, setCsrfToken] = useState<string>("");

    useEffect(() => {
        const fetchCsrf = async () => {
             try {
                const token = await authService.getCsrfToken();
                setCsrfToken(token);
             } catch (error) {
                console.error("Failed to fetch CSRF token", error);
             }
        };
        fetchCsrf();
    }, []);

    const handleCancelOrder = (order: Order) => {
    Modal.confirm({
      title: (
        <Space>
          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
          <span>ยืนยันการยกเลิกออเดอร์</span>
        </Space>
      ),
      content: (
        <div style={{ marginTop: 16 }}>
          <Text>คุณต้องการยกเลิกออเดอร์นี้หรือไม่?</Text>
          <div style={{ 
            marginTop: 12, 
            padding: 12, 
            background: 'rgba(255, 77, 79, 0.05)', 
            borderRadius: 8,
            border: '1px solid rgba(255, 77, 79, 0.1)'
          }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              ผู้สั่ง: <strong>{order.ordered_by?.name || order.ordered_by?.username}</strong>
            </Text>
          </div>
        </div>
      ),
      okText: 'ยืนยันยกเลิก',
      cancelText: 'ไม่ยกเลิก',
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        try {
          const response = await fetch(`/api/stock/orders/${order.id}/status`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({ status: OrderStatus.CANCELLED })
          });

          if (!response.ok) {
            throw new Error("Failed to cancel order");
          }
          
          message.success("ยกเลิกออเดอร์สำเร็จ");
        } catch {
          message.error("ยกเลิกออเดอร์ล้มเหลว");
        }
      }
    });
  };

  // Calculate total items count
  const totalItems = orders.reduce((acc, order) => 
    acc + (order.ordersItems?.length || 0), 0
  );

  const columns = [
    {
      title: (
        <Space>
          <UserOutlined />
          <span>ผู้สั่ง</span>
        </Space>
      ),
      dataIndex: 'ordered_by',
      key: 'ordered_by',
      width: 140,
      render: (ordered_by: { name?: string; username?: string } | null) => {
        const displayName = ordered_by?.name || ordered_by?.username || 'Unknown';
        return (
        <Space>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14
          }}>
            {displayName.charAt(0)?.toUpperCase() || '?'}
          </div>
          <Text strong style={{ fontSize: 14 }}>{displayName}</Text>
        </Space>
      )},
    },
    {
      title: (
        <Space>
          <InboxOutlined />
          <span>รายการสินค้า</span>
        </Space>
      ),
      dataIndex: 'ordersItems',
      key: 'items',
      render: (items: { id: string; quantity_ordered: number; ingredient?: { display_name: string; img_url?: string; unit?: { display_name: string } } }[]) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {(items || []).slice(0, 3).map((item) => (
            <span key={item.id} className="order-item-badge">
              <Avatar
                  src={item.ingredient?.img_url || 'https://placehold.co/32x32/f5f5f5/999999?text=📦'}
                  size={24}
                  shape="square"
                  style={{ borderRadius: 6, marginRight: 8 }}
              />
              <Text strong style={{ color: '#5b6af8', fontSize: 13 }}>
                {item.ingredient?.display_name}
              </Text>
              <Text style={{ color: '#8c8c8c', marginLeft: 6, fontSize: 12 }}>
                ×{item.quantity_ordered} {item.ingredient?.unit?.display_name}
              </Text>
            </span>
          ))}
          {items && items.length > 3 && (
            <Tooltip title={items.slice(3).map(i => i.ingredient?.display_name).join(', ')}>
              <Tag color="purple" style={{ borderRadius: 20, cursor: 'pointer' }}>
                +{items.length - 3} รายการ
              </Tag>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: OrderStatus) => {
        let config: { color: string; icon: React.ReactNode; text: string } = { color: 'default', icon: <ClockCircleOutlined />, text: status };
        if (status === OrderStatus.PENDING) {
          config = { color: 'warning', icon: <ClockCircleOutlined />, text: 'รอดำเนินการ' };
        }
        if (status === OrderStatus.COMPLETED) {
          config = { color: 'success', icon: <InboxOutlined />, text: 'เสร็จสิ้น' };
        }
        if (status === OrderStatus.CANCELLED) {
          config = { color: 'error', icon: <CloseCircleOutlined />, text: 'ยกเลิก' };
        }
        return (
          <Tag 
            color={config.color} 
            icon={config.icon}
            style={{ 
              borderRadius: 20, 
              padding: '4px 12px',
              fontWeight: 500,
              fontSize: 13
            }}
          >
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: (
        <Space>
          <CalendarOutlined />
          <span>วันที่สั่ง</span>
        </Space>
      ),
      dataIndex: 'create_date',
      key: 'create_date',
      width: 150,
      render: (date: string) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {new Date(date).toLocaleDateString('th-TH', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          })}
          <br />
          <Text style={{ fontSize: 12, color: '#bfbfbf' }}>
            {new Date(date).toLocaleTimeString('th-TH', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </Text>
      ),
    },
    {
      title: 'การจัดการ',
      key: 'actions',
      width: 280,
      render: (_: unknown, record: Order) => (
        <Space size={8} wrap>
          <Tooltip title="ดูรายละเอียด">
            <Button 
              className="action-btn"
              size="middle"
              icon={<EyeOutlined />}
              onClick={() => setViewingOrder(record)}
              style={{
                borderColor: '#667eea',
                color: '#667eea'
              }}
            >
              ดู
            </Button>
          </Tooltip>
          
          {(user?.role === 'Admin' || user?.role === 'Manager') && (
            <Tooltip title="ดำเนินการสั่งซื้อ">
              <Button
                className="action-btn"
                type="primary"
                size="middle"
                icon={<ShoppingCartOutlined />}
                disabled={record.status !== OrderStatus.PENDING}
                onClick={() => router.push(`/stock/buying?orderId=${record.id}`)}
                style={{
                  background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                  borderColor: 'transparent',
                  boxShadow: '0 2px 8px rgba(82, 196, 26, 0.3)'
                }}
              >
                สั่งซื้อ
              </Button>
            </Tooltip>
          )}
          
          <Tooltip title="แก้ไขออเดอร์">
            <Button 
              className="action-btn"
              type="primary"
              ghost
              size="middle"
              icon={<EditOutlined />}
              disabled={record.status !== OrderStatus.PENDING}
              onClick={() => setEditingOrder(record)}
            >
              แก้ไข
            </Button>
          </Tooltip>
          
          <Tooltip title="ยกเลิกออเดอร์">
            <Button 
              className="action-btn"
              danger
              size="middle"
              icon={<CloseCircleOutlined />}
              disabled={record.status !== OrderStatus.PENDING}
              onClick={() => handleCancelOrder(record)}
            >
              ยกเลิก
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ 
          padding: 16, 
          borderBottom: '1px solid rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <Skeleton.Avatar active size={40} />
          <Skeleton active paragraph={{ rows: 1, width: ['80%'] }} title={false} />
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ 
      padding: '24px', 
      paddingBottom: 120,
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f8f9fc 0%, #f0f2f5 100%)'
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <UIPageHeader
        title="รายการรอสั่งซื้อ"
        subtitle={`${orders.length} รายการ`}
        icon={<ClockCircleOutlined />}
        actions={
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchOrders}
            loading={loading}
          >
            รีเฟรช
          </Button>
        }
      />

      <PageContainer>
        <PageStack>
          <PageSection title="สรุป">
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8} md={6}>
                <Card 
                  className="status-card"
                  size="small"
                  styles={{ body: { padding: 16 } }}
                >
                  <Statistic 
                    title={<Text type="secondary" style={{ fontSize: 13 }}>ออเดอร์ทั้งหมด</Text>}
                    value={loading ? '-' : orders.length}
                    prefix={<Badge status="processing" />}
                    styles={{ content: { 
                      color: '#667eea', 
                      fontWeight: 700,
                      fontSize: 28
                    }}}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Card 
                  className="status-card"
                  size="small"
                  styles={{ body: { padding: 16 } }}
                >
                  <Statistic 
                    title={<Text type="secondary" style={{ fontSize: 13 }}>รายการสินค้า</Text>}
                    value={loading ? '-' : totalItems}
                    prefix={<Badge status="success" />}
                    styles={{ content: { 
                      color: '#52c41a', 
                      fontWeight: 700,
                      fontSize: 28
                    }}}
                  />
                </Card>
              </Col>
            </Row>
          </PageSection>

          <PageSection title="รายการรอสั่งซื้อ">
            <Card 
              variant="borderless"
              style={{ 
                borderRadius: 20,
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
                overflow: 'hidden'
              }}
              styles={{ body: { padding: 0 } }}
            >
              {loading ? (
                <LoadingSkeleton />
              ) : orders.length === 0 ? (
                <UIEmptyState
                  title="ยังไม่มีรายการรอสั่งซื้อ"
                  description="ยังไม่มีออเดอร์ที่รอการสั่งซื้อในขณะนี้"
                  action={
                    <Button 
                      type="primary"
                      icon={<ShoppingCartOutlined />}
                      size="large"
                      onClick={() => router.push('/')}
                      style={{
                        borderRadius: 10,
                        height: 48,
                        paddingInline: 32,
                        fontWeight: 600
                      }}
                    >
                      เลือกวัตถุดิบเพื่อสั่งซื้อ
                    </Button>
                  }
                />
              ) : (
                <Table 
                  dataSource={orders} 
                  columns={columns} 
                  rowKey="id" 
                  scroll={{ x: 900 }}
                  pagination={{ 
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total, range) => (
                      <Text type="secondary">
                        แสดง {range[0]}-{range[1]} จาก {total} รายการ
                      </Text>
                    )
                  }}
                  className="items-table"
                  locale={{
                    emptyText: <Empty description="ไม่มีข้อมูล" />
                  }}
                />
              )}
            </Card>
          </PageSection>
        </PageStack>
      </PageContainer>
      </div>

      {/* Modals */}
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

      <ItemsPageStyle />
    </div>
  );
}
