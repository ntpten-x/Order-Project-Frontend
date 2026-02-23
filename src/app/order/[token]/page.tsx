"use client";

import React from "react";
import {
    Alert,
    App,
    Badge,
    Button,
    Card,
    Divider,
    Drawer,
    Empty,
    Input,
    InputNumber,
    List,
    Segmented,
    Space,
    Spin,
    Tag,
    Typography,
} from "antd";
import {
    ClockCircleOutlined,
    QrcodeOutlined,
    ReloadOutlined,
    ShoppingCartOutlined,
    ThunderboltOutlined,
} from "@ant-design/icons";
import { useParams } from "next/navigation";
import { DynamicQRCode } from "../../../lib/dynamic-imports";

const { Title, Text } = Typography;

type MenuItem = {
    id: string;
    category_id: string;
    display_name: string;
    description: string;
    price: number;
    img_url: string | null;
    unit_name: string | null;
};

type MenuCategory = {
    id: string;
    category_name: string;
    display_name: string;
    items: MenuItem[];
};

type OrderItem = {
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    total_price: number;
    status: string;
    notes: string;
};

type CustomerOrder = {
    id: string;
    order_no: string;
    status: string;
    order_type: string;
    total_amount: number;
    sub_total: number;
    discount_amount: number;
    vat: number;
    create_date: string;
    update_date: string;
    can_add_items: boolean;
    items: OrderItem[];
};

type BootstrapData = {
    table: {
        id: string;
        table_name: string;
    };
    menu: MenuCategory[];
    active_order: CustomerOrder | null;
    policy: {
        can_customer_cancel: boolean;
        can_customer_pay: boolean;
        refund_supported: boolean;
    };
};

type ActiveOrderData = {
    table: {
        id: string;
        table_name: string;
    };
    active_order: CustomerOrder | null;
    policy: {
        can_customer_cancel: boolean;
        can_customer_pay: boolean;
        refund_supported: boolean;
    };
};

type SubmitOrderData = {
    mode: "create" | "append";
    table: {
        id: string;
        table_name: string;
    };
    order: CustomerOrder;
};

type CartEntry = {
    product: MenuItem;
    quantity: number;
    notes: string;
};

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
        maximumFractionDigits: 2,
    }).format(Number(value || 0));
}

function mapStatus(status: string): { label: string; color: string } {
    const normalized = String(status || "").trim().toLowerCase();
    if (normalized === "pending") return { label: "Accepted", color: "gold" };
    if (normalized === "cooking") return { label: "Preparing", color: "processing" };
    if (normalized === "served") return { label: "Served", color: "green" };
    if (normalized === "waitingforpayment") return { label: "Waiting for staff billing", color: "cyan" };
    if (normalized === "paid" || normalized === "completed") return { label: "Closed", color: "success" };
    if (normalized === "cancelled") return { label: "Cancelled by store", color: "red" };
    return { label: status || "-", color: "default" };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...init,
        cache: "no-store",
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers || {}),
        },
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message = payload?.error?.message || payload?.error || payload?.message || "Request failed";
        throw new Error(message);
    }

    if (payload?.success === true && payload?.data !== undefined) {
        return payload.data as T;
    }

    return payload as T;
}

export default function CustomerTableOrderPage() {
    const params = useParams();
    const token = String((params as Record<string, string | string[]>)?.token || "");
    const { message } = App.useApp();

    const [isLoading, setIsLoading] = React.useState(true);
    const [isRefreshingOrder, setIsRefreshingOrder] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [bootstrap, setBootstrap] = React.useState<BootstrapData | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>("");
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [cart, setCart] = React.useState<Record<string, CartEntry>>({});

    const loadBootstrap = React.useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const data = await fetchJson<BootstrapData>(`/api/public/table-order/${encodeURIComponent(token)}`);
            setBootstrap(data);
            if (!selectedCategoryId && data.menu.length > 0) {
                setSelectedCategoryId(data.menu[0].id);
            }
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Failed to load menu");
        } finally {
            setIsLoading(false);
        }
    }, [message, selectedCategoryId, token]);

    const refreshActiveOrder = React.useCallback(async () => {
        if (!token) return;
        setIsRefreshingOrder(true);
        try {
            const data = await fetchJson<ActiveOrderData>(`/api/public/table-order/${encodeURIComponent(token)}/order`);
            setBootstrap((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    active_order: data.active_order,
                    policy: data.policy,
                };
            });
        } catch {
            // no-op for polling failures
        } finally {
            setIsRefreshingOrder(false);
        }
    }, [token]);

    React.useEffect(() => {
        void loadBootstrap();
    }, [loadBootstrap]);

    React.useEffect(() => {
        if (!token) return;
        const interval = window.setInterval(() => {
            void refreshActiveOrder();
        }, 15000);
        return () => window.clearInterval(interval);
    }, [refreshActiveOrder, token]);

    const selectedCategory = React.useMemo(() => {
        if (!bootstrap) return null;
        if (!selectedCategoryId) return bootstrap.menu[0] || null;
        return bootstrap.menu.find((category) => category.id === selectedCategoryId) || bootstrap.menu[0] || null;
    }, [bootstrap, selectedCategoryId]);

    const cartEntries = React.useMemo(() => Object.values(cart), [cart]);

    const cartSummary = React.useMemo(() => {
        const itemCount = cartEntries.reduce((sum, entry) => sum + entry.quantity, 0);
        const total = cartEntries.reduce((sum, entry) => sum + entry.quantity * Number(entry.product.price || 0), 0);
        return { itemCount, total };
    }, [cartEntries]);

    const addToCart = (product: MenuItem) => {
        setCart((prev) => {
            const existing = prev[product.id];
            if (existing) {
                return {
                    ...prev,
                    [product.id]: {
                        ...existing,
                        quantity: existing.quantity + 1,
                    },
                };
            }
            return {
                ...prev,
                [product.id]: {
                    product,
                    quantity: 1,
                    notes: "",
                },
            };
        });
    };

    const updateQuantity = (productId: string, quantity: number) => {
        setCart((prev) => {
            if (quantity <= 0) {
                const next = { ...prev };
                delete next[productId];
                return next;
            }
            const existing = prev[productId];
            if (!existing) return prev;
            return {
                ...prev,
                [productId]: {
                    ...existing,
                    quantity,
                },
            };
        });
    };

    const updateNotes = (productId: string, notes: string) => {
        setCart((prev) => {
            const existing = prev[productId];
            if (!existing) return prev;
            return {
                ...prev,
                [productId]: {
                    ...existing,
                    notes,
                },
            };
        });
    };

    const submitOrder = async () => {
        if (!bootstrap) return;
        if (cartEntries.length === 0) {
            message.warning("Please add at least one item");
            return;
        }

        if (bootstrap.active_order && !bootstrap.active_order.can_add_items) {
            message.error("Order is locked. Please call staff.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                items: cartEntries.map((entry) => ({
                    product_id: entry.product.id,
                    quantity: entry.quantity,
                    notes: entry.notes || "",
                })),
            };

            const result = await fetchJson<SubmitOrderData>(`/api/public/table-order/${encodeURIComponent(token)}/order`, {
                method: "POST",
                body: JSON.stringify(payload),
            });

            setBootstrap((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    active_order: result.order,
                };
            });
            setCart({});
            setDrawerOpen(false);
            message.success(result.mode === "create" ? "Order submitted" : "Items added");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "Failed to submit order");
        } finally {
            setIsSubmitting(false);
        }
    };

    const activeOrderStatus = bootstrap?.active_order ? mapStatus(bootstrap.active_order.status) : null;
    const orderUrl = typeof window !== "undefined" ? window.location.href : "";

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "radial-gradient(circle at top left, #fef3c7 0%, #ecfccb 35%, #f8fafc 100%)",
                padding: "20px 14px 96px",
            }}
        >
            <div style={{ maxWidth: 980, margin: "0 auto" }}>
                <Card
                    bordered={false}
                    style={{
                        borderRadius: 22,
                        background: "linear-gradient(145deg, #065f46 0%, #0f766e 100%)",
                        color: "#ffffff",
                        boxShadow: "0 20px 45px rgba(6,95,70,0.25)",
                        marginBottom: 16,
                    }}
                >
                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                        <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
                            <Space align="center">
                                <QrcodeOutlined style={{ fontSize: 22 }} />
                                <div>
                                    <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>Table QR ordering</Text>
                                    <Title level={4} style={{ color: "#ffffff", margin: 0 }}>
                                        {bootstrap?.table.table_name ? `Table ${bootstrap.table.table_name}` : "Loading table..."}
                                    </Title>
                                </div>
                            </Space>
                            <Button
                                icon={<ReloadOutlined spin={isRefreshingOrder} />}
                                onClick={() => {
                                    void refreshActiveOrder();
                                }}
                                disabled={!bootstrap}
                            >
                                Refresh
                            </Button>
                        </Space>
                        <Space wrap>
                            <Tag color="gold">Customer can add items</Tag>
                            <Tag color="default">Cancel by store only</Tag>
                            <Tag color="default">Payment by store only</Tag>
                            <Tag color="red">No refund flow</Tag>
                        </Space>
                    </Space>
                </Card>

                {isLoading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
                        <Spin size="large" />
                    </div>
                ) : !bootstrap ? (
                    <Card bordered={false} style={{ borderRadius: 18 }}>
                        <Empty description="Table not found or QR expired" />
                    </Card>
                ) : (
                    <>
                        <Card bordered={false} style={{ borderRadius: 18, marginBottom: 16 }}>
                            <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
                                <div>
                                    <Text type="secondary">Current order status</Text>
                                    {bootstrap.active_order ? (
                                        <Space align="center" size={8}>
                                            <Tag color={activeOrderStatus?.color || "default"}>{activeOrderStatus?.label}</Tag>
                                            <Text strong>{bootstrap.active_order.order_no}</Text>
                                        </Space>
                                    ) : (
                                        <Text strong style={{ display: "block" }}>
                                            No open order yet
                                        </Text>
                                    )}
                                </div>
                                <Space>
                                    <ClockCircleOutlined style={{ color: "#475569" }} />
                                    <Text type="secondary">Auto refresh every 15 seconds</Text>
                                </Space>
                            </Space>

                            {bootstrap.active_order ? (
                                <>
                                    <Divider style={{ margin: "14px 0" }} />
                                    <List
                                        size="small"
                                        dataSource={bootstrap.active_order.items}
                                        locale={{ emptyText: "No items" }}
                                        renderItem={(item) => (
                                            <List.Item>
                                                <Space direction="vertical" size={0} style={{ width: "100%" }}>
                                                    <Space style={{ justifyContent: "space-between", width: "100%" }}>
                                                        <Text strong>{item.product_name}</Text>
                                                        <Text>{formatCurrency(item.total_price)}</Text>
                                                    </Space>
                                                    <Space style={{ justifyContent: "space-between", width: "100%" }}>
                                                        <Text type="secondary">x{item.quantity}</Text>
                                                        <Tag color={mapStatus(item.status).color}>{mapStatus(item.status).label}</Tag>
                                                    </Space>
                                                </Space>
                                            </List.Item>
                                        )}
                                    />
                                    <Divider style={{ margin: "14px 0" }} />
                                    <Space style={{ justifyContent: "space-between", width: "100%" }}>
                                        <Text strong>Order total</Text>
                                        <Text strong>{formatCurrency(bootstrap.active_order.total_amount)}</Text>
                                    </Space>
                                </>
                            ) : null}
                        </Card>

                        <Card bordered={false} style={{ borderRadius: 18, marginBottom: 16 }}>
                            <Space direction="vertical" size={12} style={{ width: "100%" }}>
                                <Space style={{ justifyContent: "space-between", width: "100%" }}>
                                    <Title level={5} style={{ margin: 0 }}>
                                        Menu
                                    </Title>
                                    <Space align="center">
                                        <ThunderboltOutlined style={{ color: "#d97706" }} />
                                        <Text type="secondary">You can keep adding items until staff locks billing</Text>
                                    </Space>
                                </Space>

                                {bootstrap.menu.length > 1 ? (
                                    <Segmented
                                        block
                                        value={selectedCategory?.id}
                                        onChange={(value) => setSelectedCategoryId(String(value))}
                                        options={bootstrap.menu.map((category) => ({
                                            label: `${category.display_name} (${category.items.length})`,
                                            value: category.id,
                                        }))}
                                    />
                                ) : null}

                                {!selectedCategory || selectedCategory.items.length === 0 ? (
                                    <Empty description="No available menu" />
                                ) : (
                                    <List
                                        split={false}
                                        dataSource={selectedCategory.items}
                                        renderItem={(item) => {
                                            const qty = cart[item.id]?.quantity || 0;
                                            return (
                                                <List.Item style={{ padding: "8px 0" }}>
                                                    <Card
                                                        size="small"
                                                        style={{
                                                            width: "100%",
                                                            borderRadius: 14,
                                                            border: "1px solid #e2e8f0",
                                                        }}
                                                    >
                                                        <Space style={{ width: "100%", justifyContent: "space-between" }} align="start">
                                                            <Space direction="vertical" size={3} style={{ maxWidth: "70%" }}>
                                                                <Text strong>{item.display_name}</Text>
                                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                                    {item.description || "-"}
                                                                </Text>
                                                                <Text strong>{formatCurrency(item.price)}</Text>
                                                            </Space>
                                                            <Space direction="vertical" align="end" size={4}>
                                                                {qty > 0 ? <Badge count={`In cart ${qty}`} /> : null}
                                                                <Button type="primary" onClick={() => addToCart(item)}>
                                                                    Add
                                                                </Button>
                                                            </Space>
                                                        </Space>
                                                    </Card>
                                                </List.Item>
                                            );
                                        }}
                                    />
                                )}
                            </Space>
                        </Card>

                        <Card bordered={false} style={{ borderRadius: 18 }}>
                            <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
                                <Space>
                                    <DynamicQRCode value={orderUrl || ""} size={68} />
                                    <Space direction="vertical" size={0}>
                                        <Text strong>This table link</Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            Share this URL if needed
                                        </Text>
                                    </Space>
                                </Space>
                                <Button
                                    onClick={() => {
                                        if (!orderUrl) return;
                                        navigator.clipboard.writeText(orderUrl).then(() => {
                                            message.success("Link copied");
                                        });
                                    }}
                                >
                                    Copy link
                                </Button>
                            </Space>
                        </Card>
                    </>
                )}
            </div>

            <div
                style={{
                    position: "fixed",
                    left: 0,
                    right: 0,
                    bottom: 14,
                    display: "flex",
                    justifyContent: "center",
                    pointerEvents: "none",
                    zIndex: 40,
                }}
            >
                <Button
                    type="primary"
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    style={{
                        pointerEvents: "all",
                        borderRadius: 999,
                        minWidth: 260,
                        height: 52,
                        boxShadow: "0 14px 35px rgba(15,23,42,0.25)",
                        display: "flex",
                        justifyContent: "space-between",
                    }}
                    onClick={() => setDrawerOpen(true)}
                >
                    <span>Cart {cartSummary.itemCount} items</span>
                    <strong>{formatCurrency(cartSummary.total)}</strong>
                </Button>
            </div>

            <Drawer
                title="Order cart"
                placement="bottom"
                height="82vh"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                extra={<Tag>{cartSummary.itemCount} items</Tag>}
            >
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                    {cartEntries.length === 0 ? (
                        <Empty description="No items in cart" />
                    ) : (
                        <List
                            dataSource={cartEntries}
                            renderItem={(entry) => (
                                <List.Item>
                                    <Space direction="vertical" style={{ width: "100%" }}>
                                        <Space style={{ width: "100%", justifyContent: "space-between" }}>
                                            <div>
                                                <Text strong>{entry.product.display_name}</Text>
                                                <br />
                                                <Text type="secondary">{formatCurrency(entry.product.price)} / item</Text>
                                            </div>
                                            <InputNumber
                                                min={0}
                                                value={entry.quantity}
                                                onChange={(value) => updateQuantity(entry.product.id, Number(value || 0))}
                                            />
                                        </Space>
                                        <Input.TextArea
                                            rows={2}
                                            value={entry.notes}
                                            onChange={(event) => updateNotes(entry.product.id, event.target.value)}
                                            placeholder="Item note (for example: less spicy, no onions)"
                                            maxLength={500}
                                        />
                                    </Space>
                                </List.Item>
                            )}
                        />
                    )}

                    <Divider />
                    <Space style={{ width: "100%", justifyContent: "space-between" }}>
                        <Text strong>Grand total</Text>
                        <Title level={4} style={{ margin: 0 }}>
                            {formatCurrency(cartSummary.total)}
                        </Title>
                    </Space>

                    <Alert
                        type="info"
                        showIcon
                        message="Policy"
                        description="After submitting, customer cannot cancel or pay from this page. Please call store staff."
                    />

                    <Button
                        type="primary"
                        size="large"
                        onClick={submitOrder}
                        loading={isSubmitting}
                        disabled={cartEntries.length === 0}
                        style={{ borderRadius: 12, height: 48 }}
                    >
                        Submit order
                    </Button>
                </Space>
            </Drawer>
        </div>
    );
}
