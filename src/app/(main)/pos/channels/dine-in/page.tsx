"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Typography, Row, Col, Empty, Button } from "antd";
import {
    ShopOutlined,
    CloseCircleOutlined,
    ArrowLeftOutlined,
    StopOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import { Tables } from "../../../../../types/api/pos/tables";
import { useTables } from "../../../../../hooks/pos/useTables";
import { posPageStyles, tableColors, channelColors } from "../../../../../theme/pos";
import { channelPageStyles, channelsResponsiveStyles } from "../../../../../theme/pos/channels/style";
import { POSGlobalStyles } from "../../../../../theme/pos/GlobalStyles";
import { getTableNavigationPath } from "../../../../../utils/orders";
import { useGlobalLoading } from "../../../../../contexts/pos/GlobalLoadingContext";
import {
    getTableStats,
    sortTables,
    getActiveTables,
    getTableColorScheme,
    formatOrderStatus,
} from "../../../../../utils/channels";

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
    const stats = useMemo(() => getTableStats(tables as Tables[]), [tables]);
    const activeTables = useMemo(() => getActiveTables(tables as Tables[]), [tables]);
    const sortedTables = useMemo(() => sortTables(activeTables as Tables[]), [activeTables]);

    const handleTableClick = (table: Tables, isInactive: boolean) => {
        if (!isInactive) {
            const link = getTableNavigationPath(table);
            router.push(link);
        }
    };

    return (
        <>
            <POSGlobalStyles />
            <style jsx global>{channelsResponsiveStyles}</style>
            <style jsx global>{`
                /* Table Card Hover Effects */
                .table-card-hover {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                .table-card-hover:hover {
                    transform: translateY(-6px) !important;
                    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08) !important;
                }
                .table-card-hover:hover .table-icon {
                    transform: scale(1.1) !important;
                }
                .table-card-hover:active {
                    transform: translateY(-2px) scale(0.98) !important;
                }
                @media (hover: none) {
                    .table-card-hover:active {
                        transform: scale(0.97) !important;
                    }
                    .table-card-hover:hover {
                        transform: none !important;
                    }
                }
                /* Table Icon Container */
                .table-icon-wrapper {
                    width: 64px;
                    height: 64px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 12px;
                    position: relative;
                    transition: all 0.3s ease;
                }
                /* Pulse animation for occupied tables */
                .pulse-soft {
                    animation: pulseSoft 2s ease-in-out infinite;
                }
                @keyframes pulseSoft {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.9; }
                }
                /* Back button hover */
                .back-button-hover:hover {
                    background: rgba(255, 255, 255, 0.28) !important;
                    transform: translateX(-2px);
                }
                /* Show on mobile */
                .show-on-mobile { display: none !important; }
                @media (max-width: 768px) {
                    .show-on-mobile { display: inline !important; }
                }
            `}</style>
            
            <div style={posPageStyles.container}>
                {/* Header Section */}
                <header
                    style={{ ...channelPageStyles.channelHeader, background: channelColors.dineIn.gradient }}
                    className="dine-in-header-mobile"
                    role="banner"
                >
                    <div className="header-pattern"></div>
                    <div className="header-circle circle-1"></div>
                    <div className="header-circle circle-2"></div>

                    <div style={channelPageStyles.channelHeaderContent} className="dine-in-header-content-mobile">
                        {/* Back Button */}
                        <button
                            className="back-button-hover dine-in-back-button-mobile"
                            style={channelPageStyles.channelBackButton}
                            onClick={() => router.push("/pos/channels")}
                            aria-label="กลับไปหน้าเลือกช่องทาง"
                        >
                            <ArrowLeftOutlined />
                            <span>กลับ</span>
                        </button>

                        {/* Title Section */}
                        <div style={channelPageStyles.channelTitleSection} className="dine-in-title-section-mobile">
                            <ShopOutlined style={channelPageStyles.channelHeaderIcon} className="dine-in-header-icon-mobile" aria-hidden="true" />
                            <div>
                                <Title level={3} style={channelPageStyles.channelHeaderTitle} className="dine-in-header-title-mobile">
                                    เลือกโต๊ะ
                                </Title>
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
                </header>

                {/* Content Section */}
                <main style={{ maxWidth: 1400, margin: '24px auto 0', padding: '0 16px 32px' }} className="dine-in-content-mobile" role="main">
                    {(tables as Tables[]).length > 0 ? (
                        <Row gutter={[16, 16]}>
                            {(sortedTables as Tables[]).map((table: Tables, index: number) => {
                                const colorScheme = getTableColorScheme(table);
                                const colors = tableColors[colorScheme];
                                const isAvailable = table.status === "Available";
                                const isInactive = !table.is_active;

                                return (
                                    <Col xs={12} sm={8} md={6} lg={6} xl={4} key={table.id}>
                                        <article
                                            className={`table-card-hover dine-in-table-card dine-in-table-card-mobile table-card-animate table-card-delay-${(index % 6) + 1}`}
                                            style={{
                                                ...channelPageStyles.channelPageCard,
                                                background: isInactive ? '#F8FAFC' : colors.light,
                                                border: `2px solid ${colors.border}`,
                                                opacity: isInactive ? 0.5 : 1,
                                                cursor: isInactive ? 'not-allowed' : 'pointer',
                                            }}
                                            onClick={() => handleTableClick(table, isInactive)}
                                            onKeyDown={(e) => {
                                                if (!isInactive && (e.key === 'Enter' || e.key === ' ')) {
                                                    e.preventDefault();
                                                    handleTableClick(table, isInactive);
                                                }
                                            }}
                                            role="button"
                                            tabIndex={isInactive ? -1 : 0}
                                            aria-label={`โต๊ะ ${table.table_name} - ${isInactive ? 'ปิดใช้งาน' : isAvailable ? 'ว่าง' : 'ไม่ว่าง'}`}
                                            aria-disabled={isInactive}
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
                                                {/* Icon with background wrapper */}
                                                <div
                                                    className="table-icon-wrapper"
                                                    style={{
                                                        background: `${colors.primary}15`,
                                                        border: `2px solid ${colors.primary}30`,
                                                    }}
                                                >
                                                    {isInactive ? (
                                                        <StopOutlined
                                                            className="table-icon dine-in-table-icon-mobile"
                                                            style={{
                                                                fontSize: 32,
                                                                color: colors.primary,
                                                                transition: 'transform 0.3s ease',
                                                            }}
                                                        />
                                                    ) : isAvailable ? (
                                                        <CheckCircleOutlined
                                                            className="table-icon dine-in-table-icon-mobile"
                                                            style={{
                                                                fontSize: 32,
                                                                color: colors.primary,
                                                                transition: 'transform 0.3s ease',
                                                            }}
                                                        />
                                                    ) : (
                                                        <CloseCircleOutlined
                                                            className="table-icon pulse-soft dine-in-table-icon-mobile"
                                                            style={{
                                                                fontSize: 32,
                                                                color: colors.primary,
                                                                transition: 'transform 0.3s ease',
                                                            }}
                                                        />
                                                    )}
                                                </div>

                                                {/* Table Name */}
                                                <div
                                                    style={{
                                                        ...channelPageStyles.channelPageCardMainText,
                                                        fontSize: 24,
                                                        color: colors.text || colors.primary,
                                                    }}
                                                    className="dine-in-table-name-mobile"
                                                >
                                                    {table.table_name}
                                                </div>

                                                {/* Two-Tier Status Display */}
                                                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                                                    {/* Tier 1: Availability indicator */}
                                                    {!isInactive && (
                                                        <div
                                                            style={{
                                                                fontSize: 13,
                                                                fontWeight: 700,
                                                                color: isAvailable ? tableColors.available.primary : '#EF4444',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.5px',
                                                            }}
                                                        >
                                                            {isAvailable ? "● ว่าง" : "● ไม่ว่าง"}
                                                        </div>
                                                    )}

                                                    {/* Tier 2: Specific order status badge */}
                                                    <div
                                                        style={{
                                                            ...channelPageStyles.channelPageCardStatusBadge,
                                                            background: isInactive
                                                                ? "#94A3B8"
                                                                : isAvailable
                                                                    ? "rgba(16, 185, 129, 0.1)"
                                                                    : colors.primary,
                                                            color: isInactive
                                                                ? "#fff"
                                                                : isAvailable
                                                                    ? tableColors.available.primary
                                                                    : "#fff",
                                                            border: isAvailable ? `1px solid ${tableColors.available.border}` : "none",
                                                            fontSize: 12,
                                                            padding: '6px 14px',
                                                        }}
                                                    >
                                                        {isInactive
                                                            ? "ปิดใช้งาน"
                                                            : isAvailable
                                                                ? "รอรับออเดอร์"
                                                                : table.active_order_status
                                                                    ? formatOrderStatus(table.active_order_status)
                                                                    : "กำลังใช้งาน"}
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    </Col>
                                );
                            })}
                        </Row>
                    ) : (
                        <div style={channelPageStyles.emptyStateContainer}>
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                styles={{ image: { height: 100 } }}
                                description={
                                    <div style={{ marginTop: 20 }}>
                                        <Title level={4} style={{ marginBottom: 8, color: '#1E293B' }}>ยังไม่มีข้อมูลโต๊ะ</Title>
                                        <Text type="secondary" style={{ fontSize: 15 }}>กรุณาเพิ่มข้อมูลโต๊ะก่อนเริ่มการขาย</Text>
                                    </div>
                                }
                            >
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<ShopOutlined />}
                                    style={{
                                        height: 52,
                                        padding: '0 36px',
                                        borderRadius: 16,
                                        fontSize: 16,
                                        fontWeight: 600,
                                        marginTop: 20,
                                        background: channelColors.dineIn.primary,
                                        border: 'none',
                                        boxShadow: `0 8px 20px ${channelColors.dineIn.primary}40`,
                                    }}
                                    onClick={() => router.push("/pos/tables")}
                                >
                                    ไปหน้าจัดการโต๊ะ
                                </Button>
                            </Empty>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
