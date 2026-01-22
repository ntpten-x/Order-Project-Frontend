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
import { useTables } from "../../../../../hooks/pos/useTables";
import {
  dineInStyles,
  tableColors,
  DineInStyles,
} from "./style";
import {
  getTableStats,
  sortTables,
  getActiveTables,
  getTableColorScheme,
  formatOrderStatus,
} from "../../../../../utils/channels/tableUtils.utils";

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
      <DineInStyles />
      <div style={dineInStyles.container}>
        {/* Header Section */}
        <div style={dineInStyles.header} className="dine-in-header-mobile">
          <div className="header-pattern"></div>

          <div style={dineInStyles.headerContent} className="dine-in-header-content-mobile">
            {/* Back Button */}
            <div
              className="back-button-hover dine-in-back-button-mobile"
              style={dineInStyles.backButton}
              onClick={() => router.push("/pos/channels")}
            >
              <ArrowLeftOutlined />
              <span>กลับ</span>
            </div>

            {/* Title Section */}
            <div style={dineInStyles.titleSection} className="dine-in-title-section-mobile">
              <ShopOutlined style={dineInStyles.headerIcon} className="dine-in-header-icon-mobile" />
              <div>
                <Title level={3} style={dineInStyles.headerTitle} className="dine-in-header-title-mobile">
                  เลือกโต๊ะ
                </Title>
                <Text style={dineInStyles.headerSubtitle}>Dine In</Text>
              </div>
            </div>

            {/* Statistics Bar */}
            <div style={dineInStyles.statsBar} className="dine-in-stats-bar-mobile">
              <div style={dineInStyles.statItem}>
                <span
                  style={{
                    ...dineInStyles.statDot,
                    background: tableColors.available.primary,
                  }}
                />
                <Text style={dineInStyles.statText}>
                  ว่าง {stats.available}
                </Text>
              </div>
              <div style={dineInStyles.statItem}>
                <span
                  style={{
                    ...dineInStyles.statDot,
                    background: tableColors.occupied.primary,
                  }}
                />
                <Text style={dineInStyles.statText}>
                  ไม่ว่าง {stats.occupied}
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div style={dineInStyles.contentContainer} className="dine-in-content-mobile">
          {isLoading ? (
            <div style={dineInStyles.loadingContainer}>
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
                        ...dineInStyles.tableCard,
                        background: colors.light,
                        border: `2px solid ${colors.border}`,
                        opacity: isInactive ? 0.6 : 1,
                      }}
                      onClick={() => {
                        if (!isInactive) {
                          router.push(`/pos/channels/dine-in/${table.id}`);
                        }
                      }}
                    >
                      {/* Gradient Overlay */}
                      <div
                        style={{
                          ...dineInStyles.cardGradientOverlay,
                          background: colors.gradient,
                        }}
                      />

                      {/* Card Content */}
                      <div style={dineInStyles.tableCardInner}>
                        {/* Icon */}
                        {isInactive ? (
                          <StopOutlined
                            className="dine-in-table-icon-mobile"
                            style={{
                              ...dineInStyles.tableIcon,
                              color: colors.primary,
                            }}
                          />
                        ) : isAvailable ? (
                          <CheckCircleOutlined
                            className="dine-in-table-icon-mobile"
                            style={{
                              ...dineInStyles.tableIcon,
                              color: colors.primary,
                            }}
                          />
                        ) : (
                          <CloseCircleOutlined
                            className="pulse-soft dine-in-table-icon-mobile"
                            style={{
                              ...dineInStyles.tableIcon,
                              color: colors.primary,
                            }}
                          />
                        )}

                        {/* Table Name */}
                        <div style={dineInStyles.tableName} className="dine-in-table-name-mobile">
                          {table.table_name}
                        </div>

                        {/* Status Badge - Container to ensure new line */}
                        <div style={{ marginTop: 8 }}>
                          <div
                            style={{
                              ...dineInStyles.statusBadge,
                              background: colors.primary,
                              color: "#fff",
                            }}
                          >
                            {isInactive
                              ? "ปิดใช้งาน"
                              : isAvailable
                              ? "ว่าง"
                              : "ไม่ว่าง"}
                          </div>
                        </div>

                        {/* Order Status Tag */}
                        {!isInactive &&
                          !isAvailable &&
                          table.active_order_status && (
                            <div style={{ marginTop: 8 }}>
                              <div
                                style={{
                                  ...dineInStyles.orderStatusTag,
                                  background: "rgba(0,0,0,0.05)",
                                  color: "#595959",
                                }}
                              >
                                {formatOrderStatus(table.active_order_status)}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          ) : (
            <div style={dineInStyles.emptyState}>
              <Empty description="ไม่พบข้อมูลโต๊ะ" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
