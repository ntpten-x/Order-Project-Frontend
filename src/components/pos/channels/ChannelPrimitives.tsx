"use client";

import React from "react";
import {
    ArrowRightOutlined,
    ClockCircleOutlined,
} from "@ant-design/icons";
import { Button, Card, Flex, Grid, Tag, Typography, theme } from "antd";

const { Text, Title } = Typography;

export type ChannelAccent = {
    primary: string;
    soft: string;
    border: string;
    gradient: string;
};

type HeroMetric = {
    label: string;
    value: React.ReactNode;
};

type ChannelHeroProps = {
    eyebrow?: string;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    icon?: React.ReactNode;
    accent: ChannelAccent;
    metrics?: HeroMetric[];
    actions?: React.ReactNode;
    footer?: React.ReactNode;
};

export function ChannelHero({
    eyebrow,
    title,
    subtitle,
    icon,
    accent,
    metrics = [],
    actions,
    footer,
}: ChannelHeroProps) {
    const { token } = theme.useToken();
    const screens = Grid.useBreakpoint();

    return (
        <div
            style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: 28,
                padding: screens.md ? 28 : 20,
                border: `1px solid ${accent.border}`,
                background: `${accent.gradient}, linear-gradient(180deg, ${token.colorBgContainer} 0%, ${token.colorBgElevated} 100%)`,
                boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: "auto -10% -35% auto",
                    width: screens.md ? 240 : 160,
                    height: screens.md ? 240 : 160,
                    borderRadius: "50%",
                    background: accent.soft,
                    filter: "blur(20px)",
                    opacity: 0.9,
                }}
            />
            <Flex vertical gap={screens.md ? 20 : 16} style={{ position: "relative" }}>
                <Flex justify="space-between" align="flex-start" gap={16} wrap="wrap">
                    <Flex gap={14} align="flex-start" style={{ minWidth: 0, flex: 1 }}>
                        {icon ? (
                            <div
                                style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 18,
                                    display: "grid",
                                    placeItems: "center",
                                    background: "#fff",
                                    border: `1px solid ${accent.border}`,
                                    color: accent.primary,
                                    flex: "0 0 auto",
                                }}
                            >
                                {icon}
                            </div>
                        ) : null}
                        <div style={{ minWidth: 0 }}>
                            {eyebrow ? (
                                <Text
                                    style={{
                                        display: "block",
                                        color: token.colorTextSecondary,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                        marginBottom: 6,
                                    }}
                                >
                                    {eyebrow}
                                </Text>
                            ) : null}
                            <Title level={screens.md ? 2 : 3} style={{ margin: 0, color: token.colorText }}>
                                {title}
                            </Title>
                            {subtitle ? (
                                <Text
                                    style={{
                                        display: "block",
                                        marginTop: 6,
                                        color: token.colorTextSecondary,
                                        fontSize: screens.md ? 15 : 14,
                                    }}
                                >
                                    {subtitle}
                                </Text>
                            ) : null}
                        </div>
                    </Flex>
                    {actions ? <Flex gap={8} wrap="wrap">{actions}</Flex> : null}
                </Flex>

                {metrics.length > 0 ? (
                    <Flex gap={12} wrap="wrap">
                        {metrics.map((metric) => (
                            <Card
                                key={metric.label}
                                size="small"
                                style={{
                                    minWidth: 140,
                                    flex: screens.md ? "1 1 0" : "1 1 140px",
                                    borderRadius: 18,
                                    borderColor: accent.border,
                                    background: "rgba(255,255,255,0.72)",
                                }}
                                styles={{ body: { padding: screens.md ? 16 : 14 } }}
                            >
                                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                                    {metric.label}
                                </Text>
                                <Text strong style={{ fontSize: screens.md ? 22 : 18, color: accent.primary }}>
                                    {metric.value}
                                </Text>
                            </Card>
                        ))}
                    </Flex>
                ) : null}

                {footer ? <div>{footer}</div> : null}
            </Flex>
        </div>
    );
}

type DashboardTileProps = {
    title: string;
    description: string;
    meta?: React.ReactNode;
    icon?: React.ReactNode;
    accent: ChannelAccent;
    onClick?: () => void;
    actionLabel?: string;
};

export function DashboardTile({
    title,
    description,
    meta,
    icon,
    accent,
    onClick,
    actionLabel = "เปิด",
}: DashboardTileProps) {
    const screens = Grid.useBreakpoint();

    return (
        <Card
            hoverable={Boolean(onClick)}
            onClick={onClick}
            style={{
                height: "100%",
                borderRadius: 24,
                borderColor: accent.border,
                background: "#fff",
                boxShadow: "0 14px 36px rgba(15, 23, 42, 0.06)",
            }}
            styles={{ body: { padding: screens.md ? 22 : 18 } }}
        >
            <Flex vertical justify="space-between" style={{ height: "100%" }} gap={18}>
                <Flex justify="space-between" align="flex-start" gap={12}>
                    <div
                        style={{
                            width: 50,
                            height: 50,
                            borderRadius: 18,
                            display: "grid",
                            placeItems: "center",
                            background: accent.soft,
                            color: accent.primary,
                            border: `1px solid ${accent.border}`,
                            flex: "0 0 auto",
                        }}
                    >
                        {icon}
                    </div>
                    {meta ? <div>{meta}</div> : null}
                </Flex>

                <div>
                    <Title level={4} style={{ margin: "0 0 6px" }}>
                        {title}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                        {description}
                    </Text>
                </div>

                <Button
                    type="text"
                    style={{
                        paddingInline: 0,
                        color: accent.primary,
                        fontWeight: 700,
                    }}
                    icon={<ArrowRightOutlined />}
                    iconPosition="end"
                >
                    {actionLabel}
                </Button>
            </Flex>
        </Card>
    );
}

type SummaryPanelProps = {
    title: string;
    value: React.ReactNode;
    hint?: React.ReactNode;
    accent?: ChannelAccent;
};

export function SummaryPanel({ title, value, hint, accent }: SummaryPanelProps) {
    return (
        <Card
            size="small"
            style={{
                borderRadius: 20,
                borderColor: accent?.border,
                background: accent ? accent.soft : "#fff",
                height: "100%",
            }}
            styles={{ body: { padding: 18 } }}
        >
            <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>
                {title}
            </Text>
            <Text strong style={{ fontSize: 24, color: accent?.primary }}>
                {value}
            </Text>
            {hint ? (
                <Text type="secondary" style={{ display: "block", marginTop: 6, fontSize: 12 }}>
                    {hint}
                </Text>
            ) : null}
        </Card>
    );
}

type ChannelOrderCardProps = {
    title: string;
    subtitle?: React.ReactNode;
    itemsCount?: number;
    amount?: number;
    status: React.ReactNode;
    accent: ChannelAccent;
    icon?: React.ReactNode;
    footerTag?: React.ReactNode;
    createdAt?: string | null;
    onClick?: () => void;
};

export function ChannelOrderCard({
    title,
    subtitle,
    itemsCount = 0,
    amount = 0,
    status,
    accent,
    icon,
    footerTag,
    createdAt,
    onClick,
}: ChannelOrderCardProps) {
    const screens = Grid.useBreakpoint();
    const age = getRelativeAge(createdAt);

    return (
        <Card
            hoverable={Boolean(onClick)}
            onClick={onClick}
            style={{
                height: "100%",
                borderRadius: 22,
                borderColor: accent.border,
                boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
            }}
            styles={{ body: { padding: screens.md ? 20 : 16 } }}
        >
            <Flex vertical gap={16} style={{ height: "100%" }}>
                <Flex justify="space-between" align="flex-start" gap={12}>
                    <Flex gap={12} align="center" style={{ minWidth: 0 }}>
                        {icon ? (
                            <div
                                style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 14,
                                    display: "grid",
                                    placeItems: "center",
                                    background: accent.soft,
                                    color: accent.primary,
                                    border: `1px solid ${accent.border}`,
                                    flex: "0 0 auto",
                                }}
                            >
                                {icon}
                            </div>
                        ) : null}
                        <div style={{ minWidth: 0 }}>
                            <Text strong style={{ display: "block", fontSize: 16 }}>
                                {title}
                            </Text>
                            {subtitle ? (
                                <Text type="secondary" ellipsis style={{ fontSize: 13 }}>
                                    {subtitle}
                                </Text>
                            ) : null}
                        </div>
                    </Flex>
                    {typeof status === "string" ? (
                        <Tag
                            style={{
                                margin: 0,
                                borderRadius: 999,
                                paddingInline: 10,
                                borderColor: accent.border,
                                background: accent.soft,
                                color: accent.primary,
                                fontWeight: 700,
                            }}
                        >
                            {status}
                        </Tag>
                    ) : (
                        status
                    )}
                </Flex>

                <Flex gap={12}>
                    <div style={{ flex: 1 }}>
                        <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                            รายการสินค้า
                        </Text>
                        <Text strong style={{ fontSize: 16 }}>
                            {itemsCount} รายการ
                        </Text>
                    </div>
                    <div style={{ flex: 1, textAlign: "right" }}>
                        <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                            ยอดรวม
                        </Text>
                        <Text strong style={{ fontSize: 18, color: accent.primary }}>
                            {formatMoney(amount)}
                        </Text>
                    </div>
                </Flex>

                <Flex justify="space-between" align="center" gap={12} style={{ marginTop: "auto" }}>
                    <Flex align="center" gap={6}>
                        <ClockCircleOutlined style={{ color: age.color }} />
                        <Text style={{ color: age.color, fontSize: 12, fontWeight: 600 }}>
                            {age.label}
                        </Text>
                    </Flex>
                    {footerTag}
                </Flex>
            </Flex>
        </Card>
    );
}

function getRelativeAge(raw?: string | null): { label: string; color: string } {
    if (!raw) {
        return { label: "ไม่ทราบเวลา", color: "#94A3B8" };
    }

    const created = new Date(raw);
    if (Number.isNaN(created.getTime())) {
        return { label: "ไม่ทราบเวลา", color: "#94A3B8" };
    }

    const diffMinutes = Math.max(0, Math.floor((Date.now() - created.getTime()) / 60_000));
    if (diffMinutes < 1) {
        return { label: "เมื่อสักครู่", color: "#16A34A" };
    }
    if (diffMinutes < 10) {
        return { label: `${diffMinutes} นาทีที่ผ่านมา`, color: "#16A34A" };
    }
    if (diffMinutes < 20) {
        return { label: `${diffMinutes} นาทีที่ผ่านมา`, color: "#D97706" };
    }
    return { label: `${diffMinutes} นาทีที่ผ่านมา`, color: "#DC2626" };
}

function formatMoney(amount: number): string {
    return `฿${Number(amount || 0).toLocaleString()}`;
}
