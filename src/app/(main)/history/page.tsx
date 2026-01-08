"use client";

import React, { useEffect, useState } from "react";
import { message, Modal, Spin } from "antd";
import { HistoryOutlined } from "@ant-design/icons";
import { Order, OrderStatus } from "../../../types/api/orders";
import OrderDetailModal from "../../../components/OrderDetailModal";
import { useSocket } from "../../../hooks/useSocket";
import { useAuth } from "../../../contexts/AuthContext";
import {
    HistoryPageStyles,
    pageStyles,
    PageHeader,
    StatsCard,
    OrderCard,
    EmptyState
} from "./style";

export default function HistoryPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const { socket } = useSocket();
    const { user } = useAuth();

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/orders", { cache: "no-store" });
            if (!response.ok) throw new Error("Failed to fetch orders");
            const data = await response.json();
            
            // Show only Completed or Cancelled, sorted by date desc
            const filteredOrders = data
                .filter((order: Order) => 
                    order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED
                )
                .sort((a: Order, b: Order) => 
                    new Date(b.create_date).getTime() - new Date(a.create_date).getTime()
                );
            setOrders(filteredOrders);
        } catch {
            console.error("Failed to fetch orders");
            message.error("ไม่สามารถโหลดประวัติออเดอร์ได้");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOrder = (order: Order) => {
        Modal.confirm({
            title: 'ยืนยันการลบ',
            content: `คุณต้องการลบประวัติออเดอร์ #${order.id.substring(0, 8).toUpperCase()} หรือไม่? ข้อมูลที่เกี่ยวข้องทั้งหมดจะถูกลบด้วย`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            onOk: async () => {
                try {
                    const response = await fetch(`/api/orders/${order.id}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error("Failed to delete order");
                    
                    message.success("ลบประวัติออเดอร์สำเร็จ");
                    setOrders(prev => prev.filter(o => o.id !== order.id));
                } catch {
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
        
        socket.on("orders_updated", () => {
            fetchOrders();
        });

        return () => {
            socket.off("orders_updated");
        };
    }, [socket]);

    const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED);
    const cancelledOrders = orders.filter(o => o.status === OrderStatus.CANCELLED);
    const isAdmin = user?.role === 'Admin';

    if (loading && orders.length === 0) {
        return (
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                minHeight: '100vh',
                flexDirection: 'column',
                gap: 16
            }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="history-page" style={pageStyles.container}>
            <HistoryPageStyles />
            
            {/* Header */}
            <PageHeader onRefresh={fetchOrders} loading={loading} />
            
            {/* Stats Card */}
            <StatsCard 
                totalOrders={orders.length}
                completedOrders={completedOrders.length}
                cancelledOrders={cancelledOrders.length}
            />

            {/* Orders List */}
            <div style={pageStyles.listContainer}>
                {orders.length > 0 ? (
                    <>
                        <div style={pageStyles.sectionTitle}>
                            <HistoryOutlined style={{ fontSize: 18, color: '#667eea' }} />
                            <span style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>
                                ประวัติทั้งหมด
                            </span>
                            <div style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 600
                            }}>
                                {orders.length} รายการ
                            </div>
                        </div>

                        {orders.map((order, index) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                index={index}
                                onView={setViewingOrder}
                                onDelete={handleDeleteOrder}
                                isAdmin={isAdmin}
                            />
                        ))}
                    </>
                ) : (
                    <EmptyState />
                )}
            </div>
            
            {/* Order Detail Modal */}
            <OrderDetailModal
                open={!!viewingOrder}
                order={viewingOrder}
                onClose={() => setViewingOrder(null)}
            />
        </div>
    );
}
