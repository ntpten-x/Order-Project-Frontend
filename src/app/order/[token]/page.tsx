"use client";

import React from "react";
import {
    App,
    Alert,
    Badge,
    Button,
    Card,
    Empty,
    List,
    Pagination,
    Spin,
    Tag,
    Typography,
} from "antd";
import {
    DeleteOutlined,
    EditOutlined,
    MinusOutlined,
    PlusOutlined,
    QrcodeOutlined,
    ShoppingCartOutlined,
    ShopOutlined,
    LockOutlined,
} from "@ant-design/icons";
import { useParams } from "next/navigation";
import type { CartItem } from "../../../store/useCartStore";
import type { Products } from "../../../types/api/pos/products";
import { groupOrderItems } from "../../../utils/orderGrouping";
import { resolveImageSource } from "../../../utils/image/source";
import { formatPrice } from "../../../utils/products/productDisplay.utils";
import { orderDetailColors, orderDetailStyles } from "../../../theme/pos/orders/style";
import { POSCategoryFilterBar } from "../../../components/pos/shared/POSCategoryFilterBar";
import { POSCartDrawer } from "../../../components/pos/shared/POSCartDrawer";
import { POSCheckoutDrawer } from "../../../components/pos/shared/POSCheckoutDrawer";
import { CartItemDetailModal } from "../../../components/pos/shared/CartItemDetailModal";
import { POSHeaderBar } from "../../../components/pos/shared/POSHeaderBar";
import { POSNoteModal } from "../../../components/pos/shared/POSNoteModal";
import { POSProductCard } from "../../../components/pos/shared/POSProductCard";
import { POSProductDetailModal } from "../../../components/pos/shared/POSProductDetailModal";
import SmartImage from "../../../components/ui/image/SmartImage";
import { POSSharedStyles, posColors, posComponentStyles, posLayoutStyles, POSHeaderBadge } from "../../../components/pos/shared/style";
import { usePublicTableOrderRealtime } from "../../../hooks/usePublicTableOrderRealtime";
import { OrderType } from "../../../types/api/pos/salesOrder";
import type { Topping } from "../../../types/api/pos/topping";

const { Text, Title } = Typography;

const MENU_PAGE_SIZE = 20;

type MenuItem = {
    id: string;
    category_id: string;
    display_name: string;
    description: string;
    price: number;
    img_url: string | null;
    unit_display_name: string | null;
};

type MenuCategory = {
    id: string;
    display_name: string;
    items: MenuItem[];
};

type CustomerOrderItem = {
    id: string;
    product_id: string;
    display_name: string;
    quantity: number;
    price: number;
    total_price: number;
    status: string;
    notes: string;
    details?: { id?: string; detail_name: string; extra_price: number; topping_id?: string | null }[];
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
    items: CustomerOrderItem[];
};

type BootstrapData = {
    table: {
        id: string;
        table_name: string;
    };
    menu: MenuCategory[];
    toppings: Topping[];
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

type NoteEditorState = {
    id: string;
    name: string;
    note: string;
};

type DetailEditorState = {
    id: string;
    name: string;
    product: Products;
    details: { detail_name: string; extra_price: number; topping_id?: string }[];
};



function mapMenuToProduct(item: MenuItem, category: MenuCategory): Products {
    const now = new Date();
    const unitId = `unit-${item.id}`;

    return {
        id: item.id,
        display_name: item.display_name,
        description: item.description || "",
        price: Number(item.price || 0),
        price_delivery: Number(item.price || 0),
        category_id: category.id,
        unit_id: unitId,
        img_url: item.img_url,
        create_date: now,
        update_date: now,
        is_active: true,
        category: {
            id: category.id,
            display_name: category.display_name,
            create_date: now,
            update_date: now,
            is_active: true,
        },
        unit: {
            id: unitId,
            display_name: item.unit_display_name || "รายการ",
            create_date: now,
            update_date: now,
            is_active: true,
        },
    };
}

function createCartItem(product: Products): CartItem {
    return {
        cart_item_id: `qr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        product,
        quantity: 1,
        notes: "",
        details: [],
    };
}

class FetchJsonError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "FetchJsonError";
        this.status = status;
    }
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
        throw new FetchJsonError(message, response.status);
    }

    if (payload?.success === true && payload?.data !== undefined) {
        return payload.data as T;
    }

    return payload as T;
}

const QROrderMobileStyles = () => (
    <style jsx global>{`
        .qr-order-page {
            overflow-x: hidden;
        }

        .qr-order-page .qr-floating-cart-btn {
            width: 62px !important;
            height: 62px !important;
            border-radius: 20px !important;
        }

        @media (max-width: 768px) {
            .qr-order-page .qr-main-content {
                padding: 12px !important;
            }

            .qr-order-page .qr-main-stack {
                gap: 14px !important;
            }

            .qr-order-page .qr-alert .ant-alert-message {
                font-size: 13px !important;
                line-height: 1.35 !important;
            }

            .qr-order-page .qr-alert .ant-alert-description {
                font-size: 12px !important;
                line-height: 1.45 !important;
            }

            .qr-order-page .qr-products-grid {
                gap: 10px !important;
            }

            .qr-order-page .pos-product-card {
                border-radius: 14px !important;
                min-height: 178px !important;
            }

            .qr-order-page .pos-product-image-mobile {
                height: 108px !important;
            }

            .qr-order-page .pos-product-info-mobile {
                padding: 10px !important;
            }

            .qr-order-page .pos-product-name-mobile {
                font-size: 12px !important;
            }

            .qr-order-page .pos-product-price-mobile {
                font-size: 14px !important;
            }

            .qr-order-page .pos-add-button-mobile {
                min-height: 34px !important;
                height: 34px !important;
                font-size: 11px !important;
                padding: 0 10px !important;
            }

            .qr-order-page .qr-summary-card {
                border-radius: 14px !important;
            }

            .qr-order-page .qr-summary-card .ant-card-body {
                padding: 14px !important;
            }

            .qr-order-page .qr-summary-header {
                gap: 8px !important;
                margin-bottom: 10px !important;
                align-items: flex-start !important;
            }

            .qr-order-page .qr-summary-title {
                font-size: 16px !important;
            }

            .qr-order-page .qr-summary-subtitle {
                font-size: 12px !important;
            }

            .qr-order-page .qr-summary-refresh-btn {
                height: 34px !important;
                font-size: 12px !important;
                padding: 0 10px !important;
                border-radius: 9px !important;
            }

            .qr-order-page .qr-order-meta {
                gap: 6px !important;
                margin-bottom: 10px !important;
            }

            .qr-order-page .summary-list {
                padding: 10px 12px !important;
                margin-bottom: 10px !important;
                border-radius: 10px !important;
            }

            .qr-order-page .summary-item-row {
                gap: 10px !important;
                padding: 10px 0 !important;
                align-items: flex-start !important;
            }

            .qr-order-page .summary-item-image {
                width: 40px !important;
                height: 40px !important;
                border-radius: 10px !important;
            }

            .qr-order-page .qr-summary-total-label {
                font-size: 17px !important;
            }

            .qr-order-page .qr-summary-total-value {
                font-size: 24px !important;
            }

            .qr-order-page .qr-floating-cart-btn {
                width: 64px !important;
                height: 64px !important;
                border-radius: 20px !important;
            }
        }

        @media (max-width: 768px) {
            .qr-mobile-cart-drawer .ant-drawer-content-wrapper,
            .qr-mobile-checkout-drawer .ant-drawer-content-wrapper {
                width: 100% !important;
                max-width: 100vw !important;
            }

            .qr-mobile-cart-drawer .ant-drawer-header,
            .qr-mobile-cart-drawer .ant-drawer-footer,
            .qr-mobile-checkout-drawer .ant-drawer-header,
            .qr-mobile-checkout-drawer .ant-drawer-footer {
                padding: 12px !important;
            }

            .qr-mobile-cart-drawer .ant-drawer-body {
                padding: 12px !important;
            }

            .qr-mobile-checkout-drawer .ant-drawer-body {
                padding: 0 12px !important;
            }
        }
    `}</style>
);

export default function CustomerTableOrderPage() {
    const params = useParams();
    const token = String((params as Record<string, string | string[]>)?.token || "");
    const { message, modal } = App.useApp();

    const [isLoading, setIsLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [bootstrap, setBootstrap] = React.useState<BootstrapData | null>(null);
    const [accessDenied, setAccessDenied] = React.useState(false);

    const [selectedCategory, setSelectedCategory] = React.useState<string | undefined>(undefined);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [page, setPage] = React.useState(1);

    const [cartVisible, setCartVisible] = React.useState(false);
    const [checkoutVisible, setCheckoutVisible] = React.useState(false);
    const [cartItems, setCartItems] = React.useState<CartItem[]>([]);

    const [isNoteModalVisible, setIsNoteModalVisible] = React.useState(false);
    const [noteInput, setNoteInput] = React.useState("");
    const [currentNoteItem, setCurrentNoteItem] = React.useState<NoteEditorState | null>(null);
    const [isDetailModalVisible, setIsDetailModalVisible] = React.useState(false);
    const [currentDetailItem, setCurrentDetailItem] = React.useState<DetailEditorState | null>(null);

    const [isProductModalVisible, setIsProductModalVisible] = React.useState(false);
    const [selectedProduct, setSelectedProduct] = React.useState<Products | null>(null);
    const submitIdempotencyKeyRef = React.useRef<string | null>(null);
    const cartStorageKey = React.useMemo(
        () => (token ? `public-table-order-cart:${token}` : null),
        [token]
    );

    const deferredSearchQuery = React.useDeferredValue(searchQuery);
    const cartSignature = React.useMemo(
        () =>
            cartItems
                .map((item) =>
                    `${item.product.id}:${item.quantity}:${item.notes || ""}:${(item.details || [])
                        .map((detail) => `${detail.topping_id || detail.detail_name}:${Number(detail.extra_price || 0)}`)
                        .join(",")}`,
                )
                .join("|"),
        [cartItems],
    );

    const getOrCreateSubmitIdempotencyKey = React.useCallback(() => {
        if (!submitIdempotencyKeyRef.current) {
            const randomPart =
                typeof globalThis.crypto?.randomUUID === "function"
                    ? globalThis.crypto.randomUUID()
                    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
            const shortToken = token.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 24) || "public";
            submitIdempotencyKeyRef.current = `qr-${shortToken}-${randomPart}`;
        }
        return submitIdempotencyKeyRef.current;
    }, [token]);

    React.useEffect(() => {
        submitIdempotencyKeyRef.current = null;
    }, [cartSignature]);

    React.useEffect(() => {
        if (!cartStorageKey || typeof window === "undefined") {
            setCartItems([]);
            return;
        }

        try {
            const rawCart = window.sessionStorage.getItem(cartStorageKey);
            if (!rawCart) {
                setCartItems([]);
                return;
            }

            const parsedCart = JSON.parse(rawCart);
            setCartItems(Array.isArray(parsedCart) ? (parsedCart as CartItem[]) : []);
        } catch {
            setCartItems([]);
        }
    }, [cartStorageKey]);

    React.useEffect(() => {
        if (!cartStorageKey || typeof window === "undefined") {
            return;
        }

        if (cartItems.length === 0) {
            window.sessionStorage.removeItem(cartStorageKey);
            return;
        }

        window.sessionStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
    }, [cartItems, cartStorageKey]);

    const loadBootstrap = React.useCallback(async () => {
        if (!token) {
            setBootstrap(null);
            setAccessDenied(true);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const data = await fetchJson<BootstrapData>(`/api/public/table-order/${encodeURIComponent(token)}`);
            setAccessDenied(false);
            setBootstrap(data);
            setSelectedCategory((prev) => {
                if (!data.menu?.length) return undefined;
                if (!prev) return undefined;
                return data.menu.some((cat) => cat.id === prev) ? prev : undefined;
            });
        } catch (error) {
            setBootstrap(null);
            if (error instanceof FetchJsonError && (error.status === 403 || error.status === 404)) {
                setAccessDenied(true);
            } else {
                message.error(error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลเมนูได้");
            }
        } finally {
            setIsLoading(false);
        }
    }, [message, token]);

    const refreshActiveOrder = React.useCallback(
        async (showError = false) => {
            if (!token) return;
            try {
                const data = await fetchJson<ActiveOrderData>(`/api/public/table-order/${encodeURIComponent(token)}/order`);
                setAccessDenied(false);
                setBootstrap((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        active_order: data.active_order,
                        policy: data.policy,
                    };
                });
            } catch (error) {
                if (error instanceof FetchJsonError && (error.status === 403 || error.status === 404)) {
                    setAccessDenied(true);
                    setBootstrap(null);
                    return;
                }

                if (showError) {
                    message.error(error instanceof Error ? error.message : "ไม่สามารถอัปเดตสถานะออเดอร์ได้");
                }
            }
        },
        [message, token]
    );

    React.useEffect(() => {
        void loadBootstrap();
    }, [loadBootstrap]);

    usePublicTableOrderRealtime({
        publicTableToken: token,
        enabled: Boolean(token && bootstrap && !accessDenied),
        onOrderChanged: async () => {
            await refreshActiveOrder();
        },
    });

    const menuProducts = React.useMemo(() => {
        if (!bootstrap) return [];
        return bootstrap.menu.flatMap((category) => category.items.map((item) => mapMenuToProduct(item, category)));
    }, [bootstrap]);

    const menuProductById = React.useMemo(() => {
        const map = new Map<string, Products>();
        menuProducts.forEach((product) => {
            map.set(product.id, product);
        });
        return map;
    }, [menuProducts]);

    React.useEffect(() => {
        if (!menuProductById.size) return;

        setCartItems((prev) => {
            let changed = false;
            const nextCart = prev.flatMap((item) => {
                const latestProduct = menuProductById.get(item.product.id);
                if (!latestProduct) {
                    changed = true;
                    return [];
                }

                if (latestProduct !== item.product) {
                    changed = true;
                    return [{ ...item, product: latestProduct }];
                }

                return [item];
            });

            return changed ? nextCart : prev;
        });
    }, [menuProductById]);

    const filteredProducts = React.useMemo(() => {
        const keyword = deferredSearchQuery.trim().toLowerCase();

        return menuProducts.filter((product) => {
            const matchedCategory = !selectedCategory || product.category_id === selectedCategory;
            if (!matchedCategory) return false;
            if (!keyword) return true;
            return `${product.display_name} ${product.description || ""}`.toLowerCase().includes(keyword);
        });
    }, [deferredSearchQuery, menuProducts, selectedCategory]);

    const paginatedProducts = React.useMemo(() => {
        const startIndex = (page - 1) * MENU_PAGE_SIZE;
        return filteredProducts.slice(startIndex, startIndex + MENU_PAGE_SIZE);
    }, [filteredProducts, page]);

    React.useEffect(() => {
        setPage(1);
    }, [searchQuery, selectedCategory]);

    React.useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(filteredProducts.length / MENU_PAGE_SIZE));
        if (page > maxPage) {
            setPage(maxPage);
        }
    }, [filteredProducts.length, page]);

    const isOrderLocked = Boolean(bootstrap?.active_order && !bootstrap.active_order.can_add_items);

    React.useEffect(() => {
        if (!isOrderLocked) return;
        setCartItems([]);
        setCheckoutVisible(false);
    }, [isOrderLocked]);

    const syncLockedOrderState = React.useCallback(async () => {
        setCartVisible(false);
        setCheckoutVisible(false);
        setCartItems([]);
        await loadBootstrap();
        await refreshActiveOrder();
    }, [loadBootstrap, refreshActiveOrder]);

    const showLockedOrderNotice = React.useCallback(() => {
        let synced = false;
        const syncOnce = () => {
            if (synced) return;
            synced = true;
            void syncLockedOrderState();
        };

        modal.info({
            title: <span style={{ fontSize: 18, fontWeight: 700 }}>ไม่สามารถสั่งรายการเพิ่มได้</span>,
            icon: <LockOutlined style={{ color: posColors.primary }} />,
            content: (
                <div style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: 15, color: posColors.textSecondary }}>
                        ไม่สามารถสั่งรายการเพิ่มได้ เนื่องจากบิลโต๊ะนี้ถูกล็อกแล้ว และอยู่ระหว่างการรอชำระเงิน
                    </Text>
                    <Text style={{ display: "block", marginTop: 8, fontSize: 13, color: "#94a3b8" }}>
                        เมื่อปิดข้อความนี้ ระบบจะอัปเดตสถานะบิลให้อัตโนมัติ
                    </Text>
                </div>
            ),
            okText: "ตกลง",
            centered: true,
            maskClosable: true,
            afterClose: syncOnce,
            onOk: syncOnce,
            okButtonProps: {
                size: "large",
                style: {
                    borderRadius: 10,
                    height: 44,
                    minWidth: 100,
                    fontWeight: 600,
                },
            },
        });
    }, [modal, syncLockedOrderState]);

    const getProductUnitPrice = React.useCallback((product: Products) => Number(product.price || 0), []);

    const getCartItemLineTotal = React.useCallback((item: CartItem) => {
        const unitPrice = Number(item.product.price || 0);
        const detailsTotal = (item.details || []).reduce(
            (sum, detail) => sum + Number(detail.extra_price || 0),
            0,
        );
        return (unitPrice + detailsTotal) * item.quantity;
    }, []);

    const totalItems = React.useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

    const subtotal = React.useMemo(() => {
        return cartItems.reduce((sum, item) => {
            return sum + getCartItemLineTotal(item);
        }, 0);
    }, [cartItems, getCartItemLineTotal]);

    const groupedCartItems = React.useMemo(() => groupOrderItems(cartItems), [cartItems]);

    const categorySummary = React.useMemo(() => {
        const categoriesMap: Record<string, number> = {};
        cartItems.forEach((item) => {
            const categoryName = item.product.category?.display_name || "อื่นๆ";
            categoriesMap[categoryName] = (categoriesMap[categoryName] || 0) + item.quantity;
        });
        return Object.entries(categoriesMap).map(([name, count]) => ({ name, count }));
    }, [cartItems]);

    const purchasedItems = React.useMemo(() => {
        const activeItems = bootstrap?.active_order?.items || [];
        const nonCancelled = activeItems.filter((item) => String(item.status || "").toLowerCase() !== "cancelled");
        return groupOrderItems(nonCancelled);
    }, [bootstrap?.active_order?.items]);

    const purchasedCategorySummary = React.useMemo(() => {
        const summaryMap: Record<string, number> = {};
        purchasedItems.forEach((item) => {
            const categoryName = menuProductById.get(item.product_id)?.category?.display_name || "อื่นๆ";
            summaryMap[categoryName] = (summaryMap[categoryName] || 0) + Number(item.quantity || 0);
        });
        return Object.entries(summaryMap);
    }, [menuProductById, purchasedItems]);


    const addToCart = React.useCallback(
        (product: Products) => {
            if (isOrderLocked) {
                showLockedOrderNotice();
                return;
            }
            setCartItems((prev) => {
                const existingItem = prev.find(
                    (item) =>
                        item.product.id === product.id &&
                        !item.notes &&
                        (!item.details || item.details.length === 0)
                );

                if (!existingItem) {
                    return [...prev, createCartItem(product)];
                }

                return prev.map((item) =>
                    item.cart_item_id === existingItem.cart_item_id
                        ? {
                              ...item,
                              quantity: item.quantity + 1,
                          }
                        : item
                );
            });
            message.success(`เพิ่ม ${product.display_name} ลงตะกร้าเรียบร้อยแล้ว`);
        },
        [isOrderLocked, message, showLockedOrderNotice]
    );

    const updateQuantity = React.useCallback((cartItemId: string, quantity: number) => {
        setCartItems((prev) => {
            if (quantity <= 0) {
                return prev.filter((item) => item.cart_item_id !== cartItemId);
            }
            return prev.map((item) =>
                item.cart_item_id === cartItemId
                    ? {
                          ...item,
                          quantity,
                      }
                    : item
            );
        });
    }, []);

    const removeFromCart = React.useCallback((cartItemId: string) => {
        setCartItems((prev) => prev.filter((item) => item.cart_item_id !== cartItemId));
    }, []);

    const clearCart = React.useCallback(() => {
        setCartItems([]);
    }, []);

    const openProductModal = React.useCallback((product: Products) => {
        setSelectedProduct(product);
        setIsProductModalVisible(true);
    }, []);

    const closeProductModal = React.useCallback(() => {
        setIsProductModalVisible(false);
        setSelectedProduct(null);
    }, []);

    const openNoteModal = React.useCallback((id: string, name: string, note: string) => {
        setCurrentNoteItem({ id, name, note });
        setNoteInput(note || "");
        setIsNoteModalVisible(true);
    }, []);

    const closeNoteModal = React.useCallback(() => {
        setCurrentNoteItem(null);
        setNoteInput("");
        setIsNoteModalVisible(false);
    }, []);

    const openDetailModal = React.useCallback((item: CartItem) => {
        setCurrentDetailItem({
            id: item.cart_item_id,
            name: item.product.display_name || "สินค้า",
            product: item.product,
            details: item.details || [],
        });
        setIsDetailModalVisible(true);
    }, []);

    const closeDetailModal = React.useCallback(() => {
        setCurrentDetailItem(null);
        setIsDetailModalVisible(false);
    }, []);

    const handleSaveNote = React.useCallback(() => {
        if (!currentNoteItem) return;
        setCartItems((prev) =>
            prev.map((item) =>
                item.cart_item_id === currentNoteItem.id
                    ? {
                          ...item,
                          notes: noteInput,
                      }
                    : item
            )
        );
        message.success("บันทึกหมายเหตุเรียบร้อยแล้ว");
        closeNoteModal();
    }, [closeNoteModal, currentNoteItem, message, noteInput]);

    const handleSaveDetails = React.useCallback(
        (details: { detail_name: string; extra_price: number; topping_id?: string }[]) => {
            if (!currentDetailItem) return;

            setCartItems((prev) =>
                prev.map((item) =>
                    item.cart_item_id === currentDetailItem.id
                        ? {
                              ...item,
                              details,
                          }
                        : item,
                ),
            );
            message.success("บันทึกรายละเอียดเพิ่มเติมแล้ว");
        },
        [currentDetailItem, message],
    );

    const handleCheckout = React.useCallback(() => {
        if (cartItems.length === 0) {
            message.warning("กรุณาเพิ่มสินค้าลงตะกร้าก่อน");
            return;
        }
        if (isOrderLocked) {
            showLockedOrderNotice();
            return;
        }
        setCheckoutVisible(true);
    }, [cartItems.length, isOrderLocked, message, showLockedOrderNotice]);

    const submitOrder = React.useCallback(async () => {
        if (!bootstrap) return;
        if (cartItems.length === 0) {
            message.warning("กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ");
            return;
        }
        if (isOrderLocked) {
            showLockedOrderNotice();
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                items: cartItems.map((entry) => ({
                    product_id: entry.product.id,
                    quantity: entry.quantity,
                    notes: entry.notes || "",
                    details: (entry.details || [])
                        .filter((detail) => detail.topping_id)
                        .map((detail) => ({
                            topping_id: String(detail.topping_id),
                        })),
                })),
            };
            const idempotencyKey = getOrCreateSubmitIdempotencyKey();

            const result = await fetchJson<SubmitOrderData>(`/api/public/table-order/${encodeURIComponent(token)}/order`, {
                method: "POST",
                headers: {
                    "Idempotency-Key": idempotencyKey,
                },
                body: JSON.stringify(payload),
            });

            setBootstrap((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    active_order: result.order,
                };
            });

            setCartItems([]);
            setAccessDenied(false);
            submitIdempotencyKeyRef.current = null;
            setCheckoutVisible(false);
            setCartVisible(false);
            void refreshActiveOrder();

            message.success(result.mode === "create" ? "ส่งคำสั่งซื้อเรียบร้อยแล้ว" : "เพิ่มรายการเรียบร้อยแล้ว");
        } catch (error) {
            if (error instanceof FetchJsonError && (error.status === 403 || error.status === 404)) {
                setAccessDenied(true);
                setBootstrap(null);
                setCartVisible(false);
                setCheckoutVisible(false);
                return;
            }

            message.error(error instanceof Error ? error.message : "ไม่สามารถส่งคำสั่งซื้อได้");
        } finally {
            setIsSubmitting(false);
        }
    }, [bootstrap, cartItems, getOrCreateSubmitIdempotencyKey, isOrderLocked, message, refreshActiveOrder, showLockedOrderNotice, token]);

    const handleConfirmOrder = React.useCallback(async () => {
        await submitOrder();
    }, [submitOrder]);

    const renderCartItem = React.useCallback(
        (item: CartItem) => {
            const lineTotal = getCartItemLineTotal(item);
            const imageSrc = resolveImageSource(item.product.img_url);
            const productName = item.product.display_name || "สินค้า";
            const categoryName = item.product.category?.display_name || "ทั่วไป";

            return (
                <List.Item key={item.cart_item_id} style={posComponentStyles.cartItemContainer} className="cart-item-hover">
                    <div style={posComponentStyles.cartItemRow}>
                        <div style={{ flexShrink: 0 }}>
                            {imageSrc ? (
                                <div style={{ ...posComponentStyles.cartItemImage, position: "relative" }}>
                                    <SmartImage
                                        src={imageSrc}
                                        alt={productName}
                                        fill
                                        style={{ objectFit: "cover" }}
                                        sizes="72px"
                                    />
                                </div>
                            ) : (
                                <div style={posComponentStyles.cartItemImagePlaceholder}>
                                    <ShopOutlined style={{ fontSize: 24, color: "#94a3b8" }} />
                                </div>
                            )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div style={{ flex: 1 }}>
                                    <Text
                                        style={{
                                            fontWeight: 600,
                                            fontSize: 15,
                                            color: "#1e293b",
                                            display: "block",
                                            lineHeight: 1.2,
                                            marginBottom: 4,
                                        }}
                                    >
                                        {productName}
                                    </Text>
                                    <Tag style={posComponentStyles.cartItemTag}>{categoryName}</Tag>
                                </div>
                                <Text
                                    style={{
                                        fontWeight: 700,
                                        fontSize: 16,
                                        color: "#10b981",
                                        whiteSpace: "nowrap",
                                        marginLeft: 8,
                                    }}
                                >
                                    {formatPrice(lineTotal)}
                                </Text>
                            </div>

                            {item.notes ? (
                                <div style={posComponentStyles.cartItemNote}>
                                    <Text style={{ fontSize: 11, color: "#ef4444" }}>โน้ต: {item.notes}</Text>
                                </div>
                            ) : null}

                            {item.details && item.details.length > 0 ? (
                                <div style={{ marginTop: 2, display: "flex", flexDirection: "column", gap: 0 }}>
                                    {item.details.map((detail, index) => (
                                        <Text key={`${detail.topping_id || detail.detail_name}-${index}`} style={{ fontSize: 13, color: "#10B981", lineHeight: 1.4 }}>
                                            + {detail.detail_name} (+{formatPrice(Number(detail.extra_price || 0))})
                                        </Text>
                                    ))}
                                </div>
                            ) : null}

                            <div
                                className="pos-cart-item-controls"
                                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}
                            >
                                <div className="pos-cart-qty-control" style={posComponentStyles.cartItemQtyControl}>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<MinusOutlined style={{ fontSize: 10 }} />}
                                        className="pos-cart-icon-btn pos-cart-qty-btn"
                                        aria-label="ลดจำนวน"
                                        onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                                        style={{ borderRadius: 10, background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    />
                                    <Text style={{ margin: "0 8px", fontWeight: 600, minWidth: 16, textAlign: "center", fontSize: 13 }}>
                                        {item.quantity}
                                    </Text>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<PlusOutlined style={{ fontSize: 10 }} />}
                                        className="pos-cart-icon-btn pos-cart-qty-btn"
                                        aria-label="เพิ่มจำนวน"
                                        onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                                        style={{ borderRadius: 10, background: "#10b981", color: "white" }}
                                    />
                                </div>

                                <div className="pos-cart-action-row" style={{ display: "flex", gap: 6 }}>
                                    <Button
                                        type="text"
                                        icon={<EditOutlined />}
                                        size="small"
                                        className="pos-cart-icon-btn pos-cart-action-btn"
                                        aria-label="แก้ไขโน้ต"
                                        onClick={() => openNoteModal(item.cart_item_id, productName, item.notes || "")}
                                        style={{ color: "#64748b", background: "#f1f5f9", borderRadius: 10 }}
                                    />
                                    <Button
                                        type="text"
                                        icon={<PlusOutlined />}
                                        size="small"
                                        className="pos-cart-icon-btn pos-cart-action-btn"
                                        aria-label="เพิ่มท็อปปิ้ง"
                                        onClick={() => openDetailModal(item)}
                                        style={{ color: "#10b981", background: "#ecfdf5", borderRadius: 10 }}
                                    />
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        size="small"
                                        className="pos-cart-icon-btn pos-cart-action-btn"
                                        aria-label="ลบออกจากตะกร้า"
                                        onClick={() => removeFromCart(item.cart_item_id)}
                                        style={{ background: "#fef2f2", borderRadius: 10 }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </List.Item>
            );
        },
        [getCartItemLineTotal, openDetailModal, openNoteModal, removeFromCart, updateQuantity]
    );

    const tableName = (
        <POSHeaderBadge>
            *{bootstrap?.table.table_name ? `โต๊ะ ${bootstrap.table.table_name}` : "โต๊ะ"}
        </POSHeaderBadge>
    );

    return (
        <>
            <POSSharedStyles />
            <QROrderMobileStyles />

            <div style={posLayoutStyles.container} className="qr-order-page">
                {!accessDenied ? (
                    <>
                        <POSHeaderBar
                            title="สั่งอาหาร"
                            subtitle={tableName}
                            icon={<QrcodeOutlined style={{ fontSize: 26 }} />}
                            subtitlePosition="aside"
                        />

                        <POSCategoryFilterBar
                            categories={bootstrap?.menu || []}
                            searchQuery={searchQuery}
                            selectedCategory={selectedCategory}
                            onSearchChange={setSearchQuery}
                            onSelectCategory={setSelectedCategory}
                        />
                    </>
                ) : null}

                <main style={posLayoutStyles.content} className="pos-content-mobile qr-main-content" role="main">
                    {isLoading ? (
                        <div style={posLayoutStyles.loadingContainer}>
                            <Spin size="large" />
                            <Text style={{ display: "block", marginTop: 16, color: posColors.textSecondary }}>
                                กำลังโหลดเมนู...
                            </Text>
                        </div>
                    ) : accessDenied ? (
                        <div
                            style={{
                                minHeight: "calc(100dvh - 180px)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "24px 16px",
                            }}
                        >
                            <Card
                                bordered={false}
                                style={{
                                    width: "100%",
                                    maxWidth: 520,
                                    borderRadius: 28,
                                    padding: 8,
                                    textAlign: "center",
                                    background:
                                        "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,247,237,0.96) 100%)",
                                    boxShadow: "0 24px 80px rgba(15, 23, 42, 0.10)",
                                }}
                            >
                                <div
                                    style={{
                                        width: 88,
                                        height: 88,
                                        margin: "0 auto 20px",
                                        borderRadius: 28,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: "linear-gradient(135deg, #fff1f2 0%, #ffedd5 100%)",
                                        color: "#dc2626",
                                        boxShadow: "inset 0 0 0 1px rgba(220, 38, 38, 0.08)",
                                    }}
                                >
                                    <LockOutlined style={{ fontSize: 34 }} />
                                </div>
                                <Title level={2} style={{ marginBottom: 8, fontSize: 30 }}>
                                    ไม่อนุญาตให้ใช้งาน
                                </Title>
                                <Text style={{ display: "block", fontSize: 16, color: "#64748b", lineHeight: 1.7 }}>
                                    กรุณาสอบถามพนักงาน
                                </Text>
                            </Card>
                        </div>
                    ) : !bootstrap ? (
                        <div style={posLayoutStyles.emptyContainer}>
                            <Empty description="ไม่พบข้อมูลโต๊ะ หรือ QR Code หมดอายุแล้ว" />
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="qr-main-stack">
                            {isOrderLocked ? (
                                <Alert
                                    type="info"
                                    showIcon
                                    className="qr-alert qr-alert-info"
                                    message="บิลนี้ถูกล็อกแล้ว"
                                    description="ไม่สามารถเพิ่มรายการใหม่ได้ เนื่องจากอยู่ระหว่างการรอชำระเงิน กรุณาสอบถามพนักงาน"
                                    style={{ borderRadius: 14 }}
                                />
                            ) : null}

                            {filteredProducts.length > 0 ? (
                                <>
                                    <div
                                        style={posLayoutStyles.productGrid}
                                        className="pos-product-grid pos-product-grid-mobile qr-products-grid"
                                    >
                                        {paginatedProducts.map((product, index) => (
                                            <POSProductCard
                                                key={product.id}
                                                index={index}
                                                product={product}
                                                onOpenProductModal={openProductModal}
                                                onAddToCart={addToCart}
                                                getProductUnitPrice={getProductUnitPrice}
                                            />
                                        ))}
                                    </div>

                                    <div className="pos-pagination-container" style={{ ...posLayoutStyles.paginationContainer, position: 'relative' }}>
                                        <div className="pos-pagination-total" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}>
                                            <Text type="secondary" style={{ fontSize: 13 }}>
                                                ทั้งหมด {filteredProducts.length} รายการ
                                            </Text>
                                        </div>
                                        <Pagination
                                            current={page}
                                            total={filteredProducts.length}
                                            pageSize={MENU_PAGE_SIZE}
                                            onChange={(nextPage) => setPage(nextPage)}
                                            showSizeChanger={false}
                                        />
                                    </div>
                                </>
                            ) : (
                                <Card style={posLayoutStyles.emptyContainer}>
                                    <Empty description="ไม่พบเมนูตามที่ค้นหา" />
                                    <div style={{ marginTop: 12, textAlign: "center" }}>
                                        <Button
                                            onClick={() => {
                                                setSearchQuery("");
                                                setSelectedCategory(undefined);
                                                setPage(1);
                                            }}
                                        >
                                            รีเซ็ตตัวกรอง
                                        </Button>
                                    </div>
                                </Card>
                            )}

                            {bootstrap.active_order && (
                                <Card
                                    className="summary-card qr-summary-card"
                                    style={{
                                        ...orderDetailStyles.summaryCard,
                                        position: "static",
                                        top: "auto",
                                        marginTop: 4,
                                    }}
                                >
                                    <div
                                        style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}
                                        className="qr-summary-header"
                                    >
                                        <div>
                                            <Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 600 }} className="qr-summary-title">
                                                สรุปการสั่งซื้อ
                                            </Title>
                                        </div>
                                    </div>

                                    <>
                                        <div style={orderDetailStyles.summaryList} className="summary-list">
                                            <Text
                                                strong
                                                style={{
                                                    fontSize: 15,
                                                    marginBottom: 10,
                                                    display: "block",
                                                    color: orderDetailColors.textSecondary,
                                                }}
                                            >
                                                รายการที่สั่งแล้ว
                                            </Text>

                                            {purchasedItems.length > 0 ? (
                                                purchasedItems.map((item, index) => {
                                                    const product = menuProductById.get(item.product_id);
                                                    const imageSrc = resolveImageSource(product?.img_url || null);
                                                    const isLast = index === purchasedItems.length - 1;

                                                    return (
                                                        <div
                                                            key={`${item.id}-${index}`}
                                                            style={{
                                                                ...orderDetailStyles.summaryItemRow,
                                                                ...(isLast ? orderDetailStyles.summaryItemRowLast : {}),
                                                            }}
                                                            className="summary-item-row"
                                                        >
                                                            {imageSrc ? (
                                                                <div
                                                                    style={{
                                                                        ...orderDetailStyles.summaryItemImage,
                                                                        position: "relative",
                                                                        overflow: "hidden",
                                                                    }}
                                                                    className="summary-item-image"
                                                                >
                                                                    <SmartImage
                                                                        src={imageSrc}
                                                                        alt={item.display_name || "สินค้า"}
                                                                        fill
                                                                        style={{ objectFit: "cover" }}
                                                                        sizes="48px"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    style={{
                                                                        ...orderDetailStyles.summaryItemImage,
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        background: "#f8fafc",
                                                                    }}
                                                                    className="summary-item-image"
                                                                >
                                                                    <ShopOutlined style={{ fontSize: 16, color: "#bfbfbf" }} />
                                                                </div>
                                                            )}

                                                            <div style={orderDetailStyles.summaryItemContent}>
                                                                <div
                                                                    style={{
                                                                        display: "flex",
                                                                        justifyContent: "space-between",
                                                                        alignItems: "flex-start",
                                                                    }}
                                                                >
                                                                    <Text strong style={{ fontSize: 15, flex: 1, lineHeight: 1.4 }}>
                                                                        {item.display_name}
                                                                    </Text>
                                                                    <Text strong style={{ fontSize: 15, color: orderDetailColors.primary, lineHeight: 1.4 }}>
                                                                        {formatPrice(Number(item.total_price || 0))}
                                                                    </Text>
                                                                </div>

                                                                <div
                                                                    style={{
                                                                        display: "flex",
                                                                        justifyContent: "space-between",
                                                                        alignItems: "center",
                                                                        marginTop: 4,
                                                                    }}
                                                                >
                                                                    <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.4 }}>
                                                                        จำนวน: {item.quantity}
                                                                    </Text>
                                                                    <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.4 }}>
                                                                        ราคา: {formatPrice(Number(item.price || 0))}
                                                                    </Text>
                                                                </div>

                                                                {item.details && item.details.length > 0 && (
                                                                    <div style={{ marginTop: 2, display: "flex", flexDirection: "column", gap: 0 }}>
                                                                        {item.details.map((d: { detail_name: string; extra_price: number }, idx: number) => (
                                                                            <Text key={idx} style={{ fontSize: 13, color: "#10B981", lineHeight: 1.4 }}>
                                                                                + {d.detail_name} (+{formatPrice(Number(d.extra_price))})
                                                                            </Text>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {item.notes ? (
                                                                    <div
                                                                        style={{
                                                                            ...orderDetailStyles.summaryDetailText,
                                                                            color: orderDetailColors.cancelled,
                                                                            fontStyle: "italic",
                                                                        }}
                                                                    >
                                                                        โน้ต: {item.notes}
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <Text type="secondary">ยังไม่มีรายการที่สั่งแล้ว</Text>
                                            )}
                                        </div>

                                        <div style={orderDetailStyles.summaryList}>
                                            <Text
                                                strong
                                                style={{
                                                    fontSize: 15,
                                                    marginBottom: 10,
                                                    display: "block",
                                                    color: orderDetailColors.textSecondary,
                                                }}
                                            >
                                                สรุปตามหมวดหมู่
                                            </Text>

                                            {purchasedCategorySummary.length > 0 ? (
                                                purchasedCategorySummary.map(([categoryName, quantity]) => (
                                                    <div key={categoryName} style={orderDetailStyles.summaryRow}>
                                                        <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.4 }}>
                                                            {categoryName}
                                                        </Text>
                                                        <Text strong style={{ fontSize: 14, lineHeight: 1.4 }}>
                                                            {String(quantity)} รายการ
                                                        </Text>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={orderDetailStyles.summaryRow}>
                                                    <Text type="secondary">ยังไม่มีข้อมูลหมวดหมู่</Text>
                                                </div>
                                            )}

                                            <div style={orderDetailStyles.summaryMainRow}>
                                                <Text strong style={{ fontSize: 20, lineHeight: 1.3 }} className="qr-summary-total-label">
                                                    ยอดรวมปัจจุบัน
                                                </Text>
                                                <Text
                                                    strong
                                                    style={{ fontSize: 28, color: orderDetailColors.primary, lineHeight: 1.2 }}
                                                    className="qr-summary-total-value"
                                                >
                                                    {formatPrice(Number(bootstrap.active_order.total_amount || 0))}
                                                </Text>
                                            </div>
                                        </div>
                                    </>
                                </Card>
                            )}
                        </div>
                    )}
                </main>

                {!accessDenied ? (
                    <div className="pos-floating-btn-container">
                        <Badge count={totalItems} size="default" offset={[-5, 5]}>
                            <Button
                                type="primary"
                                shape="circle"
                                size="large"
                                icon={<ShoppingCartOutlined style={{ fontSize: 26 }} />}
                                onClick={() => setCartVisible(true)}
                                style={posLayoutStyles.floatingCartButton}
                                className={`qr-floating-cart-btn ${totalItems > 0 ? "pos-cart-pulse" : ""}`.trim()}
                                aria-label={`ตะกร้าสินค้า ${totalItems} รายการ`}
                            />
                        </Badge>
                    </div>
                ) : null}

                {!accessDenied ? (
                    <POSCartDrawer
                        rootClassName="qr-mobile-cart-drawer"
                        open={cartVisible}
                        onClose={() => {
                            setCartVisible(false);
                            setCheckoutVisible(false);
                        }}
                        totalItems={totalItems}
                        subtotal={subtotal}
                        discountAmount={0}
                        finalPrice={subtotal}
                        cartItems={cartItems}
                        onClearCart={clearCart}
                        onCheckout={handleCheckout}
                        renderCartItem={renderCartItem}
                    />
                ) : null}

                {!accessDenied && cartVisible ? (
                    <POSCheckoutDrawer
                        rootClassName="qr-mobile-checkout-drawer"
                        open={checkoutVisible}
                        onClose={() => setCheckoutVisible(false)}
                        isProcessing={isSubmitting}
                        onConfirm={() => {
                            void handleConfirmOrder();
                        }}
                        groupedCartItems={groupedCartItems}
                        categorySummary={categorySummary}
                        totalItems={totalItems}
                        discountAmount={0}
                        finalPrice={subtotal}
                        getProductUnitPrice={getProductUnitPrice}
                    />
                ) : null}

                <POSNoteModal
                    open={isNoteModalVisible}
                    itemName={currentNoteItem?.name}
                    value={noteInput}
                    onChange={setNoteInput}
                    onSave={handleSaveNote}
                    onCancel={closeNoteModal}
                />

                <CartItemDetailModal
                    item={currentDetailItem}
                    isOpen={isDetailModalVisible}
                    onClose={closeDetailModal}
                    onSave={handleSaveDetails}
                    orderType={OrderType.DineIn}
                    toppingCatalog={bootstrap?.toppings ?? []}
                />

                <POSProductDetailModal
                    open={isProductModalVisible}
                    product={selectedProduct}
                    onClose={closeProductModal}
                    onAddToCart={addToCart}
                    getProductUnitPrice={getProductUnitPrice}
                />
            </div>
        </>
    );
}
