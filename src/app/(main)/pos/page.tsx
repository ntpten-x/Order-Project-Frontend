"use client";

import React, { useEffect, useMemo } from "react";
import {
    AppstoreOutlined,
    ClockCircleOutlined,
    HistoryOutlined,
    SettingOutlined,
    ShopOutlined,
    ShoppingOutlined,
    RocketOutlined,
    SwapOutlined,
} from "@ant-design/icons";
import { Button, Col, Row, Skeleton, Tag, Typography } from "antd";
import { useRouter } from "next/navigation";

import {
    ChannelHero,
    DashboardTile,
    SummaryPanel,
    type ChannelAccent,
} from "../../../components/pos/channels/ChannelPrimitives";
import PageContainer from "../../../components/ui/page/PageContainer";
import PageStack from "../../../components/ui/page/PageStack";
import PageSection from "../../../components/ui/page/PageSection";
import { AccessGuardFallback } from "../../../components/pos/AccessGuard";
import { useAuth } from "../../../contexts/AuthContext";
import { useShift } from "../../../contexts/pos/ShiftContext";
import { useShopProfile } from "../../../hooks/pos/useShopProfile";
import { useEffectivePermissions } from "../../../hooks/useEffectivePermissions";
import { useChannelStats } from "../../../utils/channels/channelStats.utils";

const { Text } = Typography;

const accents: Record<"dineIn" | "takeaway" | "delivery" | "neutral", ChannelAccent> = {
    dineIn: {
        primary: "#2563EB",
        soft: "#EFF6FF",
        border: "#BFDBFE",
        gradient: "linear-gradient(135deg, rgba(37,99,235,0.16) 0%, rgba(255,255,255,0.95) 72%)",
    },
    takeaway: {
        primary: "#EA580C",
        soft: "#FFF7ED",
        border: "#FED7AA",
        gradient: "linear-gradient(135deg, rgba(234,88,12,0.16) 0%, rgba(255,255,255,0.95) 72%)",
    },
    delivery: {
        primary: "#7C3AED",
        soft: "#F5F3FF",
        border: "#DDD6FE",
        gradient: "linear-gradient(135deg, rgba(124,58,237,0.16) 0%, rgba(255,255,255,0.95) 72%)",
    },
    neutral: {
        primary: "#0F172A",
        soft: "#F8FAFC",
        border: "#E2E8F0",
        gradient: "linear-gradient(135deg, rgba(15,23,42,0.08) 0%, rgba(255,255,255,0.96) 72%)",
    },
};

export default function POSPage() {
    const { user, loading: authLoading } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const router = useRouter();
    const { currentShift, loading: shiftLoading } = useShift();
    const { stats, isLoading: statsLoading } = useChannelStats();
    const { profile, isLoading: profileLoading } = useShopProfile();



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

    const channelCards = useMemo(
        () => [
            {
                key: "dine-in",
                title: "หน้าร้าน",
                description: "เลือกโต๊ะและเริ่มออเดอร์สำหรับลูกค้านั่งทานที่ร้าน",
                icon: <ShopOutlined style={{ fontSize: 22 }} />,
                path: "/pos/channels/dine-in",
                accent: accents.dineIn,
                count: stats?.dineIn ?? 0,
            },
            {
                key: "takeaway",
                title: "สั่งกลับบ้าน",
                description: "ดูคิวออเดอร์กลับบ้านและสร้างออเดอร์ใหม่ได้ทันที",
                icon: <ShoppingOutlined style={{ fontSize: 22 }} />,
                path: "/pos/channels/takeaway",
                accent: accents.takeaway,
                count: stats?.takeaway ?? 0,
            },
            {
                key: "delivery",
                title: "เดลิเวอรี่",
                description: "ติดตามออเดอร์จัดส่งและแยกตามผู้ให้บริการได้ชัดเจน",
                icon: <RocketOutlined style={{ fontSize: 22 }} />,
                path: "/pos/channels/delivery",
                accent: accents.delivery,
                count: stats?.delivery ?? 0,
            },
        ],
        [stats]
    );

    const isLoading = shiftLoading || statsLoading || profileLoading;

    if (authLoading || permissionLoading) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!can("orders.page", "view")) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }
    return (
        <PageContainer>
            <PageStack gap={20}>
                <ChannelHero
                    eyebrow="POS Workspace"
                    title={profile?.shop_name || "POS"}
                    subtitle={
                        currentShift
                            ? `กะกำลังเปิดอยู่ เริ่มต้นเงินทอน ${formatMoney(currentShift.start_amount)}`
                            : "เริ่มงานจากหน้าเดียว ดูภาพรวมกะขาย ช่องทางขาย และงานที่ต้องทำทันที"
                    }
                    icon={<AppstoreOutlined style={{ fontSize: 22 }} />}
                    accent={accents.neutral}
                    metrics={[
                        { label: "ออเดอร์หน้าร้าน", value: stats?.dineIn ?? 0 },
                        { label: "ออเดอร์กลับบ้าน", value: stats?.takeaway ?? 0 },
                        { label: "ออเดอร์เดลิเวอรี่", value: stats?.delivery ?? 0 },
                    ]}
                    actions={
                        <>
                            <Button onClick={() => router.push("/pos/channels")}>เปิดช่องทางขาย</Button>
                            <Button
                                type="primary"
                                onClick={() => router.push(currentShift ? "/pos/list" : "/pos/shift?openShift=1")}
                            >
                                {currentShift ? "ไปบอร์ดรายการ" : "เปิดกะขาย"}
                            </Button>
                        </>
                    }
                    footer={
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            <Tag color={currentShift ? "success" : "warning"} style={{ margin: 0, borderRadius: 999, paddingInline: 12 }}>
                                {currentShift ? "กะเปิดอยู่" : "ยังไม่เปิดกะ"}
                            </Tag>
                            {profile?.phone ? (
                                <Tag style={{ margin: 0, borderRadius: 999, paddingInline: 12 }}>
                                    โทร {profile.phone}
                                </Tag>
                            ) : null}
                        </div>
                    }
                />

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={16}>
                        <PageSection title="เริ่มงานได้ทันที">
                            {isLoading ? (
                                <Skeleton active paragraph={{ rows: 6 }} />
                            ) : (
                                <Row gutter={[16, 16]}>
                                    {channelCards.map((card) => (
                                        <Col xs={24} md={12} xl={8} key={card.key}>
                                            <DashboardTile
                                                title={card.title}
                                                description={card.description}
                                                icon={card.icon}
                                                accent={card.accent}
                                                meta={
                                                    <Tag
                                                        style={{
                                                            margin: 0,
                                                            borderRadius: 999,
                                                            paddingInline: 10,
                                                            background: card.accent.soft,
                                                            borderColor: card.accent.border,
                                                            color: card.accent.primary,
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {card.count} รายการ
                                                    </Tag>
                                                }
                                                onClick={() => router.push(card.path)}
                                            />
                                        </Col>
                                    ))}
                                </Row>
                            )}
                        </PageSection>
                    </Col>

                    <Col xs={24} lg={8}>
                        <PageSection title="งานที่เกี่ยวข้อง">
                            <PageStack gap={12}>
                                <SummaryPanel
                                    title="สถานะกะขาย"
                                    value={currentShift ? "เปิดอยู่" : "ยังไม่เปิด"}
                                    hint={currentShift ? `เปิดเมื่อ ${formatDateTime(currentShift.open_time)}` : "ต้องเปิดกะก่อนเริ่มรับออเดอร์"}
                                    accent={accents.neutral}
                                />
                                <Button block icon={<ClockCircleOutlined />} onClick={() => router.push("/pos/shift")}>
                                    จัดการกะขาย
                                </Button>
                                <Button block icon={<HistoryOutlined />} onClick={() => router.push("/pos/shiftHistory")}>
                                    ประวัติกะขาย
                                </Button>
                                <Button block icon={<SwapOutlined />} onClick={() => router.push("/pos/list")}>
                                    บอร์ดรายการสด
                                </Button>
                                <Button block icon={<SettingOutlined />} onClick={() => router.push("/pos/settings")}>
                                    ตั้งค่าร้าน
                                </Button>
                            </PageStack>
                        </PageSection>
                    </Col>
                </Row>

                {!isLoading && !currentShift ? (
                    <PageSection title="หมายเหตุ">
                        <Text type="secondary">
                            ระบบจะจำกัดหน้าที่ต้องเปิดกะก่อนใช้งาน เช่น รับออเดอร์ใหม่หรือเข้าหน้าช่องทางขายย่อย เพื่อป้องกันการเปิดออเดอร์ผิดช่วงเวลา
                        </Text>
                    </PageSection>
                ) : null}
            </PageStack>
        </PageContainer>
    );
}

function formatMoney(value: number): string {
    return `฿${Number(value || 0).toLocaleString()}`;
}

function formatDateTime(value?: string): string {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}
