"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { groupOrderItems } from "../../../../../utils/orderGrouping";
import { Typography, Row, Col, Card, Tag, Button, Empty, Table, Checkbox, message, Tooltip, Space, Divider } from "antd";
import { 
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
    CheckCircleOutlined,
    UnorderedListOutlined
} from "@ant-design/icons";
import { ordersService } from "../../../../../services/pos/orders.service";
import { getCsrfTokenCached } from "../../../../../utils/pos/csrf";
import { tablesService } from "../../../../../services/pos/tables.service";
import { SalesOrder, OrderStatus, OrderType } from "../../../../../types/api/pos/salesOrder";
import { ItemStatus, SalesOrderItem } from "../../../../../types/api/pos/salesOrderItem";
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
  getOrderNavigationPath,
  isCancelledStatus,
  isPaidOrCompletedStatus,
  isWaitingForPaymentStatus,
} from "../../../../../utils/orders"; 
import dayjs from "dayjs";
import 'dayjs/locale/th';

import { AddItemsModal } from "./AddItemsModal";
import { EditItemModal } from "./EditItemModal";
import ConfirmationDialog from "../../../../../components/dialog/ConfirmationDialog";
import { useGlobalLoading } from "../../../../../contexts/pos/GlobalLoadingContext";
import { useAuth } from "../../../../../contexts/AuthContext";
import { Products } from "../../../../../types/api/pos/products";
import { useNetwork } from "../../../../../hooks/useNetwork";
import { useEffectivePermissions } from "../../../../../hooks/useEffectivePermissions";
import { offlineQueueService } from "../../../../../services/pos/offline.queue.service";
import { useSocket } from "../../../../../hooks/useSocket";
import { useRealtimeRefresh } from "../../../../../utils/pos/realtime";
import { ORDER_REALTIME_EVENTS } from "../../../../../utils/pos/orderRealtimeEvents";
import { useOrderQueue } from "../../../../../hooks/pos/useOrderQueue";
import { QueueStatus, QueuePriority } from "../../../../../types/api/pos/orderQueue";
import UIPageHeader from "../../../../../components/ui/page/PageHeader";
import { resolveImageSource } from "../../../../../utils/image/source";


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

    const { user } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    // Avoid "flash 403" while effective permissions are still loading.
    const canUpdateOrders = user?.role === "Admin" ? true : (!permissionLoading && can("orders.page", "update"));
    const canDeleteOrders = user?.role === "Admin" ? true : (!permissionLoading && can("orders.page", "delete"));

    const [order, setOrder] = useState<SalesOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const { showLoading, hideLoading } = useGlobalLoading();
    const { socket, isConnected } = useSocket();
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
            if (isPaidOrCompletedStatus(data.status)) {
                router.push(`/pos/dashboard/${data.id}`);
                return;
            }
            if (isCancelledStatus(data.status)) {
                router.push(getCancelOrderNavigationPath(data.order_type));
                return;
            }
            if (isWaitingForPaymentStatus(data.status)) {
                router.push(getOrderNavigationPath(data));
                return;
            }
            setOrder(data);
        } catch {
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
        events: ORDER_REALTIME_EVENTS,
        onRefresh: () => {
            if (orderId) {
                fetchOrder(orderId as string);
            }
        },
        intervalMs: isConnected ? undefined : 15000,
        enabled: Boolean(orderId),
    });

    const activeItems = useMemo<SalesOrderItem[]>(
        () => order?.items?.filter((i) => i.status === ItemStatus.Pending || i.status === ItemStatus.Cooking) || [],
        [order?.items],
    );

    const servedItems = useMemo<SalesOrderItem[]>(() => {
        const items =
            order?.items?.filter(
                (i) =>
                    i.status === ItemStatus.Served ||
                    i.status === ItemStatus.Cancelled,
            ) || [];

        return items.sort((a, b) => {
            if (a.status === ItemStatus.Cancelled && b.status !== ItemStatus.Cancelled) return 1;
            if (a.status !== ItemStatus.Cancelled && b.status === ItemStatus.Cancelled) return -1;
            return 0;
        });
    }, [order?.items]);

    const groupedActiveItems = useMemo(() => groupOrderItems(activeItems), [activeItems]);
    const groupedServedItems = useMemo(() => groupOrderItems(servedItems), [servedItems]);

    const nonCancelledItems = useMemo<SalesOrderItem[]>(() => getNonCancelledItems(order?.items) as SalesOrderItem[], [order?.items]);
    const groupedNonCancelledItems = useMemo(() => groupOrderItems(nonCancelledItems), [nonCancelledItems]);
    const calculatedTotal = calculateOrderTotal(order?.items);
    const isOrderComplete = activeItems.length === 0 && (order?.items?.length || 0) > 0;
    const shouldVirtualizeActive = groupedActiveItems.length > 12;
    const shouldVirtualizeServed = groupedServedItems.length > 12;

    const handleServeItem = async (itemId: string) => {
        if (!canUpdateOrders) {
            message.warning("คุณไม่มีสิทธิ์แก้ไขออเดอร์");
            return;
        }
        try {
            setIsUpdating(true);
            showLoading("กำลังดำเนินการเสิร์ฟ...");
            const csrfToken = await getCsrfTokenCached();
            
            // Resolve IDs from group
            const targetItem = groupedActiveItems.find((i) => i.id === itemId);
            const idsToServe = targetItem?.originalItems?.map((i) => i.id) || [itemId];

            await Promise.all(idsToServe.map((id: string) => 
                ordersService.updateItemStatus(id, ItemStatus.Served, undefined, csrfToken)
            ));
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
        if (!canUpdateOrders) {
            message.warning("คุณไม่มีสิทธิ์แก้ไขออเดอร์");
            return;
        }
        if (selectedRowKeys.length === 0) return;
        try {
            setIsUpdating(true);
            showLoading(`กำลังดำเนินการเสิร์ฟ ${selectedRowKeys.length} รายการ (รวมกลุ่ม)...`);
            const csrfToken = await getCsrfTokenCached();
            
            // Resolve all IDs from selected groups
            const allIds = selectedRowKeys.flatMap(key => {
                const group = groupedActiveItems.find((g) => g.id === key);
                return group?.originalItems?.map((i) => i.id) || [key.toString()];
            });

            await Promise.all(allIds.map((id: string) => 
                ordersService.updateItemStatus(id, ItemStatus.Served, undefined, csrfToken)
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
        if (!canUpdateOrders) {
            message.warning("คุณไม่มีสิทธิ์แก้ไขออเดอร์");
            return;
        }
        if (selectedRowKeys.length === 0) return;
        
        // Resolve all IDs to count correctly for confirmation
        const allIds = selectedRowKeys.flatMap(key => {
                const group = groupedActiveItems.find((g) => g.id === key);
                return group?.originalItems?.map((i) => i.id) || [key.toString()];
        });

        setConfirmConfig({
            open: true,
            type: 'danger',
            title: 'ยืนยันการยกเลิก',
            content: `คุณต้องการยกเลิก ${allIds.length} รายการที่เลือกใช่หรือไม่?`,
            okText: 'ยืนยันยกเลิก',
            cancelText: 'ไม่ยกเลิก',
            onOk: async () => {
                try {
                    setIsUpdating(true);
                    showLoading("กำลังดำเนินการยกเลิก...");
                    closeConfirm();
                    const csrfToken = await getCsrfTokenCached();
                    await Promise.all(allIds.map((id: string) => 
                        ordersService.updateItemStatus(id, ItemStatus.Cancelled, undefined, csrfToken)
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
        if (!canUpdateOrders) {
            message.warning("คุณไม่มีสิทธิ์แก้ไขออเดอร์");
            return;
        }
        try {
            setIsUpdating(true);
            showLoading("กำลังย้อนกลับสถานะ...");
            const csrfToken = await getCsrfTokenCached();

            // Resolve IDs from group (served items)
            const targetItem = groupedServedItems.find((i) => i.id === itemId);
            const idsToUnserve = targetItem?.originalItems?.map((i) => i.id) || [itemId];

            await Promise.all(idsToUnserve.map((id: string) => 
                ordersService.updateItemStatus(id, ItemStatus.Cooking, undefined, csrfToken)
            ));

            message.success("ยกเลิกการเสิร์ฟ (กลับไปปรุง)");
            fetchOrder(orderId as string);
        } finally {
            setIsUpdating(false);
            hideLoading();
        }
    };

    const handleCancelOrder = () => {
        if (!canDeleteOrders) {
            message.warning("คุณไม่มีสิทธิ์ลบ/ยกเลิกออเดอร์");
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
                    setIsUpdating(true);
                    showLoading("กำลังดำเนินการยกเลิก...");
                    closeConfirm();
                    const csrfToken = await getCsrfTokenCached();

                    // 1. Cancel all non-cancelled items
                    const activeItems = order.items?.filter(item => item.status !== ItemStatus.Cancelled) || [];
                    await Promise.all(
                        activeItems.map(item => 
                            ordersService.updateItemStatus(item.id, ItemStatus.Cancelled, undefined, csrfToken)
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

                } catch {
                    message.error("ไม่สามารถยกเลิกออเดอร์ได้");
                } finally {
                    setIsUpdating(false);
                    hideLoading();
                }
            }
        });
    };


    const handleDeleteItem = async (itemId: string) => {
        if (!canDeleteOrders) {
            message.warning("คุณไม่มีสิทธิ์ลบรายการ");
            return;
        }
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
                    
                    // Resolve IDs from group
                    const targetItem = groupedActiveItems.find((i) => i.id === itemId);
                    const idsToDelete = targetItem?.originalItems?.map((i) => i.id) || [itemId];

                    await Promise.all(idsToDelete.map((id: string) => 
                           ordersService.deleteItem(id, undefined, csrfToken)
                    ));
                    message.success(`ลบรายการเรียบร้อย (${idsToDelete.length} รายการ)`);
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
        if (!canUpdateOrders) {
            message.warning("คุณไม่มีสิทธิ์แก้ไขออเดอร์");
            return;
        }
        try {
            setIsUpdating(true);
            showLoading("กำลังบันทึกข้อมูล...");
            const csrfToken = await getCsrfTokenCached();
            
            // Validate quantity
            if (!quantity || quantity < 1) {
                message.error("จำนวนต้องมากกว่า 0");
                throw new Error("Invalid quantity");
            }
            
            // Prepare update data - ensure all values are properly formatted
            const updateData = {
                quantity: Number(quantity),
                notes: String(notes || ''),
                details: Array.isArray(details) ? details.map(d => ({
                    detail_name: String(d.detail_name || ''),
                    extra_price: Number(d.extra_price || 0)
                })) : []
            };
            
            // Send update request
            await ordersService.updateItem(
                itemId, 
                updateData, 
                undefined, 
                csrfToken
            );
            
            message.success("แก้ไขรายการเรียบร้อย");
            
            // Close modal first
            setEditModalOpen(false);
            setItemToEdit(null);
            
            // Close modal first
            setEditModalOpen(false);
            setItemToEdit(null);
            
            // Always fetch fresh data after update
            // Note: Backend might have a bug where it uses old quantity value
            // So we'll fetch multiple times to ensure we get the updated data
            
            // First fetch after short delay
            await new Promise(resolve => setTimeout(resolve, 600));
            await fetchOrder(orderId as string);
            
            // Second fetch to ensure we have the latest data
            setTimeout(async () => {
                const freshOrder = await ordersService.getById(orderId as string);
                const freshItem = freshOrder?.items?.find((item: SalesOrderItem) => item.id === itemId);
                if (freshItem) {
                    if (freshItem.quantity === quantity) {
                        setOrder(freshOrder);
                    } else {
                        // Try one more time after longer delay
                        setTimeout(async () => {
                            await fetchOrder(orderId as string);
                        }, 1000);
                    }
                }
            }, 500);
        } catch (error: unknown) {
            message.error("ไม่สามารถแก้ไขรายการได้");
            throw error;
        } finally {
            setIsUpdating(false);
            hideLoading();
        }
    };

    const handleEditClick = (record: SalesOrderItem) => {
        if (!canUpdateOrders) {
            message.warning("คุณไม่มีสิทธิ์แก้ไขออเดอร์");
            return;
        }
        setItemToEdit(record);
        setEditModalOpen(true);
    };

    const handleAddItem = async (product: Products, quantity: number, notes: string, details: ItemDetailInput[] = []) => {
        if (!canUpdateOrders) {
            message.warning("คุณไม่มีสิทธิ์แก้ไขออเดอร์");
            return;
        }
        const unitPrice =
            order?.order_type === OrderType.Delivery
                ? Number(product.price_delivery ?? product.price)
                : Number(product.price);
        const totalPrice = (unitPrice + details.reduce((sum, d) => sum + d.extra_price, 0)) * quantity;

        if (!isOnline) {
            offlineQueueService.addToQueue('ADD_ITEM', { 
                orderId: orderId as string, 
                itemData: { product_id: product.id, quantity, price: unitPrice, notes, discount_amount: 0, total_price: totalPrice, details } 
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
                price: unitPrice,
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
        if (!canUpdateOrders) {
            message.warning("คุณไม่มีสิทธิ์แก้ไขออเดอร์");
            return;
        }
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
                            src={resolveImageSource(record.product.img_url) || undefined}
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
                            disabled={!canUpdateOrders || isUpdating}
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
                    <Tooltip title="แก้ไข">
                        <Button type="text" icon={<EditOutlined />} onClick={() => handleEditClick(record)} disabled={!canUpdateOrders || isUpdating} />
                    </Tooltip>
                    <Tooltip title="ลบ">
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteItem(record.id)} disabled={!canDeleteOrders || isUpdating} />
                    </Tooltip>
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
                            src={resolveImageSource(record.product.img_url) || undefined}
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
                        textDecoration: record.status === ItemStatus.Cancelled ? 'line-through' : 'none',
                        color: record.status === ItemStatus.Cancelled ? orderDetailColors.textLight : orderDetailColors.text
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
                    color: record.status === ItemStatus.Cancelled ? orderDetailColors.textLight : orderDetailColors.priceTotal, 
                    fontSize: 16,
                    textDecoration: record.status === ItemStatus.Cancelled ? 'line-through' : 'none'
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
                record.status === ItemStatus.Served ? (
                    <Button 
                        size="small" 
                        className="unserve-button"
                        style={orderDetailStyles.unserveButton}
                        icon={<CloseOutlined />}
                        onClick={() => handleUnserveItem(record.id)}
                        disabled={!canUpdateOrders || isUpdating}
                    >
                        {order.order_type === OrderType.DineIn ? 'ยกเลิกเสิร์ฟ' : 'ยกเลิกปรุงเสร็จ'}
                    </Button>
                ) : null
            )
        }
    ];



    return (
        <div className="order-detail-page" style={orderDetailStyles.container}>
            <style jsx global>{ordersResponsiveStyles}</style>
            
            <UIPageHeader
                title={order?.order_no ?? "รายละเอียดออเดอร์"}
                subtitle={
                    order ? (
                        <Space size={8} wrap>
                            <Tag
                                icon={
                                    order.order_type === OrderType.DineIn ? <ShopOutlined style={{ fontSize: 10 }} /> :
                                    order.order_type === OrderType.TakeAway ? <ShoppingOutlined style={{ fontSize: 10 }} /> :
                                    <RocketOutlined style={{ fontSize: 10 }} />
                                }
                                style={{
                                    ...orderDetailStyles.channelBadge,
                                    background: getOrderChannelColor(order.order_type) + "15",
                                    color: getOrderChannelColor(order.order_type),
                                }}
                            >
                                {getOrderChannelText(order.order_type)}
                            </Tag>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {dayjs(order.create_date).format("HH:mm | D MMM YY")}
                            </Text>
                            <Tag
                                color={getOrderStatusColor(order.status)}
                                style={{ margin: 0, borderRadius: 8, fontWeight: 600 }}
                            >
                                {getOrderStatusText(order.status, order.order_type)}
                            </Tag>
                            {order.order_type === OrderType.DineIn && order.table?.table_name && (
                                <Tag color="blue" style={{ margin: 0, borderRadius: 8, fontWeight: 600 }}>
                                    โต๊ะ: {order.table.table_name}
                                </Tag>
                            )}
                            {order.order_type === OrderType.Delivery && (order.delivery_code || order.delivery?.delivery_name) && (
                                <Tag color="purple" style={{ margin: 0, borderRadius: 8, fontWeight: 600 }}>
                                    {order.delivery_code ? `รหัส: ${order.delivery_code}` : order.delivery?.delivery_name}
                                </Tag>
                            )}
                            {currentQueueItem && (
                                <Tag
                                    color={
                                        currentQueueItem.status === QueueStatus.Pending ? "orange" :
                                        currentQueueItem.status === QueueStatus.Processing ? "blue" :
                                        currentQueueItem.status === QueueStatus.Completed ? "green" : "red"
                                    }
                                    style={{ margin: 0, borderRadius: 8, fontWeight: 600 }}
                                >
                                    คิว #{currentQueueItem.queue_position}
                                </Tag>
                            )}
                        </Space>
                    ) : undefined
                }
                onBack={() => {
                    if (order?.order_type === OrderType.DineIn) {
                        router.push("/pos/channels/dine-in");
                    } else {
                        router.back();
                    }
                }}
                icon={<UnorderedListOutlined style={{ fontSize: 20 }} />}
                actions={
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => orderId && fetchOrder(orderId as string)}
                        loading={isUpdating || isLoading}
                    >
                        รีเฟรช
                    </Button>
                }
            />
            
            {/* Queue Management Actions */}
            {order && order.status !== OrderStatus.Cancelled && order.status !== OrderStatus.Completed && (
                <div style={{ 
                    padding: '12px 16px', 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    gap: 8,
                    background: orderDetailColors.backgroundSecondary,
                    borderBottom: `1px solid ${orderDetailColors.border}`,
                }}>
                    {currentQueueItem ? (
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                                if (!canUpdateOrders) {
                                    message.warning("คุณไม่มีสิทธิ์แก้ไขออเดอร์");
                                    return;
                                }
                                removeFromQueue(currentQueueItem.id);
                            }}
                            loading={isQueueLoading}
                            disabled={!canUpdateOrders}
                            size="middle"
                            style={{ borderRadius: 10, height: 36, fontWeight: 500, fontSize: 13 }}
                            className="scale-hover queue-action-button"
                        >
                            ลบออกจากคิว
                        </Button>
                    ) : (
                        <Button
                            type="primary"
                            icon={<UnorderedListOutlined />}
                            onClick={() => {
                                if (!canUpdateOrders) {
                                    message.warning("คุณไม่มีสิทธิ์แก้ไขออเดอร์");
                                    return;
                                }
                                addToQueue({
                                    orderId: order.id,
                                    priority: QueuePriority.Normal
                                });
                            }}
                            loading={isQueueLoading}
                            disabled={!canUpdateOrders}
                            size="middle"
                            style={{ 
                                borderRadius: 10, 
                                height: 36, 
                                fontWeight: 500,
                                fontSize: 13,
                                background: `linear-gradient(135deg, ${orderDetailColors.primary} 0%, ${orderDetailColors.primaryDark} 100%)`,
                                border: 'none',
                                boxShadow: `0 2px 8px ${orderDetailColors.primary}25`,
                            }}
                            className="scale-hover queue-action-button"
                        >
                            เพิ่มเข้าคิว
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
                                <div className="card-header-wrapper">
                                    <div className="card-header-top-row">
                                        <div className="card-header-left">
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
                                            <Text strong style={orderDetailTypography.sectionTitle} className="section-title-text">
                                                กำลังทำอาหาร ({activeItems.length})
                                            </Text>
                                        </div>
                                        <div className="card-header-right">
                                            {/* Header Actions - แสดงเสมอ อยู่ฝั่งขวา */}
                                            <div className="header-actions-container">
                                                <Button 
                                                    icon={<ReloadOutlined />} 
                                                    onClick={() => fetchOrder(orderId as string)}
                                                    size="small"
                                                    style={orderDetailStyles.actionButtonSecondary}
                                                    className="header-action-btn"
                                                    title="รีเฟรช"
                                                />
                                                <Button 
                                                    type="primary" 
                                                    icon={<PlusOutlined />} 
                                                    onClick={() => {
                                                        if (!canUpdateOrders) {
                                                            message.warning("คุณไม่มีสิทธิ์แก้ไขออเดอร์");
                                                            return;
                                                        }
                                                        setIsAddModalOpen(true);
                                                    }}
                                                    disabled={!canUpdateOrders || isUpdating}
                                                    size="small"
                                                    style={orderDetailStyles.actionButtonPrimary}
                                                    className="header-action-btn"
                                                >
                                                    <span>เพิ่ม</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Bulk Actions - แสดงเมื่อเลือกหลายรายการ อยู่ฝั่งซ้าย ข้างล่าง Title */}
                                    {selectedRowKeys.length > 0 && (
                                        <div className="bulk-actions-container">
                                            <Button 
                                                danger 
                                                icon={<DeleteOutlined />} 
                                                onClick={handleCancelSelected}
                                                disabled={!canUpdateOrders || isUpdating}
                                                size="small"
                                                className="bulk-action-btn"
                                            >
                                                <span>ยกเลิก ({selectedRowKeys.length})</span>
                                            </Button>
                                            <Button 
                                                type="primary" 
                                                icon={<CheckOutlined />} 
                                                onClick={handleServeSelected} 
                                                loading={isUpdating}
                                                disabled={!canUpdateOrders || isUpdating}
                                                size="small"
                                                style={{ background: orderDetailColors.served, borderColor: orderDetailColors.served }}
                                                className="bulk-action-btn"
                                            >
                                                <span>{getServeActionText(order.order_type)} ({selectedRowKeys.length})</span>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            }
                        >
                            {activeItems.length > 0 ? (
                                <>
                                    {/* Desktop Table */}
                                    <div className="order-detail-table-desktop">
                                        <Table 
                                            dataSource={groupedActiveItems} 
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
                                        {groupedActiveItems.map((item) => (
                                            <div 
                                                key={item.id} 
                                                style={{...orderDetailStyles.itemCard, ...orderDetailStyles.itemCardActive}}
                                                className="order-item-card scale-in"
                                            >
                                                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                                                    {/* Product Image */}
                                                    <div style={{ flexShrink: 0 }}>
                                                        {item.product?.img_url ? (
                                                            <>
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img
                                                                    src={resolveImageSource(item.product.img_url) || undefined}
                                                                    alt={item.product?.display_name ?? "สินค้า"}
                                                                    style={{...orderDetailStyles.productThumb, width: 56, height: 56, borderRadius: 10}}
                                                                />
                                                            </>
                                                        ) : (
                                                            <div style={{...orderDetailStyles.productThumbPlaceholder, width: 56, height: 56, borderRadius: 10}}><ShopOutlined style={{ fontSize: 20 }} /></div>
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
                                                                    <Text strong style={{ fontSize: 17, lineHeight: 1.5 }}>{item.product?.display_name}</Text>
                                                                </Checkbox>
                                                                <div style={{ paddingLeft: 24, marginTop: 2 }}>
                                                                    {item.product?.category?.display_name && (
                                                                        <Tag color="cyan" style={{...orderDetailStyles.categoryTag, fontSize: 9}}>
                                                                            {item.product.category.display_name}
                                                                        </Tag>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <Text strong style={{ fontSize: 19, color: orderDetailColors.primary, marginLeft: 8, lineHeight: 1.4 }}>x{item.quantity}</Text>
                                                        </div>
                                                        <div style={{ paddingLeft: 24, marginTop: 2 }}>
                                                            {item.details && item.details.length > 0 && (
                                                                <div style={{ fontSize: 13, color: orderDetailColors.served, marginBottom: 4, lineHeight: 1.4 }}>
                                                                    {item.details.map((d: { detail_name: string; extra_price: number }) => `${d.detail_name} (+ ฿${Number(d.extra_price).toLocaleString()})`).join(', ')}
                                                                </div>
                                                            )}
                                                            <Space orientation="vertical" size={2}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <Text style={{...orderDetailStyles.priceTag, fontSize: 15}}>฿{Number(item.price).toLocaleString()}</Text>
                                                                    <Text strong style={{ color: orderDetailColors.priceTotal, fontSize: 16 }}>
                                                                        รวม ฿{Number(item.total_price).toLocaleString()}
                                                                    </Text>
                                                                </div>
                                                            </Space>
                                                            {item.notes && (
                                                                <div style={{ marginTop: 4 }}>
                                                                    <Text style={{ fontSize: 13, color: orderDetailColors.cancelled, lineHeight: 1.4 }}>
                                                                        <InfoCircleOutlined style={{ fontSize: 13 }} /> {item.notes}
                                                                    </Text>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${orderDetailColors.border}`, paddingTop: 10, gap: 6, marginTop: 10 }}>
                                                    <Button 
                                                        size="small" 
                                                        type="text" 
                                                        danger 
                                                        icon={<DeleteOutlined />} 
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        disabled={!canDeleteOrders || isUpdating}
                                                        style={{ height: 34, borderRadius: 8, fontSize: 13, padding: '0 12px', fontWeight: 500 }}
                                                        className="scale-hover"
                                                    >
                                                        ลบ
                                                    </Button>
                                                    <Button 
                                                        size="small" 
                                                        type="text" 
                                                        icon={<EditOutlined />} 
                                                        onClick={() => handleEditClick(item)}
                                                        disabled={!canUpdateOrders || isUpdating}
                                                        style={{ height: 34, borderRadius: 8, fontSize: 13, padding: '0 12px', fontWeight: 500 }}
                                                        className="scale-hover"
                                                    >
                                                        แก้ไข
                                                    </Button>
                                                    <Button 
                                                        size="small" 
                                                        type="primary" 
                                                        onClick={() => handleServeItem(item.id)}
                                                        disabled={!canUpdateOrders || isUpdating}
                                                        style={{ 
                                                            background: orderDetailColors.served, 
                                                            borderColor: orderDetailColors.served,
                                                            height: 34,
                                                            padding: '0 14px',
                                                            borderRadius: 8,
                                                            fontSize: 13,
                                                            fontWeight: 600,
                                                        }}
                                                        className="scale-hover"
                                                    >
                                                        <CheckOutlined style={{ fontSize: 13, marginRight: 4 }} />
                                                        {getServeActionText(order.order_type)}
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
                                            dataSource={groupedServedItems} 
                                            columns={desktopServedColumns} 
                                            rowKey="id" 
                                            virtual={shouldVirtualizeServed}
                                            scroll={shouldVirtualizeServed ? { y: 360 } : undefined}
                                            pagination={false} 
                                            size="small"
                                            className="order-items-table"
                                            rowClassName={(record) => record.status === ItemStatus.Cancelled ? 'row-cancelled' : ''}
                                        />
                                    </div>

                                    {/* Mobile Cards for Served items */}
                                    <div className="order-detail-cards-mobile">
                                        {groupedServedItems.map((item) => (
                                            <div 
                                                key={item.id} 
                                                style={{
                                                    ...orderDetailStyles.itemCard, 
                                                    ...orderDetailStyles.itemCardServed, 
                                                    backgroundColor: item.status === ItemStatus.Cancelled ? orderDetailColors.cancelledLight : orderDetailColors.white,
                                                    borderColor: item.status === ItemStatus.Cancelled ? orderDetailColors.cancelled + '30' : orderDetailColors.border,
                                                    position: 'relative'
                                                }}
                                            >
                                                {/* Status Tag in Top Right */}
                                                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                                                    <Tag color={getOrderStatusColor(item.status)} style={{ margin: 0, fontSize: 10, padding: '2px 8px', borderRadius: 6, lineHeight: 1.2 }}>
                                                        {getOrderStatusText(item.status, order.order_type)}
                                                    </Tag>
                                                </div>

                                                <div style={{ display: 'flex', gap: 10 }}>
                                                    {/* Product Image */}
                                                    <div style={{ flexShrink: 0 }}>
                                                        {item.product?.img_url ? (
                                                            <>
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img
                                                                    src={resolveImageSource(item.product.img_url) || undefined}
                                                                    alt={item.product?.display_name ?? "สินค้า"}
                                                                    style={{...orderDetailStyles.productThumb, width: 52, height: 52, borderRadius: 10, opacity: 0.7}}
                                                                />
                                                            </>
                                                        ) : (
                                                            <div style={{...orderDetailStyles.productThumbPlaceholder, width: 52, height: 52, borderRadius: 10}}><ShopOutlined style={{ fontSize: 18 }} /></div>
                                                        )}
                                                    </div>

                                                    <div style={{ flex: 1, minWidth: 0, paddingRight: 50 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <Text strong style={{ 
                                                                    fontSize: 16, 
                                                                    textDecoration: item.status === ItemStatus.Cancelled ? 'line-through' : 'none',
                                                                    color: item.status === ItemStatus.Cancelled ? orderDetailColors.textLight : orderDetailColors.text,
                                                                    lineHeight: 1.5
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
                                                                    <div style={{ fontSize: 13, color: orderDetailColors.served, opacity: 0.7, marginBottom: 4, lineHeight: 1.4 }}>
                                                                        {item.details.map((d: { detail_name: string; extra_price: number }) => `${d.detail_name} (+ ฿${Number(d.extra_price).toLocaleString()})`).join(', ')}
                                                                    </div>
                                                                )}
                                                                <Space orientation="vertical" size={2} style={{ marginTop: 4, width: '100%' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <div>
                                                                            <Text style={{...orderDetailStyles.priceTag, fontSize: 14, opacity: 0.7}}>฿{Number(item.price).toLocaleString()}</Text>
                                                                            <Text strong style={{ marginLeft: 8, color: orderDetailColors.textSecondary, opacity: 0.7, fontSize: 15 }}>
                                                                                รวม ฿{Number(item.total_price).toLocaleString()}
                                                                            </Text>
                                                                        </div>
                                                                        <Text strong style={{ color: orderDetailColors.textSecondary, fontSize: 15 }}>x{item.quantity}</Text>
                                                                    </div>
                                                                </Space>
                                                                {item.notes && (
                                                                    <div style={{ marginTop: 4 }}>
                                                                        <Text style={{ fontSize: 13, opacity: 0.7, color: orderDetailColors.cancelled, lineHeight: 1.4 }}>
                                                                            <InfoCircleOutlined style={{ fontSize: 13 }} /> {item.notes}
                                                                        </Text>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {item.status === ItemStatus.Served && (
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, paddingTop: 10, borderTop: `1px solid ${orderDetailColors.border}` }}>
                                                        <Button 
                                                            size="small" 
                                                            className="unserve-button"
                                                            style={{...orderDetailStyles.unserveButton, height: 34, fontSize: 13, padding: '0 14px', borderRadius: 8, fontWeight: 500}}
                                                            icon={<CloseOutlined style={{ fontSize: 13 }} />}
                                                            onClick={() => handleUnserveItem(item.id)}
                                                            disabled={!canUpdateOrders || isUpdating}
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
                        <Card className="order-detail-card summary-card" style={orderDetailStyles.summaryCard}>
                            <Title level={5} style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>สรุปการสั่งซื้อ</Title>
                            
                            {/* Detailed Item List */}
                            <div style={{ ...orderDetailStyles.summaryList, background: 'white' }}>
                                <Text strong style={{ fontSize: 15, marginBottom: 10, display: 'block', color: orderDetailColors.textSecondary }}>
                                    รายการสินค้า
                                </Text>
                                {groupedNonCancelledItems.map((item, index: number) => (
                                    <div key={item.id || index} style={orderDetailStyles.summaryItemRow}>
                                        {/* Product Image */}
                                        {item.product?.img_url ? (
                                            <>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img 
                                                    src={resolveImageSource(item.product.img_url) || undefined} 
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
                                                <Text strong style={{ fontSize: 15, flex: 1, lineHeight: 1.4 }}>{item.product?.display_name}</Text>
                                                <Text strong style={{ fontSize: 15, color: orderDetailColors.primary, lineHeight: 1.4 }}>฿{Number(item.total_price).toLocaleString()}</Text>
                                            </div>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                                <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.4 }}>จำนวน : {item.quantity}</Text>
                                                <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.4 }}>ราคา : {Number(item.price).toLocaleString()}</Text>
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
                                <Text strong style={{ fontSize: 15, marginBottom: 10, display: 'block', color: orderDetailColors.textSecondary }}>
                                    แยกตามหมวดหมู่
                                </Text>
                                {Object.entries(groupItemsByCategory(order?.items || []) as Record<string, number>).map(([cat, qty]) => (
                                    <div key={cat} style={orderDetailStyles.summaryRow}>
                                        <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.4 }}>{cat}</Text>
                                        <Text strong style={{ fontSize: 14, lineHeight: 1.4 }}>{String(qty)} รายการ</Text>
                                    </div>
                                ))}
                                <Divider style={{ margin: '10px 0' }} />
                                <div style={orderDetailStyles.summaryRow}>
                                    <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.4 }}>จำนวนรายการทั้งหมด</Text>
                                    <Text strong style={{ fontSize: 14, lineHeight: 1.4 }}>{nonCancelledItems.length} รายการ</Text>
                                </div>
                            </div>

                            {/* Total Only */}
                            <div style={{ padding: '0 4px' }}>
                                <div style={orderDetailStyles.summaryMainRow}>
                                    <Text strong style={{ fontSize: 20, lineHeight: 1.3 }}>ยอดรวมทั้งสิ้น</Text>
                                    <Text strong style={{ fontSize: 28, color: orderDetailColors.primary, lineHeight: 1.2 }}>
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
                                    disabled={!canUpdateOrders || isUpdating}
                                    style={{ 
                                        marginTop: 16, 
                                        height: 48, 
                                        borderRadius: 10, 
                                        fontWeight: 600, 
                                        fontSize: 16,
                                        background: `linear-gradient(135deg, ${orderDetailColors.served} 0%, #059669 100%)`,
                                        border: 'none',
                                        boxShadow: `0 4px 12px ${orderDetailColors.served}25`,
                                    }}
                                    className="scale-hover"
                                >
                                    {getConfirmServeActionText(order.order_type)}
                                </Button>
                            )}
                            
                            <Button 
                                danger
                                block 
                                size="large" 
                                onClick={handleCancelOrder}
                                style={{ 
                                    marginTop: 12, 
                                    height: 44, 
                                    borderRadius: 10, 
                                    fontWeight: 500, 
                                    fontSize: 15,
                                    border: `1px solid ${orderDetailColors.danger}`,
                                }}
                                disabled={!canDeleteOrders || isUpdating}
                                className="scale-hover"
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
                orderType={order?.order_type}
            />
            
            {editModalOpen && itemToEdit && (
                <EditItemModal
                    key={`edit-modal-${itemToEdit.id}`}
                    item={itemToEdit}
                    isOpen={editModalOpen}
                    onClose={() => {
                        setEditModalOpen(false);
                        setItemToEdit(null);
                    }}
                    onSave={handleSaveEdit}
                />
            )}

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
