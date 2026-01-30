"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Typography, Card, Row, Col, Statistic, Table, DatePicker, Button, Avatar, Tag, Dropdown, message, Spin } from "antd";
import { DollarCircleOutlined, ShoppingOutlined, RiseOutlined, ReloadOutlined, EyeOutlined, DownloadOutlined, FilePdfOutlined, FileExcelOutlined } from "@ant-design/icons";
import { exportSalesReportPDF, exportSalesReportExcel } from "../../../../utils/export.utils";
import { useRouter } from "next/navigation";
import { posPageStyles, posColors } from "@/theme/pos";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import { dashboardService } from "../../../../services/pos/dashboard.service";
import { ordersService } from "../../../../services/pos/orders.service";
import { SalesSummary, TopItem } from "../../../../types/api/pos/dashboard";
import { SalesOrderSummary, OrderStatus, OrderType } from "../../../../types/api/pos/salesOrder";
import { useGlobalLoading } from "@/contexts/pos/GlobalLoadingContext";
import { useSocket } from "@/hooks/useSocket";
import { useRealtimeRefresh } from "@/utils/pos/realtime";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
dayjs.locale('th');

export default function DashboardPage() {
    const router = useRouter();
    const { showLoading, hideLoading } = useGlobalLoading(); // Note: Dashboard often loads on mount, so global loading might cover the whole page or just use local loading for regions
    const { socket } = useSocket();
    const [salesData, setSalesData] = useState<SalesSummary[]>([]);
    const [topItems, setTopItems] = useState<TopItem[]>([]);
    const [recentOrders, setRecentOrders] = useState<SalesOrderSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().startOf('month'), dayjs().endOf('month')]);

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const startDate = dateRange[0].format('YYYY-MM-DD');
            const endDate = dateRange[1].format('YYYY-MM-DD');

            // Fetch Sales Summary, Top Items, and Recent Orders in parallel
            const [salesRes, itemsRes, ordersRes] = await Promise.all([
                dashboardService.getSalesSummary(startDate, endDate),
                dashboardService.getTopSellingItems(5),
                ordersService.getAllSummary(undefined, 1, 10, 'Paid,Cancelled')
            ]);

            setSalesData(salesRes);
            setTopItems(itemsRes);
            setRecentOrders(ordersRes.data || []);
        } catch {
            // Silent failure for dashboard data
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchData(false);
    }, [fetchData]);

    useRealtimeRefresh({
        socket,
        events: ["orders:update", "orders:create", "orders:delete", "payments:create"],
        onRefresh: () => fetchData(true),
        intervalMs: 20000,
        debounceMs: 1000,
    });

    const handleExportPDF = () => {
        try {
            showLoading("กำลังสร้าง PDF...");
            exportSalesReportPDF(
                salesData,
                topItems,
                [dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')]
            );
            message.success('ส่งออก PDF สำเร็จ');
        } catch {
            message.error('เกิดข้อผิดพลาดในการส่งออก PDF');
        } finally {
            hideLoading();
        }
    };

    const handleExportExcel = () => {
        try {
            showLoading("กำลังสร้าง Excel...");
            exportSalesReportExcel(
                salesData,
                topItems,
                [dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')]
            );
            message.success('ส่งออก Excel สำเร็จ');
        } catch {
            message.error('เกิดข้อผิดพลาดในการส่งออก Excel');
        } finally {
            hideLoading();
        }
    };

    // Calculate aggregates
    const totalSales = salesData.reduce((acc, curr) => acc + Number(curr.total_sales), 0);
    const totalOrders = salesData.reduce((acc, curr) => acc + Number(curr.total_orders), 0);
    const totalDiscount = salesData.reduce((acc, curr) => acc + Number(curr.total_discount), 0);
    const totalDeliverySales = salesData.reduce((acc, curr) => acc + Number(curr.delivery_sales || 0), 0);
    const totalDineInSales = salesData.reduce((acc, curr) => acc + Number(curr.dine_in_sales || 0), 0);
    const totalTakeAwaySales = salesData.reduce((acc, curr) => acc + Number(curr.takeaway_sales || 0), 0);
    const shouldVirtualizeRecentOrders = recentOrders.length > 10;

    const topItemsColumns = [
        {
            title: '#',
            key: 'index',
            width: 60,
            render: (_: unknown, __: TopItem, index: number) => index + 1
        },
        {
            title: 'สินค้า',
            dataIndex: 'product_name',
            key: 'name',
            render: (name: string, record: TopItem) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar shape="square" src={record.img_url} icon={<ShoppingOutlined />} />
                    <Text>{name}</Text>
                </div>
            )
        },
        {
            title: 'ยอดขาย (ชิ้น)',
            dataIndex: 'total_quantity',
            key: 'qty',
            align: 'center' as const,
        },
        {
            title: 'ยอดขาย (บาท)',
            dataIndex: 'total_revenue',
            key: 'revenue',
            align: 'right' as const,
            render: (val: number) => `฿${Number(val).toLocaleString()}`
        }
    ];

    if (isLoading) {
        return (
            <div style={{ ...posPageStyles.container, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Spin size="large" tip="กำลังโหลดข้อมูล..." />
            </div>
        );
    }

    return (
        <div style={posPageStyles.container}>
            <div style={{ ...posPageStyles.heroParams, paddingBottom: 60 }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div style={posPageStyles.sectionTitle}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <RiseOutlined style={{ fontSize: 32, color: '#fff' }} />
                            <div>
                                <Title level={3} style={{ margin: 0, color: '#fff' }}>Dashboard</Title>
                                <Text style={{ color: 'rgba(255,255,255,0.85)' }}>ภาพรวมยอดขายร้านค้า</Text>
                            </div>
                         </div>
                    </div>
                    
                    <Row gutter={16} align="middle">
                        <Col>
                             <RangePicker 
                                style={{ borderRadius: 8, padding: '8px 16px' }}
                                value={dateRange}
                                onChange={(dates) => dates && setDateRange([dates[0]!, dates[1]!])}
                                allowClear={false}
                             />
                        </Col>
                        <Col>
                            <Button icon={<ReloadOutlined />} onClick={() => fetchData(false)} type="default" style={{ borderRadius: 8, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}>
                                รีเฟรช
                            </Button>
                        </Col>
                        <Col>
                            <Dropdown
                                menu={{
                                    items: [
                                        {
                                            key: 'pdf',
                                            icon: <FilePdfOutlined />,
                                            label: 'ส่งออก PDF',
                                            onClick: handleExportPDF
                                        },
                                        {
                                            key: 'excel',
                                            icon: <FileExcelOutlined />,
                                            label: 'ส่งออก Excel',
                                            onClick: handleExportExcel
                                        }
                                    ]
                                }}
                                trigger={['click']}
                                disabled={isLoading || salesData.length === 0}
                            >
                                <Button 
                                    icon={<DownloadOutlined />} 
                                    type="primary"
                                    style={{ borderRadius: 8 }}
                                >
                                    ส่งออกรายงาน
                                </Button>
                            </Dropdown>
                        </Col>
                    </Row>
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: '-40px auto 30px', padding: '0 24px', position: 'relative', zIndex: 20 }}>
                {/* Stats Cards */}
                <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={8}>
                        <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <Statistic 
                                title="ยอดขายรวม" 
                                value={totalSales} 
                                precision={2}
                                prefix={<DollarCircleOutlined style={{ color: posColors.primary }} />} 
                                suffix="฿"
                                valueStyle={{ color: posColors.primary, fontWeight: 'bold' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                             <Statistic 
                                title="จำนวนออเดอร์" 
                                value={totalOrders} 
                                prefix={<ShoppingOutlined style={{ color: '#52c41a' }} />} 
                                suffix="รายการ"
                                valueStyle={{ fontWeight: 'bold' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                             <Statistic 
                                title="ส่วนลดทั้งหมด" 
                                value={totalDiscount} 
                                precision={2}
                                prefix={<RiseOutlined style={{ color: '#ff4d4f' }} />} 
                                suffix="฿"
                                valueStyle={{ color: '#ff4d4f', fontWeight: 'bold' }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Channel Specific Stats */}
                <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={8}>
                        <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <Statistic 
                                title="ยอดขายทานที่ร้าน" 
                                value={totalDineInSales} 
                                precision={2}
                                prefix={<DollarCircleOutlined style={{ color: '#1890ff' }} />} 
                                suffix="฿"
                                valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                             <Statistic 
                                title="ยอดขายกลับบ้าน" 
                                value={totalTakeAwaySales} 
                                precision={2}
                                prefix={<ShoppingOutlined style={{ color: '#52c41a' }} />} 
                                suffix="฿"
                                valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                             <Statistic 
                                title="ยอดขายเดลิเวอรี่" 
                                value={totalDeliverySales} 
                                precision={2}
                                prefix={<RiseOutlined style={{ color: '#eb2f96' }} />} 
                                suffix="฿"
                                valueStyle={{ color: '#eb2f96', fontWeight: 'bold' }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={16}>
                        <Card title="รายการยอดขายรายวัน" bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <Table 
                                dataSource={salesData} 
                                loading={isLoading}
                                rowKey="date"
                                pagination={{ pageSize: 5 }}
                                columns={[
                                    { title: 'วันที่', dataIndex: 'date', render: (date) => dayjs(date).format('DD MMM YYYY') },
                                    { title: 'ออเดอร์', dataIndex: 'total_orders', align: 'center' },
                                    { title: 'ยอดขาย', dataIndex: 'total_sales', align: 'right', render: val => <strong>฿{Number(val).toLocaleString()}</strong> },
                                    { title: 'เงินสด', dataIndex: 'cash_sales', align: 'right', render: val => `฿${Number(val).toLocaleString()}` },
                                    { title: 'เดลิเวอรี่', dataIndex: 'delivery_sales', align: 'right', render: val => <span style={{ color: '#eb2f96' }}>฿{Number(val || 0).toLocaleString()}</span> },
                                ]}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                        <Card title="5 สินค้าขายดี" bordered={false} style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}>
                            <Table 
                                dataSource={topItems} 
                                columns={topItemsColumns} 
                                pagination={false}
                                size="small"
                                rowKey="product_id"
                                loading={isLoading}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Recent Orders */}
                <Row style={{ marginTop: 24 }}>
                    <Col xs={24}>
                        <Card 
                            title="ออเดอร์ล่าสุด" 
                            bordered={false} 
                            style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        >
                            <Table
                                dataSource={recentOrders}
                                loading={isLoading}
                                rowKey="id"
                                virtual={shouldVirtualizeRecentOrders}
                                scroll={shouldVirtualizeRecentOrders ? { y: 360 } : undefined}
                                pagination={false}
                                columns={[
                                    { title: 'เลขที่', dataIndex: 'order_no', key: 'order_no', render: (val: string) => <Tag color="blue">#{val}</Tag> },
                                    { title: 'วันเวลา', dataIndex: 'create_date', key: 'date', render: (val: string) => dayjs(val).format('DD/MM/YYYY HH:mm') },
                                    { title: 'ประเภท', dataIndex: 'order_type', key: 'type', render: (type: OrderType) => {
                                        const typeMap: Record<OrderType, { label: string, color: string }> = {
                                            [OrderType.DineIn]: { label: 'ทานที่ร้าน', color: 'blue' },
                                            [OrderType.TakeAway]: { label: 'กลับบ้าน', color: 'green' },
                                            [OrderType.Delivery]: { label: 'เดลิเวอรี่', color: 'orange' },
                                        };
                                        return <Tag color={typeMap[type]?.color || 'default'}>{typeMap[type]?.label || type}</Tag>;
                                    }},
                                    { title: 'ยอดรวม', dataIndex: 'total_amount', key: 'total', align: 'right' as const, render: (val: number) => <strong>฿{Number(val).toLocaleString()}</strong> },
                                    { title: 'สถานะ', dataIndex: 'status', key: 'status', render: (status: OrderStatus) => {
                                        const statusMap: Record<string, { label: string, color: string }> = {
                                            [OrderStatus.Paid]: { label: 'ชำระแล้ว', color: 'green' },
                                            [OrderStatus.Cancelled]: { label: 'ยกเลิก', color: 'red' },
                                        };
                                        return <Tag color={statusMap[status]?.color || 'default'}>{statusMap[status]?.label || status}</Tag>;
                                    }},
                                    { title: '', key: 'action', width: 100, render: (_value: unknown, record: SalesOrderSummary) => (
                                        <Button 
                                            type="primary" 
                                            icon={<EyeOutlined />} 
                                            size="small"
                                            onClick={() => router.push(`/pos/dashboard/${record.id}`)}
                                        >
                                            ดูรายละเอียด
                                        </Button>
                                    )}
                                ]}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}
