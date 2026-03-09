"use client";

import React from "react";
import { Typography } from "antd";

const { Text } = Typography;

export interface StatItem {
    label: string;
    value: number | string;
    color?: string;
    subLabel?: string;
}

export interface StatsGroupProps {
    stats: StatItem[];
    columns?: number;
    style?: React.CSSProperties;
}

export const StatsGroup = ({ stats, columns, style }: StatsGroupProps) => {
    const gridTemplateColumns = columns
        ? `repeat(${columns}, minmax(0, 1fr))`
        : "repeat(auto-fit, minmax(140px, 1fr))";

    return (
        <div
            style={{
                background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                borderRadius: 18,
                border: '1px solid #e2e8f0',
                display: 'grid',
                gridTemplateColumns,
                gap: 12,
                padding: 12,
                overflow: 'hidden',
                ...style
            }}
        >
            {stats.map((stat, index) => (
                <div
                    key={index}
                    style={{
                        textAlign: 'left',
                        padding: '16px 14px',
                        border: '1px solid #edf2f7',
                        borderRadius: 14,
                        background: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        minHeight: 88,
                        boxShadow: '0 10px 22px rgba(15, 23, 42, 0.04)',
                    }}
                >
                    <span
                        style={{
                            fontSize: 24,
                            fontWeight: 700,
                            color: stat.color || '#0f172a',
                            display: 'block',
                            lineHeight: 1.2,
                            marginBottom: 6,
                        }}
                    >
                        {stat.value}
                    </span>
                    <Text style={{ fontSize: 13, color: '#475569', display: 'block', fontWeight: 600 }}>
                        {stat.label}
                    </Text>
                    {stat.subLabel && (
                        <Text type="secondary" style={{ fontSize: 11, marginTop: 4 }}>
                            {stat.subLabel}
                        </Text>
                    )}
                </div>
            ))}
        </div>
    );
};
