"use client";

import React, { useEffect, useMemo } from "react";
import {
    ShopOutlined,
    ShoppingOutlined,
    RocketOutlined,
} from "@ant-design/icons";
import { Grid, Skeleton, Typography } from "antd";
import { useRouter } from "next/navigation";

import PageContainer from "../../../components/ui/page/PageContainer";
import { AccessGuardFallback } from "../../../components/pos/AccessGuard";
import { useAuth } from "../../../contexts/AuthContext";
import { useShift } from "../../../contexts/pos/ShiftContext";
import { useEffectivePermissions } from "../../../hooks/useEffectivePermissions";
import { useChannelStats, formatOrderCount } from "../../../utils/channels/channelStats.utils";

const { Title, Text } = Typography;

/* ── Accent colours per channel ── */
const channelThemes = {
    dineIn: {
        iconBg: "#EFF6FF",
        iconBorder: "#BFDBFE",
        iconColor: "#2563EB",
        badgeBg: "#EFF6FF",
        badgeBorder: "#BFDBFE",
        badgeText: "#2563EB",
        badgeDot: "#3B82F6",
    },
    takeaway: {
        iconBg: "#ECFDF5",
        iconBorder: "#A7F3D0",
        iconColor: "#059669",
        badgeBg: "#ECFDF5",
        badgeBorder: "#A7F3D0",
        badgeText: "#059669",
        badgeDot: "#10B981",
    },
    delivery: {
        iconBg: "#F5F3FF",
        iconBorder: "#DDD6FE",
        iconColor: "#7C3AED",
        badgeBg: "#F5F3FF",
        badgeBorder: "#DDD6FE",
        badgeText: "#7C3AED",
        badgeDot: "#8B5CF6",
    },
};

type ChannelKey = keyof typeof channelThemes;

interface ChannelCardData {
    key: ChannelKey;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    path: string;
    count: number;
}

/* ── Channel Card ── */
function ChannelCard({
    card,
    onClick,
    isMobile,
}: {
    card: ChannelCardData;
    onClick: () => void;
    isMobile: boolean;
}) {
    const theme = channelThemes[card.key];
    const label = formatOrderCount(card.count);
    const hasOrders = card.count > 0;

    return (
        <div
            onClick={onClick}
            className="pos-channel-card"
            style={{
                background: "#ffffff",
                borderRadius: 20,
                border: "1px solid #F1F5F9",
                padding: isMobile ? "28px 20px 24px" : "36px 24px 28px",
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: isMobile ? 12 : 16,
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.03)",
                position: "relative",
            }}
        >
            {/* Icon circle */}
            <div
                style={{
                    width: isMobile ? 72 : 80,
                    height: isMobile ? 72 : 80,
                    borderRadius: "50%",
                    background: theme.iconBg,
                    border: `1.5px solid ${theme.iconBorder}`,
                    display: "grid",
                    placeItems: "center",
                    transition: "transform 0.25s ease",
                }}
                className="pos-channel-icon"
            >
                {React.cloneElement(card.icon as React.ReactElement, {
                    style: {
                        fontSize: isMobile ? 30 : 34,
                        color: theme.iconColor,
                    },
                })}
            </div>

            {/* Labels */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span
                    style={{
                        fontSize: isMobile ? 18 : 20,
                        fontWeight: 700,
                        color: "#1E293B",
                        lineHeight: 1.3,
                    }}
                >
                    {card.title}
                </span>
                <span
                    style={{
                        fontSize: 13,
                        color: "#94A3B8",
                        fontWeight: 400,
                        letterSpacing: 0.3,
                    }}
                >
                    {card.subtitle}
                </span>
            </div>

            {/* Status badge */}
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 14px",
                    borderRadius: 999,
                    background: hasOrders ? theme.badgeBg : "#F8FAFC",
                    border: `1px solid ${hasOrders ? theme.badgeBorder : "#E2E8F0"}`,
                    transition: "all 0.2s ease",
                }}
            >
                {hasOrders && (
                    <span
                        style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: theme.badgeDot,
                            display: "inline-block",
                            flexShrink: 0,
                        }}
                    />
                )}
                <span
                    style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: hasOrders ? theme.badgeText : "#94A3B8",
                        lineHeight: 1,
                    }}
                >
                    {label}
                </span>
            </div>
        </div>
    );
}

/* ── Main Page ── */
export default function POSPage() {
    const { user, loading: authLoading } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const router = useRouter();
    const { currentShift, loading: shiftLoading } = useShift();
    const { stats, isLoading: statsLoading } = useChannelStats();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    useEffect(() => {
        if (authLoading || permissionLoading || !can("orders.page", "view")) {
            return;
        }
        [
            "/pos/channels",
            "/pos/channels/dine-in",
            "/pos/channels/takeaway",
            "/pos/channels/delivery",
            "/pos/shift",
            "/pos/shiftHistory",
            "/pos/list",
            "/pos/settings",
        ].forEach((path) => router.prefetch(path));
    }, [authLoading, can, permissionLoading, router]);

    const channelCards: ChannelCardData[] = useMemo(
        () => [
            {
                key: "dineIn" as ChannelKey,
                title: "หน้าร้าน",
                subtitle: "Dine In",
                icon: <ShopOutlined />,
                path: "/pos/channels/dine-in",
                count: stats?.dineIn ?? 0,
            },
            {
                key: "takeaway" as ChannelKey,
                title: "สั่งกลับบ้าน",
                subtitle: "Take Away",
                icon: <ShoppingOutlined />,
                path: "/pos/channels/takeaway",
                count: stats?.takeaway ?? 0,
            },
            {
                key: "delivery" as ChannelKey,
                title: "เดลิเวอรี่",
                subtitle: "Delivery",
                icon: <RocketOutlined />,
                path: "/pos/channels/delivery",
                count: stats?.delivery ?? 0,
            },
        ],
        [stats]
    );

    const isLoading = shiftLoading || statsLoading;

    if (authLoading || permissionLoading) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!can("orders.page", "view")) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    return (
        <>
            {/* Scoped hover / animation styles */}
            <style jsx global>{`
                .pos-channel-card:hover {
                    transform: translateY(-4px);
                    box-shadow:
                        0 8px 24px rgba(15, 23, 42, 0.08),
                        0 2px 8px rgba(15, 23, 42, 0.04);
                    border-color: #E2E8F0;
                }
                .pos-channel-card:active {
                    transform: translateY(-1px);
                }
                .pos-channel-card:hover .pos-channel-icon {
                    transform: scale(1.06);
                }

                /* Touch feedback for mobile */
                @media (max-width: 767px) {
                    .pos-channel-card:active {
                        transform: scale(0.98);
                        background: #fafbfc !important;
                    }
                }

                /* Entry animation */
                @keyframes posChannelFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(12px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .pos-channel-animate {
                    animation: posChannelFadeIn 0.4s ease-out forwards;
                    opacity: 0;
                }
                .pos-channel-delay-1 { animation-delay: 0.08s; }
                .pos-channel-delay-2 { animation-delay: 0.16s; }
                .pos-channel-delay-3 { animation-delay: 0.24s; }

                .pos-channel-card {
                    -webkit-user-select: none;
                    user-select: none;
                    -webkit-tap-highlight-color: transparent;
                }
            `}</style>

            <PageContainer>
                <div style={{ paddingTop: isMobile ? 4 : 12 }}>
                    {/* Page header */}
                    <div style={{ marginBottom: isMobile ? 20 : 28 }}>
                        <Title
                            level={3}
                            style={{
                                margin: 0,
                                fontSize: isMobile ? 22 : 26,
                                fontWeight: 700,
                                color: "#0F172A",
                            }}
                        >
                            ช่องทางขาย
                        </Title>
                        <Text
                            style={{
                                fontSize: 14,
                                color: "#94A3B8",
                                marginTop: 4,
                                display: "block",
                            }}
                        >
                            เลือกช่องทางขาย
                        </Text>
                    </div>

                    {/* Channel cards grid */}
                    {isLoading ? (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                                gap: 16,
                            }}
                        >
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    style={{
                                        background: "#fff",
                                        borderRadius: 20,
                                        padding: 32,
                                        border: "1px solid #F1F5F9",
                                    }}
                                >
                                    <Skeleton active paragraph={{ rows: 3 }} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                                gap: isMobile ? 14 : 20,
                            }}
                        >
                            {channelCards.map((card, i) => (
                                <div
                                    key={card.key}
                                    className={`pos-channel-animate pos-channel-delay-${i + 1}`}
                                >
                                    <ChannelCard
                                        card={card}
                                        onClick={() => router.push(card.path)}
                                        isMobile={isMobile}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Shift note */}
                    {!isLoading && !currentShift && (
                        <div
                            style={{
                                marginTop: 24,
                                padding: "14px 18px",
                                borderRadius: 14,
                                background: "#FFFBEB",
                                border: "1px solid #FDE68A",
                            }}
                        >
                            <Text style={{ fontSize: 13, color: "#92400E", lineHeight: 1.6 }}>
                                ⓘ ระบบจะจำกัดหน้าที่ต้องเปิดกะก่อนใช้งาน เช่น รับออเดอร์ใหม่ เพื่อป้องกันการเปิดออเดอร์ผิดช่วงเวลา
                            </Text>
                        </div>
                    )}
                </div>
            </PageContainer>
        </>
    );
}
