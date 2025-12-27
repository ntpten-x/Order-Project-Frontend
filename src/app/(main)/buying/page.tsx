"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, Typography, List, Checkbox, InputNumber, Button, message, Modal, Avatar, Tag } from "antd";
import { ShoppingCartOutlined, ArrowLeftOutlined, PlusOutlined, MinusOutlined } from "@ant-design/icons";
import { Order } from "@/types/api/orders";

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

    const fetchOrder = useCallback(async () => {
        try {
            setLoading(true);
            // Use Proxy API
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
            
            // Use Proxy API
            const response = await fetch(`/api/orders/${orderId}/purchase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

    if (!orderId) return <div style={{ padding: 24 }}>Select an order first.</div>;

    return (
        <div style={{ paddingBottom: 160, backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
             {/* Header */}
             <div style={{ 
                 position: 'sticky', top: 0, zIndex: 100, 
                 backgroundColor: 'white', padding: '12px 16px', 
                 boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                 display: 'flex', alignItems: 'center'
            }}>
                <Button 
                    type="text" 
                    icon={<ArrowLeftOutlined style={{ fontSize: '18px' }} />} 
                    onClick={() => router.back()} 
                    style={{ marginRight: 8 }}
                />
                <div>
                   <Text type="secondary" style={{ fontSize: 12 }}>ทำการสั่งซื้อ</Text>
                   <Title level={5} style={{ margin: 0 }}>ออเดอร์ #{order?.id?.substring(0, 8) || '...'}</Title>
                </div>
             </div>

            <div style={{ padding: '16px 16px 0 16px' }}>
                <List
                    dataSource={items}
                    renderItem={item => (
                        <Card 
                            style={{ 
                                marginBottom: 12, 
                                borderRadius: 16, 
                                border: 'none',
                                boxShadow: item.is_purchased ? '0 4px 12px rgba(82, 196, 26, 0.15)' : '0 2px 6px rgba(0,0,0,0.02)',
                                opacity: item.is_purchased ? 1 : 0.9,
                                overflow: 'hidden'
                            }}
                            bodyStyle={{ padding: 0 }}
                            onClick={() => !item.is_purchased && handleCheck(item.ingredient_id, true)}
                        >
                            <div style={{ padding: 12, display: 'flex', alignItems: 'flex-start', backgroundColor: item.is_purchased ? '#f6ffed' : 'white' }}>
                                <Checkbox 
                                    checked={item.is_purchased} 
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        handleCheck(item.ingredient_id, e.target.checked);
                                    }}
                                    style={{ marginTop: 4, marginRight: 12, transform: 'scale(1.2)' }}
                                />
                                <Avatar 
                                    src={item.img_url || 'https://placehold.co/40x40?text=No+Img'} 
                                    shape="square" 
                                    size={72} 
                                    style={{ marginRight: 12, borderRadius: 8, flexShrink: 0, border: '1px solid #f0f0f0' }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Text strong style={{ fontSize: 16, marginBottom: 4, maxWidth: '140px' }} ellipsis>
                                            {item.display_name}
                                        </Text>
                                        <Tag color="blue" style={{ marginRight: 0 }}>สั่ง {item.ordered_quantity} {item.unit_name}</Tag>
                                    </div>
                                    
                                    {!item.is_purchased ? (
                                        <div style={{ marginTop: 8 }}>
                                            <Button 
                                                size="middle" 
                                                type="dashed" 
                                                block
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCheck(item.ingredient_id, true);
                                                }}
                                                style={{ color: '#8c8c8c' }}
                                            >
                                                แตะเพื่อเลือกซื้อ
                                            </Button>
                                        </div>
                                    ) : (
                                        <div 
                                            style={{ marginTop: 8 }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <Text style={{ fontSize: 12, color: '#8c8c8c' }}>จำนวนที่ซื้อจริง ({item.unit_name})</Text>
                                                <Text 
                                                    style={{ fontSize: 12, color: '#1890ff', cursor: 'pointer' }}
                                                    onClick={() => handleSetFullAmount(item.ingredient_id)}
                                                >
                                                    เต็มจำนวน
                                                </Text>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Button 
                                                    icon={<MinusOutlined />} 
                                                    onClick={() => {
                                                        const newVal = Math.max(0, item.actual_quantity - 1);
                                                        handleQuantityChange(item.ingredient_id, newVal);
                                                    }}
                                                />
                                                <InputNumber 
                                                    min={0} 
                                                    value={item.actual_quantity} 
                                                    onChange={(v) => handleQuantityChange(item.ingredient_id, v)}
                                                    style={{ flex: 1, textAlign: 'center' }}
                                                    controls={false}
                                                />
                                                <Button 
                                                    icon={<PlusOutlined />} 
                                                    onClick={() => {
                                                        const newVal = item.actual_quantity + 1;
                                                        handleQuantityChange(item.ingredient_id, newVal);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}
                />
            </div>

            {/* Sticky Footer - Lifted up to avoid bottom nav overlap */}
            <div style={{ 
                position: 'fixed', bottom: 70, left: 16, right: 16, 
                zIndex: 99
            }}>
                <Button 
                    type="primary" 
                    size="large" 
                    block 
                    icon={<ShoppingCartOutlined />} 
                    onClick={() => setConfirmModalOpen(true)}
                    disabled={!items.some(i => i.is_purchased)}
                    style={{ 
                        height: 52, 
                        borderRadius: 26, 
                        fontWeight: 'bold',
                        boxShadow: '0 4px 16px rgba(82, 196, 26, 0.4)',
                        backgroundColor: !items.some(i => i.is_purchased) ? undefined : '#52c41a',
                        border: !items.some(i => i.is_purchased) ? undefined : 'none'
                    }}
                >
                    ยืนยันการสั่งซื้อ ({items.filter(i => i.is_purchased).length})
                </Button>
            </div>

            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <ShoppingCartOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                        สรุปรายการสั่งซื้อ
                    </div>
                }
                open={confirmModalOpen}
                onCancel={() => setConfirmModalOpen(false)}
                onOk={confirmPurchase}
                confirmLoading={loading}
                width={600}
                centered
                okText="ยืนยัน"
                cancelText="กลับ"
                okButtonProps={{ size: 'large', style: { backgroundColor: '#52c41a' } }}
                cancelButtonProps={{ size: 'large' }}
            >
                {/* Modal content remains same */}
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <List
                        dataSource={items.filter(i => i.is_purchased)}
                        renderItem={item => {
                            const diff = item.actual_quantity - item.ordered_quantity;
                            let diffText = '';
                            let type: 'secondary' | 'success' | 'danger' = 'secondary';
                            if (diff > 0) { diffText = `(+${diff})`; type = 'success'; }
                            if (diff < 0) { diffText = `(-${Math.abs(diff)})`; type = 'danger'; }

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
                                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                                <Text strong>{item.display_name}</Text>
                                            </div>
                                        }
                                        description={
                                            <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
                                                <Text>ซื้อ: <Text strong>{item.actual_quantity}</Text></Text>
                                                <Text type="secondary" style={{ margin: '0 8px' }}>/</Text>
                                                <Text type="secondary">สั่ง: {item.ordered_quantity}</Text>
                                                {diffText && <Tag color={type === 'success' ? 'green' : 'red'} style={{ marginLeft: 8 }}>{diffText}</Tag>}
                                            </div>
                                        }
                                    />
                                </List.Item>
                            );
                        }}
                    />
                    {items.filter(i => !i.is_purchased).length > 0 && (
                        <div style={{ marginTop: 16, padding: '12px', backgroundColor: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f' }}>
                             <Text type="warning">
                                 มี {items.filter(i => !i.is_purchased).length} รายการที่ <b>&quot;ไม่ได้เลือก&quot;</b> (จะถูกบันทึกว่าไม่ได้ซื้อ)
                             </Text>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
