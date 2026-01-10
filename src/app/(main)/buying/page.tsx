"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Typography, Button, message, Modal, Spin } from "antd";
import { ShoppingCartOutlined, CloseOutlined } from "@ant-design/icons";
import { Order } from "../../../types/api/orders";
import { useAuth } from "../../../contexts/AuthContext";
import { useSocket } from "../../../hooks/useSocket";
import { authService } from "../../../services/auth.service";
import { 
    BuyingPageStyles,
    pageStyles,
    PageHeader,
    StatsCard,
    PurchaseItemCard,
    ModalHeader,
    ModalItemCard,
    WarningBanner
} from "./style";

const { Text } = Typography;

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
            const response = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
            if (!response.ok) throw new Error("Failed to load order");
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
            message.error("Failed to load order");
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

        socket.on("orders_updated", (event) => {
            if (event.action === "update_order" && event.data.id === orderId) {
                fetchOrder();
                message.info("ออเดอร์มีการเปลี่ยนแปลงข้อมูล");
            }
            
            if ((event.action === "update_status" || event.action === "delete") && 
                (event.data?.id === orderId || event.id === orderId)) {
                
                const status = event.data?.status;
                if (event.action === "delete") {
                    message.warning("ออเดอร์นี้ถูกยกเลิกเสร็จสิ้นแล้ว");
                    router.push("/items");
                } else if (status && status !== "pending") {
                     if (status === "completed") {
                        message.success("การสั่งซื้อดำเนินการเสร็จสิ้นแล้ว");
                     } else {
                        message.warning("ออเดอร์นี้ถูกยกเลิกเสร็จสิ้นแล้ว");
                     }
                     router.push("/items");
                }
            }
        });

        return () => {
            socket.off("orders_updated");
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
            message.error("User not found");
            return;
        }
        try {
            setLoading(true);
            const payload = items.map(i => ({
                ingredient_id: i.ingredient_id,
                actual_quantity: i.is_purchased ? i.actual_quantity : 0,
                is_purchased: i.is_purchased
            }));
            
            const response = await fetch(`/api/orders/${orderId}/purchase`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({ items: payload, purchased_by_id: user.id })
            });

            if (!response.ok) throw new Error("Failed to confirm purchase");

            message.success("บันทึกการสั่งซื้อเรียบร้อย");
            setConfirmModalOpen(false);
            router.push("/history");
        } catch (error) {
            console.error(error);
            message.error("Failed to confirm purchase");
        } finally {
            setLoading(false);
        }
    };

    const purchasedItems = items.filter(i => i.is_purchased);
    const notPurchasedItems = items.filter(i => !i.is_purchased);
    const hasSelectedItems = purchasedItems.length > 0;

    if (!orderId) {
        return (
            <div style={{ 
                padding: 24, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                minHeight: '100vh',
                flexDirection: 'column',
                gap: 16
            }}>
                <ShoppingCartOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <Text type="secondary">กรุณาเลือกออเดอร์ก่อน</Text>
                <Button type="primary" onClick={() => router.push('/items')}>
                    กลับหน้าหลัก
                </Button>
            </div>
        );
    }

    if (loading && !order) {
        return (
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                minHeight: '100vh'
            }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="buying-page" style={pageStyles.container}>
            <BuyingPageStyles />
            
            {/* Header */}
            <PageHeader orderId={order?.id} onBack={() => router.back()} />
            
            {/* Stats Card */}
            <StatsCard 
                totalItems={items.length}
                purchasedItems={purchasedItems.length}
                notPurchasedItems={notPurchasedItems.length}
            />

            {/* Items List */}
            <div style={pageStyles.listContainer}>
                <div style={pageStyles.sectionTitle}>
                    <ShoppingCartOutlined style={{ fontSize: 18, color: '#52c41a' }} />
                    <Text strong style={{ fontSize: 16, color: '#1a1a2e' }}>
                        รายการสินค้า
                    </Text>
                    <div style={{
                        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600
                    }}>
                        {items.length} รายการ
                    </div>
                </div>

                {items.map((item, index) => (
                    <PurchaseItemCard
                        key={item.ingredient_id}
                        item={item}
                        index={index}
                        onCheck={handleCheck}
                        onQuantityChange={handleQuantityChange}
                        onSetFullAmount={handleSetFullAmount}
                    />
                ))}
            </div>

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
