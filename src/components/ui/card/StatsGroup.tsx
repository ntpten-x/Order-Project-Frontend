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
    const gridColumns = columns || stats.length || 3;

    return (
        <div
            style={{
                background: '#fff',
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                display: 'grid',
                gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                gap: 8,
                padding: 14,
                ...style
            }}
        >
            {stats.map((stat, index) => (
                <div 
                    key={index} 
                    style={{ 
                        textAlign: 'center',
                        borderRight: index < stats.length - 1 ? '1px solid #f1f5f9' : 'none'
                    }}
                >
                    <span 
                        style={{ 
                            fontSize: 24, 
                            fontWeight: 700, 
                            color: stat.color || '#0f172a', 
                            display: 'block',
                            lineHeight: 1.2
                        }}
                    >
                        {stat.value}
                    </span>
                    <Text style={{ fontSize: 12, color: '#64748b', display: 'block' }}>
                        {stat.label}
                    </Text>
                    {stat.subLabel && (
                        <Text type="secondary" style={{ fontSize: 10 }}>
                            {stat.subLabel}
                        </Text>
                    )}
                </div>
            ))}
        </div>
    );
};
