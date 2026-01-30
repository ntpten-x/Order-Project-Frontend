"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Typography, Row, Col, Empty } from "antd";
import {
  ShopOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useTables } from "@/hooks/pos/useTables";
import { posPageStyles, tableColors, channelColors } from "@/theme/pos";
import { channelPageStyles } from "@/theme/pos/channels/style";
import { POSGlobalStyles } from "@/theme/pos/GlobalStyles";
import { getTableNavigationPath } from "@/utils/orders";
import { useGlobalLoading } from "@/contexts/pos/GlobalLoadingContext";
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
  const { showLoading, hideLoading } = useGlobalLoading();
  const { tables, isLoading } = useTables();
  
  // Use global loading for initial tables fetch
  React.useEffect(() => {
    if (isLoading) {
      showLoading();
    } else {
      hideLoading();
    }
  }, [isLoading, showLoading, hideLoading]);

  // Calculate statistics and sort tables
  const stats = useMemo(() => getTableStats(tables), [tables]);
  const activeTables = useMemo(() => getActiveTables(tables), [tables]);
  const sortedTables = useMemo(() => sortTables(activeTables), [activeTables]);

  return (
    <>
      <POSGlobalStyles />
      <div style={posPageStyles.container}>
        {/* Header Section */}
        <div style={{ ...channelPageStyles.channelHeader, background: channelColors.dineIn.gradient }} className="dine-in-header-mobile">
          <div className="header-pattern"></div>

          <div style={channelPageStyles.channelHeaderContent} className="dine-in-header-content-mobile">
            {/* Back Button */}
            <div
              className="back-button-hover dine-in-back-button-mobile"
              style={channelPageStyles.channelBackButton}
              onClick={() => router.push("/pos/channels")}
            >
              <ArrowLeftOutlined />
              <span>กลับ</span>
            </div>

            {/* Title Section */}
            <div style={channelPageStyles.channelTitleSection} className="dine-in-title-section-mobile">
              <ShopOutlined style={channelPageStyles.channelHeaderIcon} className="dine-in-header-icon-mobile" />
              <div>
                <Title level={3} style={channelPageStyles.channelHeaderTitle} className="dine-in-header-title-mobile">
                  เลือกโต๊ะ
                </Title>
                <Text style={channelPageStyles.channelHeaderSubtitle}>Dine In</Text>
              </div>
            </div>

            {/* Statistics Bar */}
            <div style={channelPageStyles.channelStatsBar} className="dine-in-stats-bar-mobile">
              <div style={channelPageStyles.statItem}>
                <span
                  style={{
                    ...channelPageStyles.statDot,
                    background: tableColors.available.primary,
                  }}
                />
                <Text style={channelPageStyles.statText}>
                  ว่าง {stats.available}
                </Text>
              </div>
              <div style={channelPageStyles.statItem}>
                <span
                  style={{
                    ...channelPageStyles.statDot,
                    background: tableColors.occupied.primary,
                  }}
                />
                <Text style={channelPageStyles.statText}>
                  ไม่ว่าง {stats.occupied}
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px 24px' }} className="dine-in-content-mobile">
          {tables.length > 0 ? (
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
                        ...channelPageStyles.channelPageCard,
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
                          ...channelPageStyles.channelPageCardGradientOverlay,
                          background: colors.gradient,
                        }}
                      />

                        {/* Card Content */}
                        <div style={channelPageStyles.channelPageCardInner}>
                          {/* Icon logic based on specific status */}
                          {isInactive ? (
                            <StopOutlined
                              className="dine-in-table-icon-mobile"
                              style={{
                                ...channelPageStyles.channelPageCardIcon,
                                color: colors.primary,
                              }}
                            />
                          ) : isAvailable ? (
                            <ShopOutlined
                              className="dine-in-table-icon-mobile"
                              style={{
                                ...channelPageStyles.channelPageCardIcon,
                                color: colors.primary,
                                opacity: 0.6
                              }}
                            />
                          ) : (
                            <CloseCircleOutlined
                              className="pulse-soft dine-in-table-icon-mobile"
                              style={{
                                ...channelPageStyles.channelPageCardIcon,
                                color: colors.primary,
                              }}
                            />
                          )}

                          {/* Table Name */}
                          <div style={channelPageStyles.channelPageCardMainText} className="dine-in-table-name-mobile">
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
                                ...channelPageStyles.channelPageCardStatusBadge,
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
            <div style={{ 
                background: '#fff', 
                borderRadius: 24, 
                padding: '80px 24px', 
                textAlign: 'center',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)' 
            }}>
              <Empty description="ไม่พบข้อมูลโต๊ะ" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
