"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Typography, Row, Col, Empty, Spin } from "antd";
import {
  ShopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useTables } from "@/hooks/pos/useTables";
import {
  dineInPageStyles,
} from "@/theme/pos/dine-in.theme";
import { posPageStyles, tableColors, channelColors } from "@/theme/pos";
import { POSGlobalStyles } from "@/theme/pos/GlobalStyles";
import { getTableNavigationPath } from "@/utils/orders";
import {
    getTableStats,
    sortTables,
    getActiveTables,
    getTableColorScheme,
    formatOrderStatus,
} from "@/utils/channels";

const { Title, Text } = Typography;

export default function DineInTableSelectionPage() {
  const router = useRouter();
  const { tables, isLoading } = useTables();

  // Calculate statistics and sort tables
  const stats = useMemo(() => getTableStats(tables), [tables]);
  const activeTables = useMemo(() => getActiveTables(tables), [tables]);
  const sortedTables = useMemo(() => sortTables(activeTables), [activeTables]);

  return (
    <>
      <POSGlobalStyles />
      <div style={dineInPageStyles.container}>
        {/* Header Section */}
        <div style={dineInPageStyles.header} className="dine-in-header-mobile">
          <div className="header-pattern"></div>

          <div style={dineInPageStyles.headerContent} className="dine-in-header-content-mobile">
            {/* Back Button */}
            <div
              className="back-button-hover dine-in-back-button-mobile"
              style={dineInPageStyles.backButton}
              onClick={() => router.push("/pos/channels")}
            >
              <ArrowLeftOutlined />
              <span>กลับ</span>
            </div>

            {/* Title Section */}
            <div style={dineInPageStyles.titleSection} className="dine-in-title-section-mobile">
              <ShopOutlined style={dineInPageStyles.headerIcon} className="dine-in-header-icon-mobile" />
              <div>
                <Title level={3} style={dineInPageStyles.headerTitle} className="dine-in-header-title-mobile">
                  เลือกโต๊ะ
                </Title>
                <Text style={dineInPageStyles.headerSubtitle}>Dine In</Text>
              </div>
            </div>

            {/* Statistics Bar */}
            <div style={dineInPageStyles.statsBar} className="dine-in-stats-bar-mobile">
              <div style={dineInPageStyles.statItem}>
                <span
                  style={{
                    ...dineInPageStyles.statDot,
                    background: tableColors.available.primary,
                  }}
                />
                <Text style={dineInPageStyles.statText}>
                  ว่าง {stats.available}
                </Text>
              </div>
              <div style={dineInPageStyles.statItem}>
                <span
                  style={{
                    ...dineInPageStyles.statDot,
                    background: tableColors.occupied.primary,
                  }}
                />
                <Text style={dineInPageStyles.statText}>
                  ไม่ว่าง {stats.occupied}
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div style={dineInPageStyles.contentContainer} className="dine-in-content-mobile">
          {isLoading ? (
            <div style={dineInPageStyles.loadingContainer}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">กำลังโหลดข้อมูลโต๊ะ...</Text>
              </div>
            </div>
          ) : sortedTables.length > 0 ? (
            <Row gutter={[20, 20]}>
              {sortedTables.map((table, index) => {
                const colorScheme = getTableColorScheme(table);
                const colors = tableColors[colorScheme];
                const isAvailable = table.status === "Available";
                const isInactive = !table.is_active;

                return (
                  <Col xs={12} sm={8} md={6} lg={4} key={table.id}>
                    <div
                      className={`dine-in-table-card dine-in-table-card-mobile table-card-animate table-card-delay-${
                        (index % 6) + 1
                      }`}
                      style={{
                        ...dineInPageStyles.tableCard,
                        background: colors.light,
                        border: `2px solid ${colors.border}`,
                        opacity: isInactive ? 0.6 : 1,
                      }}
                      onClick={() => {
                        if (!isInactive) {
                          const link = getTableNavigationPath(table);
                          router.push(link);
                        }
                      }}
                    >
                      {/* Gradient Overlay */}
                      <div
                        style={{
                          ...dineInPageStyles.cardGradientOverlay,
                          background: colors.gradient,
                        }}
                      />

                        {/* Card Content */}
                        <div style={dineInPageStyles.tableCardInner}>
                          {/* Icon logic based on specific status */}
                          {isInactive ? (
                            <StopOutlined
                              className="dine-in-table-icon-mobile"
                              style={{
                                ...dineInPageStyles.tableIcon,
                                color: colors.primary,
                              }}
                            />
                          ) : isAvailable ? (
                            <ShopOutlined
                              className="dine-in-table-icon-mobile"
                              style={{
                                ...dineInPageStyles.tableIcon,
                                color: colors.primary,
                                opacity: 0.6
                              }}
                            />
                          ) : (
                            <CloseCircleOutlined
                              className="pulse-soft dine-in-table-icon-mobile"
                              style={{
                                ...dineInPageStyles.tableIcon,
                                color: colors.primary,
                              }}
                            />
                          )}

                          {/* Table Name */}
                          <div style={dineInPageStyles.tableName} className="dine-in-table-name-mobile">
                            {table.table_name}
                          </div>

                          {/* Two-Tier Status Display */}
                          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                            {/* Tier 1: Availability indicator */}
                            {!isInactive && (
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: isAvailable ? "#52c41a" : "#ff4d4f",
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}
                              >
                                {isAvailable ? "ว่าง" : "ไม่ว่าง"}
                              </div>
                            )}

                            {/* Tier 2: Specific order status badge */}
                            <div
                              style={{
                                ...dineInPageStyles.statusBadge,
                                background: isInactive ? "#bfbfbf" : isAvailable ? "#f0f0f0" : colors.primary,
                                color: isInactive ? "#fff" : isAvailable ? "#8c8c8c" : "#fff",
                                border: isAvailable ? "1px solid #d9d9d9" : "none",
                                fontSize: 11,
                                padding: '2px 10px',
                                height: 'auto',
                                lineHeight: '1.4'
                              }}
                            >
                              {isInactive
                                ? "ปิดใช้งาน"
                                : isAvailable
                                ? "รอรับออเดอร์"
                                : table.active_order_status 
                                  ? formatOrderStatus(table.active_order_status)
                                  : "ไม่ว่าง"}
                            </div>
                          </div>
                        </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          ) : (
            <div style={dineInPageStyles.emptyState}>
              <Empty description="ไม่พบข้อมูลโต๊ะ" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
