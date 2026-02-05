"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, message, Modal, Spin } from "antd";
import { ShoppingCartOutlined, CloseOutlined } from "@ant-design/icons";
import { Order } from "../../../../types/api/stock/orders";
import { useAuth } from "../../../../contexts/AuthContext";
import { useSocket } from "../../../../hooks/useSocket";
import { authService } from "../../../../services/auth.service";
import { 
    BuyingPageStyles,
    pageStyles,
    StatsCard,
    PurchaseItemCard,
    ModalHeader,
    ModalItemCard,
    WarningBanner
} from "./style";
import PageContainer from "@/components/ui/page/PageContainer";
import PageSection from "@/components/ui/page/PageSection";
import PageStack from "@/components/ui/page/PageStack";
import UIPageHeader from "@/components/ui/page/PageHeader";
import UIEmptyState from "@/components/ui/states/EmptyState";
import { LegacyRealtimeEvents, RealtimeEvents } from "../../../../utils/realtimeEvents";

interface PurchaseItemState {
    ingredient_id: string;
    actual_quantity: number;
    ordered_quantity: number;
    is_purchased: boolean;
    display_name: string;
    description?: string;
    unit_name: string;
    img_url?: string;
}

export default function BuyingPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get("orderId");
    const { user } = useAuth();

    const [order, setOrder] = useState<Order | null>(null);
    const [items, setItems] = useState<PurchaseItemState[]>([]);
    const [loading, setLoading] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const { socket } = useSocket();

    const fetchOrder = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/stock/orders/${orderId}`, { cache: "no-store" });
            if (!response.ok) throw new Error("ไม่สามารถโหลดออเดอร์ได้");
            const data = await response.json();
            
            setOrder(data);
            
            const initialItems = data.ordersItems?.map((item: unknown) => {
                const i = item as {
                    ingredient_id: string;
                    quantity_ordered: number;
                    ingredient?: {
                        display_name?: string;
                        description?: string;
                        unit?: { display_name?: string };
                        img_url?: string;
                    }
                };
                return {
                    ingredient_id: i.ingredient_id,
                    actual_quantity: i.quantity_ordered,
                    ordered_quantity: i.quantity_ordered,
                    is_purchased: false,
                    display_name: i.ingredient?.display_name || 'Unknown',
                    description: i.ingredient?.description || '',
                    unit_name: i.ingredient?.unit?.display_name || '-',
                    img_url: i.ingredient?.img_url
                };
            }) || [];
            setItems(initialItems);
        } catch {
            message.error("ไม่สามารถโหลดออเดอร์ได้");
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }
        if (user.role !== "Admin" && user.role !== "Manager") {
            message.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
            router.push("/items");
            return;
        }
        if (orderId) {
            fetchOrder();
        }
    }, [orderId, user, fetchOrder, router]);

    useEffect(() => {
        if (!socket || !orderId) return;

        const handleOrderUpdate = (updated: Order) => {
            if (updated?.id !== orderId) return;
            fetchOrder();
            message.info("Order updated.");
        };

        const handleStatusUpdate = (updated: Order) => {
            if (updated?.id !== orderId) return;
            if (updated.status && updated.status !== "pending") {
                if (updated.status === "completed") {
                    message.success("Purchase completed.");
                } else {
                    message.warning("Order was cancelled.");
                }
                router.push("/stock/items");
            }
        };

        const handleDelete = (payload: { id?: string }) => {
            if (payload?.id !== orderId) return;
            message.warning("Order was deleted.");
            router.push("/stock/items");
        };

        const handleDetailUpdate = (payload: { orderId?: string }) => {
            if (payload?.orderId !== orderId) return;
            fetchOrder();
        };

        const handleLegacyUpdate = (event: { action?: string; data?: Order; id?: string }) => {
            if (event.action === "update_order" && event.data?.id === orderId) {
                fetchOrder();
                message.info("Order updated.");
            }

            if ((event.action === "update_status" || event.action === "delete") &&
                (event.data?.id === orderId || event.id === orderId)) {

                const status = event.data?.status;
                if (event.action === "delete") {
                    message.warning("Order was deleted.");
                    router.push("/stock/items");
                } else if (status && status !== "pending") {
                     if (status === "completed") {
                        message.success("Purchase completed.");
                     } else {
                        message.warning("Order was cancelled.");
                     }
                     router.push("/stock/items");
                }
            }
        };

        socket.on(RealtimeEvents.stockOrders.update, handleOrderUpdate);
        socket.on(RealtimeEvents.stockOrders.status, handleStatusUpdate);
        socket.on(RealtimeEvents.stockOrders.delete, handleDelete);
        socket.on(RealtimeEvents.stockOrders.detailUpdate, handleDetailUpdate);
        socket.on(LegacyRealtimeEvents.stockOrdersUpdated, handleLegacyUpdate);

        return () => {
            socket.off(RealtimeEvents.stockOrders.update, handleOrderUpdate);
            socket.off(RealtimeEvents.stockOrders.status, handleStatusUpdate);
            socket.off(RealtimeEvents.stockOrders.delete, handleDelete);
            socket.off(RealtimeEvents.stockOrders.detailUpdate, handleDetailUpdate);
            socket.off(LegacyRealtimeEvents.stockOrdersUpdated, handleLegacyUpdate);
        };
    }, [socket, orderId, fetchOrder, router]);

    const handleCheck = (id: string, checked: boolean) => {
        setItems(items.map(i => i.ingredient_id === id ? { ...i, is_purchased: checked } : i));
    };

    const handleQuantityChange = (id: string, val: number | null) => {
        if (val === null) return;
        setItems(items.map(i => i.ingredient_id === id ? { ...i, actual_quantity: val } : i));
    };

    const handleSetFullAmount = (id: string) => {
        setItems(items.map(i => i.ingredient_id === id ? { ...i, actual_quantity: i.ordered_quantity, is_purchased: true } : i));
    };

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

    const confirmPurchase = async () => {
        if (!user) {
            message.error("ไม่พบผู้ใช้งาน");
            return;
        }
        try {
            setLoading(true);
            const payload = items.map(i => ({
                ingredient_id: i.ingredient_id,
                actual_quantity: i.is_purchased ? i.actual_quantity : 0,
                is_purchased: i.is_purchased
            }));
            
            const response = await fetch(`/api/stock/orders/${orderId}/purchase`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({ items: payload, purchased_by_id: user.id })
            });

            if (!response.ok) throw new Error("ไม่สามารถยืนยันการสั่งซื้อได้");

            message.success("บันทึกการสั่งซื้อเรียบร้อย");
            setConfirmModalOpen(false);
            router.push("/stock/history");
        } catch (error) {
            console.error(error);
            message.error("ไม่สามารถยืนยันการสั่งซื้อได้");
        } finally {
            setLoading(false);
        }
    };

    const purchasedItems = items.filter(i => i.is_purchased);
    const notPurchasedItems = items.filter(i => !i.is_purchased);
    const hasSelectedItems = purchasedItems.length > 0;
    const orderCode = order?.id ? order.id.substring(0, 8).toUpperCase() : undefined;

    if (!orderId) {
        return (
            <div className="buying-page" style={pageStyles.container}>
                <BuyingPageStyles />
                <UIPageHeader
                    title="รายละเอียดการสั่งซื้อสินค้า"
                    subtitle="ไม่พบออเดอร์"
                    icon={<ShoppingCartOutlined />}
                    onBack={() => router.back()}
                />
                <PageContainer>
                    <PageSection>
                        <UIEmptyState
                            title="กรุณาเลือกออเดอร์ก่อน"
                            description="เลือกออเดอร์จากหน้ารายการเพื่อดำเนินการสั่งซื้อ"
                            action={(
                                <Button type="primary" onClick={() => router.push('/stock/items')}>
                                    กลับหน้ารายการออเดอร์
                                </Button>
                            )}
                        />
                    </PageSection>
                </PageContainer>
            </div>
        );
    }

    if (loading && !order) {
        return (
            <div className="buying-page" style={pageStyles.container}>
                <BuyingPageStyles />
                <UIPageHeader
                    title="รายละเอียดการสั่งซื้อสินค้า"
                    subtitle="กำลังโหลด"
                    icon={<ShoppingCartOutlined />}
                    onBack={() => router.back()}
                />
                <PageContainer>
                    <PageSection>
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                            <Spin size="large" />
                        </div>
                    </PageSection>
                </PageContainer>
            </div>
        );
    }

    return (
        <div className="buying-page" style={pageStyles.container}>
            <BuyingPageStyles />
            
            <UIPageHeader
                title="รายละเอียดการสั่งซื้อสินค้า"
                subtitle={orderCode ? `ออเดอร์ #${orderCode}` : undefined}
                icon={<ShoppingCartOutlined />}
                onBack={() => router.back()}
            />
            
            <PageContainer>
                <PageStack>
                    <PageSection title="สรุป">
                        <StatsCard 
                            totalItems={items.length}
                            purchasedItems={purchasedItems.length}
                            notPurchasedItems={notPurchasedItems.length}
                        />
                    </PageSection>

                    <PageSection title="รายการสินค้า" extra={<span style={{ fontWeight: 600 }}>{items.length}</span>}>
                        <div style={pageStyles.listContainer}>
                            {items.length > 0 ? (
                                items.map((item, index) => (
                                    <PurchaseItemCard
                                        key={item.ingredient_id}
                                        item={item}
                                        index={index}
                                        onCheck={handleCheck}
                                        onQuantityChange={handleQuantityChange}
                                        onSetFullAmount={handleSetFullAmount}
                                    />
                                ))
                            ) : (
                                <UIEmptyState
                                    title="ยังไม่มีรายการสินค้า"
                                    description="ยังไม่มีรายการสินค้าในออเดอร์นี้"
                                />
                            )}
                        </div>
                    </PageSection>
                </PageStack>
            </PageContainer>

            {/* Floating Footer */}
            <div style={pageStyles.floatingFooter}>
                <Button 
                    type="primary" 
                    size="large" 
                    block 
                    icon={<ShoppingCartOutlined style={{ fontSize: 18 }} />} 
                    onClick={() => setConfirmModalOpen(true)}
                    disabled={!hasSelectedItems}
                    style={pageStyles.confirmButton(hasSelectedItems)}
                >
                    ยืนยันการสั่งซื้อ ({purchasedItems.length} รายการ)
                </Button>
            </div>

            {/* Confirmation Modal */}
            <Modal
                open={confirmModalOpen}
                onCancel={() => setConfirmModalOpen(false)}
                footer={null}
                width={520}
                centered
                className="buying-page-modal"
                styles={pageStyles.modalStyles}
                closeIcon={null}
            >
                {/* Modal Header */}
                <ModalHeader />

                {/* Modal Body */}
                <div style={{ padding: '20px 24px 24px' }}>
                    {/* Purchased Items List */}
                    <div style={{ 
                        maxHeight: 320, 
                        overflowY: 'auto',
                        paddingRight: 4,
                        marginBottom: 16
                    }}>
                        {purchasedItems.map((item, index) => (
                            <ModalItemCard key={item.ingredient_id} item={item} index={index} />
                        ))}
                    </div>

                    {/* Warning for unchecked items */}
                    {notPurchasedItems.length > 0 && (
                        <WarningBanner count={notPurchasedItems.length} />
                    )}

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                        <Button
                            block
                            size="large"
                            onClick={() => setConfirmModalOpen(false)}
                            icon={<CloseOutlined />}
                            style={{
                                height: 48,
                                borderRadius: 12,
                                fontWeight: 600
                            }}
                        >
                            กลับ
                        </Button>
                        <Button
                            type="primary"
                            block
                            size="large"
                            onClick={confirmPurchase}
                            loading={loading}
                            style={{
                                height: 48,
                                borderRadius: 12,
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                                border: 'none',
                                boxShadow: '0 4px 16px rgba(82, 196, 26, 0.35)'
                            }}
                        >
                            ยืนยันการสั่งซื้อ
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
