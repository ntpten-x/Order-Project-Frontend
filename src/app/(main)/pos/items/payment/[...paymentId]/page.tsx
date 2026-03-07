"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import { Typography, Row, Col, Card, Button, Empty, Divider, message, InputNumber, Tag, Alert, Result, Spin } from "antd";
import { ArrowLeftOutlined, ShopOutlined, DollarOutlined, CreditCardOutlined, QrcodeOutlined, UndoOutlined, EditOutlined, SettingOutlined, DownOutlined, UpOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { ordersService } from "../../../../../../services/pos/orders.service";
import { paymentMethodService } from "../../../../../../services/pos/paymentMethod.service";
import { discountsService } from "../../../../../../services/pos/discounts.service";
import { paymentsService } from "../../../../../../services/pos/payments.service";
import { shopProfileService, ShopProfile } from "../../../../../../services/pos/shopProfile.service";
import { getCsrfTokenCached } from "../../../../../../utils/pos/csrf";
import { groupOrderItems } from "../../../../../../utils/orderGrouping";

import { SalesOrder, OrderStatus, OrderType } from "../../../../../../types/api/pos/salesOrder";
import { PaymentMethod } from "../../../../../../types/api/pos/paymentMethod";
import { Discounts, DiscountType } from "../../../../../../types/api/pos/discounts";
import { PaymentStatus } from "../../../../../../types/api/pos/payments";
import { itemsResponsiveStyles, itemsColors } from "../../../../../../theme/pos/items/style";
import { calculatePaymentTotals, isCashMethod, isPromptPayMethod, quickCashAmounts, getPostCancelPaymentRedirect, getEditOrderRedirect, isPaymentMethodConfigured } from "../../../../../../utils/payments";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import {
    getCancelOrderNavigationPath,
    getOrderChannelText,
    ConfirmationConfig,
    formatCurrency,
    isCancelledStatus,
    isPaidOrCompletedStatus,
    isWaitingForPaymentStatus,
} from "../../../../../../utils/orders";
import { useGlobalLoading } from "../../../../../../contexts/pos/GlobalLoadingContext";
import { useAuth } from "../../../../../../contexts/AuthContext";
import { useSocket } from "../../../../../../hooks/useSocket";
import { useEffectivePermissions } from "../../../../../../hooks/useEffectivePermissions";
import { consumeOrderTransitionCache } from "../../../../../../utils/pos/orderTransitionCache";
import { withInflightDedup } from "../../../../../../utils/api/inflight";
import { matchesRealtimeEntityPayload, useRealtimeRefresh } from "../../../../../../utils/pos/realtime";
import { RealtimeEvents } from "../../../../../../utils/realtimeEvents";
import { ORDER_REALTIME_EVENTS } from "../../../../../../utils/pos/orderRealtimeEvents";
import { resolveImageSource } from "../../../../../../utils/image/source";
import SmartAvatar from "../../../../../../components/ui/image/SmartAvatar";


const { Title, Text } = Typography;
dayjs.locale('th');

const PromptPayQr = dynamic(() => import("./PromptPayQr"), {
    ssr: false,
    loading: () => <Spin size="large" />,
});

const DiscountSelectionModal = dynamic(() => import("./DiscountSelectionModal"), {
    ssr: false,
    loading: () => null,
});

const ConfirmationDialog = dynamic(() => import("../../../../../../components/dialog/ConfirmationDialog"), {
    ssr: false,
    loading: () => null,
});

const loadPrintRuntime = () => import("../../../../../../utils/print-settings/runtime");

const normalizeDiscountsResponse = (discountsRes: unknown): Discounts[] => {
    if (Array.isArray(discountsRes)) {
        return discountsRes;
    }

    if (discountsRes && typeof discountsRes === "object") {
        const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";
        const record = discountsRes as Record<string, unknown>;

        if ("id" in record && typeof record.display_name === "string") {
            return [record as unknown as Discounts];
        }
        if (Array.isArray(record.data)) {
            return record.data as Discounts[];
        }
        if (record.success === true && Array.isArray(record.data)) {
            return record.data as Discounts[];
        }
        if (record.success === true && isRecord(record.data)) {
            const data = record.data as Record<string, unknown>;
            if ("id" in data && typeof data.display_name === "string") {
                return [data as unknown as Discounts];
            }
        }
    }

    return [];
};


export default function POSPaymentPage() {
    const router = useRouter();
    const params = useParams();
    const [messageApi, contextHolder] = message.useMessage();
    const paymentId = Array.isArray(params?.paymentId) ? params.paymentId[0] : params?.paymentId; 

    const { user } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const isAdminUser = user?.role === "Admin";
    const canCreatePayment = can("payments.page", "create");
    const canEditOrder = isAdminUser || can("orders.edit.feature", "access") || can("orders.page", "update");
    const canCancelOrder = isAdminUser || can("orders.cancel.feature", "access") || can("orders.page", "delete");

    const [order, setOrder] = useState<SalesOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMetadataLoading, setIsMetadataLoading] = useState(true);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [discounts, setDiscounts] = useState<Discounts[]>([]);
    const [shopProfile, setShopProfile] = useState<ShopProfile | null>(null);
    const [summaryExpanded, setSummaryExpanded] = useState(false);
    
    // Payment State
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
    const [receivedAmount, setReceivedAmount] = useState<number>(0);
    const [appliedDiscount, setAppliedDiscount] = useState<Discounts | null>(null);
    const [discountModalVisible, setDiscountModalVisible] = useState(false);
    const { showLoading, hideLoading } = useGlobalLoading();
    const { socket } = useSocket();
    
    // Confirmation Dialog State
    const [confirmConfig, setConfirmConfig] = useState<ConfirmationConfig>({
        open: false,
        type: 'confirm',
        title: '',
        content: '',
        onOk: () => {},
    });

    const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, open: false }));

    const applyOrderData = useCallback((orderData: SalesOrder, options?: { syncReceivedAmount?: boolean }) => {
        if (isPaidOrCompletedStatus(orderData.status)) {
            router.push(`/pos/dashboard/${orderData.id}?from=payment`);
            return false;
        }

        if (isCancelledStatus(orderData.status)) {
            router.push(getCancelOrderNavigationPath(orderData.order_type));
            return false;
        }

        if (!isWaitingForPaymentStatus(orderData.status)) {
            router.push(`/pos/orders/${orderData.id}`);
            return false;
        }

        setOrder(orderData);
        setAppliedDiscount(orderData.discount ?? null);

        if (options?.syncReceivedAmount ?? true) {
            setReceivedAmount(Number(orderData.total_amount));
        }

        return true;
    }, [router]);

    const loadPaymentMetadata = useCallback(async (orderData: SalesOrder, options?: { showLoadingState?: boolean }) => {
        if (options?.showLoadingState) {
            setIsMetadataLoading(true);
        }

        const [shopResult, methodsResult, discountsResult] = await Promise.allSettled([
            shopProfileService.getProfile(),
            paymentMethodService.getAll(),
            discountsService.getAll(),
        ]);

        if (shopResult.status === "fulfilled") {
            setShopProfile(shopResult.value);
        } else if (options?.showLoadingState) {
            setShopProfile(null);
        }

        if (methodsResult.status === "fulfilled") {
            const filteredMethods = (methodsResult.value.data || []).filter((method) => {
                if (orderData.order_type !== OrderType.Delivery && method.payment_method_name === "Delivery") {
                    return false;
                }
                return true;
            });
            setPaymentMethods(filteredMethods);
        } else if (options?.showLoadingState) {
            setPaymentMethods([]);
        }

        if (discountsResult.status === "fulfilled") {
            setDiscounts(normalizeDiscountsResponse(discountsResult.value));
        } else if (options?.showLoadingState) {
            setDiscounts([]);
        }

        setIsMetadataLoading(false);
    }, []);

    const fetchInitialData = useCallback(async (silent = false): Promise<void> => {
        if (!paymentId) return;

        const warmedOrder = consumeOrderTransitionCache(paymentId);
        let shouldHideBlockingLoader = false;

        try {
            if (warmedOrder) {
                applyOrderData(warmedOrder, { syncReceivedAmount: true });
                setIsLoading(false);
            }

            if (!silent && !warmedOrder) {
                setIsLoading(true);
                showLoading("กำลังโหลดข้อมูลการชำระเงิน...");
                shouldHideBlockingLoader = true;
            }
            const orderData = await withInflightDedup(`paymentPage:order:${paymentId}`, () => ordersService.getById(paymentId));
            const canRenderPayment = applyOrderData(orderData, { syncReceivedAmount: !silent });
            if (!canRenderPayment) {
                return;
            }

            setIsLoading(false);
            if (shouldHideBlockingLoader) {
                hideLoading();
                shouldHideBlockingLoader = false;
            }

            void loadPaymentMetadata(orderData, {
                showLoadingState: !silent,
            });
        } catch {
            if (!silent) messageApi.error("ไม่สามารถโหลดข้อมูลการชำระเงินได้");
        } finally {
            if (!silent && !warmedOrder) {
                setIsLoading(false);
            }
            if (shouldHideBlockingLoader) {
                hideLoading();
            }
        }
    }, [
        applyOrderData,
        hideLoading,
        loadPaymentMetadata,
        messageApi,
        paymentId,
        showLoading,
    ]);


    // Memoize discount options for Select component
    const discountOptions = useMemo(() => {
        if (!discounts || !Array.isArray(discounts) || discounts.length === 0) {
            return [];
        }
        
        const activeDiscounts = discounts.filter(d => {
            if (!d) return false;
            return d.is_active === true || d.is_active === undefined;
        });
        
        if (activeDiscounts.length === 0) {
            return [];
        }
        
        const options = activeDiscounts.map(d => {
            const displayName = d.display_name;
            if (!displayName || !d.id) {
                return null;
            }
            const label = `${displayName} (${d.discount_type === DiscountType.Percentage ? `${d.discount_amount}%` : `-${d.discount_amount}฿`})`;
            return { label, value: d.id };
        }).filter((opt): opt is { label: string; value: string } => opt !== null);
        
        return options;
    }, [discounts]);

    useEffect(() => {
        if (paymentId) {
            fetchInitialData(false);
        }
    }, [fetchInitialData, paymentId]);

    const realtimeEnabled = !discountModalVisible && !confirmConfig.open;

    useRealtimeRefresh({
        socket,
        events: ORDER_REALTIME_EVENTS,
        onRefresh: async () => {
            if (paymentId) {
                await fetchInitialData(true);
            }
        },
        enabled: Boolean(paymentId) && realtimeEnabled,
        debounceMs: 800,
        shouldRefresh: (payload) =>
            matchesRealtimeEntityPayload(payload as Parameters<typeof matchesRealtimeEntityPayload>[0], paymentId as string | undefined),
    });

    useRealtimeRefresh({
        socket,
        events: [
            RealtimeEvents.paymentMethods.create,
            RealtimeEvents.paymentMethods.update,
            RealtimeEvents.discounts.create,
            RealtimeEvents.discounts.update,
            RealtimeEvents.discounts.delete,
            RealtimeEvents.shopProfile.update,
        ],
        onRefresh: async () => {
            if (order) {
                await loadPaymentMetadata(order, { showLoadingState: false });
            }
        },
        enabled: Boolean(order) && realtimeEnabled,
        debounceMs: 800,
    });
    
    // Prevent auto-scroll when component re-renders
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if ('scrollRestoration' in window.history) {
                window.history.scrollRestoration = 'manual';
            }
        }
    }, []);

    const { subtotal, discount, vat, total, change } = calculatePaymentTotals(order, receivedAmount);
    
    // Group items for display
    const groupedItems = useMemo(() => {
        if (!order?.items) return [];
        const activeItems = order.items.filter(item => !isCancelledStatus(item.status));
        return groupOrderItems(activeItems);
    }, [order?.items]);

    const handleDiscountChange = async (value: string | undefined) => {
        if (!order) return;
        
        try {
            showLoading("กำลังอัปเดตส่วนลด...");
            const csrfToken = await getCsrfTokenCached();
            
            const updatedOrder = await ordersService.update(
                order.id, 
                { discount_id: value || null },
                undefined,
                csrfToken
            );

            setOrder(updatedOrder);
            
            if (value) {
                const selected = discounts.find(d => d.id === value);
                if (selected) {
                    setAppliedDiscount(selected);
                    messageApi.success(`ใช้ส่วนลด "${selected.display_name}" เรียบร้อย`);
                }
            } else {
                setAppliedDiscount(null);
                messageApi.info("ยกเลิกการใช้ส่วนลด");
            }

            setReceivedAmount(Number(updatedOrder.total_amount));

        } catch {
            messageApi.error("ไม่สามารถบันทึกส่วนลดได้");
        } finally {
            hideLoading();
        }
    };

    const handleConfirmPayment = async () => {
        if (!selectedPaymentMethod) {
            messageApi.error("กรุณาเลือกวิธีการชำระเงิน");
            return;
        }
        
        if (receivedAmount < total) {
            messageApi.error("ยอดเงินที่รับต้องมากกว่าหรือเท่ากับยอดชำระ");
            return;
        }

        const method = paymentMethods.find(m => m.id === selectedPaymentMethod);
        const methodName = method?.display_name || 'ไม่ระบุ';

        setConfirmConfig({
            open: true,
            type: 'success',
            title: 'ยืนยันการชำระเงิน',
            content: (
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, marginBottom: 8 }}>
                        วิธีการชำระเงิน: <Text strong>{methodName}</Text>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: itemsColors.primary }}>
                        ยอดสุทธิ {formatCurrency(total)}
                    </div>
                    {change > 0 && (
                        <div style={{ color: itemsColors.success, fontSize: 18, marginTop: 4 }}>
                            เงินทอน {formatCurrency(change)}
                        </div>
                    )}
                </div>
            ),
            okText: 'ยืนยัน',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                const runtime = await loadPrintRuntime();
                const cachedPrintSettings = runtime.peekPrintSettings();
                const reservedPrintWindow =
                    !cachedPrintSettings || cachedPrintSettings.automation.auto_print_receipt_after_payment
                        ? runtime.reservePrintWindow(`Receipt #${order?.order_no || ""}`.trim())
                        : null;
                try {
                    showLoading("กำลังดำเนินการชำระเงิน...");
                    closeConfirm();
                    const csrfToken = await getCsrfTokenCached();
                    
                    const paymentData = {
                        order_id: order!.id,
                        payment_method_id: selectedPaymentMethod,
                        amount: total,
                        amount_received: receivedAmount,
                        change_amount: change,
                        status: PaymentStatus.Success
                    };

                    const createdPayment = await paymentsService.create(paymentData, undefined, csrfToken);

                    const printSettings = await runtime.getPrintSettings();
                    if (printSettings.automation.auto_print_receipt_after_payment && order) {
                        const printableOrder: SalesOrder = {
                            ...order,
                            status: OrderStatus.Paid,
                            received_amount: receivedAmount,
                            change_amount: change,
                            payments: [
                                ...(order.payments || []),
                                {
                                    ...createdPayment,
                                    amount_received: receivedAmount,
                                    change_amount: change,
                                    payment_method: method || null,
                                },
                            ] as SalesOrder["payments"],
                        };

                        try {
                            await runtime.printReceiptDocument({
                                order: printableOrder,
                                settings: printSettings,
                                shopProfile: shopProfile ?? undefined,
                                targetWindow: reservedPrintWindow,
                            });
                        } catch (printError) {
                            runtime.closePrintWindow(reservedPrintWindow);
                            console.error("Receipt auto print failed", printError);
                            messageApi.warning("ชำระเงินสำเร็จ แต่เปิดหน้าพิมพ์ใบเสร็จไม่สำเร็จ");
                        }
                    } else {
                        runtime.closePrintWindow(reservedPrintWindow);
                    }

                    messageApi.success("ชำระเงินเรียบร้อย");
                    router.push(`/pos/dashboard/${order!.id}?from=payment`);

                } catch (error) {
                    runtime.closePrintWindow(reservedPrintWindow);
                    const errorMessage = error instanceof Error && error.message
                        ? error.message
                        : "การชำระเงินล้มเหลว";
                    messageApi.error(errorMessage);
                } finally {
                    hideLoading();
                }
            }
        });
    };
    
    const handleEditOrder = async () => {
        if (!canEditOrder) {
            messageApi.warning("คุณไม่มีสิทธิ์แก้ไขออเดอร์");
            return;
        }
        if (!order) return;
        
        setConfirmConfig({
            open: true,
            type: 'warning',
            title: 'ย้อนกลับไปแก้ไขออเดอร์?',
            content: 'สถานะออเดอร์จะถูกเปลี่ยนเป็นกำลังดำเนินการคุณแน่ใจหรือไม่?',
            okText: 'ตกลง',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                try {
                    showLoading("กำลังดำเนินการ...");
                    closeConfirm();
                    const csrfToken = await getCsrfTokenCached();
                    await ordersService.updateStatus(order.id, OrderStatus.Pending, csrfToken);

                    messageApi.success("ย้อนกลับไปแก้ไขออเดอร์เรียบร้อย");
                    router.push(getEditOrderRedirect(order.id));

                } catch {
                    messageApi.error("ไม่สามารถเปลี่ยนสถานะออเดอร์ได้");
                } finally {
                    hideLoading();
                }
            }
        });
    };

    const handleCancelOrder = () => {
        if (!canCancelOrder) {
            messageApi.warning("คุณไม่มีสิทธิ์ยกเลิกออเดอร์");
            return;
        }
        if (!order) return;

        setConfirmConfig({
            open: true,
            type: 'danger',
            title: 'ยืนยันการยกเลิกออเดอร์?',
            content: 'การดำเนินการนี้จะยกเลิกสินค้าทุกรายการและคืนสถานะโต๊ะ (หากมี) คุณแน่ใจหรือไม่?',
            okText: 'ยืนยันการยกเลิก',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                try {
                    showLoading("กำลังดำเนินการยกเลิก...");
                    closeConfirm();
                    const csrfToken = await getCsrfTokenCached();

                    await ordersService.updateStatus(order.id, OrderStatus.Cancelled, csrfToken);

                    messageApi.success("ยกเลิกออเดอร์เรียบร้อย");
                    router.push(getPostCancelPaymentRedirect());

                } catch {
                    messageApi.error("ไม่สามารถยกเลิกออเดอร์ได้");
                } finally {
                    hideLoading();
                }
            }
        });
    };

    const handleBack = () => {
        if (order?.order_type === OrderType.DineIn) {
            router.push('/pos/channels/dine-in');
        } else if (order?.order_type === OrderType.TakeAway) {
            router.push('/pos/channels/takeaway');
        } else if (order?.order_type === OrderType.Delivery) {
            router.push('/pos/channels/delivery');
        } else {
            router.back();
        }
    };

    const getPaymentMethodIcon = (methodName?: string, displayName?: string) => {
        if (isCashMethod(methodName, displayName)) return <DollarOutlined />;
        if (isPromptPayMethod(methodName, displayName)) return <QrcodeOutlined />;
        return <CreditCardOutlined />;
    };

    const getPaymentMethodDescription = (methodName?: string, displayName?: string) => {
        if (isCashMethod(methodName, displayName)) return "ชำระด้วยเงินสด";
        if (isPromptPayMethod(methodName, displayName)) return "สแกน QR Code";
        return "ชำระด้วยบัตร";
    };

    if (!user) return null;

    if (permissionLoading && !isAdminUser) {
        return (
            <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!canCreatePayment) {
        return (
            <Result
                status="403"
                title="403"
                subTitle="คุณไม่มีสิทธิ์ชำระเงิน (ต้องมีสิทธิ์ payments.page:create)"
                extra={
                    <Button type="primary" onClick={() => router.push("/pos/orders")}>
                        กลับไปหน้ารายการ
                    </Button>
                }
            />
        );
    }

    if (isLoading && !order) return null;
    if (!order) return <Empty description="ไม่พบข้อมูลออเดอร์" />;

    const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
    const isCash = isCashMethod(selectedMethod?.payment_method_name, selectedMethod?.display_name);
    const isPromptPay = isPromptPayMethod(selectedMethod?.payment_method_name, selectedMethod?.display_name);
    const canConfirm = selectedPaymentMethod && 
        receivedAmount >= total && 
        isPaymentMethodConfigured(selectedMethod?.payment_method_name, selectedMethod?.display_name, shopProfile);

    return (
        <div className="payment-page-container">
            <style jsx global>{itemsResponsiveStyles}</style>
            {contextHolder}
                
            {/* Hero Header - Compact Mobile */}
            <div className="payment-hero-mobile">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Button 
                        type="text" 
                        icon={<ArrowLeftOutlined style={{ fontSize: 24, color: '#000' }} />} 
                        style={{ 
                            height: 40, 
                            width: 40, 
                            borderRadius: 12,
                            background: 'rgba(0,0,0,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }} 
                        onClick={handleBack}
                    />
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap' }}>
                            <Title level={4} style={{ margin: 0, color: '#000', fontSize: 22 }}>ชำระเงิน</Title>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {/* Channel Tag - Purple */}
                                <Tag 
                                    style={{ 
                                        border: 'none', 
                                        background: '#f3e8ff', 
                                        color: '#7e22ce', 
                                        fontSize: 14, 
                                        borderRadius: 8, 
                                        padding: '2px 10px', 
                                        margin: 0,
                                        fontWeight: 600
                                    }}
                                >
                                    {getOrderChannelText(order.order_type)}
                                </Tag>

                                {/* Reference Tag - Green */}
                                <Tag 
                                    style={{ 
                                        border: 'none', 
                                        background: '#dcfce7', 
                                        color: '#15803d', 
                                        fontSize: 20, 
                                        borderRadius: 8, 
                                        padding: '2px 10px', 
                                        margin: 0,
                                        fontWeight: 600
                                    }}
                                >
                                    {order.order_type === OrderType.DineIn && `*โต๊ะ ${order.table?.table_name || 'ไม่ระบุ'}`}
                                    {order.order_type === OrderType.TakeAway && `*${order.order_no?.substring(5, 10) || order.order_no}`}
                                </Tag>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Action Buttons */}
                <div className="action-buttons-row">
                    {canEditOrder ? (
                        <Button 
                            icon={<EditOutlined />} 
                            onClick={handleEditOrder}
                            className="action-btn"
                            style={{ 
                                background: '#fef3c7', 
                                border: '1.5px solid #f59e0b', 
                                color: '#92400e',
                                fontWeight: 600
                            }}
                        >
                            แก้ไข
                        </Button>
                    ) : null}
                    {canCancelOrder ? (
                        <Button 
                            danger
                            onClick={handleCancelOrder}
                            className="action-btn"
                        >
                            ยกเลิก
                        </Button>
                    ) : null}
                </div>
            </div>

            {/* Main Content */}
            <div style={{ padding: '16px', maxWidth: 1200, margin: '0 auto' }}>
                <Row gutter={[20, 20]}>
                    {/* Left: Order Summary */}
                    <Col xs={24} lg={12}>
                        {/* Collapsible Order Summary */}
                        <div className="order-summary-collapsible">
                            <div 
                                className="order-summary-header"
                                onClick={() => setSummaryExpanded(!summaryExpanded)}
                            >
                                <div>
                                    <Text strong style={{ fontSize: 16 }}>รายการสรุป</Text>
                                    <Text type="secondary" style={{ marginLeft: 8 }}>({groupedItems.length} รายการ)</Text>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Text strong style={{ fontSize: 18, color: itemsColors.primary }}>{formatCurrency(subtotal)}</Text>
                                    {summaryExpanded ? <UpOutlined /> : <DownOutlined />}
                                </div>
                            </div>
                            <div className={`order-summary-content ${summaryExpanded ? 'expanded' : ''}`}>
                                <div className="order-summary-items">
                                    {groupedItems.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${itemsColors.borderLight}` }}>
                                            <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 0 }}>
                                                <SmartAvatar
                                                    shape="square"
                                                    size={48}
                                                    src={resolveImageSource(item.product?.img_url)}
                                                    alt={item.product?.display_name || "product"}
                                                    icon={<ShopOutlined />}
                                                    imageStyle={{ objectFit: "cover" }}
                                                    style={{ backgroundColor: itemsColors.backgroundSecondary, flexShrink: 0, borderRadius: 10 }}
                                                />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <Text strong style={{ display: 'block', fontSize: 14 }} ellipsis>{item.product?.display_name}</Text>
                                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>{formatCurrency(item.price)}</Text>
                                                        <Tag style={{ margin: 0, fontSize: 10, padding: '0 6px' }}>x{item.quantity}</Tag>
                                                    </div>
                                                    {item.notes && (
                                                        <Text style={{ display: 'block', fontSize: 11, fontStyle: 'italic', color: '#ef4444', marginTop: 2 }}>
                                                            * {item.notes}
                                                        </Text>
                                                    )}
                                                    {item.details && item.details.length > 0 && (
                                                        <div style={{ marginTop: 2 }}>
                                                            {item.details.map((detail: { detail_name: string; extra_price: number }, dIdx: number) => (
                                                                <Text key={dIdx} style={{ color: '#10b981', fontSize: 11, display: 'block' }}>
                                                                    + {detail.detail_name} {Number(detail.extra_price) > 0 ? `(+${Number(detail.extra_price)})` : ''}
                                                                </Text>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <Text strong style={{ fontSize: 14 }}>{formatCurrency(Number(item.total_price || (Number(item.price) * item.quantity)))}</Text>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Price Summary Card */}
                        <Card style={{ borderRadius: 20, marginBottom: 16 }} styles={{ body: { padding: 20 } }}>
                            <Row justify="space-between" style={{ marginBottom: 8 }}>
                                <Text type="secondary">ยอดรวม</Text>
                                <Text>{formatCurrency(subtotal)}</Text>
                            </Row>
                            {discount > 0 && (
                                <Row justify="space-between" style={{ marginBottom: 8 }}>
                                    <Text type="success">ส่วนลด</Text>
                                    <Text type="success">-{formatCurrency(discount)}</Text>
                                </Row>
                            )}
                            {vat > 0 && (
                                <Row justify="space-between" style={{ marginBottom: 8 }}>
                                    <Text type="secondary">VAT (0%)</Text>
                                    <Text>{formatCurrency(vat)}</Text>
                                </Row>
                            )}
                            <Divider style={{ margin: '12px 0' }} />
                            <Row justify="space-between" align="middle">
                                <Title level={5} style={{ margin: 0 }}>ยอดสุทธิ</Title>
                                <Title level={3} style={{ color: itemsColors.primary, margin: 0 }}>{formatCurrency(total)}</Title>
                            </Row>
                        </Card>

                        {/* Discount Selector */}
                        <div 
                            className={`discount-selector ${appliedDiscount ? 'has-discount' : ''}`}
                            onClick={() => !isLoading && !isMetadataLoading && setDiscountModalVisible(true)}
                        >
                            <span style={{ color: appliedDiscount ? '#1f2937' : '#9ca3af' }}>
                                {isMetadataLoading
                                    ? "กำลังโหลดส่วนลด..."
                                    : appliedDiscount 
                                    ? `🎁 ${appliedDiscount.display_name} (${appliedDiscount.discount_type === 'Percentage' ? `${appliedDiscount.discount_amount}%` : `-${appliedDiscount.discount_amount}฿`})`
                                    : "เลือกส่วนลด (ถ้ามี)"}
                            </span>
                            {appliedDiscount ? (
                                <span 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDiscountChange(undefined);
                                    }}
                                    style={{ color: '#ef4444', padding: 8 }}
                                >
                                    ✕
                                </span>
                            ) : (
                                <span style={{ color: '#9ca3af' }}>▼</span>
                            )}
                        </div>
                    </Col>
                    
                    {/* Right: Payment Methods */}
                    <Col xs={24} lg={12}>
                        <Card style={{ borderRadius: 20 }} styles={{ body: { padding: 20 } }}>
                            <Text strong style={{ display: 'block', marginBottom: 16, fontSize: 16 }}>
                                เลือกวิธีการชำระเงิน
                            </Text>
                            
                            {isMetadataLoading && paymentMethods.length === 0 ? (
                                <div style={{ padding: "24px 0", textAlign: "center" }}>
                                    <Spin size="large" />
                                </div>
                            ) : paymentMethods.length === 0 ? (
                                <Alert
                                    message="ยังไม่มีวิธีการชำระเงิน"
                                    description="กรุณาเพิ่มวิธีการชำระเงินในเมนูตั้งค่าก่อนทำรายการ"
                                    type="warning"
                                    showIcon
                                />
                            ) : (
                                <div className="payment-method-grid">
                                    {paymentMethods.map(method => {
                                        const isSelected = selectedPaymentMethod === method.id;
                                        return (
                                            <div 
                                                key={method.id}
                                                className={`payment-method-card ${isSelected ? 'selected' : ''}`}
                                                onClick={() => {
                                                    setSelectedPaymentMethod(method.id);
                                                    if (isPromptPayMethod(method.payment_method_name, method.display_name)) {
                                                        setReceivedAmount(total);
                                                    } else if (isCashMethod(method.payment_method_name, method.display_name)) {
                                                        setReceivedAmount(0);
                                                    } else {
                                                        setReceivedAmount(total);
                                                    }
                                                }}
                                            >
                                                <div className="payment-method-icon">
                                                    {getPaymentMethodIcon(method.payment_method_name, method.display_name)}
                                                </div>
                                                <div className="payment-method-info">
                                                    <div className="payment-method-name">{method.display_name}</div>
                                                    <div className="payment-method-desc">
                                                        {getPaymentMethodDescription(method.payment_method_name, method.display_name)}
                                                    </div>
                                                </div>
                                                {isSelected && <CheckCircleOutlined style={{ fontSize: 20, color: '#4F46E5' }} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Payment Method Details */}
                            {selectedPaymentMethod && (
                                <div style={{ marginTop: 20 }}>
                                    <Divider style={{ margin: '0 0 20px' }} />
                                    
                                    {isPromptPay && (
                                        <>
                                            {!shopProfile?.promptpay_number ? (
                                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                                    <div style={{ color: '#ff4d4f', marginBottom: 12, fontWeight: 500 }}>
                                                        กรุณาตั้งค่าเบอร์ PromptPay ในระบบก่อน
                                                    </div>
                                                    <Button 
                                                        type="primary" 
                                                        danger 
                                                        ghost 
                                                        icon={<SettingOutlined />}
                                                        onClick={() => router.push('/pos/settings')}
                                                    >
                                                        ไปตั้งค่าที่ Shop Profile
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="qr-display-wrapper">
                                                    <Text style={{ display: 'block', marginBottom: 16, fontSize: 14, color: '#6b7280' }}>
                                                        สแกน QR Code เพื่อชำระเงิน
                                                    </Text>
                                                    <PromptPayQr
                                                        promptpayNumber={shopProfile.promptpay_number}
                                                        amount={total}
                                                    />
                                                    <div className="qr-amount">{formatCurrency(total)}</div>
                                                    <div className="qr-account-info">
                                                        {shopProfile.promptpay_number}
                                                        {shopProfile.promptpay_name && <><br/>({shopProfile.promptpay_name})</>}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {isCash && (
                                        <>
                                            <div className="amount-input-wrapper">
                                                <Text style={{ display: 'block', marginBottom: 12, fontSize: 14, fontWeight: 500 }}>
                                                    รับเงินมา
                                                </Text>
                                                <InputNumber
                                                    style={{ width: '100%' }} 
                                                    size="large"
                                                    min={0}
                                                    value={receivedAmount}
                                                    onChange={(val) => setReceivedAmount(val || 0)}
                                                    formatter={value => `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                    parser={value => Number(value!.replace(/฿\s?|(,*)/g, '').replace(/[^0-9.]/g, ''))}
                                                    onKeyDown={(e) => {
                                                        // Allow: backspace, delete, tab, escape, enter
                                                        if (
                                                            [8, 46, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                                                            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                                                            (e.ctrlKey === true && [65, 67, 86, 88].indexOf(e.keyCode) !== -1) ||
                                                            // Allow: home, end, left, right
                                                            (e.keyCode >= 35 && e.keyCode <= 39)
                                                        ) {
                                                            // Special handling for decimal point (prevent multiple dots)
                                                            if ((e.keyCode === 190 || e.keyCode === 110) && `${receivedAmount}`.includes('.')) {
                                                                e.preventDefault();
                                                            }
                                                            return;
                                                        }
                                                        // Ensure that it is a number and stop the keypress
                                                        if (
                                                            (e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) &&
                                                            (e.keyCode < 96 || e.keyCode > 105)
                                                        ) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    onFocus={(e) => e.target.select()}
                                                    controls={false}
                                                    inputMode="decimal"
                                                />
                                            </div>
                                            
                                            {/* Quick Buttons */}
                                            <div className="quick-cash-grid">
                                                <Button 
                                                    onClick={() => setReceivedAmount(total)} 
                                                    type="primary" 
                                                    className="quick-cash-btn quick-cash-btn-exact"
                                                >
                                                    พอดี ({formatCurrency(total)})
                                                </Button>
                                                {quickCashAmounts.map(amt => (
                                                    <Button 
                                                        key={amt} 
                                                        onClick={() => setReceivedAmount(amt)} 
                                                        className="quick-cash-btn"
                                                    >
                                                        ฿{amt.toLocaleString()}
                                                    </Button>
                                                ))}
                                                <Button 
                                                    icon={<UndoOutlined />} 
                                                    onClick={() => setReceivedAmount(0)} 
                                                    danger 
                                                    className="quick-cash-btn"
                                                />
                                            </div>

                                            {/* Change Display */}
                                            <div className={`change-display ${change < 0 ? 'insufficient' : ''}`}>
                                                <div className="change-label">
                                                    {change >= 0 ? 'เงินทอน' : 'ยังขาดอีก'}
                                                </div>
                                                <div className="change-amount">
                                                    {formatCurrency(Math.abs(change))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {!isCash && !isPromptPay && (
                                        <div style={{ textAlign: 'center', padding: 20 }}>
                                            <Text type="secondary">ตรวจสอบยอดเงินและชำระผ่านช่องทางที่เลือก</Text>
                                            <div style={{ marginTop: 16 }}>
                                                <InputNumber
                                                    style={{ width: '100%', fontSize: 24 }} 
                                                    value={receivedAmount} 
                                                    onChange={val => setReceivedAmount(val || 0)} 
                                                    formatter={value => `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                    parser={value => Number(value!.replace(/฿\s?|(,*)/g, ''))}
                                                    controls={false}
                                                    inputMode="decimal"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Desktop Confirm Button */}
                            <div className="payment-desktop-confirm-footer" style={{ marginTop: 20 }}>
                                <Button 
                                    type="primary" 
                                    size="large" 
                                    block 
                                    className="payment-confirm-btn"
                                    onClick={handleConfirmPayment}
                                    disabled={!canConfirm}
                                    icon={<CheckCircleOutlined />}
                                >
                                    ยืนยันการชำระเงิน {canConfirm && `(${formatCurrency(total)})`}
                                </Button>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>

            {/* Mobile Sticky Footer */}
            <div className="payment-sticky-footer-mobile">
                <div className="payment-sticky-footer-content">
                    <div className="payment-total-row">
                        <span className="payment-total-label">ยอดสุทธิ</span>
                        <span className="payment-total-amount">{formatCurrency(total)}</span>
                    </div>
                    <Button 
                        type="primary" 
                        size="large" 
                        block 
                        className="payment-confirm-btn"
                        onClick={handleConfirmPayment}
                        disabled={!canConfirm}
                        icon={<CheckCircleOutlined />}
                    >
                        ยืนยันการชำระเงิน
                    </Button>
                </div>
            </div>
            
            {discountModalVisible && (
                <DiscountSelectionModal
                    open={discountModalVisible}
                    options={discountOptions}
                    appliedDiscountId={appliedDiscount?.id}
                    onCancel={() => setDiscountModalVisible(false)}
                    onSelect={(value) => {
                        void handleDiscountChange(value);
                        setDiscountModalVisible(false);
                    }}
                />
            )}
            
            {confirmConfig.open && (
                <ConfirmationDialog
                    open={confirmConfig.open}
                    type={confirmConfig.type}
                    title={confirmConfig.title}
                    content={confirmConfig.content}
                    okText={confirmConfig.okText}
                    cancelText={confirmConfig.cancelText}
                    onOk={confirmConfig.onOk}
                    onCancel={closeConfirm}
                />
            )}
        </div>
    );
}
