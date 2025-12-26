import React, { useState, useEffect } from "react";
import { Modal, Form, InputNumber, Button, Select, Space, Typography, List, message } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Order, OrderStatus } from "@/types/api/orders";
import { Ingredients } from "@/types/api/ingredients";
import { ordersService } from "@/services/orders.service";
import axios from "axios";
import { useSocket } from "@/hooks/useSocket";

const { Text } = Typography;

interface EditOrderModalProps {
    order: Order | null;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditOrderModal({ order, open, onClose, onSuccess }: EditOrderModalProps) {
    const [loading, setLoading] = useState(false);
    const [ingredients, setIngredients] = useState<Ingredients[]>([]);
    // Local state for items: { ingredient_id, quantity_ordered, display_name, unit_name }
    const [items, setItems] = useState<{ ingredient_id: string; quantity_ordered: number; display_name: string; unit_name: string }[]>([]);
    const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);
    const { socket } = useSocket();

    // Listen for real-time updates for the current order
    useEffect(() => {
        if (!socket || !order || !open) return;

        const handleUpdate = (payload: { action: string, data?: Order }) => {
            const { action, data } = payload;
            if (!data || data.id !== order.id) return;

            if (action === "update_order" || action === "update_item_detail") {
                message.info("ข้อมูลออเดอร์มีการเปลี่ยนแปลงจากระบบ");
                const mappedItems = data.ordersItems?.map(item => ({
                    ingredient_id: item.ingredient_id,
                    quantity_ordered: item.quantity_ordered,
                    display_name: item.ingredient?.display_name || 'Unknown',
                    unit_name: item.ingredient?.unit?.display_name || '-'
                })) || [];
                setItems(mappedItems);
            } else if (action === "update_status") {
                if (data.status !== OrderStatus.PENDING) {
                    message.warning(`สถานะออเดอร์เปลี่ยนเป็น ${data.status} ปิดการแก้ไข`);
                    onClose();
                }
            }
        };

        socket.on("orders_updated", handleUpdate);
        return () => {
            socket.off("orders_updated", handleUpdate);
        };
    }, [socket, order, open, onClose]);

    // Fetch ingredients for adding new items
    useEffect(() => {
        const fetchIngredients = async () => {
            try {
                const response = await axios.get("/api/ingredients/getAll");
                setIngredients(response.data.filter((i: Ingredients) => i.is_active));
            } catch (error) {
                console.error("Failed to load ingredients");
            }
        };
        fetchIngredients();
    }, []);

    // Initialize items when order changes
    useEffect(() => {
        if (order && open) {
            const mappedItems = order.ordersItems?.map(item => ({
                ingredient_id: item.ingredient_id,
                quantity_ordered: item.quantity_ordered,
                display_name: item.ingredient?.display_name || 'Unknown',
                unit_name: item.ingredient?.unit?.display_name || '-'
            })) || [];
            setItems(mappedItems);
        }
    }, [order, open]);

    const handleAddItem = () => {
        if (!selectedIngredient) return;
        const ing = ingredients.find(i => i.id === selectedIngredient);
        if (!ing) return;

        // Check if already exists
        const exists = items.find(i => i.ingredient_id === selectedIngredient);
        if (exists) {
            message.warning("สินค้านี้มีอยู่ในรายการแล้ว");
            return;
        }

        setItems([...items, {
            ingredient_id: ing.id,
            quantity_ordered: 1,
            display_name: ing.display_name,
            unit_name: ing.unit?.display_name || '-'
        }]);
        setSelectedIngredient(null);
    };

    const handleRemoveItem = (ingredientId: string) => {
        setItems(items.filter(i => i.ingredient_id !== ingredientId));
    };

    const handleUpdateQuantity = (ingredientId: string, quantity: number | null) => {
         if (quantity === null) return;
        setItems(items.map(i => i.ingredient_id === ingredientId ? { ...i, quantity_ordered: quantity } : i));
    };

    const handleSave = async () => {
        if (!order) return;
        if (items.length === 0) {
            message.error("ออเดอร์ต้องมีสินค้าอย่างน้อย 1 ชิ้น");
            return;
        }

        setLoading(true);
        try {
            const payload = items.map(i => ({ ingredient_id: i.ingredient_id, quantity_ordered: i.quantity_ordered }));
            await ordersService.updateOrder(order.id, payload);
            message.success("แก้ไขออเดอร์สำเร็จ");
            onSuccess();
            onClose();
        } catch (error: any) {
             message.error(error.message || "แก้ไขออเดอร์ล้มเหลว");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={`แก้ไขออเดอร์ #${order?.id.substring(0, 8)}`}
            open={open}
            onCancel={onClose}
            onOk={handleSave}
            confirmLoading={loading}
            width={600}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                 <div style={{ display: 'flex', gap: 8 }}>
                    <Select
                        style={{ flex: 1 }}
                        placeholder="เลือกสินค้าเพิ่ม"
                        showSearch
                        value={selectedIngredient}
                        onChange={setSelectedIngredient}
                        filterOption={(input, option: any) =>
                             (option?.searchText ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={ingredients.map(ing => ({ 
                            value: ing.id, 
                            searchText: ing.display_name,
                            label: (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <img 
                                        src={ing.img_url || 'https://placehold.co/40x40?text=No+Img'} 
                                        alt={ing.display_name}
                                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                                    />
                                    <span>{ing.display_name}</span>
                                </div>
                            )
                        }))}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddItem}>เพิ่ม</Button>
                </div>

                <List
                    dataSource={items}
                    renderItem={item => (
                        <List.Item
                            actions={[
                                <Button key="delete" danger type="text" icon={<MinusCircleOutlined />} onClick={() => handleRemoveItem(item.ingredient_id)} />
                            ]}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 16 }}>
                                <Text strong style={{ flex: 1 }}>{item.display_name}</Text>
                                <InputNumber 
                                    min={1} 
                                    value={item.quantity_ordered} 
                                    onChange={(v) => handleUpdateQuantity(item.ingredient_id, v)} 
                                />
                                <Text type="secondary" style={{ width: 60 }}>{item.unit_name}</Text>
                            </div>
                        </List.Item>
                    )}
                />
            </Space>
        </Modal>
    );
}
