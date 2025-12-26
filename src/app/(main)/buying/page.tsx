"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, Typography, List, Checkbox, InputNumber, Button, Space, Divider, message, Modal, Avatar } from "antd";
import { ShoppingCartOutlined, ArrowLeftOutlined, CheckOutlined } from "@ant-design/icons";
import { Order } from "@/types/api/orders";
import { ordersService } from "@/services/orders.service";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/hooks/useSocket";

const { Title, Text } = Typography;

interface PurchaseItemState {
    ingredient_id: string;
    actual_quantity: number;
    ordered_quantity: number;
    is_purchased: boolean;
    display_name: string;
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

    useEffect(() => {
        if (orderId) {
            fetchOrder();
        }
    }, [orderId]);

    useEffect(() => {
        if (!socket || !orderId) return;

        socket.on("orders_updated", (event) => {
            // Check if update is relevant to current order
            if (event.action === "update_order" && event.data.id === orderId) {
                // If items changed, we might want to refresh. 
                // However, user might be editing purchase quantities.
                // Simple strategy: Warn or Refresh. Let's Refresh silently for now but user inputs might be lost if we full re-fetch.
                // Better: Just re-fetch to ensure order is still valid.
                fetchOrder();
                message.info("ออเดอร์มีการเปลี่ยนแปลงข้อมูล");
            }
            
            if ((event.action === "update_status" || event.action === "delete") && 
                (event.data?.id === orderId || event.id === orderId)) {
                
                // If status changed to something not pending (e.g. cancelled) or deleted
                // Navigate back
                const status = event.data?.status;
                if (event.action === "delete" || (status && status !== "pending")) {
                    message.warning("ออเดอร์นี้ถูกยกเลิกหรือดำเนินการเสร็จสิ้นแล้ว");
                    router.push("/items");
                }
            }
        });

        return () => {
            socket.off("orders_updated");
        };
    }, [socket, orderId]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const data = await ordersService.getOrderById(orderId!);
            setOrder(data);
            
            // Initialize items state
            const initialItems = data.ordersItems?.map(item => ({
                ingredient_id: item.ingredient_id,
                actual_quantity: item.quantity_ordered, // Default to ordered quantity
                ordered_quantity: item.quantity_ordered,
                is_purchased: false,
                display_name: item.ingredient?.display_name || 'Unknown',
                unit_name: item.ingredient?.unit?.display_name || '-',
                img_url: item.ingredient?.img_url
            })) || [];
            setItems(initialItems);
        } catch (error) {
            message.error("Failed to load order");
        } finally {
            setLoading(false);
        }
    };

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
            
            await ordersService.confirmPurchase(orderId!, payload, user.id); // Assuming user.id is available
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

    if (!orderId) return <div style={{ padding: 24 }}>Select an order first.</div>;

    return (
        <div style={{ padding: 24, paddingBottom: 100 }}>
             <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ marginBottom: 16 }}>Back</Button>
            <Title level={2}>รายการสั่งซื้อ #{order?.id.substring(0, 8)}</Title>
            
            <Card loading={loading}>
                <List
                    itemLayout="horizontal"
                    dataSource={items}
                    renderItem={item => (
                        <List.Item
                            actions={[
                                <Button key="full" size="small" onClick={() => handleSetFullAmount(item.ingredient_id)}>เต็มจำนวน</Button>
                            ]}
                        >
                            <List.Item.Meta
                                avatar={
                                    <Avatar src={item.img_url || 'https://placehold.co/40x40?text=No+Img'} shape="square" size={64} />
                                }
                                title={
                                    <Space>
                                        <Checkbox 
                                            checked={item.is_purchased} 
                                            onChange={(e) => handleCheck(item.ingredient_id, e.target.checked)}
                                        />
                                        <Text strong style={{ fontSize: 16, textDecoration: item.is_purchased ? 'none' : 'gray' }}>
                                            {item.display_name}
                                        </Text>
                                    </Space>
                                }
                                description={
                                    <Space direction="vertical" size={2}>
                                        <Text>สั่ง: <Text strong>{item.ordered_quantity}</Text> {item.unit_name}</Text>
                                        <Space style={{ marginTop: 4 }}>
                                            <Text>ซื้อจริง:</Text>
                                            <InputNumber 
                                                min={0} 
                                                value={item.actual_quantity} 
                                                onChange={(v) => handleQuantityChange(item.ingredient_id, v)}
                                                disabled={!item.is_purchased}
                                                style={{ width: 100 }}
                                            />
                                            <Text>{item.unit_name}</Text>
                                        </Space>
                                    </Space>
                                }
                            />
                        </List.Item>
                    )}
                />

                <Divider />
                <Button 
                    type="primary" 
                    size="large" 
                    block 
                    icon={<ShoppingCartOutlined />} 
                    onClick={() => setConfirmModalOpen(true)}
                    disabled={!items.some(i => i.is_purchased)}
                >
                    ยืนยันการสั่งซื้อ
                </Button>
            </Card>

            <Modal
                title="สรุปรายการสั่งซื้อ"
                open={confirmModalOpen}
                onCancel={() => setConfirmModalOpen(false)}
                onOk={confirmPurchase}
                confirmLoading={loading}
                width={600}
            >
                <List
                    dataSource={items.filter(i => i.is_purchased)}
                    renderItem={item => {
                        const diff = item.actual_quantity - item.ordered_quantity;
                        let diffText = '';
                        let type: 'secondary' | 'success' | 'danger' = 'secondary';
                        if (diff > 0) { diffText = `(เกิน ${diff})`; type = 'success'; }
                        if (diff < 0) { diffText = `(ขาด ${Math.abs(diff)})`; type = 'danger'; }

                        return (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={
                                        <Avatar 
                                            src={item.img_url || 'https://placehold.co/40x40?text=No+Img'} 
                                            shape="square" 
                                            size={48} 
                                        />
                                    }
                                    title={
                                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                            <Text>{item.display_name}</Text>
                                            <Space>
                                                <Text>ซื้อ {item.actual_quantity}</Text>
                                                <Text type="secondary">/ {item.ordered_quantity}</Text>
                                                {diffText && <Text type={type}>{diffText}</Text>}
                                            </Space>
                                        </Space>
                                    }
                                />
                            </List.Item>
                        );
                    }}
                />
                <Divider />
                <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
                    รายการที่ไม่ได้เลือก ({items.filter(i => !i.is_purchased).length}) จะถูกบันทึกว่า "ไม่ได้ซื้อ"
                </Text>
            </Modal>
        </div>
    );
}
