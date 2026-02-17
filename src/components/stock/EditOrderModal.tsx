import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Button,
    Card,
    Col,
    Divider,
    Empty,
    Grid,
    InputNumber,
    List,
    Modal,
    Row,
    Space,
    Tag,
    Typography,
    message,
} from "antd";
import {
    DeleteOutlined,
    MinusOutlined,
    PlusOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import { Order, OrderStatus } from "../../types/api/stock/orders";
import { Ingredients } from "../../types/api/stock/ingredients";
import { ingredientsService } from "../../services/stock/ingredients.service";
import { ordersService } from "../../services/stock/orders.service";
import { authService } from "../../services/auth.service";
import { ModalSelector } from "../ui/select/ModalSelector";
import StockImageThumb from "./StockImageThumb";

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

function formatDateTime(value?: string): string {
    if (!value) return "-";
    return new Date(value).toLocaleString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function EditOrderModal({ order, open, onClose, onSuccess }: EditOrderModalProps) {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const isPending = order?.status === OrderStatus.PENDING;

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

    const totalQuantity = useMemo(() => {
        return items.reduce((sum, item) => sum + Number(item.quantity_ordered || 0), 0);
    }, [items]);

    const addIngredient = () => {
        if (!selectedIngredient || !isPending) return;
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
        if (!isPending) return;
        setItems((prev) => prev.filter((item) => item.ingredient_id !== ingredientId));
    };

    const updateQuantity = (ingredientId: string, quantity: number | null) => {
        if (!isPending) return;
        const next = Number(quantity || 0);
        if (next < 1) return;
        setItems((prev) =>
            prev.map((item) => (item.ingredient_id === ingredientId ? { ...item, quantity_ordered: next } : item))
        );
    };

    const changeQuantityBy = (ingredientId: string, delta: number) => {
        if (!isPending) return;
        const current = items.find((item) => item.ingredient_id === ingredientId)?.quantity_ordered;
        if (!current) return;
        updateQuantity(ingredientId, Math.max(1, current + delta));
    };

    const saveOrder = async () => {
        if (!order) return;
        if (!isPending) {
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
            width={980}
            style={{ maxWidth: "96vw", top: isMobile ? 8 : 24 }}
            styles={{ body: { padding: isMobile ? 12 : 16 } }}
            title={
                <Space direction="vertical" size={2} style={{ width: "100%" }}>
                    <Space size={8} wrap>
                        <Title level={5} style={{ margin: 0 }}>
                            แก้ไขใบซื้อ #{order?.id.slice(0, 8).toUpperCase() || "-"}
                        </Title>
                        <Tag color={isPending ? "gold" : "default"} style={{ margin: 0 }}>
                            {isPending ? "รอดำเนินการ" : "แก้ไขไม่ได้"}
                        </Tag>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        ปรับรายการวัตถุดิบและจำนวนที่ต้องซื้อให้อัปเดตล่าสุด
                    </Text>
                </Space>
            }
        >
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {!isPending ? (
                    <Alert
                        type="warning"
                        showIcon
                        message="ใบซื้อนี้ไม่อยู่ในสถานะรอดำเนินการ"
                        description="ระบบอนุญาตให้แก้ไขได้เฉพาะใบซื้อที่ยังไม่ถูกยืนยันซื้อหรือยกเลิก"
                    />
                ) : null}

                <Row gutter={[12, 12]}>
                    <Col xs={24} lg={9}>
                        <Space direction="vertical" size={12} style={{ width: "100%" }}>
                            <Card size="small" styles={{ body: { padding: isMobile ? 12 : 14 } }}>
                                <Text strong style={{ display: "block", marginBottom: 8 }}>
                                    สรุปใบซื้อ
                                </Text>
                                <Row gutter={[8, 8]}>
                                    <Col xs={8} lg={24}>
                                        <Card size="small" styles={{ body: { padding: 10 } }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                จำนวนรายการ
                                            </Text>
                                            <Title level={4} style={{ margin: "4px 0 0" }}>
                                                {items.length.toLocaleString()}
                                            </Title>
                                        </Card>
                                    </Col>
                                    <Col xs={8} lg={24}>
                                        <Card size="small" styles={{ body: { padding: 10 } }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                รวมจำนวน
                                            </Text>
                                            <Title level={4} style={{ margin: "4px 0 0", color: "#1677ff" }}>
                                                {totalQuantity.toLocaleString()}
                                            </Title>
                                        </Card>
                                    </Col>
                                    <Col xs={8} lg={24}>
                                        <Card size="small" styles={{ body: { padding: 10 } }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                เพิ่มได้อีก
                                            </Text>
                                            <Title level={4} style={{ margin: "4px 0 0" }}>
                                                {availableIngredients.length.toLocaleString()}
                                            </Title>
                                        </Card>
                                    </Col>
                                </Row>

                                <Divider style={{ margin: "12px 0" }} />

                                <Space direction="vertical" size={1}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        ผู้สร้างใบซื้อ
                                    </Text>
                                    <Text>{order?.ordered_by?.name || order?.ordered_by?.username || "-"}</Text>
                                    <Text type="secondary" style={{ fontSize: 12, marginTop: 6 }}>
                                        วันที่สร้าง
                                    </Text>
                                    <Text>{formatDateTime(order?.create_date)}</Text>
                                </Space>
                            </Card>

                            <Card
                                size="small"
                                title="เพิ่มวัตถุดิบเข้ารายการ"
                                styles={{ body: { padding: isMobile ? 12 : 14 } }}
                            >
                                <Space direction="vertical" size={10} style={{ width: "100%" }}>
                                    <ModalSelector
                                        title="เลือกวัตถุดิบ"
                                        placeholder="เลือกวัตถุดิบ"
                                        value={selectedIngredient}
                                        onChange={(value) => setSelectedIngredient(value)}
                                        loading={loadingIngredients}
                                        options={availableIngredients.map((item) => ({
                                            value: item.id,
                                            label: (
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <StockImageThumb
                                                        src={item.img_url}
                                                        alt={item.display_name}
                                                        size={24}
                                                        borderRadius={6}
                                                    />
                                                    <span style={{ lineHeight: 1.3 }}>
                                                        {item.display_name} ({item.unit?.display_name || "หน่วย"})
                                                    </span>
                                                </div>
                                            ),
                                            searchLabel: item.display_name,
                                        }))}
                                        showSearch
                                        style={{ width: "100%" }}
                                    />
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={addIngredient}
                                        disabled={!selectedIngredient || !isPending}
                                        block
                                        style={{ height: 40, fontWeight: 600 }}
                                    >
                                        เพิ่มเข้ารายการ
                                    </Button>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        เลือกวัตถุดิบจากรายการที่ยังไม่ถูกเพิ่มในใบซื้อนี้
                                    </Text>
                                </Space>
                            </Card>
                        </Space>
                    </Col>

                    <Col xs={24} lg={15}>
                        <Card
                            size="small"
                            title={`รายการที่ต้องซื้อ (${items.length})`}
                            styles={{ body: { padding: isMobile ? 10 : 12 } }}
                        >
                            {items.length === 0 ? (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="ยังไม่มีรายการ"
                                    style={{ marginTop: 12, marginBottom: 12 }}
                                />
                            ) : (
                                <List
                                    style={{
                                        maxHeight: isMobile ? "42vh" : "52vh",
                                        overflowY: "auto",
                                        paddingRight: 2,
                                    }}
                                    dataSource={items}
                                    renderItem={(item, index) => (
                                        <List.Item style={{ padding: "0 0 10px", borderBlockEnd: "none" }}>
                                            <Card
                                                size="small"
                                                style={{ width: "100%", borderRadius: 12, background: "#fafafa" }}
                                                styles={{ body: { padding: isMobile ? 10 : 12 } }}
                                            >
                                                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                                    <StockImageThumb
                                                        src={item.img_url}
                                                        alt={item.display_name}
                                                        size={isMobile ? 48 : 54}
                                                        borderRadius={10}
                                                    />

                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                gap: 8,
                                                                justifyContent: "space-between",
                                                                alignItems: "flex-start",
                                                                flexWrap: "wrap",
                                                            }}
                                                        >
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <Text
                                                                    strong
                                                                    ellipsis={{ tooltip: item.display_name }}
                                                                    style={{ display: "block" }}
                                                                >
                                                                    {item.display_name}
                                                                </Text>
                                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                                    หน่วย: {item.unit_name}
                                                                </Text>
                                                            </div>
                                                            <Space size={6}>
                                                                <Tag style={{ margin: 0, borderRadius: 999 }}>
                                                                    #{index + 1}
                                                                </Tag>
                                                                <Button
                                                                    type="text"
                                                                    danger
                                                                    icon={<DeleteOutlined />}
                                                                    onClick={() => removeItem(item.ingredient_id)}
                                                                    disabled={!isPending}
                                                                >
                                                                    {!isMobile ? "ลบ" : undefined}
                                                                </Button>
                                                            </Space>
                                                        </div>

                                                        <Divider style={{ margin: "10px 0" }} />

                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                gap: 8,
                                                                flexWrap: "wrap",
                                                                alignItems: "center",
                                                                justifyContent: "space-between",
                                                            }}
                                                        >
                                                            <Space.Compact>
                                                                <Button
                                                                    icon={<MinusOutlined />}
                                                                    onClick={() => changeQuantityBy(item.ingredient_id, -1)}
                                                                    disabled={!isPending || item.quantity_ordered <= 1}
                                                                />
                                                                <InputNumber
                                                                    min={1}
                                                                    controls={false}
                                                                    value={item.quantity_ordered}
                                                                    onChange={(value) =>
                                                                        updateQuantity(item.ingredient_id, Number(value || 1))
                                                                    }
                                                                    formatter={(value) => `${value}`.replace(/[^0-9]/g, "")}
                                                                    parser={(value) =>
                                                                        value?.replace(/[^0-9]/g, "") as unknown as number
                                                                    }
                                                                    style={{ width: isMobile ? 76 : 90 }}
                                                                    disabled={!isPending}
                                                                />
                                                                <Button
                                                                    icon={<PlusOutlined />}
                                                                    onClick={() => changeQuantityBy(item.ingredient_id, 1)}
                                                                    disabled={!isPending}
                                                                />
                                                            </Space.Compact>

                                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                                จำนวน {item.quantity_ordered.toLocaleString()} {item.unit_name}
                                                            </Text>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </List.Item>
                                    )}
                                />
                            )}
                        </Card>
                    </Col>
                </Row>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: isMobile ? "stretch" : "center",
                        flexDirection: isMobile ? "column" : "row",
                        gap: 10,
                        borderTop: "1px solid #f0f0f0",
                        paddingTop: 12,
                    }}
                >
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        ตรวจสอบรายการและจำนวนให้ถูกต้องก่อนบันทึกการแก้ไข
                    </Text>

                    <div style={{ display: "flex", gap: 8, width: isMobile ? "100%" : "auto" }}>
                        <Button onClick={onClose} style={{ flex: isMobile ? 1 : undefined }}>
                            ยกเลิก
                        </Button>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={saveOrder}
                            loading={saving}
                            disabled={!isPending || items.length === 0}
                            style={{ flex: isMobile ? 1 : undefined }}
                        >
                            บันทึกการแก้ไข
                        </Button>
                    </div>
                </div>
            </Space>
        </Modal>
    );
}
