import React, { useState, useEffect } from "react";
import { Modal, InputNumber, Button, Select, Typography, message, Empty, Avatar, Badge, Tooltip } from "antd";
import { 
    MinusCircleOutlined, 
    PlusOutlined, 
    EditOutlined,
    ShoppingOutlined,
    SaveOutlined,
    CloseOutlined,
    SearchOutlined
} from "@ant-design/icons";
import { Order, OrderStatus } from "../types/api/orders";
import { Ingredients } from "../types/api/ingredients";
import axios from "axios";
import { useSocket } from "../hooks/useSocket";
import { authService } from "../services/auth.service";

const { Text, Title } = Typography;

interface EditOrderModalProps {
    order: Order | null;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// Item card component for editing
const EditableItemCard = ({ 
    item, 
    index, 
    onUpdateQuantity, 
    onRemove 
}: { 
    item: { ingredient_id: string; quantity_ordered: number; display_name: string; unit_name: string; img_url?: string | null };
    index: number;
    onUpdateQuantity: (id: string, qty: number | null) => void;
    onRemove: (id: string) => void;
}) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: 14,
            background: '#fafafa',
            borderRadius: 14,
            marginBottom: 10,
            border: '1px solid #f0f0f0',
            transition: 'all 0.3s ease',
            animation: `slideIn 0.3s ease ${index * 0.05}s both`,
        }}
        className="editable-item-card"
    >
        {/* Product Image */}
        <Badge count={index + 1} color="#667eea" size="small">
            <Avatar
                src={item.img_url || 'https://placehold.co/56x56/f5f5f5/999999?text=📦'}
                shape="square"
                size={56}
                style={{ 
                    borderRadius: 12,
                    border: '2px solid #fff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    objectFit: 'cover'
                }}
            />
        </Badge>

        {/* Product Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
            <Text 
                strong 
                style={{ 
                    fontSize: 14, 
                    display: 'block',
                    marginBottom: 2,
                    color: '#1a1a2e'
                }}
                ellipsis={{ tooltip: item.display_name }}
            >
                {item.display_name}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
                หน่วย: {item.unit_name}
            </Text>
        </div>

        {/* Quantity Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <InputNumber
                min={1}
                value={item.quantity_ordered}
                onChange={(v) => onUpdateQuantity(item.ingredient_id, v)}
                style={{
                    width: 80,
                    borderRadius: 10,
                }}
                size="middle"
            />
            <Tooltip title="ลบรายการ">
                <Button
                    danger
                    type="text"
                    icon={<MinusCircleOutlined style={{ fontSize: 18 }} />}
                    onClick={() => onRemove(item.ingredient_id)}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                />
            </Tooltip>
        </div>
    </div>
);

export default function EditOrderModal({ order, open, onClose, onSuccess }: EditOrderModalProps) {
    const [loading, setLoading] = useState(false);
    const [ingredients, setIngredients] = useState<Ingredients[]>([]);
    const [items, setItems] = useState<{ ingredient_id: string; quantity_ordered: number; display_name: string; unit_name: string; img_url?: string | null }[]>([]);
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
                    unit_name: item.ingredient?.unit?.display_name || '-',
                    img_url: item.ingredient?.img_url || undefined
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
                const response = await axios.get("/api/ingredients");
                const allIngredients = response.data.filter((i: Ingredients) => i.is_active);
                setIngredients(allIngredients);

                // Fallback: Update existing items with images if they are missing
                setItems(prevItems => prevItems.map(item => {
                    const match = allIngredients.find((ing: Ingredients) => ing.id === item.ingredient_id);
                    return {
                        ...item,
                        img_url: item.img_url || match?.img_url
                    };
                }));
            } catch {
                console.error("Failed to load ingredients");
            }
        };
        fetchIngredients();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Initialize items when order changes
    useEffect(() => {
        if (order && open) {
            const mappedItems = order.ordersItems?.map(item => ({
                ingredient_id: item.ingredient_id,
                quantity_ordered: item.quantity_ordered,
                display_name: item.ingredient?.display_name || 'Unknown',
                unit_name: item.ingredient?.unit?.display_name || '-',
                img_url: item.ingredient?.img_url || undefined
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
            unit_name: ing.unit?.display_name || '-',
            img_url: ing.img_url
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

    const [csrfToken, setCsrfToken] = useState<string>("");

    useEffect(() => {
        const fetchCsrf = async () => {
             const token = await authService.getCsrfToken();
             setCsrfToken(token);
        };
        fetchCsrf();
    }, []);

    const handleSave = async () => {
        if (!order) return;
        if (items.length === 0) {
            message.error("ออเดอร์ต้องมีสินค้าอย่างน้อย 1 ชิ้น");
            return;
        }

        setLoading(true);
        try {
            const payload = items.map(i => ({ ingredient_id: i.ingredient_id, quantity_ordered: i.quantity_ordered }));
            
            await axios.put(`/api/orders/${order.id}`, { items: payload }, {
                headers: {
                    'X-CSRF-Token': csrfToken
                }
            });

            message.success("แก้ไขออเดอร์สำเร็จ");
            onSuccess();
            onClose();
        } catch (error: unknown) {
             let errorMessage = "แก้ไขออเดอร์ล้มเหลว";
             if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.error || error.response?.data?.message || errorMessage;
             } else if (error instanceof Error) {
                errorMessage = error.message;
             }
             message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Filter out already added ingredients
    const availableIngredients = ingredients.filter(
        ing => !items.some(item => item.ingredient_id === ing.id)
    );

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={560}
            centered
            className="edit-order-modal"
            style={{ top: 20 }}
            styles={{
                body: {
                    padding: 0,
                },
                mask: {
                    backdropFilter: 'blur(8px)',
                    background: 'rgba(0, 0, 0, 0.45)'
                }
            }}
            closeIcon={null}
        >
            {/* Header Section with Gradient */}
            <div style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                padding: '24px 24px 20px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative circles */}
                <div style={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 150,
                    height: 150,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: -30,
                    left: -30,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)'
                }} />

                {/* Header Content */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: 14,
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(8px)'
                        }}>
                            <EditOutlined style={{ fontSize: 24, color: 'white' }} />
                        </div>
                        <div>
                            <Text style={{ 
                                color: 'rgba(255,255,255,0.8)', 
                                fontSize: 13,
                                display: 'block'
                            }}>
                                แก้ไขออเดอร์
                            </Text>
                            <Title level={4} style={{ 
                                color: 'white', 
                                margin: 0,
                                fontWeight: 700,
                                letterSpacing: '0.5px'
                            }}>
                                #{order?.id.substring(0, 8).toUpperCase()}
                            </Title>
                        </div>
                    </div>

                    {/* Items count badge */}
                    <div style={{ 
                        marginTop: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                    }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: 20,
                            padding: '6px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            backdropFilter: 'blur(4px)'
                        }}>
                            <ShoppingOutlined style={{ color: 'white', fontSize: 14 }} />
                            <Text style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>
                                {items.length} รายการ
                            </Text>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body Content */}
            <div style={{ padding: '20px 24px 24px' }}>
                {/* Add Item Section */}
                <div style={{
                    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 20
                }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        marginBottom: 12
                    }}>
                        <PlusOutlined style={{ fontSize: 16, color: '#d4380d' }} />
                        <Text strong style={{ fontSize: 14, color: '#d4380d' }}>
                            เพิ่มสินค้าใหม่
                        </Text>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Select
                            style={{ flex: 1 }}
                            placeholder="ค้นหาและเลือกสินค้า..."
                            showSearch
                            allowClear
                            value={selectedIngredient}
                            onChange={setSelectedIngredient}
                            suffixIcon={<SearchOutlined style={{ color: '#d4380d' }} />}
                            filterOption={(input, option: unknown) =>
                                ((option as { searchText: string })?.searchText ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            notFoundContent={
                                <Empty 
                                    image={Empty.PRESENTED_IMAGE_SIMPLE} 
                                    description="ไม่พบสินค้า"
                                    style={{ padding: '12px 0' }}
                                />
                            }
                            options={availableIngredients.map(ing => ({ 
                                value: ing.id, 
                                searchText: ing.display_name,
                                label: (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src={ing.img_url || 'https://placehold.co/36x36?text=📦'} 
                                            alt={ing.display_name}
                                            style={{ 
                                                width: 36, 
                                                height: 36, 
                                                objectFit: 'cover', 
                                                borderRadius: 8,
                                                border: '1px solid #f0f0f0'
                                            }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 500, fontSize: 13 }}>{ing.display_name}</div>
                                            <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                                                {ing.unit?.display_name || '-'}
                                            </div>
                                        </div>
                                    </div>
                                )
                            }))}
                            dropdownStyle={{ borderRadius: 12 }}
                        />
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            onClick={handleAddItem}
                            disabled={!selectedIngredient}
                            style={{
                                height: 40,
                                borderRadius: 10,
                                background: selectedIngredient 
                                    ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' 
                                    : undefined,
                                border: 'none',
                                fontWeight: 600,
                                boxShadow: selectedIngredient 
                                    ? '0 4px 12px rgba(245, 87, 108, 0.35)' 
                                    : undefined
                            }}
                        >
                            เพิ่ม
                        </Button>
                    </div>
                </div>

                {/* Items List Section */}
                <div style={{ marginBottom: 20 }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        marginBottom: 14
                    }}>
                        <ShoppingOutlined style={{ fontSize: 16, color: '#667eea' }} />
                        <Text strong style={{ fontSize: 15, color: '#1a1a2e' }}>
                            รายการสินค้าในออเดอร์
                        </Text>
                    </div>

                    {/* Items List with scroll */}
                    <div style={{ 
                        maxHeight: 280, 
                        overflowY: 'auto',
                        paddingRight: 4,
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#d9d9d9 transparent'
                    }}>
                        {items.length > 0 ? (
                            items.map((item, index) => (
                                <EditableItemCard
                                    key={item.ingredient_id}
                                    item={item}
                                    index={index}
                                    onUpdateQuantity={handleUpdateQuantity}
                                    onRemove={handleRemoveItem}
                                />
                            ))
                        ) : (
                            <Empty 
                                description={
                                    <div>
                                        <Text type="secondary">ยังไม่มีสินค้าในออเดอร์</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            เพิ่มสินค้าจากด้านบน
                                        </Text>
                                    </div>
                                }
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                style={{ 
                                    padding: '40px 0',
                                    background: '#fafafa',
                                    borderRadius: 16
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div style={{ display: 'flex', gap: 12 }}>
                    <Button
                        block
                        size="large"
                        onClick={onClose}
                        icon={<CloseOutlined />}
                        style={{
                            height: 48,
                            borderRadius: 12,
                            fontWeight: 600,
                        }}
                    >
                        ยกเลิก
                    </Button>
                    <Button
                        type="primary"
                        block
                        size="large"
                        onClick={handleSave}
                        loading={loading}
                        icon={<SaveOutlined />}
                        disabled={items.length === 0}
                        style={{
                            height: 48,
                            borderRadius: 12,
                            fontWeight: 600,
                            background: items.length > 0 
                                ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' 
                                : undefined,
                            border: 'none',
                            boxShadow: items.length > 0 
                                ? '0 4px 16px rgba(245, 87, 108, 0.35)' 
                                : undefined
                        }}
                    >
                        บันทึกการแก้ไข
                    </Button>
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
                .edit-order-modal .ant-modal-content {
                    border-radius: 24px !important;
                    overflow: hidden;
                    padding: 0 !important;
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .editable-item-card:hover {
                    background: #fff0f6 !important;
                    border-color: #ffadd2 !important;
                    transform: translateX(4px);
                }
                
                .edit-order-modal .ant-select-selector {
                    border-radius: 10px !important;
                    height: 40px !important;
                }
                
                .edit-order-modal .ant-select-selection-placeholder,
                .edit-order-modal .ant-select-selection-item {
                    line-height: 38px !important;
                }
                
                .edit-order-modal .ant-input-number {
                    border-radius: 10px !important;
                }
                
                .edit-order-modal .ant-input-number-handler-wrap {
                    border-radius: 0 10px 10px 0 !important;
                }
                
                /* Custom scrollbar */
                *::-webkit-scrollbar {
                    width: 6px;
                }
                *::-webkit-scrollbar-track {
                    background: transparent;
                }
                *::-webkit-scrollbar-thumb {
                    background: #d9d9d9;
                    border-radius: 3px;
                }
                *::-webkit-scrollbar-thumb:hover {
                    background: #bfbfbf;
                }
            `}</style>
        </Modal>
    );
}
