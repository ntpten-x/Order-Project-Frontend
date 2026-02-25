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
    const gridColumns = columns || (stats.length > 4 ? 3 : stats.length) || 3;

    return (
        <div
            style={{
                background: '#fff',
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                display: 'grid',
                gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                padding: '4px 0',
                overflow: 'hidden',
                ...style
            }}
        >
            {stats.map((stat, index) => {
                const isLastInRow = (index + 1) % gridColumns === 0 || index === stats.length - 1;
                const isLastRow = index >= Math.floor((stats.length - 1) / gridColumns) * gridColumns;

                return (
                    <div 
                        key={index} 
                        style={{ 
                            textAlign: 'center',
                            padding: '16px 12px',
                            borderRight: isLastInRow ? 'none' : '1px solid #f1f5f9',
                            borderBottom: isLastRow ? 'none' : '1px solid #f1f5f9',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            minHeight: 80
                        }}
                    >
                        <span 
                            style={{ 
                                fontSize: 22, 
                                fontWeight: 700, 
                                color: stat.color || '#0f172a', 
                                display: 'block',
                                lineHeight: 1.2,
                                marginBottom: 4
                            }}
                        >
                            {stat.value}
                        </span>
                        <Text style={{ fontSize: 13, color: '#64748b', display: 'block', fontWeight: 500 }}>
                            {stat.label}
                        </Text>
                        {stat.subLabel && (
                            <Text type="secondary" style={{ fontSize: 11, marginTop: 2 }}>
                                {stat.subLabel}
                            </Text>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
