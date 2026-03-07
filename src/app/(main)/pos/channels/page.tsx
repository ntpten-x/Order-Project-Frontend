"use client";

import React, { useEffect, useMemo } from "react";
import {
    ClockCircleOutlined,
    RocketOutlined,
    ShopOutlined,
    ShoppingOutlined,
} from "@ant-design/icons";
import { Col, Row, Skeleton, Tag } from "antd";
import { useRouter } from "next/navigation";

import { ChannelHero, DashboardTile, SummaryPanel, type ChannelAccent } from "../../../../components/pos/channels/ChannelPrimitives";
import { AccessGuardFallback } from "../../../../components/pos/AccessGuard";
import PageContainer from "../../../../components/ui/page/PageContainer";
import PageSection from "../../../../components/ui/page/PageSection";
import PageStack from "../../../../components/ui/page/PageStack";
import { useChannelStats } from "../../../../utils/channels/channelStats.utils";
import { useAuth } from "../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../hooks/useEffectivePermissions";
import { useShift } from "../../../../contexts/pos/ShiftContext";

const accents: Record<"dineIn" | "takeaway" | "delivery", ChannelAccent> = {
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
};

export default function ChannelSelectionPage() {
    const { user, loading: authLoading } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const router = useRouter();
    const { currentShift } = useShift();
    const { stats, isLoading } = useChannelStats();



    useEffect(() => {
        if (authLoading || permissionLoading || !can("orders.page", "view")) {
            return;
        }
        ["/pos/channels/dine-in", "/pos/channels/takeaway", "/pos/channels/delivery"].forEach((path) =>
            router.prefetch(path)
        );
    }, [authLoading, can, permissionLoading, router]);

    const channels = useMemo(
        () => [
            {
                key: "dine-in",
                title: "หน้าร้าน",
                description: "เลือกโต๊ะ ดูสถานะโต๊ะ และเปิดออเดอร์สำหรับลูกค้านั่งทาน",
                icon: <ShopOutlined style={{ fontSize: 22 }} />,
                accent: accents.dineIn,
                path: "/pos/channels/dine-in",
                count: stats?.dineIn ?? 0,
                hint: "เหมาะกับหน้าร้านและโต๊ะภายในร้าน",
            },
            {
                key: "takeaway",
                title: "สั่งกลับบ้าน",
                description: "รวมออเดอร์กลับบ้านที่กำลังทำและรายการที่รอชำระเงิน",
                icon: <ShoppingOutlined style={{ fontSize: 22 }} />,
                accent: accents.takeaway,
                path: "/pos/channels/takeaway",
                count: stats?.takeaway ?? 0,
                hint: `รอชำระ ${stats?.takeaway_waiting_payment ?? 0} รายการ`,
            },
            {
                key: "delivery",
                title: "เดลิเวอรี่",
                description: "ดูงานที่ต้องจัดส่งและเริ่มออเดอร์ใหม่ตามผู้ให้บริการได้ทันที",
                icon: <RocketOutlined style={{ fontSize: 22 }} />,
                accent: accents.delivery,
                path: "/pos/channels/delivery",
                count: stats?.delivery ?? 0,
                hint: `รอส่ง ${stats?.delivery_waiting_payment ?? 0} รายการ`,
            },
        ],
        [stats]
    );

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
                    eyebrow="Sales Channels"
                    title="เลือกช่องทางขาย"
                    subtitle="ทุกช่องทางถูกออกแบบให้กดน้อย มองสถานะง่าย และรองรับการทำงานต่อเนื่องทั้งคอม แท็บเล็ต และมือถือ"
                    icon={<ClockCircleOutlined style={{ fontSize: 22 }} />}
                    accent={{
                        primary: "#0F172A",
                        soft: "#F8FAFC",
                        border: "#E2E8F0",
                        gradient: "linear-gradient(135deg, rgba(15,23,42,0.08) 0%, rgba(255,255,255,0.96) 72%)",
                    }}
                    metrics={[
                        { label: "รวมทุกช่องทาง", value: stats?.total ?? 0 },
                        { label: "กลับบ้านรอชำระ", value: stats?.takeaway_waiting_payment ?? 0 },
                        { label: "เดลิเวอรี่รอส่ง", value: stats?.delivery_waiting_payment ?? 0 },
                    ]}
                    footer={
                        <Tag color={currentShift ? "success" : "warning"} style={{ margin: 0, borderRadius: 999, paddingInline: 12 }}>
                            {currentShift ? "พร้อมรับออเดอร์" : "ยังไม่เปิดกะ"}
                        </Tag>
                    }
                />

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={17}>
                        <PageSection title="ช่องทางขายทั้งหมด">
                            {isLoading ? (
                                <Skeleton active paragraph={{ rows: 6 }} />
                            ) : (
                                <Row gutter={[16, 16]}>
                                    {channels.map((channel) => (
                                        <Col xs={24} md={12} xl={8} key={channel.key}>
                                            <DashboardTile
                                                title={channel.title}
                                                description={channel.description}
                                                icon={channel.icon}
                                                accent={channel.accent}
                                                meta={
                                                    <Tag
                                                        style={{
                                                            margin: 0,
                                                            borderRadius: 999,
                                                            paddingInline: 10,
                                                            background: channel.accent.soft,
                                                            borderColor: channel.accent.border,
                                                            color: channel.accent.primary,
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {channel.count} รายการ
                                                    </Tag>
                                                }
                                                onClick={() => router.push(channel.path)}
                                            />
                                        </Col>
                                    ))}
                                </Row>
                            )}
                        </PageSection>
                    </Col>

                    <Col xs={24} lg={7}>
                        <PageSection title="สรุปย่อ">
                            <PageStack gap={12}>
                                <SummaryPanel title="หน้าร้าน" value={stats?.dineIn ?? 0} hint="ออเดอร์ที่ผูกกับโต๊ะ" accent={accents.dineIn} />
                                <SummaryPanel title="สั่งกลับบ้าน" value={stats?.takeaway ?? 0} hint={channels[1].hint} accent={accents.takeaway} />
                                <SummaryPanel title="เดลิเวอรี่" value={stats?.delivery ?? 0} hint={channels[2].hint} accent={accents.delivery} />
                            </PageStack>
                        </PageSection>
                    </Col>
                </Row>
            </PageStack>
        </PageContainer>
    );
}
