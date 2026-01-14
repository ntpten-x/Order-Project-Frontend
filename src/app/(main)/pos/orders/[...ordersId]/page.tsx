"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Typography, Row, Col, Card, Tag, Button, Spin, Empty, Divider, Table, Checkbox, message, Modal, InputNumber, Input, Form } from "antd";
import { ArrowLeftOutlined, ClockCircleOutlined, ShopOutlined, RocketOutlined, ShoppingOutlined, UserOutlined, FileTextOutlined, CheckOutlined, FilterOutlined, PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined, CloseOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { ordersService } from "../../../../../services/pos/orders.service";
import { authService } from "../../../../../services/auth.service";
import { Orders, OrderStatus } from "../../../../../types/api/pos/orders";
import { OrdersItem } from "../../../../../types/api/pos/ordersItem";
import { pageStyles, colors } from "../../style"; 
import dayjs from "dayjs";
import 'dayjs/locale/th';

import { AddItemsModal } from "./AddItemsModal";
import { Products } from "../../../../../types/api/pos/products";

const { Title, Text } = Typography;
const { TextArea } = Input;
dayjs.locale('th');

export default function POSOrderDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = Array.isArray(params?.ordersId) ? params.ordersId[0] : params?.ordersId;

    const [order, setOrder] = useState<Orders | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Selection State
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    // Edit States
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editForm] = Form.useForm();

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

    const handleServeAllActive = async () => {
        const activeItems = order?.items?.filter(i => i.status === OrderStatus.Pending || i.status === OrderStatus.Cooking) || [];
        if (activeItems.length === 0) return;

        try {
            setIsServeAllLoading(true);
            const csrfToken = await authService.getCsrfToken();
            await Promise.all(activeItems.map(item => 
                ordersService.updateItemStatus(item.id, OrderStatus.Served, undefined, csrfToken)
            ));
            message.success("เสิร์ฟทั้งหมดเรียบร้อย");
            fetchOrder(orderId as string);
        } catch (error) {
            message.error("เกิดข้อผิดพลาด");
        } finally {
            setIsServeAllLoading(false);
        }
    }

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

    const handleSaveEdit = async (itemId: string) => {
        try {
            const values = await editForm.validateFields();
            const csrfToken = await authService.getCsrfToken();
            await ordersService.updateItem(itemId, values, undefined, csrfToken);
            message.success("แก้ไขรายการเรียบร้อย");
            setEditingItemId(null);
            fetchOrder(orderId as string);
        } catch (error) {
            message.error("ไม่สามารถแก้ไขรายการได้");
        }
    };

    const handleEditClick = (record: OrdersItem) => {
        setEditingItemId(record.id);
        editForm.setFieldsValue({
            quantity: record.quantity,
            notes: record.notes
        });
    };

    const handleAddItem = async (product: Products, quantity: number, notes: string) => {
        try {
            const csrfToken = await authService.getCsrfToken();
            const itemData = {
                product_id: product.id,
                quantity: quantity,
                price: product.price,
                notes: notes,
                discount_amount: 0 // Optional logic
            };
            await ordersService.addItem(orderId as string, itemData, undefined, csrfToken);
            fetchOrder(orderId as string);
        } catch (error) {
            message.error("เพิ่มสินค้าไม่สำเร็จ");
            throw error;
        }
    };

    const handleConfirmServe = async () => {
        Modal.confirm({
            title: 'ยืนยันการเสิร์ฟทั้งหมด',
            content: 'รายการทั้งหมดดำเนินการเสร็จสิ้นแล้ว ต้องการยืนยันเพื่อเข้าสู่กระบวนการชำระเงินหรือไม่?',
            okText: 'ยืนยัน (รอชำระเงิน)',
            cancelText: 'ยกเลิก',
            onOk: async () => {
                try {
                    const csrfToken = await authService.getCsrfToken();
                    // Manual Status Update
                    await ordersService.updateStatus(orderId as string, OrderStatus.WaitingForPayment, csrfToken);
                    
                    message.success("ยืนยันออเดอร์เรียบร้อย");
                    router.push('/pos/items');
                } catch (error) {
                    console.error(error);
                    message.error("เกิดข้อผิดพลาดในการยืนยัน");
                }
            }
        });
    }

    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
        getCheckboxProps: (record: OrdersItem) => ({
            name: record.id,
        }),
    };


    // Split Items
    const activeItems = order?.items?.filter(i => i.status === OrderStatus.Pending || i.status === OrderStatus.Cooking) || [];
    const servedItems = order?.items?.filter(i => i.status === OrderStatus.Served || i.status === OrderStatus.Cancelled || i.status === OrderStatus.WaitingForPayment) || [];

    const isOrderComplete = activeItems.length === 0 && (order?.items?.length || 0) > 0;

    const getStatusColor = (status: string) => {
        switch (status) {
            case OrderStatus.Pending: return "orange";
            case OrderStatus.Cooking: return "blue";
            case OrderStatus.Served: return "green";
            case OrderStatus.WaitingForPayment: return "geekblue";
            case OrderStatus.Paid: return "gold";
            case OrderStatus.Cancelled: return "red";
            default: return "default";
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

    // Columns for Active Items (Editable)
    const activeColumns = [
        {
            title: 'สินค้า',
            dataIndex: 'product',
            key: 'product',
            render: (product: any, record: OrdersItem) => {
                const isEditing = record.id === editingItemId;
                return (
                    <div>
                        <Text strong style={{ display: 'block', fontSize: 15 }}>{product?.display_name}</Text>
                        {!isEditing && record.notes && <Text type="secondary" style={{ fontSize: 12 }}>Note: {record.notes}</Text>}
                        {isEditing && (
                             <Form form={editForm} component={false}>
                                <Form.Item name="notes" style={{ margin: 0 }}>
                                    <Input placeholder="หมายเหตุ" size="small" />
                                </Form.Item>
                             </Form>
                        )}
                    </div>
                )
            }
        },
        {
            title: 'จำนวน',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 100,
            align: 'center' as const,
            render: (qty: number, record: OrdersItem) => {
                const isEditing = record.id === editingItemId;
                if (isEditing) {
                    return (
                        <Form form={editForm} component={false}>
                            <Form.Item name="quantity" style={{ margin: 0 }} rules={[{ required: true, message: '' }]}>
                                <InputNumber min={1} size="small" />
                            </Form.Item>
                        </Form>
                    )
                }
                return <Text style={{ fontSize: 16 }}>{qty}</Text>;
            }
        },
        {
            title: '',
            key: 'actions',
            width: 100,
            align: 'right' as const,
            render: (_: any, record: OrdersItem) => {
                const isEditing = record.id === editingItemId;
                if (isEditing) {
                    return (
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <Button type="primary" size="small" icon={<SaveOutlined />} onClick={() => handleSaveEdit(record.id)} />
                            <Button size="small" icon={<CloseOutlined />} onClick={() => setEditingItemId(null)} />
                        </div>
                    )
                }
                return (
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                         <Button type="text" icon={<EditOutlined />} onClick={() => handleEditClick(record)} />
                         <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteItem(record.id)} />
                    </div>
                )
            }
        }
    ];

    // Columns for Served/History Items (ReadOnly)
    const servedColumns = [
         {
            title: 'สินค้า',
            dataIndex: 'product',
            key: 'product',
            render: (product: any, record: OrdersItem) => (
                <div>
                     <Text style={{ display: 'block', textDecoration: record.status === OrderStatus.Cancelled ? 'line-through' : 'none' }}>
                        {product?.display_name}
                     </Text>
                     {record.notes && <Text type="secondary" style={{ fontSize: 11 }}>{record.notes}</Text>}
                </div>
            )
        },
        {
            title: 'สถานะ',
            dataIndex: 'status',
            key: 'status',
            align: 'center' as const,
            width: 100,
            render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
        },
        {
            title: 'จำนวน',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'center' as const,
            width: 80,
        },
        {
            title: '',
            key: 'action',
            align: 'right' as const,
            width: 100,
            render: (_: any, record: OrdersItem) => {
                if (record.status === OrderStatus.Served) {
                     return <Button size="small" danger onClick={() => handleUnserveItem(record.id)}>ยกเลิกเสิร์ฟ</Button>
                }
                return null;
            }
        }
    ];


    if (isLoading) return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
    if (!order) return <Empty description="ไม่พบข้อมูล" />;

    return (
        <div style={pageStyles.container}>
            {/* ... hero section ... */}
             <div style={{ ...pageStyles.heroParams, paddingBottom: 80 }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div style={pageStyles.sectionTitle}>
                         <Button type="text" icon={<ArrowLeftOutlined />} style={{ color: '#fff', marginRight: 16 }} onClick={() => router.back()}>กลับ</Button>
                        <div>
                            <Title level={3} style={{ margin: 0, color: '#fff' }}>รายละเอียดออเดอร์</Title>
                            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>{order.order_no}</Text>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1000, margin: '-40px auto 30px', padding: '0 24px', position: 'relative', zIndex: 20 }}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={16}>
                        {/* Active Items Card */}
                        <Card 
                            style={{ borderRadius: 12, marginBottom: 24 }}
                            title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong style={{ fontSize: 16 }}>กำลังทำอาหาร ({activeItems.length})</Text>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                         <Button icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)}>เพิ่มเมนู</Button>
                                         <Button danger disabled={selectedRowKeys.length === 0} onClick={handleCancelSelected}>ยกเลิกที่เลือก</Button>
                                         <Button type="primary" disabled={selectedRowKeys.length === 0} onClick={handleServeSelected} loading={isUpdating}>เสิร์ฟที่เลือก</Button>
                                    </div>
                                </div>
                            }
                        >
                            {activeItems.length > 0 ? (
                                <Table 
                                    rowSelection={rowSelection}
                                    dataSource={activeItems} 
                                    columns={activeColumns} 
                                    rowKey="id" 
                                    pagination={false} 
                                    size="middle"
                                />
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <CheckCircleOutlined style={{ fontSize: 40, color: colors.success, marginBottom: 16 }} />
                                    <Text type="secondary" style={{ display: 'block' }}>ไม่มีรายการที่กำลังทำอาหาร</Text>
                                    
                                    {isOrderComplete && (
                                        <div style={{ marginTop: 24 }}>
                                            <Text type="secondary">กรุณายืนยันการเสิร์ฟที่กล่องด้านล่าง</Text>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>

                        {/* Served History */}
                        <Card 
                            style={{ borderRadius: 12 }} 
                            bodyStyle={{ background: '#fafafa' }}
                            title={<Text type="secondary">รอเสิร์ฟ / ประวัติ ({servedItems.length})</Text>}
                        >
                            <Table 
                                dataSource={servedItems} 
                                columns={servedColumns} 
                                rowKey="id" 
                                pagination={false} 
                                size="small"
                                style={{ marginBottom: 16 }}
                            />
                            
                            {isOrderComplete && (
                                <div style={{ textAlign: 'center', padding: '12px 0', borderTop: '1px dashed #d9d9d9' }}>
                                    <Button 
                                        type="primary" 
                                        size="large" 
                                        style={{ background: colors.primary, minWidth: 200 }}
                                        onClick={handleConfirmServe}
                                    >
                                        ยืนยันการเสิร์ฟ (ชำระเงิน)
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </Col>
                    
                    <Col xs={24} lg={8}>
                         <Card style={{ borderRadius: 12 }}>
                            <div style={{ marginBottom: 12 }}>
                                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>สถานะออเดอร์</Text>
                                    <Tag color={getStatusColor(order.status)} style={{ marginTop: 4, fontSize: 14 }}>
                                        {getStatusText(order.status)}
                                    </Tag>
                            </div>
                            <Divider style={{ margin: '12px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text>รวมเป็นเงิน</Text>
                                    <Text>฿{Number(order.total_amount).toLocaleString()}</Text>
                                </div>
                         </Card>
                    </Col>
                </Row>
            </div>
            
            <AddItemsModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onAddItem={handleAddItem} 
            />
        </div>
    );
}
