"use client";

import React, { useEffect, useState } from "react";
import { message, Modal, Spin, Pagination } from "antd";
import { HistoryOutlined } from "@ant-design/icons";
import { Order, OrderStatus } from "../../../../types/api/stock/orders";
import OrderDetailModal from "../../../../components/stock/OrderDetailModal";
import { useSocket } from "../../../../hooks/useSocket";
import { useAuth } from "../../../../contexts/AuthContext";
import { authService } from "../../../../services/auth.service";
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
    
    // Pagination State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

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

    const fetchOrders = async (currentPage = 1, limit = 10) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/stock/orders?status=completed,cancelled&page=${currentPage}&limit=${limit}`, { cache: "no-store" });
            if (!response.ok) throw new Error("Failed to fetch orders");
            const result = await response.json();
            
            // Handle both legacy array response (if API not updated yet) and new paginated response
            if (Array.isArray(result)) {
                setOrders(result);
                setTotal(result.length);
            } else {
                setOrders(result.data);
                setTotal(result.total);
            }
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
                    const response = await fetch(`/api/stock/orders/${order.id}`, { 
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) throw new Error("Failed to delete order");
                    
                    message.success("ลบประวัติออเดอร์สำเร็จ");
                    // Refresh current page
                    fetchOrders(page, pageSize);
                } catch {
                    message.error("ลบประวัติออเดอร์ล้มเหลว");
                }
            }
        });
    };

    useEffect(() => {
        fetchOrders(page, pageSize);
    }, [page, pageSize]);

    // Listen for updates but only refresh if we are on the first page or it's a general update
    useEffect(() => {
        if (!socket) return;
        
        socket.on("orders_updated", () => {
             fetchOrders(page, pageSize);
        });

        return () => {
            socket.off("orders_updated");
        };
    }, [socket, page, pageSize]);

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
            <PageHeader onRefresh={() => fetchOrders(page, pageSize)} loading={loading} />
            
            {/* Stats Card (Might need separate API for true totals if pagination is on, but for now using current page stats or we can remove/update logic later) */}
            <StatsCard 
                totalOrders={total}
                completedOrders={completedOrders.length} // Note: This only counts current page! Ideally backend should return stats.
                cancelledOrders={cancelledOrders.length} // Note: This only counts current page!
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
                                {total} รายการ
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

                        {/* Pagination */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                            <Pagination
                                current={page}
                                pageSize={pageSize}
                                total={total}
                                onChange={(p, s) => {
                                    setPage(p);
                                    setPageSize(s);
                                }}
                                showSizeChanger
                                showTotal={(total) => `ทั้งหมด ${total} รายการ`}
                            />
                        </div>
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
