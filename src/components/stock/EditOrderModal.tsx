import React, { useEffect, useMemo, useState } from "react";
import {
    Avatar,
    Button,
    Empty,
    InputNumber,
    List,
    Modal,
    Space,
    Typography,
    message,
} from "antd";
import { DeleteOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { Order, OrderStatus } from "../../types/api/stock/orders";
import { Ingredients } from "../../types/api/stock/ingredients";
import { ingredientsService } from "../../services/stock/ingredients.service";
import { ordersService } from "../../services/stock/orders.service";
import { authService } from "../../services/auth.service";
import { resolveImageSource } from "../../utils/image/source";
import { ModalSelector } from "../ui/select/ModalSelector";

const { Text, Title } = Typography;

interface EditOrderModalProps {
    order: Order | null;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface EditableItem {
    ingredient_id: string;
    quantity_ordered: number;
    display_name: string;
    unit_name: string;
    img_url?: string | null;
}

function mapOrderItems(order: Order | null): EditableItem[] {
    return (
        order?.ordersItems?.map((item) => ({
            ingredient_id: item.ingredient_id,
            quantity_ordered: Number(item.quantity_ordered || 1),
            display_name: item.ingredient?.display_name || "-",
            unit_name: item.ingredient?.unit?.display_name || "หน่วย",
            img_url: item.ingredient?.img_url,
        })) ?? []
    );
}

export default function EditOrderModal({ order, open, onClose, onSuccess }: EditOrderModalProps) {
    const [ingredients, setIngredients] = useState<Ingredients[]>([]);
    const [items, setItems] = useState<EditableItem[]>([]);
    const [selectedIngredient, setSelectedIngredient] = useState<string | undefined>();
    const [saving, setSaving] = useState(false);
    const [loadingIngredients, setLoadingIngredients] = useState(false);
    const [csrfToken, setCsrfToken] = useState("");

    useEffect(() => {
        if (!open) return;
        setItems(mapOrderItems(order));
    }, [open, order]);

    useEffect(() => {
        if (!open) return;

        let mounted = true;

        const run = async () => {
            setLoadingIngredients(true);
            try {
                const token = await authService.getCsrfToken();
                const data = await ingredientsService.findAll();
                if (!mounted) return;
                setCsrfToken(token);
                setIngredients(data.filter((item) => item.is_active));
            } catch {
                if (mounted) message.error("โหลดรายการวัตถุดิบไม่สำเร็จ");
            } finally {
                if (mounted) setLoadingIngredients(false);
            }
        };

        void run();

        return () => {
            mounted = false;
        };
    }, [open]);

    const availableIngredients = useMemo(() => {
        const selectedIds = new Set(items.map((item) => item.ingredient_id));
        return ingredients.filter((ingredient) => !selectedIds.has(ingredient.id));
    }, [ingredients, items]);

    const addIngredient = () => {
        if (!selectedIngredient) return;
        const ingredient = ingredients.find((item) => item.id === selectedIngredient);
        if (!ingredient) return;

        setItems((prev) => [
            ...prev,
            {
                ingredient_id: ingredient.id,
                quantity_ordered: 1,
                display_name: ingredient.display_name,
                unit_name: ingredient.unit?.display_name || "หน่วย",
                img_url: ingredient.img_url,
            },
        ]);
        setSelectedIngredient(undefined);
    };

    const removeItem = (ingredientId: string) => {
        setItems((prev) => prev.filter((item) => item.ingredient_id !== ingredientId));
    };

    const updateQuantity = (ingredientId: string, quantity: number | null) => {
        const next = Number(quantity || 0);
        if (next < 1) return;
        setItems((prev) =>
            prev.map((item) => (item.ingredient_id === ingredientId ? { ...item, quantity_ordered: next } : item))
        );
    };

    const saveOrder = async () => {
        if (!order) return;
        if (order.status !== OrderStatus.PENDING) {
            message.warning("แก้ไขได้เฉพาะใบซื้อที่รอดำเนินการ");
            return;
        }
        if (items.length === 0) {
            message.warning("ต้องมีอย่างน้อย 1 รายการ");
            return;
        }

        setSaving(true);
        try {
            await ordersService.updateOrder(
                order.id,
                items.map((item) => ({
                    ingredient_id: item.ingredient_id,
                    quantity_ordered: item.quantity_ordered,
                })),
                undefined,
                csrfToken
            );
            message.success("บันทึกการแก้ไขใบซื้อเรียบร้อย");
            onSuccess();
            onClose();
        } catch (error: unknown) {
            message.error((error as Error)?.message || "บันทึกการแก้ไขไม่สำเร็จ");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={760}
            style={{ maxWidth: "95vw" }}
            title={`แก้ไขใบซื้อ #${order?.id.slice(0, 8).toUpperCase() || "-"}`}
        >
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <div>
                    <Text type="secondary">เพิ่มรายการวัตถุดิบ</Text>
                    <Space.Compact style={{ width: "100%", marginTop: 8 }}>
                            <ModalSelector
                                title="เลือกวัตถุดิบ"
                                placeholder="เลือกวัตถุดิบ"
                                value={selectedIngredient}
                                onChange={(value) => setSelectedIngredient(value)}
                                loading={loadingIngredients}
                                options={availableIngredients.map((item) => ({
                                    value: item.id,
                                    label: (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <Avatar 
                                                shape="square" 
                                                src={resolveImageSource(item.img_url) || undefined}
                                                size="small"
                                            />
                                            <span>{item.display_name} ({item.unit?.display_name || "หน่วย"})</span>
                                        </div>
                                    ),
                                    searchLabel: item.display_name
                                }))}
                                showSearch
                                style={{ width: "100%", borderRadius: "8px 0 0 8px" }}
                            />
                        <Button type="primary" icon={<PlusOutlined />} onClick={addIngredient} disabled={!selectedIngredient}>
                            เพิ่ม
                        </Button>
                    </Space.Compact>
                </div>

                <div>
                    <Title level={5} style={{ margin: 0 }}>รายการที่ต้องซื้อ ({items.length})</Title>
                    {items.length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ยังไม่มีรายการ" style={{ marginTop: 16 }} />
                    ) : (
                        <List
                            style={{ marginTop: 12 }}
                            dataSource={items}
                            renderItem={(item) => (
                                <List.Item
                                    actions={[
                                        <InputNumber
                                            key="qty"
                                            min={1}
                                            value={item.quantity_ordered}
                                            onChange={(value) => updateQuantity(item.ingredient_id, value)}
                                            formatter={(value) => `${value}`.replace(/[^0-9]/g, "")}
                                            parser={(value) => value?.replace(/[^0-9]/g, "") as unknown as number}
                                        />,
                                        <Button
                                            key="delete"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => removeItem(item.ingredient_id)}
                                        >
                                            ลบ
                                        </Button>,
                                    ]}
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar shape="square" src={resolveImageSource(item.img_url) || undefined} />}
                                        title={item.display_name}
                                        description={`หน่วย: ${item.unit_name}`}
                                    />
                                </List.Item>
                            )}
                        />
                    )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                    <Button onClick={onClose}>ยกเลิก</Button>
                    <Button type="primary" icon={<SaveOutlined />} onClick={saveOrder} loading={saving}>
                        บันทึก
                    </Button>
                </div>
            </Space>
        </Modal>
    );
}
