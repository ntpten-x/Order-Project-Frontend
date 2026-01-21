"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { 
  Typography, 
  Row, 
  Col, 
  Card, 
  Tag, 
  Spin, 
  Empty, 
  Button, 
  Divider,
  Select,
  Space,
  Pagination,
  Segmented,
  ConfigProvider
} from "antd";
import { 
  ClockCircleOutlined, 
  ShopOutlined, 
  RocketOutlined, 
  ShoppingOutlined, 
  ArrowRightOutlined, 
  UserOutlined,
  AppstoreOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  FilterOutlined
} from "@ant-design/icons";
import { ordersService } from "@/services/pos/orders.service";
import { OrderStatus } from "@/types/api/pos/salesOrder";
import { 
  ordersStyles, 
  ordersColors, 
  ordersTypography,
  ordersResponsiveStyles 
} from "./style";
import {
  getOrderStatusColor,
  getOrderStatusText,
  getOrderChannelColor,
  getOrderChannelText,
  formatCurrency,
  getOrderReference,
  getTotalItemsQuantity,
  groupItemsByCategory,
  sortOrdersByDate,
  sortOrdersByQuantity
} from "@/utils/orders";
import dayjs from "dayjs";
import "dayjs/locale/th";

const { Title, Text } = Typography;
const { Option } = Select;
dayjs.locale("th");

export default function POSOrdersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [sortAscending, setSortAscending] = useState(true); // true = oldest first (FIFO)
  const [limit, setLimit] = useState(50);
  const [sortBy, setSortBy] = useState<'date' | 'quantity'>('date');

  // Fetch active orders
  const activeStatuses = [OrderStatus.Pending, OrderStatus.Cooking, OrderStatus.Served].join(",");

  const { data, isLoading } = useSWR(
    `/pos/orders?page=${page}&limit=${limit}&status=${activeStatuses}`,
    () => ordersService.getAll(undefined, page, limit, activeStatuses),
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
  );

  const orders = data?.data || [];
  const sortedOrders = sortBy === 'date' 
    ? sortOrdersByDate(orders, sortAscending)
    : sortOrdersByQuantity(orders, sortAscending);

  // Get icon for order type
  const getChannelIcon = (type: string) => {
    switch (type) {
      case "DineIn":
        return <ShopOutlined />;
      case "TakeAway":
        return <ShoppingOutlined />;
      case "Delivery":
        return <RocketOutlined />;
      default:
        return <AppstoreOutlined />;
    }
  };

  return (
    <div className="pos-orders-container" style={ordersStyles.container}>
      {/* Responsive Styles */}
      <style jsx global>{ordersResponsiveStyles}</style>

      {/* Header */}
      <div className="orders-header" style={ordersStyles.header}>
        <div style={ordersStyles.headerContent}>
          <div className="orders-header-icon" style={ordersStyles.headerIcon}>
            <ClockCircleOutlined style={{ fontSize: 32, color: '#fff' }} />
          </div>
          <div style={ordersStyles.headerTextContainer}>
            <Title 
              level={2} 
              className="orders-page-title"
              style={ordersStyles.headerTitle}
            >
              รายการออเดอร์
            </Title>
            <Text 
              className="orders-page-subtitle"
              style={ordersStyles.headerSubtitle}
            >
              จัดการและติดตามออเดอร์ที่กำลังดำเนินการ
            </Text>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="orders-content-wrapper" style={ordersStyles.contentWrapper}>
        {/* Filter Controls */}
        <div className="orders-filter-section" style={ordersStyles.filterSection}>
          <div style={ordersStyles.filterLeft}>
            <FilterOutlined style={{ fontSize: 16, color: ordersColors.primary }} />
            <Text style={ordersStyles.statsText}>
              แสดง <Text strong style={{ color: ordersColors.text }}>{sortedOrders.length}</Text> ออเดอร์
            </Text>
          </div>
          <div className="filter-controls-group" style={ordersStyles.filterRight}>
            <ConfigProvider
              theme={{
                components: {
                  Segmented: {
                    itemSelectedBg: ordersColors.primary,
                    itemSelectedColor: '#fff',
                    trackBg: '#e2e8f0',
                  },
                },
              }}
            >
              <Segmented
                value={sortBy}
                onChange={(value) => setSortBy(value as 'date' | 'quantity')}
                options={[
                  { label: 'เวลา', value: 'date', icon: <ClockCircleOutlined /> },
                  { label: 'จำนวนรายการ', value: 'quantity', icon: <AppstoreOutlined /> },
                ]}
                style={{ borderRadius: 10, padding: 2 }}
              />
            </ConfigProvider>
            
            <Button
              type="primary"
              ghost
              icon={sortAscending ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
              onClick={() => setSortAscending(!sortAscending)}
              style={{ 
                borderRadius: 10, 
                height: 32,
                display: 'flex',
                alignItems: 'center',
                fontWeight: 600,
                borderWidth: 2,
              }}
            >
              {sortBy === 'date' 
                ? (sortAscending ? "เก่าก่อน" : "ใหม่ก่อน")
                : (sortAscending ? "น้อยสุด" : "มากสุด")
              }
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div style={ordersStyles.loadingState}>
            <Spin size="large" tip="กำลังโหลดข้อมูล..." />
          </div>
        ) : sortedOrders.length > 0 ? (
          <Row gutter={[16, 16]}>
            {sortedOrders.map((order: any) => {
              const itemsSummary = groupItemsByCategory(order.items || []);
              const totalItems = getTotalItemsQuantity(order.items || []);
              const orderRef = getOrderReference(order);

              return (
                <Col xs={24} sm={12} lg={8} key={order.id}>
                  <Card
                    hoverable
                    className="orders-card"
                    style={ordersStyles.orderCard}
                    styles={{ body: { padding: 0 } }}
                  >
                    {/* Card Header */}
                    <div className="orders-card-header" style={ordersStyles.cardHeader}>
                      <div style={ordersStyles.cardHeaderLeft}>
                        <Tag
                          icon={getChannelIcon(order.order_type)}
                          color={getOrderChannelColor(order.order_type)}
                          style={{ 
                            margin: 0, 
                            padding: "4px 10px", 
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600
                          }}
                        >
                          {getOrderChannelText(order.order_type)}
                        </Tag>
                        <Text strong style={{ fontSize: 14 }}>
                          {dayjs(order.create_date).format("HH:mm")}
                        </Text>
                      </div>
                      <Tag
                        color={getOrderStatusColor(order.status)}
                        style={{ 
                          margin: 0, 
                          fontWeight: 600,
                          borderRadius: 6,
                          padding: "4px 10px"
                        }}
                      >
                        {getOrderStatusText(order.status)}
                      </Tag>
                    </div>

                    {/* Card Body */}
                    <div className="orders-card-body" style={ordersStyles.cardBody}>
                      {/* Reference Section */}
                      <div style={ordersStyles.refSection}>
                        <Text style={ordersStyles.refLabel}>
                          {order.order_type === "DineIn" && "โต๊ะ"}
                          {order.order_type === "Delivery" && "เดลิเวอรี่"}
                          {order.order_type === "TakeAway" && "หมายเลข"}
                        </Text>
                        <div className="orders-ref-value" style={ordersStyles.refValue}>
                          <AppstoreOutlined style={{ fontSize: 18, color: ordersColors.primary }} />
                          <span>{orderRef}</span>
                        </div>
                      </div>

                      {/* Items Summary */}
                      <div style={ordersStyles.itemsSummary}>
                        {Object.keys(itemsSummary).length > 0 ? (
                          <>
                            {Object.entries(itemsSummary).map(([category, qty]) => (
                              <div key={category} style={ordersStyles.summaryRow}>
                                <Text type="secondary">{category}</Text>
                                <Text strong>{qty} รายการ</Text>
                              </div>
                            ))}
                            <div style={ordersStyles.summaryRowBold}>
                              <Text>รวมทั้งหมด</Text>
                              <Text>{totalItems} รายการ</Text>
                            </div>
                          </>
                        ) : (
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            ไม่มีรายการสินค้า
                          </Text>
                        )}
                      </div>

                      {/* Total Amount */}
                      <div style={ordersStyles.totalSection}>
                        <Text style={ordersStyles.totalLabel}>ยอดรวม</Text>
                        <Text style={ordersStyles.totalAmount}>
                          {formatCurrency(order.total_amount)}
                        </Text>
                      </div>

                      {/* Creator Info */}
                      <div style={ordersStyles.metaSection}>
                        <UserOutlined />
                        <Text type="secondary">
                          {order.created_by?.username || order.created_by_id || "System"}
                        </Text>
                      </div>

                      {/* Action Button */}
                      <Button
                        type="primary"
                        block
                        icon={<ArrowRightOutlined />}
                        style={ordersStyles.actionButton}
                        onClick={() => router.push(`/pos/orders/${order.id}`)}
                      >
                        ดูรายละเอียด
                      </Button>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : (
          <div style={ordersStyles.emptyState}>
            <Empty 
              description="ไม่พบรายการออเดอร์"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}

        {/* Pagination Section */}
        {!isLoading && orders.length > 0 && (
          <div style={{ 
            marginTop: 32, 
            display: 'flex', 
            justifyContent: 'center',
            background: '#fff',
            padding: '16px',
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <Pagination
              current={page}
              pageSize={limit}
              total={data?.total || 0}
              onChange={(p, ps) => {
                setPage(p);
                setLimit(ps);
              }}
              showSizeChanger
              pageSizeOptions={['10', '20', '50', '100']}
              locale={{ items_per_page: '/ หน้า' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
