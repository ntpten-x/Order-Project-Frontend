"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, Col, Row, Space, Tag } from "antd";
import {
    ShopOutlined,
    CloseCircleOutlined,
    StopOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import PageContainer from "../../../../../components/ui/page/PageContainer";
import PageSection from "../../../../../components/ui/page/PageSection";
import UIPageHeader from "../../../../../components/ui/page/PageHeader";
import UIEmptyState from "../../../../../components/ui/states/EmptyState";
import { Tables } from "../../../../../types/api/pos/tables";
import { useTables } from "../../../../../hooks/pos/useTables";
import { posPageStyles, tableColors } from "../../../../../theme/pos";
import { channelPageStyles, channelsResponsiveStyles } from "../../../../../theme/pos/channels/style";
import { POSGlobalStyles } from "../../../../../theme/pos/GlobalStyles";
import { getTableNavigationPath } from "../../../../../utils/orders";
import { useGlobalLoading } from "../../../../../contexts/pos/GlobalLoadingContext";
import RequireOpenShift from "../../../../../components/pos/shared/RequireOpenShift";
import {
    getTableStats,
    sortTables,
    getActiveTables,
    getTableColorScheme,
    formatOrderStatus,
} from "../../../../../utils/channels";

export default function DineInTableSelectionPage() {
    return (
        <RequireOpenShift>
            <DineInTableSelectionPageContent />
        </RequireOpenShift>
    );
}

function DineInTableSelectionPageContent() {
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
                <UIPageHeader
                    title="หน้าร้าน"
                    subtitle="เลือกโต๊ะ"
                    onBack={() => router.push("/pos/channels")}
                    icon={<ShopOutlined style={{ fontSize: 20 }} />}
                    actions={
                        <Space size={8} wrap>
                            <Tag color="success">ว่าง {stats.available}</Tag>
                            <Tag color="warning">ไม่ว่าง {stats.occupied}</Tag>
                        </Space>
                    }
                />

                <PageContainer>
                    <PageSection title="โต๊ะ">
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
                        <UIEmptyState
                            title="ยังไม่มีข้อมูลโต๊ะ"
                            description="กรุณาเพิ่มข้อมูลโต๊ะก่อนเริ่มการขาย"
                            action={
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<ShopOutlined />}
                                    onClick={() => router.push("/pos/tables")}
                                >
                                    ไปหน้าจัดการโต๊ะ
                                </Button>
                            }
                        />
                    )}
                    </PageSection>
                </PageContainer>
            </div>
        </>
    );
}
