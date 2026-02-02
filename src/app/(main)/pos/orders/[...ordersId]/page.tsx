"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Typography, Row, Col, Card, Tag, Button, Empty, Table, Checkbox, message, Tooltip, Space, Divider } from "antd";
import { 
    ArrowLeftOutlined, 
    ShopOutlined, 
    PlusOutlined, 
    DeleteOutlined, 
    EditOutlined, 
    CheckOutlined,
    CloseOutlined,
    InfoCircleOutlined,
    ReloadOutlined,
    ShoppingOutlined,
    RocketOutlined,
    CheckCircleOutlined
} from "@ant-design/icons";
import { ordersService } from "../../../../../services/pos/orders.service";
import { getCsrfTokenCached } from "../../../../../utils/pos/csrf";
import { tablesService } from "../../../../../services/pos/tables.service";
import { SalesOrder, OrderStatus, OrderType } from "../../../../../types/api/pos/salesOrder";
import { SalesOrderItem } from "../../../../../types/api/pos/salesOrderItem";
import { TableStatus } from "../../../../../types/api/pos/tables";
import { orderDetailStyles, orderDetailColors, ordersResponsiveStyles, orderDetailTypography } from "../../../../../theme/pos/orders/style"; 
import {
  calculateOrderTotal,
  getNonCancelledItems,
  getPostConfirmServeNavigationPath,
  getCancelOrderNavigationPath,
  ConfirmationConfig,
  getOrderStatusColor,
  getOrderStatusText,
  getOrderChannelColor,
  getOrderChannelText,
  getServeActionText,
  getServedStatusText,
  groupItemsByCategory,
  getConfirmServeActionText,
} from "../../../../../utils/orders"; 
import dayjs from "dayjs";
import 'dayjs/locale/th';

import { AddItemsModal } from "./AddItemsModal";
import { EditItemModal } from "./EditItemModal";
import ConfirmationDialog from "../../../../../components/dialog/ConfirmationDialog";
import { useGlobalLoading } from "../../../../../contexts/pos/GlobalLoadingContext";
import { Products } from "../../../../../types/api/pos/products";
import { useNetwork } from "../../../../../hooks/useNetwork";
import { offlineQueueService } from "../../../../../services/pos/offline.queue.service";
import { useSocket } from "../../../../../hooks/useSocket";
import { useRealtimeRefresh } from "../../../../../utils/pos/realtime";
import { useOrderQueue } from "../../../../../hooks/pos/useOrderQueue";
import { QueueStatus, QueuePriority } from "../../../../../types/api/pos/orderQueue";
import { UnorderedListOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
dayjs.locale('th');

type ItemDetailInput = {
    detail_name: string;
    extra_price: number;
};

export default function POSOrderDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = Array.isArray(params?.ordersId) ? params.ordersId[0] : params?.ordersId;

    const [order, setOrder] = useState<SalesOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const { showLoading, hideLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const isOnline = useNetwork();
    
    // Queue management
    const { queue, addToQueue, removeFromQueue, isLoading: isQueueLoading } = useOrderQueue();
    const currentQueueItem = order ? queue.find(q => q.order_id === order.id) : null;
    
    // Selection State
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    // Edit Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<SalesOrderItem | null>(null);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Confirmation Dialog State
    const [confirmConfig, setConfirmConfig] = useState<ConfirmationConfig>({
        open: false,
        type: 'confirm',
        title: '',
        content: '',
        onOk: () => {},
    });

    const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, open: false }));

    const fetchOrder = useCallback(async (id: string) => {
        try {
            setIsLoading(true);
            showLoading("กำลังโหลดข้อมูลออเดอร์...");
            const data = await ordersService.getById(id);
            if ([OrderStatus.Paid, OrderStatus.Cancelled, OrderStatus.WaitingForPayment].includes(data.status)) {
                const nextPath = getPostConfirmServeNavigationPath(data);
                router.push(nextPath);
                return;
            }
            setOrder(data);
        } catch (error) {
            console.error("Failed to fetch order:", error);
            message.error("ไม่สามารถโหลดข้อมูลออเดอร์ได้");
        } finally {
            setIsLoading(false);
            hideLoading();
        }
    }, [router, showLoading, hideLoading]);

    useEffect(() => {
        if (orderId) {
            fetchOrder(orderId);
        }
    }, [orderId, fetchOrder]);

    useRealtimeRefresh({
        socket,
        events: ["orders:update", "orders:delete", "orders:create", "payments:create", "payments:update"],
        onRefresh: () => {
            if (orderId) {
                fetchOrder(orderId as string);
            }
        },
        intervalMs: 15000,
        enabled: Boolean(orderId),
    });

    const handleServeItem = async (itemId: string) => {
        try {
            setIsUpdating(true);
            showLoading("กำลังดำเนินการเสิร์ฟ...");
            const csrfToken = await getCsrfTokenCached();
            await ordersService.updateItemStatus(itemId, OrderStatus.Served, undefined, csrfToken);
            message.success("เสิร์ฟรายการเรียบร้อย");
            fetchOrder(orderId as string);
        } catch {
            message.error("เกิดข้อผิดพลาดในการเสิร์ฟ");
        } finally {
            setIsUpdating(false);
            hideLoading();
        }
    };

    const handleServeSelected = async () => {
        if (selectedRowKeys.length === 0) return;
        try {
            setIsUpdating(true);
            showLoading(`กำลังดำเนินการเสิร์ฟ ${selectedRowKeys.length} รายการ...`);
            const csrfToken = await getCsrfTokenCached();
            await Promise.all(selectedRowKeys.map(key => 
                ordersService.updateItemStatus(key.toString(), OrderStatus.Served, undefined, csrfToken)
            ));
            message.success("เสิร์ฟรายการที่เลือกเรียบร้อย");
            setSelectedRowKeys([]);
            fetchOrder(orderId as string);
        } catch {
            message.error("เกิดข้อผิดพลาดในการเสิร์ฟ");
        } finally {
            setIsUpdating(false);
            hideLoading();
        }
    };

    const handleCancelSelected = async () => {
        if (selectedRowKeys.length === 0) return;
        
        setConfirmConfig({
            open: true,
            type: 'danger',
            title: 'ยืนยันการยกเลิก',
            content: `คุณต้องการยกเลิก ${selectedRowKeys.length} รายการที่เลือกใช่หรือไม่?`,
            okText: 'ยืนยันยกเลิก',
            cancelText: 'ไม่ยกเลิก',
            onOk: async () => {
                try {
                    setIsUpdating(true);
                    showLoading("กำลังดำเนินการยกเลิก...");
                    closeConfirm();
                    const csrfToken = await getCsrfTokenCached();
                    await Promise.all(selectedRowKeys.map(key => 
                        ordersService.updateItemStatus(key.toString(), OrderStatus.Cancelled, undefined, csrfToken)
                    ));
                    message.success("ยกเลิกรายการที่เลือกเรียบร้อย");
                    setSelectedRowKeys([]);
                    fetchOrder(orderId as string);
                } catch {
                    message.error("เกิดข้อผิดพลาดในการยกเลิก");
                } finally {
                    setIsUpdating(false);
                    hideLoading();
                }
            }
        });
    };

    const handleUnserveItem = async (itemId: string) => {
        try {
            setIsUpdating(true);
            showLoading("กำลังย้อนกลับสถานะ...");
            const csrfToken = await getCsrfTokenCached();
            await ordersService.updateItemStatus(itemId, OrderStatus.Cooking, undefined, csrfToken);
            message.success("ยกเลิกการเสิร์ฟ (กลับไปปรุง)");
            fetchOrder(orderId as string);
        } finally {
            setIsUpdating(false);
            hideLoading();
        }
    };

    const handleCancelOrder = () => {
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
                    setIsUpdating(true);
                    showLoading("กำลังดำเนินการยกเลิก...");
                    closeConfirm();
                    const csrfToken = await getCsrfTokenCached();

                    // 1. Cancel all non-cancelled items
                    const activeItems = order.items?.filter(item => item.status !== OrderStatus.Cancelled) || [];
                    await Promise.all(
                        activeItems.map(item => 
                            ordersService.updateItemStatus(item.id, OrderStatus.Cancelled, undefined, csrfToken)
                        )
                    );

                    // 2. Set Order status to Cancelled
                    await ordersService.updateStatus(order.id, OrderStatus.Cancelled, csrfToken);

                    // 3. Set Table to Available if Dine-In
                    if (order.table_id) {
                        await tablesService.update(order.table_id, { status: TableStatus.Available }, undefined, csrfToken);
                    }

                    message.success("ยกเลิกออเดอร์เรียบร้อย");
                    router.push(getCancelOrderNavigationPath(order.order_type));

                } catch (error) {
                    console.error("Cancel failed:", error);
                    message.error("ไม่สามารถยกเลิกออเดอร์ได้");
                } finally {
                    setIsUpdating(false);
                    hideLoading();
                }
            }
        });
    };


    const handleDeleteItem = async (itemId: string) => {
        setConfirmConfig({
            open: true,
            type: 'danger',
            title: 'ยืนยันการลบ',
            content: 'คุณต้องการลบรายการสินค้านี้ใช่หรือไม่?',
            okText: 'ลบ',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                try {
                    setIsUpdating(true);
                    showLoading("กำลังลบรายการ...");
                    closeConfirm();
                    const csrfToken = await getCsrfTokenCached();
                    await ordersService.deleteItem(itemId, undefined, csrfToken);
                    message.success("ลบรายการเรียบร้อย");
                    fetchOrder(orderId as string);
                } catch {
                    message.error("ไม่สามารถลบรายการได้");
                } finally {
                    setIsUpdating(false);
                    hideLoading();
                }
            }
        });
    };

    const handleSaveEdit = async (itemId: string, quantity: number, notes: string, details: ItemDetailInput[] = []) => {
        try {
            setIsUpdating(true);
            showLoading("กำลังบันทึกข้อมูล...");
            const csrfToken = await getCsrfTokenCached();
            await ordersService.updateItem(itemId, { quantity, notes, details }, undefined, csrfToken);
            message.success("แก้ไขรายการเรียบร้อย");
            fetchOrder(orderId as string);
        } catch (error) {
            message.error("ไม่สามารถแก้ไขรายการได้");
            throw error;
        } finally {
            setIsUpdating(false);
            hideLoading();
        }
    };

    const handleEditClick = (record: SalesOrderItem) => {
        setItemToEdit(record);
        setEditModalOpen(true);
    };

    const handleAddItem = async (product: Products, quantity: number, notes: string, details: ItemDetailInput[] = []) => {
        const totalPrice = (Number(product.price) + details.reduce((sum, d) => sum + d.extra_price, 0)) * quantity;

        if (!isOnline) {
            offlineQueueService.addToQueue('ADD_ITEM', { 
                orderId: orderId as string, 
                itemData: { product_id: product.id, quantity, price: product.price, notes, discount_amount: 0, total_price: totalPrice, details } 
            });
            message.warning("บันทึกข้อมูลแบบ Offline แล้ว");
            fetchOrder(orderId as string); // Refresh from cache/local
            return;
        }

        try {
            setIsUpdating(true);
            showLoading("กำลังเพิ่มสินค้า...");
            const csrfToken = await getCsrfTokenCached();
            await ordersService.addItem(orderId as string, {
                product_id: product.id,
                quantity: quantity,
                price: product.price,
                notes: notes,
                discount_amount: 0,
                total_price: totalPrice,
                details: details,
                status: OrderStatus.Cooking
            }, undefined, csrfToken);
            message.success("เพิ่มสินค้าเรียบร้อย");
            fetchOrder(orderId as string);
        } catch (error) {
            message.error("เพิ่มสินค้าไม่สำเร็จ");
            throw error;
        } finally {
            setIsUpdating(false);
            hideLoading();
        }
    };

    const handleConfirmServe = async () => {
        const isDelivery = order?.order_type === OrderType.Delivery;
        setConfirmConfig({
            open: true,
            type: 'success',
            title: isDelivery ? 'ยืนยันจัดออเดอร์เสร็จสิ้น' : `ยืนยันการ${getServeActionText(order?.order_type)}ทั้งหมด`,
            content: isDelivery ? 'จัดเตรียมอาหารเรียบร้อยแล้ว ต้องการส่งมอบให้ไรเดอร์หรือไม่?' : 'รายการทั้งหมดเสร็จสิ้นแล้ว ต้องการเข้าสู่ขั้นตอนการชำระเงินหรือไม่?',
            okText: 'ยืนยัน',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                try {
                    setIsUpdating(true);
                    showLoading("กำลังยืนยันรายการ...");
                    closeConfirm();
                    const csrfToken = await getCsrfTokenCached();
                    await ordersService.updateStatus(orderId as string, OrderStatus.WaitingForPayment, csrfToken);
                    message.success("ยืนยันออเดอร์เรียบร้อย");
                    
                    if (order) {
                        const nextPath = getPostConfirmServeNavigationPath(order);
                        router.push(nextPath);
                    } else {
                        router.push('/pos/orders');
                    }
                } catch {
                    message.error("เกิดข้อผิดพลาดในการยืนยัน");
                } finally {
                    setIsUpdating(false);
                    hideLoading();
                }
            }
        });
    }

    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };



    if (isLoading && !order) return null;
    if (!order) return <Empty description="ไม่พบข้อมูล" />;

    const desktopColumns = [
        {
            title: '',
            key: 'image',
            width: 70,
            align: 'center' as const,
            render: (_value: unknown, record: SalesOrderItem) => (
                record.product?.img_url ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={record.product.img_url}
                            alt={record.product?.display_name ?? "สินค้า"}
                            style={orderDetailStyles.productThumb}
                        />
                    </>
                ) : (
                    <div style={orderDetailStyles.productThumbPlaceholder}><ShopOutlined /></div>
                )
            )
        },
        {
            title: 'รายการ',
            key: 'product',
            align: 'center' as const,
            render: (_value: unknown, record: SalesOrderItem) => (
                <Space orientation="vertical" size={2} align="center">
                    <Text strong style={{ fontSize: 15, lineHeight: '1.2' }}>{record.product?.display_name}</Text>
                    {record.details && record.details.length > 0 && (
                        <div style={{ fontSize: 13, color: orderDetailColors.served, textAlign: 'center' }}>
                            {record.details.map((d, i) => (
                                <div key={i} style={{ lineHeight: '1.4' }}>+ {d.detail_name}</div>
                            ))}
                        </div>
                    )}
                    {record.notes && <Text style={{ fontSize: 13, color: orderDetailColors.cancelled }}><InfoCircleOutlined /> {record.notes}</Text>}
                </Space>
            )
        },
        {
            title: 'หมวดหมู่',
            key: 'category',
            width: 120,
            align: 'center' as const,
            render: (_value: unknown, record: SalesOrderItem) => (
                <Space orientation="vertical" size={0} align="center">
                    {record.product?.category?.display_name ? (
                        <Tag color="cyan" style={orderDetailStyles.categoryTag}>
                            {record.product.category.display_name}
                        </Tag>
                    ) : '-'}
                </Space>
            )
        },
        {
            title: 'ราคา',
            key: 'price',
            width: 110,
            align: 'center' as const,
            render: (_value: unknown, record: SalesOrderItem) => {
                return (
                    <Space orientation="vertical" size={0} align="center">
                        <Text style={{ ...orderDetailStyles.priceTag, fontSize: 18 }}>฿{Number(record.price).toLocaleString()}</Text>
                        {record.details && record.details.length > 0 && record.details.map((d, i) => (
                            <Text key={i} style={{ fontSize: 13, color: orderDetailColors.priceTotal, display: 'block', lineHeight: '1.4' }}>
                                + ฿{Number(d.extra_price).toLocaleString()}
                            </Text>
                        ))}
                    </Space>
                );
            }
        },
        {
            title: 'สถานะ',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            align: 'center' as const,
            render: (status: string) => (
                <Tag color={status === OrderStatus.Pending ? 'orange' : status === OrderStatus.Cooking ? 'blue' : 'green'}>
                    {getOrderStatusText(status, order.order_type)}
                </Tag>
            )
        },
        {
            title: 'จำนวน',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 80,
            align: 'center' as const,
            render: (qty: number) => <Text strong style={{ fontSize: 16 }}>x{qty}</Text>
        },
        {
            title: 'จัดการ',
            key: 'actions',
            width: 130,
            align: 'right' as const,
            render: (_value: unknown, record: SalesOrderItem) => (
                <Space>
                    <Tooltip title={getServeActionText(order.order_type)}>
                        <Button 
                            type="primary" 
                            onClick={() => handleServeItem(record.id)} 
                            style={{ 
                                background: orderDetailColors.served, 
                                borderColor: orderDetailColors.served,
                                height: 'auto',
                                padding: '4px 8px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 2,
                                minWidth: 60,
                                borderRadius: 10
                            }}
                        >
                            <CheckOutlined style={{ fontSize: 16 }} />
                            <span style={{ fontSize: 10, fontWeight: 700 }}>{getServeActionText(order.order_type)}</span>
                        </Button>
                    </Tooltip>
                    <Tooltip title="แก้ไข"><Button type="text" icon={<EditOutlined />} onClick={() => handleEditClick(record)} /></Tooltip>
                    <Tooltip title="ลบ"><Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteItem(record.id)} /></Tooltip>
                </Space>
            )
        }
    ];
    
    const desktopServedColumns = [
        {
            title: '',
            key: 'image',
            width: 70,
            align: 'center' as const,
            render: (_value: unknown, record: SalesOrderItem) => (
                record.product?.img_url ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={record.product.img_url}
                            alt={record.product?.display_name ?? "สินค้า"}
                            style={{...orderDetailStyles.productThumb, opacity: 0.7}}
                        />
                    </>
                ) : (
                    <div style={orderDetailStyles.productThumbPlaceholder}><ShopOutlined /></div>
                )
            )
        },
        {
            title: 'รายการ',
            key: 'product',
            align: 'center' as const,
            render: (_value: unknown, record: SalesOrderItem) => (
                <Space orientation="vertical" size={2} align="center">
                    <Text strong style={{ 
                        fontSize: 15, 
                        lineHeight: '1.2',
                        textDecoration: record.status === OrderStatus.Cancelled ? 'line-through' : 'none',
                        color: record.status === OrderStatus.Cancelled ? orderDetailColors.textLight : orderDetailColors.text
                    }}>
                        {record.product?.display_name}
                    </Text>
                    {record.details && record.details.length > 0 && (
                        <div style={{ fontSize: 12, color: orderDetailColors.served, opacity: 0.7, textAlign: 'center' }}>
                            {record.details.map((d, i) => (
                                <div key={i} style={{ lineHeight: '1.4' }}>+ {d.detail_name}</div>
                            ))}
                        </div>
                    )}
                    {record.notes && <Text style={{ fontSize: 12, opacity: 0.7, color: orderDetailColors.cancelled }}><InfoCircleOutlined /> {record.notes}</Text>}
                </Space>
            )
        },
        {
            title: 'หมวดหมู่',
            key: 'category',
            width: 120,
            align: 'center' as const,
            render: (_value: unknown, record: SalesOrderItem) => (
                <Space orientation="vertical" size={0} align="center">
                    {record.product?.category?.display_name ? (
                        <Tag color="cyan" style={{...orderDetailStyles.categoryTag, opacity: 0.7}}>
                            {record.product.category.display_name}
                        </Tag>
                    ) : '-'}
                </Space>
            )
        },
        {
            title: 'ราคา',
            key: 'price',
            width: 110,
            align: 'center' as const,
            render: (_value: unknown, record: SalesOrderItem) => {
                return (
                    <Space orientation="vertical" size={0} align="center">
                        <Text style={{...orderDetailStyles.priceTag, opacity: 0.7}}>฿{Number(record.price).toLocaleString()}</Text>
                        {record.details && record.details.length > 0 && record.details.map((d, i) => (
                            <Text key={i} style={{ fontSize: 11, opacity: 0.7, color: orderDetailColors.priceTotal, display: 'block', lineHeight: '1.4' }}>
                                + ฿{Number(d.extra_price).toLocaleString()}
                            </Text>
                        ))}
                    </Space>
                );
            }
        },
        {
            title: 'ราคารวม',
            key: 'total',
            width: 120,
            align: 'center' as const,
            render: (_value: unknown, record: SalesOrderItem) => (
                <Text strong style={{ 
                    color: record.status === OrderStatus.Cancelled ? orderDetailColors.textLight : orderDetailColors.priceTotal, 
                    fontSize: 16,
                    textDecoration: record.status === OrderStatus.Cancelled ? 'line-through' : 'none'
                }}>
                    ฿{Number(record.total_price).toLocaleString()}
                </Text>
            )
        },
        {
            title: 'สถานะ',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            align: 'center' as const,
            render: (status: string) => (
                <Tag color={getOrderStatusColor(status)}>
                    {getOrderStatusText(status, order.order_type)}
                </Tag>
            )
        },
        {
            title: 'จำนวน',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 80,
            align: 'center' as const,
            render: (qty: number) => <Text strong style={{ fontSize: 16 }}>x{qty}</Text>
        },
        {
            title: 'จัดการ',
            key: 'actions',
            width: 130,
            align: 'right' as const,
            render: (_value: unknown, record: SalesOrderItem) => (
                record.status === OrderStatus.Served ? (
                    <Button 
                        size="small" 
                        className="unserve-button"
                        style={orderDetailStyles.unserveButton}
                        icon={<CloseOutlined />}
                        onClick={() => handleUnserveItem(record.id)}
                    >
                        {order.order_type === OrderType.DineIn ? 'ยกเลิกเสิร์ฟ' : 'ยกเลิกปรุงเสร็จ'}
                    </Button>
                ) : null
            )
        }
    ];

    const activeItems = order.items?.filter(i => i.status === OrderStatus.Pending || i.status === OrderStatus.Cooking) || [];
    const servedItems = (order.items?.filter(i => 
        i.status === OrderStatus.Served || 
        i.status === OrderStatus.Cancelled || 
        i.status === OrderStatus.WaitingForPayment
    ) || []).sort((a, b) => {
        if (a.status === OrderStatus.Cancelled && b.status !== OrderStatus.Cancelled) return 1;
        if (a.status !== OrderStatus.Cancelled && b.status === OrderStatus.Cancelled) return -1;
        return 0;
    });

    const nonCancelledItems = getNonCancelledItems(order.items) as SalesOrderItem[];
    const calculatedTotal = calculateOrderTotal(order.items);
    const isOrderComplete = activeItems.length === 0 && (order.items?.length || 0) > 0;
    const shouldVirtualizeActive = activeItems.length > 12;
    const shouldVirtualizeServed = servedItems.length > 12;

    return (
        <div className="order-detail-page" style={orderDetailStyles.container}>
            <style jsx global>{ordersResponsiveStyles}</style>
            
            {/* Sticky Compact Header - Glass Effect */}
            <header className="order-detail-header" style={orderDetailStyles.header}>
                <div style={orderDetailStyles.headerContent}>
                    {/* Glass Back Button */}
                    <Button 
                        type="text" 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => {
                            if (order?.order_type === OrderType.DineIn) {
                                router.push('/pos/channels/dine-in');
                            } else {
                                router.back();
                            }
                        }}
                        aria-label="กลับ"
                        style={orderDetailStyles.headerBackButton}
                        className="scale-hover"
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <Title level={4} style={orderDetailStyles.headerTitle}>
                                {order.order_no}
                            </Title>
                            {order.order_type === OrderType.DineIn && order.table && (
                                <Tag style={orderDetailStyles.tableNameBadge}>
                                    🪑 โต๊ะ {order.table.table_name}
                                </Tag>
                            )}
                            {order.order_type === OrderType.Delivery && order.delivery_code && (
                                <Tag style={orderDetailStyles.tableNameBadge}>
                                    📋 รหัส: {order.delivery_code}
                                </Tag>
                            )}
                        </div>
                        <div style={orderDetailStyles.headerMetaRow}>
                            <Tag 
                                icon={
                                    order.order_type === OrderType.DineIn ? <ShopOutlined /> :
                                    order.order_type === OrderType.TakeAway ? <ShoppingOutlined /> :
                                    <RocketOutlined />
                                }
                                style={{
                                    ...orderDetailStyles.channelBadge,
                                    background: getOrderChannelColor(order.order_type) + '15',
                                    color: getOrderChannelColor(order.order_type),
                                }}
                            >
                                {getOrderChannelText(order.order_type)}
                            </Tag>
                            <div style={orderDetailStyles.headerMetaSeparator} />
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                {dayjs(order.create_date).format('HH:mm | D MMM YY')}
                            </Text>
                        </div>
                    </div>
                    <Space direction="vertical" align="end" size={6}>
                        <Tag 
                            color={getOrderStatusColor(order.status)} 
                            className="status-badge"
                            style={{ margin: 0, fontSize: 13, fontWeight: 600, borderRadius: 10, padding: '4px 14px' }}
                        >
                            {getOrderStatusText(order.status, order.order_type)}
                        </Tag>
                        {currentQueueItem && (
                            <Tag 
                                color={
                                    currentQueueItem.status === QueueStatus.Pending ? 'orange' :
                                    currentQueueItem.status === QueueStatus.Processing ? 'blue' :
                                    currentQueueItem.status === QueueStatus.Completed ? 'green' : 'red'
                                }
                                style={{ margin: 0, fontSize: 11, borderRadius: 8 }}
                            >
                                คิว #{currentQueueItem.queue_position} - {currentQueueItem.status === QueueStatus.Pending ? 'รอ' :
                                    currentQueueItem.status === QueueStatus.Processing ? 'กำลังทำ' :
                                    currentQueueItem.status === QueueStatus.Completed ? 'เสร็จ' : 'ยกเลิก'}
                            </Tag>
                        )}
                    </Space>
                </div>
            </header>
            
            {/* Queue Management Actions */}
            {order && order.status !== OrderStatus.Cancelled && order.status !== OrderStatus.Completed && (
                <div style={{ 
                    padding: '16px 24px', 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    gap: 10,
                    background: orderDetailColors.backgroundSecondary,
                    borderBottom: `1px solid ${orderDetailColors.borderLight}`,
                }}>
                    {currentQueueItem ? (
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                                removeFromQueue(currentQueueItem.id);
                            }}
                            loading={isQueueLoading}
                            style={{ borderRadius: 12, height: 40, fontWeight: 600 }}
                            className="scale-hover"
                        >
                            ลบออกจากคิว
                        </Button>
                    ) : (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                addToQueue({
                                    orderId: order.id,
                                    priority: QueuePriority.Normal
                                });
                            }}
                            loading={isQueueLoading}
                            style={{ 
                                borderRadius: 12, 
                                height: 40, 
                                fontWeight: 600,
                                background: `linear-gradient(135deg, ${orderDetailColors.primary} 0%, ${orderDetailColors.primaryDark} 100%)`,
                                border: 'none',
                                boxShadow: `0 4px 12px ${orderDetailColors.primary}30`,
                            }}
                            className="scale-hover"
                        >
                            <UnorderedListOutlined /> เพิ่มเข้าคิว
                        </Button>
                    )}
                </div>
            )}

            <main className="order-detail-content" style={orderDetailStyles.contentWrapper}>
                <Row gutter={[20, 20]}>
                    <Col xs={24} lg={16}>
                        {/* Active Items Section */}
                        <Card 
                            className="order-detail-card fade-in"
                            style={orderDetailStyles.card}
                            title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Space align="center" size={12}>
                                        <div style={orderDetailStyles.masterCheckboxWrapper}>
                                            <Checkbox 
                                                indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < activeItems.length}
                                                checked={activeItems.length > 0 && selectedRowKeys.length === activeItems.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedRowKeys(activeItems.map(i => i.id));
                                                    } else {
                                                        setSelectedRowKeys([]);
                                                    }
                                                }}
                                                style={orderDetailStyles.masterCheckbox}
                                            />
                                        </div>
                                        <Text strong style={orderDetailTypography.sectionTitle}>
                                            กำลังทำอาหาร ({activeItems.length})
                                        </Text>
                                    </Space>
                                    <Space wrap>
                                        {selectedRowKeys.length > 0 && (
                                            <Space style={{ gap: 8 }}>
                                                <Button 
                                                    danger 
                                                    icon={<DeleteOutlined />} 
                                                    onClick={handleCancelSelected}
                                                    style={orderDetailStyles.bulkActionButtonDesktop}
                                                    className="bulk-action-btn"
                                                >
                                                    <span className="hide-on-mobile">ยกเลิกรายการ ({selectedRowKeys.length})</span>
                                                    <span className="show-on-mobile-inline">ยกเลิกรายการ ({selectedRowKeys.length})</span>
                                                </Button>
                                                <Button 
                                                    type="primary" 
                                                    icon={<CheckOutlined />} 
                                                    onClick={handleServeSelected} 
                                                    loading={isUpdating}
                                                    style={{ ...orderDetailStyles.bulkActionButtonDesktop, background: orderDetailColors.served, borderColor: orderDetailColors.served }}
                                                    className="bulk-action-btn"
                                                >
                                                    <span className="hide-on-mobile">{getServeActionText(order.order_type)} ({selectedRowKeys.length})</span>
                                                    <span className="show-on-mobile-inline">{getServeActionText(order.order_type)} ({selectedRowKeys.length})</span>
                                                </Button>
                                            </Space>
                                        )}
                                        <Button 
                                            icon={<ReloadOutlined />} 
                                            onClick={() => fetchOrder(orderId as string)}
                                            style={orderDetailStyles.actionButtonSecondary}
                                        />
                                        <Button 
                                            type="primary" 
                                            icon={<PlusOutlined />} 
                                            onClick={() => setIsAddModalOpen(true)}
                                            style={orderDetailStyles.actionButtonPrimary}
                                        >
                                            เพิ่ม
                                        </Button>
                                    </Space>
                                </div>
                            }
                        >
                            {activeItems.length > 0 ? (
                                <>
                                    {/* Desktop Table */}
                                    <div className="order-detail-table-desktop">
                                        <Table 
                                            dataSource={activeItems} 
                                            columns={desktopColumns} 
                                            rowKey="id" 
                                            virtual={shouldVirtualizeActive}
                                            scroll={shouldVirtualizeActive ? { y: 420 } : undefined}
                                            pagination={false} 
                                            size="middle"
                                            className="order-items-table"
                                            rowSelection={{
                                                selectedRowKeys,
                                                onChange: onSelectChange,
                                                hideSelectAll: true,
                                            }}
                                        />
                                    </div>

                                    {/* Mobile Cards */}
                                    <div className="order-detail-cards-mobile">
                                        {activeItems.map(item => (
                                            <div 
                                                key={item.id} 
                                                style={{...orderDetailStyles.itemCard, ...orderDetailStyles.itemCardActive, padding: 12}}
                                                className="order-item-card scale-in"
                                            >
                                                <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                                                    {/* Product Image */}
                                                    <div style={{ flexShrink: 0 }}>
                                                        {item.product?.img_url ? (
                                                            <>
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img
                                                                    src={item.product.img_url}
                                                                    alt={item.product?.display_name ?? "สินค้า"}
                                                                    style={{...orderDetailStyles.productThumb, width: 60, height: 60}}
                                                                />
                                                            </>
                                                        ) : (
                                                            <div style={{...orderDetailStyles.productThumbPlaceholder, width: 60, height: 60}}><ShopOutlined /></div>
                                                        )}
                                                    </div>

                                                    {/* Product Info */}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <Checkbox 
                                                                    checked={selectedRowKeys.includes(item.id)}
                                                                    onChange={(e) => {
                                                                        const newKeys = e.target.checked 
                                                                            ? [...selectedRowKeys, item.id] 
                                                                            : selectedRowKeys.filter(k => k !== item.id);
                                                                        setSelectedRowKeys(newKeys);
                                                                    }}
                                                                >
                                                                    <Text strong style={{ fontSize: 16 }}>{item.product?.display_name}</Text>
                                                                </Checkbox>
                                                                <div style={{ paddingLeft: 24, marginTop: 2 }}>
                                                                    {item.product?.category?.display_name && (
                                                                        <Tag color="cyan" style={{...orderDetailStyles.categoryTag, fontSize: 9}}>
                                                                            {item.product.category.display_name}
                                                                        </Tag>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <Text strong style={{ fontSize: 18, color: orderDetailColors.primary, marginLeft: 8 }}>x{item.quantity}</Text>
                                                        </div>
                                                        <div style={{ paddingLeft: 24, marginTop: 2 }}>
                                                            {item.details && item.details.length > 0 && (
                                                                <div style={{ fontSize: 12, color: orderDetailColors.served, marginBottom: 4 }}>
                                                                    {item.details.map((d: { detail_name: string; extra_price: number }) => `${d.detail_name} (+ ฿${Number(d.extra_price).toLocaleString()})`).join(', ')}
                                                                </div>
                                                            )}
                                                            <Space orientation="vertical" size={2}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <Text style={orderDetailStyles.priceTag}>฿{Number(item.price).toLocaleString()}</Text>
                                                                    <Text strong style={{ color: orderDetailColors.priceTotal }}>
                                                                        รวม ฿{Number(item.total_price).toLocaleString()}
                                                                    </Text>
                                                                </div>
                                                            </Space>
                                                            {item.notes && (
                                                                <div style={{ marginTop: 4 }}>
                                                                    <Text style={{ fontSize: 12, color: orderDetailColors.cancelled }}>
                                                                        <InfoCircleOutlined /> {item.notes}
                                                                    </Text>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${orderDetailColors.borderLight}`, paddingTop: 8, gap: 8 }}>
                                                    <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteItem(item.id)}>ลบ</Button>
                                                    <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleEditClick(item)}>แก้ไข</Button>
                                                    <Button 
                                                        size="small" 
                                                        type="primary" 
                                                        onClick={() => handleServeItem(item.id)}
                                                        style={{ 
                                                            background: orderDetailColors.served, 
                                                            borderColor: orderDetailColors.served,
                                                            height: 'auto',
                                                            padding: '4px 10px',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            gap: 2,
                                                            borderRadius: 10
                                                        }}
                                                    >
                                                        <CheckOutlined style={{ fontSize: 16 }} />
                                                        <span style={{ fontSize: 10, fontWeight: 700 }}>{getServeActionText(order.order_type)}</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div style={orderDetailStyles.emptyState}>
                                    <CheckCircleOutlined className="empty-state-icon" />
                                    <Text className="empty-state-text">ไม่มีรายการที่กำลังรอ</Text>
                                </div>
                            )}
                        </Card>

                        <Card 
                            className="order-detail-card fade-in"
                            style={orderDetailStyles.card}
                            title={
                                <Text strong style={{...orderDetailTypography.sectionTitle, color: orderDetailColors.textSecondary}}>
                                    {getServedStatusText(order.order_type)} ({servedItems.length})
                                </Text>
                            }
                        >
                            {servedItems.length > 0 ? (
                                <>
                                    {/* Desktop Table for Served items */}
                                    <div className="order-detail-table-desktop">
                                        <Table 
                                            dataSource={servedItems} 
                                            columns={desktopServedColumns} 
                                            rowKey="id" 
                                            virtual={shouldVirtualizeServed}
                                            scroll={shouldVirtualizeServed ? { y: 360 } : undefined}
                                            pagination={false} 
                                            size="small"
                                            className="order-items-table"
                                            rowClassName={(record) => record.status === OrderStatus.Cancelled ? 'row-cancelled' : ''}
                                        />
                                    </div>

                                    {/* Mobile Cards for Served items */}
                                    <div className="order-detail-cards-mobile">
                                        {servedItems.map(item => (
                                            <div 
                                                key={item.id} 
                                                style={{
                                                    ...orderDetailStyles.itemCard, 
                                                    ...orderDetailStyles.itemCardServed, 
                                                    padding: 12,
                                                    backgroundColor: item.status === OrderStatus.Cancelled ? orderDetailColors.cancelledLight : orderDetailColors.white,
                                                    borderColor: item.status === OrderStatus.Cancelled ? orderDetailColors.cancelled + '30' : orderDetailColors.border,
                                                    position: 'relative'
                                                }}
                                            >
                                                {/* Status Tag in Top Right */}
                                                <div style={{ position: 'absolute', top: 8, right: 12 }}>
                                                    <Tag color={getOrderStatusColor(item.status)} style={{ margin: 0 }}>
                                                        {getOrderStatusText(item.status, order.order_type)}
                                                    </Tag>
                                                </div>

                                                <div style={{ display: 'flex', gap: 12 }}>
                                                    {/* Product Image */}
                                                    <div style={{ flexShrink: 0 }}>
                                                        {item.product?.img_url ? (
                                                            <>
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img
                                                                    src={item.product.img_url}
                                                                    alt={item.product?.display_name ?? "สินค้า"}
                                                                    style={{...orderDetailStyles.productThumb, width: 50, height: 50, opacity: 0.7}}
                                                                />
                                                            </>
                                                        ) : (
                                                            <div style={{...orderDetailStyles.productThumbPlaceholder, width: 50, height: 50}}><ShopOutlined /></div>
                                                        )}
                                                    </div>

                                                    <div style={{ flex: 1, minWidth: 0, paddingRight: 60 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <Text strong style={{ 
                                                                    fontSize: 15, 
                                                                    textDecoration: item.status === OrderStatus.Cancelled ? 'line-through' : 'none',
                                                                    color: item.status === OrderStatus.Cancelled ? orderDetailColors.textLight : orderDetailColors.text
                                                                }}>
                                                                    {item.product?.display_name}
                                                                </Text>
                                                                <div style={{ marginTop: 2 }}>
                                                                    {item.product?.category?.display_name && (
                                                                        <Tag color="cyan" style={{...orderDetailStyles.categoryTag, fontSize: 9}}>
                                                                            {item.product.category.display_name}
                                                                        </Tag>
                                                                    )}
                                                                </div>
                                                                {item.details && item.details.length > 0 && (
                                                                    <div style={{ fontSize: 12, color: orderDetailColors.served, opacity: 0.7, marginBottom: 4 }}>
                                                                        {item.details.map((d: { detail_name: string; extra_price: number }) => `${d.detail_name} (+ ฿${Number(d.extra_price).toLocaleString()})`).join(', ')}
                                                                    </div>
                                                                )}
                                                                <Space orientation="vertical" size={2} style={{ marginTop: 4, width: '100%' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <div>
                                                                            <Text style={{...orderDetailStyles.priceTag, opacity: 0.7}}>฿{Number(item.price).toLocaleString()}</Text>
                                                                            <Text strong style={{ marginLeft: 8, color: orderDetailColors.textSecondary, opacity: 0.7 }}>
                                                                                รวม ฿{Number(item.total_price).toLocaleString()}
                                                                            </Text>
                                                                        </div>
                                                                        <Text strong style={{ color: orderDetailColors.textSecondary }}>x{item.quantity}</Text>
                                                                    </div>
                                                                </Space>
                                                                {item.notes && (
                                                                    <div style={{ marginTop: 4 }}>
                                                                        <Text style={{ fontSize: 12, opacity: 0.7, color: orderDetailColors.cancelled }}>
                                                                            <InfoCircleOutlined /> {item.notes}
                                                                        </Text>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {item.status === OrderStatus.Served && (
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                                                        <Button 
                                                            size="small" 
                                                            className="unserve-button"
                                                            style={orderDetailStyles.unserveButton}
                                                            icon={<CloseOutlined />}
                                                            onClick={() => handleUnserveItem(item.id)}
                                                        >
                                                            {order?.order_type === OrderType.DineIn ? 'ยกเลิกเสิร์ฟ' : 'ยกเลิกปรุงเสร็จ'}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <Text type="secondary">ยังไม่มีรายการที่ดำเนินการแล้ว</Text>
                                </div>
                            )}
                        </Card>
                    </Col>
                    
                    <Col xs={24} lg={8}>
                        <Card className="order-detail-card" style={orderDetailStyles.summaryCard}>
                            <Title level={5} style={{ marginBottom: 16 }}>สรุปการสั่งซื้อ</Title>
                            
                            {/* Detailed Item List */}
                            <div style={{ ...orderDetailStyles.summaryList, background: 'white' }}>
                                <Text strong style={{ fontSize: 13, marginBottom: 8, display: 'block', color: orderDetailColors.textSecondary }}>
                                    รายการสินค้า
                                </Text>
                                {nonCancelledItems.map((item, index) => (
                                    <div key={item.id || index} style={orderDetailStyles.summaryItemRow}>
                                        {/* Product Image */}
                                        {item.product?.img_url ? (
                                            <>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img 
                                                    src={item.product.img_url} 
                                                    alt={item.product?.display_name || 'สินค้า'} 
                                                    style={orderDetailStyles.summaryItemImage} 
                                                />
                                            </>
                                        ) : (
                                            <div style={{ ...orderDetailStyles.summaryItemImage, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                                                <ShopOutlined style={{ fontSize: 16, color: '#bfbfbf' }} />
                                            </div>
                                        )}

                                        <div style={orderDetailStyles.summaryItemContent}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Text strong style={{ fontSize: 13, flex: 1 }}>{item.product?.display_name}</Text>
                                                <Text strong style={{ fontSize: 13, color: orderDetailColors.primary }}>฿{Number(item.total_price).toLocaleString()}</Text>
                                            </div>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                                                <Text type="secondary" style={{ fontSize: 11 }}>จำนวน : {item.quantity}</Text>
                                                <Text type="secondary" style={{ fontSize: 11 }}>ราคา : {Number(item.price).toLocaleString()}</Text>
                                            </div>

                                            {item.details && item.details.length > 0 && (
                                                <div style={orderDetailStyles.summaryDetailText}>
                                                    <PlusOutlined style={{ fontSize: 10 }} /> {item.details.map((d: { detail_name: string; extra_price: number }) => `${d.detail_name} (+${Number(d.extra_price).toLocaleString()})`).join(', ')}
                                                </div>
                                            )}
                                            
                                            {item.notes && (
                                                <div style={{ ...orderDetailStyles.summaryDetailText, color: orderDetailColors.cancelled, fontStyle: 'italic' }}>
                                                    โน้ต: {item.notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Category Summary */}
                            <div style={orderDetailStyles.summaryList}>
                                <Text strong style={{ fontSize: 13, marginBottom: 8, display: 'block', color: orderDetailColors.textSecondary }}>
                                    แยกตามหมวดหมู่
                                </Text>
                                {Object.entries(groupItemsByCategory(order?.items || []) as Record<string, number>).map(([cat, qty]) => (
                                    <div key={cat} style={orderDetailStyles.summaryRow}>
                                        <Text type="secondary" style={{ fontSize: 13 }}>{cat}</Text>
                                        <Text strong style={{ fontSize: 13 }}>{String(qty)} รายการ</Text>
                                    </div>
                                ))}
                                <Divider style={{ margin: '8px 0' }} />
                                <div style={orderDetailStyles.summaryRow}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>จำนวนรายการทั้งหมด</Text>
                                    <Text strong style={{ fontSize: 13 }}>{nonCancelledItems.length} รายการ</Text>
                                </div>
                            </div>

                            {/* Total Only */}
                            <div style={{ padding: '0 4px' }}>
                                <div style={orderDetailStyles.summaryMainRow}>
                                    <Text strong style={{ fontSize: 18 }}>ยอดรวมทั้งสิ้น</Text>
                                    <Text strong style={{ fontSize: 26, color: orderDetailColors.primary }}>
                                        ฿{calculatedTotal.toLocaleString()}
                                    </Text>
                                </div>
                            </div>
                            
                            {isOrderComplete && (
                                <Button 
                                    type="primary" 
                                    block 
                                    size="large" 
                                    onClick={handleConfirmServe}
                                    style={{ marginTop: 24, height: 52, borderRadius: 14, fontWeight: 700, fontSize: 16 }}
                                >
                                    {getConfirmServeActionText(order.order_type)}
                                </Button>
                            )}
                            
                            <Button 
                                danger
                                block 
                                size="large" 
                                onClick={handleCancelOrder}
                                style={{ marginTop: 12, height: 45, borderRadius: 14, fontWeight: 600, fontSize: 15 }}
                                disabled={isUpdating}
                            >
                                ยกเลิกออเดอร์
                            </Button>
                        </Card>
                    </Col>
                </Row>
            </main>

            {/* Floating Action Bar (Mobile Only) */}
            
            <AddItemsModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onAddItem={handleAddItem} 
            />
            
            <EditItemModal
                item={itemToEdit}
                isOpen={editModalOpen}
                onClose={() => {
                    setEditModalOpen(false);
                    setItemToEdit(null);
                }}
                onSave={handleSaveEdit}
            />

            <ConfirmationDialog
                open={confirmConfig.open}
                type={confirmConfig.type}
                title={confirmConfig.title}
                content={confirmConfig.content}
                okText={confirmConfig.okText}
                cancelText={confirmConfig.cancelText}
                onOk={confirmConfig.onOk}
                onCancel={closeConfirm}
                loading={isUpdating}
            />
        </div>
    );
}
