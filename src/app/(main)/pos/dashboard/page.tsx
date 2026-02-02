"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Typography, Button, Avatar, Dropdown, message, Spin } from "antd";
import { 
    DollarCircleOutlined, ShoppingOutlined, RiseOutlined, ReloadOutlined, 
    EyeOutlined, DownloadOutlined, FilePdfOutlined, FileExcelOutlined, 
    CarOutlined, HomeOutlined, ShopOutlined, CalendarOutlined,
    TrophyOutlined, FireOutlined, TagOutlined
} from "@ant-design/icons";
import { exportSalesReportPDF, exportSalesReportExcel } from "../../../../utils/export.utils";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import { dashboardService } from "../../../../services/pos/dashboard.service";
import { ordersService } from "../../../../services/pos/orders.service";
import { SalesSummary, TopItem } from "../../../../types/api/pos/dashboard";
import { SalesOrderSummary, OrderStatus, OrderType } from "../../../../types/api/pos/salesOrder";
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useSocket } from "../../../../hooks/useSocket";
import { useRealtimeRefresh } from "../../../../utils/pos/realtime";
import { dashboardStyles, dashboardColors, dashboardResponsiveStyles } from "../../../../theme/pos/dashboard/style";
import { DatePicker } from "antd";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
dayjs.locale('th');

export default function DashboardPage() {
    const router = useRouter();
    const { showLoading, hideLoading } = useGlobalLoading();
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

            const [salesRes, itemsRes, ordersRes] = await Promise.all([
                dashboardService.getSalesSummary(startDate, endDate),
                dashboardService.getTopSellingItems(5),
                ordersService.getAllSummary(undefined, 1, 10, 'Paid,Cancelled')
            ]);

            setSalesData(salesRes);
            setTopItems(itemsRes);
            setRecentOrders(ordersRes.data || []);
        } catch {
            // Silent failure
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

    if (isLoading) {
        return (
            <div style={{ 
                minHeight: '100vh', 
                background: dashboardColors.background || '#F8FAFC', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center' 
            }}>
                <Spin size="large" tip="กำลังโหลดข้อมูล..." />
            </div>
        );
    }

    return (
        <div style={dashboardStyles.container}>
            <style>{dashboardResponsiveStyles}</style>

            {/* Hero Header with Gradient */}
            <div style={dashboardStyles.heroSection} className="dashboard-hero-mobile">
                <div style={dashboardStyles.heroDecoCircle1} />
                <div style={dashboardStyles.heroDecoCircle2} />
                
                <div style={dashboardStyles.heroContent}>
                    {/* Header Row */}
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        marginBottom: 20 
                    }}>
                        <div style={dashboardStyles.heroHeader}>
                            <div style={dashboardStyles.heroIconBox}>
                                <RiseOutlined style={{ fontSize: 24, color: 'white' }} />
                            </div>
                            <div>
                                <Title level={4} style={dashboardStyles.heroTitle} className="dashboard-title-mobile">
                                    Dashboard
                                </Title>
                                <Text style={dashboardStyles.heroSubtitle}>ภาพรวมยอดขาย</Text>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Button 
                                icon={<ReloadOutlined />} 
                                onClick={() => fetchData(false)}
                                style={dashboardStyles.refreshButton}
                                className="scale-hover"
                            />
                            <Dropdown
                                menu={{
                                    items: [
                                        { key: 'pdf', icon: <FilePdfOutlined />, label: 'PDF', onClick: handleExportPDF },
                                        { key: 'excel', icon: <FileExcelOutlined />, label: 'Excel', onClick: handleExportExcel }
                                    ]
                                }}
                                trigger={['click']}
                                disabled={salesData.length === 0}
                            >
                                <Button 
                                    icon={<DownloadOutlined />} 
                                    style={dashboardStyles.exportButton}
                                    className="scale-hover"
                                />
                            </Dropdown>
                        </div>
                    </div>

                    {/* Date Picker */}
                    <div style={dashboardStyles.datePickerWrapper}>
                        <RangePicker 
                            style={{ width: '100%', border: 'none' }}
                            value={dateRange}
                            onChange={(dates) => dates && setDateRange([dates[0]!, dates[1]!])}
                            allowClear={false}
                            suffixIcon={<CalendarOutlined style={{ color: dashboardColors.primary }} />}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={dashboardStyles.contentWrapper} className="dashboard-content-mobile">
                
                {/* Main Sales Card */}
                <div 
                    style={{
                        ...dashboardStyles.statCard,
                        background: `linear-gradient(135deg, ${dashboardColors.salesColor} 0%, #818CF8 100%)`,
                        padding: 20,
                        marginBottom: 16,
                        color: 'white'
                    }}
                    className="dashboard-card-animate scale-hover"
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <DollarCircleOutlined style={{ fontSize: 28 }} />
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>ยอดขายรวม</Text>
                    </div>
                    <Title level={2} style={{ margin: 0, color: 'white', fontSize: 32 }}>
                        ฿{totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </Title>
                    <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ShoppingOutlined style={{ fontSize: 14 }} />
                            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>{totalOrders} ออเดอร์</Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <TagOutlined style={{ fontSize: 14 }} />
                            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>ส่วนลด ฿{totalDiscount.toLocaleString()}</Text>
                        </div>
                    </div>
                </div>

                {/* Channel Stats Grid */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: 10, 
                    marginBottom: 20 
                }}>
                    {/* Dine In */}
                    <div 
                        style={{
                            ...dashboardStyles.statCard,
                            padding: 14,
                            textAlign: 'center'
                        }}
                        className="dashboard-stat-card-mobile scale-hover dashboard-card-animate dashboard-card-delay-1"
                    >
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: `${dashboardColors.dineInColor}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 8px'
                        }}>
                            <ShopOutlined style={{ fontSize: 18, color: dashboardColors.dineInColor }} />
                        </div>
                        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>ทานที่ร้าน</Text>
                        <Text strong style={{ fontSize: 14, color: dashboardColors.dineInColor }}>
                            ฿{totalDineInSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </Text>
                    </div>

                    {/* Take Away */}
                    <div 
                        style={{
                            ...dashboardStyles.statCard,
                            padding: 14,
                            textAlign: 'center'
                        }}
                        className="dashboard-stat-card-mobile scale-hover dashboard-card-animate dashboard-card-delay-2"
                    >
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: `${dashboardColors.takeAwayColor}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 8px'
                        }}>
                            <HomeOutlined style={{ fontSize: 18, color: dashboardColors.takeAwayColor }} />
                        </div>
                        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>กลับบ้าน</Text>
                        <Text strong style={{ fontSize: 14, color: dashboardColors.takeAwayColor }}>
                            ฿{totalTakeAwaySales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </Text>
                    </div>

                    {/* Delivery */}
                    <div 
                        style={{
                            ...dashboardStyles.statCard,
                            padding: 14,
                            textAlign: 'center'
                        }}
                        className="dashboard-stat-card-mobile scale-hover dashboard-card-animate dashboard-card-delay-3"
                    >
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: `${dashboardColors.deliveryColor}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 8px'
                        }}>
                            <CarOutlined style={{ fontSize: 18, color: dashboardColors.deliveryColor }} />
                        </div>
                        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>เดลิเวอรี่</Text>
                        <Text strong style={{ fontSize: 14, color: dashboardColors.deliveryColor }}>
                            ฿{totalDeliverySales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </Text>
                    </div>
                </div>

                {/* Top Products Section */}
                <div 
                    style={{
                        ...dashboardStyles.tableCard,
                        marginBottom: 16
                    }}
                    className="dashboard-card-animate"
                >
                    <div style={dashboardStyles.tableHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <TrophyOutlined style={{ color: '#F59E0B', fontSize: 18 }} />
                            <Text strong style={dashboardStyles.tableTitle}>สินค้าขายดี</Text>
                        </div>
                    </div>
                    <div style={{ padding: 16 }}>
                        {topItems.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {topItems.map((item, index) => (
                                    <div 
                                        key={item.product_id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            padding: 12,
                                            background: index === 0 ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' : '#F9FAFB',
                                            borderRadius: 14,
                                            border: index === 0 ? '1px solid #FCD34D' : '1px solid transparent',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{
                                            width: index === 0 ? 32 : 26,
                                            height: index === 0 ? 32 : 26,
                                            borderRadius: 8,
                                            background: index === 0 ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : '#E5E7EB',
                                            color: index === 0 ? 'white' : '#6B7280',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: index === 0 ? 14 : 12,
                                            fontWeight: 700,
                                            flexShrink: 0,
                                            boxShadow: index === 0 ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none'
                                        }}>
                                            {index === 0 ? <FireOutlined /> : index + 1}
                                        </div>
                                        <Avatar 
                                            shape="square" 
                                            size={42} 
                                            src={item.img_url} 
                                            icon={<ShoppingOutlined />}
                                            style={{ 
                                                borderRadius: 10, 
                                                flexShrink: 0,
                                                border: '2px solid white',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                                            }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <Text strong style={{ fontSize: 13, display: 'block', lineHeight: 1.3 }} ellipsis>
                                                {item.product_name}
                                            </Text>
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                ขายได้ {item.total_quantity} ชิ้น
                                            </Text>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <Text strong style={{ 
                                                color: dashboardColors.salesColor, 
                                                fontSize: 14,
                                                display: 'block'
                                            }}>
                                                ฿{Number(item.total_revenue).toLocaleString()}
                                            </Text>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: 30, color: '#9CA3AF' }}>
                                <ShoppingOutlined style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }} />
                                <Text type="secondary" style={{ display: 'block' }}>ยังไม่มีข้อมูลสินค้า</Text>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Orders Section */}
                <div 
                    style={dashboardStyles.tableCard}
                    className="dashboard-card-animate"
                >
                    <div style={dashboardStyles.tableHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ShoppingOutlined style={{ color: dashboardColors.primary, fontSize: 18 }} />
                            <Text strong style={dashboardStyles.tableTitle}>ออเดอร์ล่าสุด</Text>
                        </div>
                    </div>
                    <div style={{ padding: '12px 16px' }}>
                        {recentOrders.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {recentOrders.slice(0, 5).map(order => {
                                    const typeConfig: Record<OrderType, { label: string, color: string, bg: string }> = {
                                        [OrderType.DineIn]: { label: 'ทานร้าน', color: '#fff', bg: '#3B82F6' },
                                        [OrderType.TakeAway]: { label: 'กลับบ้าน', color: '#fff', bg: '#22C55E' },
                                        [OrderType.Delivery]: { label: 'เดลิเวอรี่', color: '#fff', bg: '#EC4899' },
                                    };
                                    const statusConfig: Record<string, { label: string, bg: string, color: string }> = {
                                        [OrderStatus.Paid]: { label: 'ชำระแล้ว', bg: '#DCFCE7', color: '#16A34A' },
                                        [OrderStatus.Cancelled]: { label: 'ยกเลิก', bg: '#FEE2E2', color: '#DC2626' },
                                    };
                                    const type = typeConfig[order.order_type] || { label: '-', color: '#fff', bg: '#6B7280' };
                                    const status = statusConfig[order.status] || { label: order.status, bg: '#F3F4F6', color: '#6B7280' };
                                    const paymentMethod = order.payment_method?.payment_method_name || 'เงินสด';
                                    
                                    // Thai date format
                                    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
                                    const orderDate = dayjs(order.create_date);
                                    const thaiDateStr = `${orderDate.date()} ${thaiMonths[orderDate.month()]} ${orderDate.format('HH:mm')}`;

                                    return (
                                        <div 
                                            key={order.id}
                                            style={{
                                                background: 'white',
                                                borderRadius: 14,
                                                border: '1px solid #E2E8F0',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                                                overflow: 'hidden'
                                            }}
                                            className="scale-hover"
                                            onClick={() => router.push(`/pos/dashboard/${order.id}`)}
                                        >
                                            {/* Row 1: Status (top-left) + Price (top-right) */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '12px 14px',
                                                borderBottom: '1px solid #F1F5F9'
                                            }}>
                                                <span style={{
                                                    fontSize: 11,
                                                    padding: '4px 10px',
                                                    borderRadius: 6,
                                                    background: status.bg,
                                                    color: status.color,
                                                    fontWeight: 700
                                                }}>
                                                    {status.label}
                                                </span>
                                                <Text strong style={{ 
                                                    color: dashboardColors.salesColor, 
                                                    fontSize: 18
                                                }}>
                                                    ฿{Number(order.total_amount).toLocaleString()}
                                                </Text>
                                            </div>

                                            {/* Row 2: Order Number + Type + Payment */}
                                            <div style={{ padding: '12px 14px' }}>
                                                <Text strong style={{ 
                                                    fontSize: 15,
                                                    display: 'block',
                                                    marginBottom: 10
                                                }}>
                                                    #{order.order_no}
                                                </Text>
                                                
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{
                                                        fontSize: 11,
                                                        padding: '5px 12px',
                                                        borderRadius: 20,
                                                        background: type.bg,
                                                        color: type.color,
                                                        fontWeight: 600
                                                    }}>
                                                        {type.label}
                                                    </span>
                                                    <span style={{
                                                        fontSize: 11,
                                                        padding: '5px 12px',
                                                        borderRadius: 20,
                                                        background: '#FEF3C7',
                                                        color: '#B45309',
                                                        fontWeight: 600
                                                    }}>
                                                        💳 {paymentMethod}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {/* Row 3: Date & View */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '10px 14px',
                                                background: '#F8FAFC',
                                                borderTop: '1px solid #F1F5F9'
                                            }}>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    📅 {thaiDateStr}
                                                </Text>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: 4,
                                                    color: dashboardColors.primary
                                                }}>
                                                    <Text style={{ fontSize: 12, color: dashboardColors.primary }}>ดูรายละเอียด</Text>
                                                    <EyeOutlined style={{ fontSize: 14 }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: 30, color: '#9CA3AF' }}>
                                <ShoppingOutlined style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }} />
                                <Text type="secondary" style={{ display: 'block' }}>ยังไม่มีออเดอร์</Text>
                            </div>
                        )}
                    </div>
                </div>

                {/* Daily Sales Summary - Compact */}
                {salesData.length > 0 && (
                    <div 
                        style={{
                            ...dashboardStyles.tableCard,
                            marginTop: 16
                        }}
                        className="dashboard-card-animate dashboard-table-mobile"
                    >
                        <div style={dashboardStyles.tableHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CalendarOutlined style={{ color: dashboardColors.primary, fontSize: 18 }} />
                                <Text strong style={dashboardStyles.tableTitle}>ยอดขายรายวัน</Text>
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 300 }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC' }}>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: '#64748B', fontWeight: 600 }}>วันที่</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, color: '#64748B', fontWeight: 600 }}>ออเดอร์</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, color: '#64748B', fontWeight: 600 }}>ยอดขาย</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesData.slice(0, 7).map((row, index) => (
                                        <tr 
                                            key={row.date} 
                                            style={{ 
                                                borderBottom: index < salesData.length - 1 ? '1px solid #F1F5F9' : 'none' 
                                            }}
                                        >
                                            <td style={{ padding: '14px 16px', fontSize: 13 }}>
                                                {dayjs(row.date).format('DD MMM')}
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13 }}>
                                                <span style={{
                                                    background: '#F1F5F9',
                                                    padding: '4px 10px',
                                                    borderRadius: 6,
                                                    fontWeight: 600
                                                }}>
                                                    {row.total_orders}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                                <Text strong style={{ color: dashboardColors.salesColor, fontSize: 14 }}>
                                                    ฿{Number(row.total_sales).toLocaleString()}
                                                </Text>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
