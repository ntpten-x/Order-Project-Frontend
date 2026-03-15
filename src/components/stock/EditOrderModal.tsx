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
    unit_label: string;
    img_url?: string | null;
}

function mapOrderItems(order: Order | null): EditableItem[] {
    return (
        order?.ordersItems?.map((item) => ({
            ingredient_id: item.ingredient_id,
            quantity_ordered: Number(item.quantity_ordered || 1),
            display_name: item.ingredient?.display_name || "-",
            unit_label: item.ingredient?.unit?.display_name || "หน่วย",
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

async function fetchActiveIngredients(): Promise<Ingredients[]> {
    const pageSize = 200;
    let currentPage = 1;
    let lastPage = 1;
    const merged: Ingredients[] = [];

    do {
        const params = new URLSearchParams({
            page: String(currentPage),
            limit: String(pageSize),
            status: "active",
            sort_created: "new",
        });
        const response = await ingredientsService.findAllPaginated(undefined, params);
        merged.push(...response.data);
        lastPage = Math.max(response.last_page || 1, 1);
        currentPage += 1;
    } while (currentPage <= lastPage);

    return merged;
}

export default function EditOrderModal({ order, open, onClose, onSuccess }: EditOrderModalProps) {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const isPending = order?.status === OrderStatus.PENDING;

    const [ingredients, setIngredients] = useState<Ingredients[]>([]);
    const [items, setItems] = useState<EditableItem[]>([]);
    const [saving, setSaving] = useState(false);
    const [loadingIngredients, setLoadingIngredients] = useState(false);
    const [csrfToken, setCsrfToken] = useState("");
    const [selectedTempIds, setSelectedTempIds] = useState<string[]>([]);

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
                const data = await fetchActiveIngredients();
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
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Title level={5} style={{ margin: 0 }}>
                        แก้ไขใบซื้อ #{order?.id.slice(0, 8).toUpperCase() || "-"}
                    </Title>
                    <Tag color={isPending ? "gold" : "default"} style={{ margin: 0 }}>
                        {isPending ? "รอดำเนินการ" : "แก้ไขไม่ได้"}
                    </Tag>
                </div>
            }
        >
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <style>{`
                    .qty-input-center input {
                        text-align: center !important;
                    }
                `}</style>
                {!isPending ? (
                    <Alert
                        type="warning"
                        showIcon
                        message="ใบซื้อนี้ไม่อยู่ในสถานะรอดำเนินการ"
                        description="ระบบอนุญาตให้แก้ไขได้เฉพาะใบซื้อที่ยังไม่ถูกยืนยันซื้อหรือยกเลิก"
                    />
                ) : null}

                <Row gutter={[12, 12]}>
                    <Col span={24}>
                        <Space direction="vertical" size={12} style={{ width: "100%" }}>
                            <Card size="small" styles={{ body: { padding: isMobile ? 12 : 14 } }}>
                                <Text strong style={{ display: "block", marginBottom: 8 }}>
                                    สรุปใบซื้อ
                                </Text>
                                <Row gutter={[8, 8]}>
                                    <Col xs={12} lg={12}>
                                        <Card size="small" styles={{ body: { padding: 10 } }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                จำนวนรายการ
                                            </Text>
                                            <Title level={4} style={{ margin: "4px 0 0" }}>
                                                {items.length.toLocaleString()}
                                            </Title>
                                        </Card>
                                    </Col>
                                    <Col xs={12} lg={12}>
                                        <Card size="small" styles={{ body: { padding: 10 } }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                รวมจำนวน
                                            </Text>
                                            <Title level={4} style={{ margin: "4px 0 0", color: "#1677ff" }}>
                                                {totalQuantity.toLocaleString()}
                                            </Title>
                                        </Card>
                                    </Col>
                                </Row>

                                <Divider style={{ margin: "16px 0 12px" }} />

                                <Row gutter={[12, 12]}>
                                    <Col span={12}>
                                        <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                                            ผู้สร้างใบซื้อ
                                        </Text>
                                        <Text style={{ fontWeight: 500 }}>
                                            {order?.ordered_by?.name || order?.ordered_by?.username || "-"}
                                        </Text>
                                    </Col>
                                    <Col span={12}>
                                        <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                                            วันที่สร้าง
                                        </Text>
                                        <Text style={{ fontWeight: 500 }}>
                                            {formatDateTime(order?.create_date)}
                                        </Text>
                                    </Col>
                                </Row>
                            </Card>
                        </Space>
                    </Col>

                    <Col span={24}>
                        <Card
                            size="small"
                            title={`รายการที่ต้องซื้อ`}
                            extra={isPending && (
                                <ModalSelector
                                    title="เลือกวัตถุดิบ"
                                    placeholder="ค้นหาวัตถุดิบ..."
                                    multiple={true}
                                    value={selectedTempIds}
                                    onChange={(values) => setSelectedTempIds(values)}
                                    onConfirm={(values: string[]) => {
                                        const newItems: EditableItem[] = [];
                                        values.forEach((id) => {
                                            const btnIngredient = ingredients.find((m) => m.id === id);
                                            if (!btnIngredient) return;
                                            
                                            if (items.some((it) => it.ingredient_id === id)) return;

                                            newItems.push({
                                                ingredient_id: btnIngredient.id,
                                                quantity_ordered: 1,
                                                display_name: btnIngredient.display_name,
                                                unit_label: btnIngredient.unit?.display_name || "หน่วย",
                                                img_url: btnIngredient.img_url,
                                            });
                                        });

                                        if (newItems.length > 0) {
                                            setItems((prev) => [...prev, ...newItems]);
                                        }
                                        setSelectedTempIds([]);
                                    }}
                                    loading={loadingIngredients}
                                    options={availableIngredients.map((item) => ({
                                        value: item.id,
                                        label: (
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <StockImageThumb src={item.img_url} alt={item.display_name} size={24} borderRadius={6} />
                                                <span>{item.display_name} ({item.unit?.display_name || "หน่วย"})</span>
                                            </div>
                                        ),
                                        searchLabel: item.display_name,
                                    }))}
                                    showSearch
                                    trigger={
                                        <Button type="primary" size="small" icon={<PlusOutlined />} style={{ borderRadius: 6 }}>
                                            เพิ่ม
                                        </Button>
                                    }
                                />
                            )}
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
                                                                    หน่วย: {item.unit_label}
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
                                                            <Space.Compact style={{ borderRadius: 8, overflow: 'hidden' }}>
                                                                <Button
                                                                    icon={<MinusOutlined style={{ fontSize: 13 }} />}
                                                                    onClick={() => changeQuantityBy(item.ingredient_id, -1)}
                                                                    disabled={!isPending || item.quantity_ordered <= 1}
                                                                    style={{ 
                                                                        borderColor: '#fca5a5', 
                                                                        color: '#ef4444', 
                                                                        backgroundColor: '#fef2f2',
                                                                        width: 32,
                                                                        height: 32,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}
                                                                />
                                                                <InputNumber
                                                                    className="qty-input-center"
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
                                                                    style={{ width: 56, height: 32 }}
                                                                    disabled={!isPending}
                                                                />
                                                                <Button
                                                                    icon={<PlusOutlined style={{ fontSize: 13 }} />}
                                                                    onClick={() => changeQuantityBy(item.ingredient_id, 1)}
                                                                    disabled={!isPending}
                                                                    style={{ 
                                                                        borderColor: '#a7f3d0', 
                                                                        color: '#10b981', 
                                                                        backgroundColor: '#ecfdf5',
                                                                        width: 32,
                                                                        height: 32,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}
                                                                />
                                                            </Space.Compact>

                                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                                จำนวน {item.quantity_ordered.toLocaleString()} {item.unit_label}
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
