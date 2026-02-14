"use client";

import React from "react";
import { Typography, Button, Tag } from "antd";
import { 
    ExperimentOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleFilled,
    CloseCircleFilled
} from "@ant-design/icons";
import { IngredientsUnit } from "../../../../types/api/stock/ingredientsUnit";

const { Text } = Typography;

// ============ STYLES ============

export const pageStyles = {
    container: {
        paddingBottom: 100,
        backgroundColor: '#f8f9fc',
        minHeight: '100vh'
    },
    header: {
        background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
        padding: '20px 20px 60px 20px',
        position: 'relative' as const,
        overflow: 'hidden' as const
    },
    headerDecoCircle1: {
        position: 'absolute' as const,
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)'
    },
    headerDecoCircle2: {
        position: 'absolute' as const,
        bottom: -30,
        left: -30,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)'
    },
    headerContent: {
        position: 'relative' as const, 
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 12
    },
    headerIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        background: 'rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)'
    },
    headerActions: {
        display: 'flex',
        gap: 8
    },
    statsCard: {
        margin: '-40px 16px 0 16px',
        padding: '16px',
        background: 'white',
        borderRadius: 20,
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        display: 'flex',
        justifyContent: 'space-around',
        position: 'relative' as const,
        zIndex: 10
    },
    statItem: {
        textAlign: 'center' as const,
        flex: 1
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 700,
        display: 'block'
    },
    statLabel: {
        fontSize: 12,
        color: '#8c8c8c',
        marginTop: 2
    },
    listContainer: {
        padding: '20px 16px 0 16px'
    },
    sectionTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16
    },
    unitCard: (isActive: boolean) => ({
        marginBottom: 12,
        borderRadius: 20,
        border: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        background: isActive 
            ? 'white'
            : 'linear-gradient(to right, #fafafa, white)',
        opacity: isActive ? 1 : 0.7
    }),
    unitCardInner: {
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 14
    }
};

// ============ CSS ANIMATIONS ============

export const IngredientsUnitPageStyles = () => (
    <style>{`
        @keyframes fadeSlideIn {
            from {
                opacity: 0;
                transform: translateY(12px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .unit-card {
            animation: fadeSlideIn 0.4s ease both;
        }
        
        .unit-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important;
        }
        
        .unit-card:active {
            transform: scale(0.98);
        }
        
        /* Custom scrollbar */
        .ingredients-unit-page *::-webkit-scrollbar {
            width: 6px;
        }
        .ingredients-unit-page *::-webkit-scrollbar-track {
            background: transparent;
        }
        .ingredients-unit-page *::-webkit-scrollbar-thumb {
            background: #d9d9d9;
            border-radius: 3px;
        }
        .ingredients-unit-page *::-webkit-scrollbar-thumb:hover {
            background: #bfbfbf;
        }
    `}</style>
);





// ============ UNIT CARD COMPONENT ============

interface UnitCardProps {
    unit: IngredientsUnit;
    index: number;
    onEdit: (unit: IngredientsUnit) => void;
    onDelete: (unit: IngredientsUnit) => void;
}

export const UnitCard = ({ unit, index, onEdit, onDelete }: UnitCardProps) => {
    return (
        <div
            className="unit-card"
            style={{
                ...pageStyles.unitCard(unit.is_active),
                animationDelay: `${index * 0.03}s`
            }}
        >
            <div style={pageStyles.unitCardInner}>
                {/* Icon */}
                <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '2px solid #d3adf7'
                }}>
                    <ExperimentOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text 
                            strong 
                            style={{ fontSize: 16, color: '#1a1a2e' }}
                        >
                            {unit.display_name}
                        </Text>
                        {unit.is_active ? (
                            <CheckCircleFilled style={{ color: '#52c41a', fontSize: 14 }} />
                        ) : (
                            <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 14 }} />
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Tag 
                            color="purple" 
                            style={{ 
                                borderRadius: 8, 
                                margin: 0,
                                fontSize: 12,
                                fontWeight: 500
                            }}
                        >
                            {unit.unit_name}
                        </Tag>
                        {unit.create_date && (
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                สร้างเมื่อ: {new Date(unit.create_date).toLocaleDateString('th-TH')}
                            </Text>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(unit);
                        }}
                        style={{
                            borderRadius: 10,
                            color: '#722ed1',
                            background: '#f9f0ff'
                        }}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(unit);
                        }}
                        style={{
                            borderRadius: 10,
                            background: '#fff2f0'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};



export default IngredientsUnitPageStyles;
