"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Typography, Row, Col, Card, Tag, Button, Spin, Empty, Divider, Table, Checkbox, message, Modal, Tooltip, Space } from "antd";
import { 
    ArrowLeftOutlined, 
    ClockCircleOutlined, 
    ShopOutlined, 
    CheckCircleOutlined, 
    PlusOutlined, 
    DeleteOutlined, 
    EditOutlined, 
    CheckOutlined,
    CloseOutlined,
    InfoCircleOutlined,
    ReloadOutlined
} from "@ant-design/icons";
import { ordersService } from "@/services/pos/orders.service";
import { authService } from "@/services/auth.service";
import { SalesOrder, OrderStatus, OrderType } from "@/types/api/pos/salesOrder";
import { SalesOrderItem } from "@/types/api/pos/salesOrderItem";
import { orderDetailStyles, orderDetailColors, orderDetailResponsiveStyles, orderDetailTypography } from "./style"; 
import {
  calculateOrderTotal,
  getNonCancelledItems,
  calculateItemExtras
} from "@/utils/orders"; 
import dayjs from "dayjs";
import 'dayjs/locale/th';

import { AddItemsModal } from "./AddItemsModal";
import { EditItemModal } from "./EditItemModal";
import { Products } from "@/types/api/pos/products";
import { useNetwork } from "@/hooks/useNetwork";
import { offlineQueueService } from "@/services/pos/offline.queue.service";

const { Title, Text } = Typography;
dayjs.locale('th');

export default function POSOrderDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = Array.isArray(params?.ordersId) ? params.ordersId[0] : params?.ordersId;

    const [order, setOrder] = useState<SalesOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const isOnline = useNetwork();
    
    // Selection State
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    // Edit Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<SalesOrderItem | null>(null);

    const [isServeAllLoading, setIsServeAllLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    useEffect(() => {
        if (orderId) {
            fetchOrder(orderId);
        }
    }, [orderId]);

    const fetchOrder = async (id: string) => {
        try {
            setIsLoading(true);
            const data = await ordersService.getById(id);
            if ([OrderStatus.Paid, OrderStatus.Cancelled, OrderStatus.WaitingForPayment].includes(data.status)) {
                message.warning("ออเดอร์นี้ไม่อยู่ในสถานะที่ดำเนินการได้");
                router.push('/pos/orders');
                return;
            }
            setOrder(data);
        } catch (error) {
            console.error("Failed to fetch order:", error);
            message.error("ไม่สามารถโหลดข้อมูลออเดอร์ได้");
        } finally {
            setIsLoading(false);
        }
    };

    const handleServeItem = async (itemId: string) => {
        try {
            setIsUpdating(true);
            const csrfToken = await authService.getCsrfToken();
            await ordersService.updateItemStatus(itemId, OrderStatus.Served, undefined, csrfToken);
            message.success("เสิร์ฟรายการเรียบร้อย");
            fetchOrder(orderId as string);
        } catch (error) {
            message.error("เกิดข้อผิดพลาดในการเสิร์ฟ");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleServeSelected = async () => {
        if (selectedRowKeys.length === 0) return;
        try {
            setIsUpdating(true);
            const csrfToken = await authService.getCsrfToken();
            await Promise.all(selectedRowKeys.map(key => 
                ordersService.updateItemStatus(key.toString(), OrderStatus.Served, undefined, csrfToken)
            ));
            message.success("เสิร์ฟรายการที่เลือกเรียบร้อย");
            setSelectedRowKeys([]);
            fetchOrder(orderId as string);
        } catch (error) {
            message.error("เกิดข้อผิดพลาดในการเสิร์ฟ");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancelSelected = async () => {
        if (selectedRowKeys.length === 0) return;
        Modal.confirm({
            title: 'ยืนยันการยกเลิก',
            content: `คุณต้องการยกเลิก ${selectedRowKeys.length} รายการที่เลือกใช่หรือไม่?`,
            okText: 'ยืนยันยกเลิก',
            okType: 'danger',
            cancelText: 'ไม่ยกเลิก',
            onOk: async () => {
                try {
                    setIsUpdating(true);
                    const csrfToken = await authService.getCsrfToken();
                    await Promise.all(selectedRowKeys.map(key => 
                        ordersService.updateItemStatus(key.toString(), OrderStatus.Cancelled, undefined, csrfToken)
                    ));
                    message.success("ยกเลิกรายการที่เลือกเรียบร้อย");
                    setSelectedRowKeys([]);
                    fetchOrder(orderId as string);
                } catch (error) {
                    message.error("เกิดข้อผิดพลาดในการยกเลิก");
                } finally {
                    setIsUpdating(false);
                }
            }
        });
    };

    const handleUnserveItem = async (itemId: string) => {
        try {
            setIsUpdating(true);
            const csrfToken = await authService.getCsrfToken();
            await ordersService.updateItemStatus(itemId, OrderStatus.Cooking, undefined, csrfToken);
            message.success("ยกเลิกการเสิร์ฟ (กลับไปปรุง)");
            fetchOrder(orderId as string);
        } catch (error) {
            message.error("เกิดข้อผิดพลาด");
        } finally {
            setIsUpdating(false);
        }
    };


    const handleDeleteItem = async (itemId: string) => {
        Modal.confirm({
            title: 'ยืนยันการลบ',
            content: 'คุณต้องการลบรายการสินค้านี้ใช่หรือไม่?',
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                try {
                    const csrfToken = await authService.getCsrfToken();
                    await ordersService.deleteItem(itemId, undefined, csrfToken);
                    message.success("ลบรายการเรียบร้อย");
                    fetchOrder(orderId as string);
                } catch (error) {
                    message.error("ไม่สามารถลบรายการได้");
                }
            }
        });
    };

    const handleSaveEdit = async (itemId: string, quantity: number, notes: string) => {
        try {
            setIsUpdating(true);
            const csrfToken = await authService.getCsrfToken();
            await ordersService.updateItem(itemId, { quantity, notes }, undefined, csrfToken);
            message.success("แก้ไขรายการเรียบร้อย");
            fetchOrder(orderId as string);
        } catch (error) {
            message.error("ไม่สามารถแก้ไขรายการได้");
            throw error;
        } finally {
            setIsUpdating(false);
        }
    };

    const handleEditClick = (record: SalesOrderItem) => {
        setItemToEdit(record);
        setEditModalOpen(true);
    };

    const handleAddItem = async (product: Products, quantity: number, notes: string, details: { detail_name: string; extra_price: number }[] = []) => {
        const tempId = `temp-${Date.now()}`;
        const totalPrice = (Number(product.price) + details.reduce((sum, d) => sum + d.extra_price, 0)) * quantity;
        const tempItem: SalesOrderItem = {
            id: tempId,
            order_id: orderId as string,
            product_id: product.id,
            product: product,
            quantity: quantity,
            price: Number(product.price),
            total_price: totalPrice,
            discount_amount: 0,
            notes: notes,
            status: OrderStatus.Cooking,
            details: details as any 
        };

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
            const csrfToken = await authService.getCsrfToken();
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
        }
    };

    const handleConfirmServe = async () => {
        Modal.confirm({
            title: 'ยืนยันการเสิร์ฟทั้งหมด',
            content: 'รายการทั้งหมดเสร็จสิ้นแล้ว ต้องการเข้าสู่ขั้นตอนการชำระเงินหรือไม่?',
            okText: 'ยืนยัน',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                try {
                    const csrfToken = await authService.getCsrfToken();
                    await ordersService.updateStatus(orderId as string, OrderStatus.WaitingForPayment, csrfToken);
                    message.success("ยืนยันออเดอร์เรียบร้อย");
                    router.push('/pos/items');
                } catch (error) {
                    message.error("เกิดข้อผิดพลาดในการยืนยัน");
                }
            }
        });
    }

    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case OrderStatus.Pending: return orderDetailColors.pending;
            case OrderStatus.Cooking: return orderDetailColors.primary;
            case OrderStatus.Served: return orderDetailColors.success;
            case OrderStatus.Cancelled: return orderDetailColors.danger;
            default: return orderDetailColors.textSecondary;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case OrderStatus.Pending: return "รอรับออเดอร์";
            case OrderStatus.Cooking: return "กำลังปรุง";
            case OrderStatus.Served: return "เสิร์ฟแล้ว";
            case OrderStatus.WaitingForPayment: return "รอชำระเงิน";
            case OrderStatus.Paid: return "ชำระเงินแล้ว";
            case OrderStatus.Cancelled: return "ยกเลิก";
            default: return status;
        }
    };

    const desktopColumns = [
        {
            title: '',
            key: 'image',
            width: 70,
            align: 'center' as const,
            render: (_: any, record: SalesOrderItem) => (
                record.product?.img_url ? (
                    <img src={record.product.img_url} alt="" style={orderDetailStyles.productThumb} />
                ) : (
                    <div style={orderDetailStyles.productThumbPlaceholder}><ShopOutlined /></div>
                )
            )
        },
        {
            title: 'รายการ',
            key: 'product',
            align: 'center' as const,
            render: (_: any, record: SalesOrderItem) => (
                <Space direction="vertical" size={2} align="center">
                    <Text strong style={{ fontSize: 15, lineHeight: '1.2' }}>{record.product?.display_name}</Text>
                    {record.details && record.details.length > 0 && (
                        <div style={{ fontSize: 13, color: orderDetailColors.success }}>
                            {record.details.map(d => `+ ${d.detail_name}`).join(', ')}
                        </div>
                    )}
                    {record.notes && <Text style={{ fontSize: 13, color: orderDetailColors.danger }}><InfoCircleOutlined /> {record.notes}</Text>}
                </Space>
            )
        },
        {
            title: 'หมวดหมู่',
            key: 'category',
            width: 120,
            align: 'center' as const,
            render: (_: any, record: SalesOrderItem) => (
                <Space direction="vertical" size={0} align="center">
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
            render: (_: any, record: SalesOrderItem) => {
                const extrasPrice = calculateItemExtras(record.details);
                return (
                    <Space direction="vertical" size={0} align="center">
                        <Text style={{ ...orderDetailStyles.priceTag, fontSize: 18 }}>฿{Number(record.price).toLocaleString()}</Text>
                        {extrasPrice > 0 && (
                            <Text style={{ fontSize: 13, color: orderDetailColors.priceTotal }}>
                                + ฿{extrasPrice.toLocaleString()}
                            </Text>
                        )}
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
                    {getStatusText(status)}
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
            render: (_: any, record: SalesOrderItem) => (
                <Space>
                    <Tooltip title="เสิร์ฟ"><Button type="primary" ghost icon={<CheckOutlined />} onClick={() => handleServeItem(record.id)} /></Tooltip>
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
            render: (_: any, record: SalesOrderItem) => (
                record.product?.img_url ? (
                    <img src={record.product.img_url} alt="" style={{...orderDetailStyles.productThumb, opacity: 0.7}} />
                ) : (
                    <div style={orderDetailStyles.productThumbPlaceholder}><ShopOutlined /></div>
                )
            )
        },
        {
            title: 'รายการ',
            key: 'product',
            align: 'center' as const,
            render: (_: any, record: SalesOrderItem) => (
                <Space direction="vertical" size={2} align="center">
                    <Text strong style={{ 
                        fontSize: 15, 
                        lineHeight: '1.2',
                        textDecoration: record.status === OrderStatus.Cancelled ? 'line-through' : 'none',
                        color: record.status === OrderStatus.Cancelled ? orderDetailColors.textLight : orderDetailColors.text
                    }}>
                        {record.product?.display_name}
                    </Text>
                    {record.details && record.details.length > 0 && (
                        <div style={{ fontSize: 12, color: orderDetailColors.success, opacity: 0.7 }}>
                            {record.details.map(d => `+ ${d.detail_name}`).join(', ')}
                        </div>
                    )}
                    {record.notes && <Text style={{ fontSize: 12, opacity: 0.7, color: orderDetailColors.danger }}><InfoCircleOutlined /> {record.notes}</Text>}
                </Space>
            )
        },
        {
            title: 'หมวดหมู่',
            key: 'category',
            width: 120,
            align: 'center' as const,
            render: (_: any, record: SalesOrderItem) => (
                <Space direction="vertical" size={0} align="center">
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
            render: (_: any, record: SalesOrderItem) => {
                const extrasPrice = calculateItemExtras(record.details);
                return (
                    <Space direction="vertical" size={0} align="center">
                        <Text style={{...orderDetailStyles.priceTag, opacity: 0.7}}>฿{Number(record.price).toLocaleString()}</Text>
                        {extrasPrice > 0 && (
                            <Text style={{ fontSize: 11, opacity: 0.7, color: orderDetailColors.priceTotal }}>
                                + ฿{extrasPrice.toLocaleString()}
                            </Text>
                        )}
                    </Space>
                );
            }
        },
        {
            title: 'ราคารวม',
            key: 'total',
            width: 120,
            align: 'center' as const,
            render: (_: any, record: SalesOrderItem) => (
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
                <Tag color={getStatusColor(status)}>
                    {getStatusText(status)}
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
            render: (_: any, record: SalesOrderItem) => (
                record.status === OrderStatus.Served ? (
                    <Button 
                        size="small" 
                        className="unserve-button"
                        style={orderDetailStyles.unserveButton}
                        icon={<CloseOutlined />}
                        onClick={() => handleUnserveItem(record.id)}
                    >
                        ยกเลิกเสิร์ฟ
                    </Button>
                ) : null
            )
        }
    ];

    const activeItems = order?.items?.filter(i => i.status === OrderStatus.Pending || i.status === OrderStatus.Cooking) || [];
    const servedItems = (order?.items?.filter(i => 
        i.status === OrderStatus.Served || 
        i.status === OrderStatus.Cancelled || 
        i.status === OrderStatus.WaitingForPayment
    ) || []).sort((a, b) => {
        if (a.status === OrderStatus.Cancelled && b.status !== OrderStatus.Cancelled) return 1;
        if (a.status !== OrderStatus.Cancelled && b.status === OrderStatus.Cancelled) return -1;
        return 0;
    });

    const nonCancelledItems = getNonCancelledItems(order?.items);
    const calculatedTotal = calculateOrderTotal(order?.items);
    const isOrderComplete = activeItems.length === 0 && (order?.items?.length || 0) > 0;

    if (isLoading) return <div style={orderDetailStyles.loadingState}><Spin size="large" tip="กำลังโหลด..." /></div>;
    if (!order) return <Empty description="ไม่พบข้อมูล" />;

    return (
        <div className="order-detail-page" style={orderDetailStyles.container}>
            <style jsx global>{orderDetailResponsiveStyles}</style>
            
            {/* Sticky Compact Header */}
            <header className="order-detail-header" style={orderDetailStyles.header}>
                <div style={orderDetailStyles.headerContent}>
                    <Button 
                        type="text" 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => router.back()}
                        style={{ height: 40, width: 40, borderRadius: '50%' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Title level={4} style={{ margin: 0, fontSize: 18, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {order.order_no}
                            </Title>
                            {order.order_type === OrderType.DineIn && order.table && (
                                <Tag style={orderDetailStyles.tableNameBadge}>
                                    โต๊ะ {order.table.table_name}
                                </Tag>
                            )}
                        </div>
                        <Text type="secondary" style={{ fontSize: 14 }}>
                            {dayjs(order.create_date).format('HH:mm | D MMM YY')}
                        </Text>
                    </div>
                    <Tag 
                        color={getStatusColor(order.status)} 
                        className="status-badge"
                        style={{ margin: 0, fontSize: 12 }}
                    >
                        {getStatusText(order.status)}
                    </Tag>
                </div>
            </header>

            <main className="order-detail-content" style={orderDetailStyles.contentWrapper}>
                <Row gutter={[20, 20]}>
                    <Col xs={24} lg={16}>
                        {/* Active Items Section */}
                        <Card 
                            className="order-detail-card fade-in"
                            style={orderDetailStyles.card}
                            title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong style={orderDetailTypography.sectionTitle}>
                                        กำลังรอ ({activeItems.length})
                                    </Text>
                                    <Space wrap>
                                        {selectedRowKeys.length > 0 && (
                                            <Space className="hide-on-mobile" style={{ gap: 8 }}>
                                                <Button 
                                                    danger 
                                                    icon={<DeleteOutlined />} 
                                                    onClick={handleCancelSelected}
                                                    style={orderDetailStyles.bulkActionButtonDesktop}
                                                >
                                                    ยกเลิก ({selectedRowKeys.length})
                                                </Button>
                                                <Button 
                                                    type="primary" 
                                                    icon={<CheckOutlined />} 
                                                    onClick={handleServeSelected} 
                                                    loading={isUpdating}
                                                    style={{ ...orderDetailStyles.bulkActionButtonDesktop, background: orderDetailColors.success, borderColor: orderDetailColors.success }}
                                                >
                                                    เสิร์ฟ ({selectedRowKeys.length})
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
                                            pagination={false} 
                                            size="middle"
                                            className="order-items-table"
                                            rowSelection={{
                                                selectedRowKeys,
                                                onChange: onSelectChange,
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
                                                            <img src={item.product.img_url} alt="" style={{...orderDetailStyles.productThumb, width: 60, height: 60}} />
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
                                                                <div style={{ fontSize: 12, color: orderDetailColors.success, marginBottom: 4 }}>
                                                                    {item.details.map(d => `+ ${d.detail_name}`).join(', ')}
                                                                </div>
                                                            )}
                                                            <Space direction="vertical" size={2}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <Text style={orderDetailStyles.priceTag}>฿{Number(item.price).toLocaleString()}</Text>
                                                                    <Text strong style={{ color: orderDetailColors.priceTotal }}>
                                                                        รวม ฿{Number(item.total_price).toLocaleString()}
                                                                    </Text>
                                                                </div>
                                                                {calculateItemExtras(item.details) > 0 && (
                                                                    <Text style={{ fontSize: 11, paddingLeft: 4, color: orderDetailColors.priceTotal }}>
                                                                        + ฿{calculateItemExtras(item.details).toLocaleString()} (เพิ่มเติม)
                                                                    </Text>
                                                                )}
                                                            </Space>
                                                            {item.notes && (
                                                                <div style={{ marginTop: 4 }}>
                                                                    <Text style={{ fontSize: 12, color: orderDetailColors.danger }}>
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
                                                    <Button size="small" type="primary" ghost icon={<CheckOutlined />} onClick={() => handleServeItem(item.id)}>เสิร์ฟ</Button>
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
                                    ดำเนินการแล้ว ({servedItems.length})
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
                                                    backgroundColor: item.status === OrderStatus.Cancelled ? '#fff1f0' : undefined,
                                                    borderColor: item.status === OrderStatus.Cancelled ? '#ffa39e' : undefined
                                                }}
                                            >
                                                <div style={{ display: 'flex', gap: 12 }}>
                                                    {/* Product Image */}
                                                    <div style={{ flexShrink: 0 }}>
                                                        {item.product?.img_url ? (
                                                            <img src={item.product.img_url} alt="" style={{...orderDetailStyles.productThumb, width: 50, height: 50, opacity: 0.7}} />
                                                        ) : (
                                                            <div style={{...orderDetailStyles.productThumbPlaceholder, width: 50, height: 50}}><ShopOutlined /></div>
                                                        )}
                                                    </div>

                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <div>
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
                                                                    <Tag color={getStatusColor(item.status)} style={{ marginLeft: 4 }}>
                                                                        {getStatusText(item.status)}
                                                                    </Tag>
                                                                </div>
                                                                {item.details && item.details.length > 0 && (
                                                                    <div style={{ fontSize: 12, color: orderDetailColors.success, opacity: 0.7, marginBottom: 4 }}>
                                                                        {item.details.map(d => `+ ${d.detail_name}`).join(', ')}
                                                                    </div>
                                                                )}
                                                                <Space direction="vertical" size={2} style={{ marginTop: 4 }}>
                                                                    <div>
                                                                        <Text style={{...orderDetailStyles.priceTag, opacity: 0.7}}>฿{Number(item.price).toLocaleString()}</Text>
                                                                        <Text strong style={{ marginLeft: 8, color: orderDetailColors.textSecondary, opacity: 0.7 }}>
                                                                            รวม ฿{Number(item.total_price).toLocaleString()}
                                                                        </Text>
                                                                    </div>
                                                                    {calculateItemExtras(item.details) > 0 && (
                                                                        <Text style={{ fontSize: 11, opacity: 0.7, paddingLeft: 4, color: orderDetailColors.priceTotal }}>
                                                                            + ฿{calculateItemExtras(item.details).toLocaleString()} (เพิ่มเติม)
                                                                        </Text>
                                                                    )}
                                                                </Space>
                                                                {item.notes && (
                                                                    <div style={{ marginTop: 4 }}>
                                                                        <Text style={{ fontSize: 12, opacity: 0.7, color: orderDetailColors.danger }}>
                                                                            <InfoCircleOutlined /> {item.notes}
                                                                        </Text>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <Text strong style={{ color: orderDetailColors.textSecondary }}>x{item.quantity}</Text>
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
                                                                    ยกเลิกเสิร์ฟ
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
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
                            <div style={orderDetailStyles.summaryRow}>
                                <Text type="secondary">จำนวนรายการ</Text>
                                <Text strong>{nonCancelledItems.length} รายการ</Text>
                            </div>
                            <Divider style={{ margin: '8px 0' }} />
                            <div style={orderDetailStyles.summaryRow}>
                                <Text strong style={{ fontSize: 16 }}>ยอดรวมทั้งสิ้น</Text>
                                <Text strong style={{ fontSize: 22, color: orderDetailColors.primary }}>
                                    ฿{calculatedTotal.toLocaleString()}
                                </Text>
                            </div>
                            
                            {isOrderComplete && (
                                <Button 
                                    type="primary" 
                                    block 
                                    size="large" 
                                    onClick={handleConfirmServe}
                                    style={{ marginTop: 24, height: 52, borderRadius: 14, fontWeight: 700, fontSize: 16 }}
                                >
                                    ยืนยันการเสิร์ฟพร้อมชำระเงิน
                                </Button>
                            )}
                        </Card>
                    </Col>
                </Row>
            </main>

            {/* Floating Action Bar (Mobile Only) */}
            {selectedRowKeys.length > 0 && (
                <div className="floating-action-bar fade-in" style={orderDetailStyles.floatingActions}>
                    <Button 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={handleCancelSelected}
                        style={orderDetailStyles.floatingActionButton}
                    >
                        ยกเลิก ({selectedRowKeys.length})
                    </Button>
                    <Button 
                        type="primary" 
                        icon={<CheckOutlined />} 
                        onClick={handleServeSelected}
                        loading={isUpdating}
                        style={{ ...orderDetailStyles.floatingActionButton, background: orderDetailColors.success, borderColor: orderDetailColors.success }}
                    >
                        เสิร์ฟ ({selectedRowKeys.length})
                    </Button>
                </div>
            )}
            
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
        </div>
    );
}
