"use client";

import React from "react";
import { Typography, Tag, Button } from "antd";
import { 
    EditOutlined,
    DeleteOutlined,
    CheckCircleFilled,
    CloseCircleFilled,
    ShoppingOutlined
} from "@ant-design/icons";
import { Ingredients } from "../../../../types/api/stock/ingredients";
import { resolveImageSource } from "../../../../utils/image/source";
import SmartAvatar from "../../../../components/ui/image/SmartAvatar";
const { Text } = Typography;

// ============ STYLES ============

export const pageStyles = {
    container: {
        paddingBottom: 100,
        backgroundColor: '#f8f9fc',
        minHeight: '100vh'
    },
    header: {
        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
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
    ingredientCard: (isActive: boolean) => ({
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
    ingredientCardInner: {
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 14
    }
};

// ============ CSS ANIMATIONS ============

export const IngredientsPageStyles = () => (
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
        
        .ingredient-card {
            animation: fadeSlideIn 0.4s ease both;
        }
        
        .ingredient-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important;
        }
        
        .ingredient-card:active {
            transform: scale(0.98);
        }
        
        /* Custom scrollbar */
        .ingredients-page *::-webkit-scrollbar {
            width: 6px;
        }
        .ingredients-page *::-webkit-scrollbar-track {
            background: transparent;
        }
        .ingredients-page *::-webkit-scrollbar-thumb {
            background: #d9d9d9;
            border-radius: 3px;
        }
        .ingredients-page *::-webkit-scrollbar-thumb:hover {
            background: #bfbfbf;
        }
    `}</style>
);





// ============ INGREDIENT CARD COMPONENT ============

interface IngredientCardProps {
    ingredient: Ingredients;
    index: number;
    onEdit: (ingredient: Ingredients) => void;
    onDelete: (ingredient: Ingredients) => void;
}

export const IngredientCard = ({ ingredient, index, onEdit, onDelete }: IngredientCardProps) => {
    return (
        <div
            className="ingredient-card"
            style={{
                ...pageStyles.ingredientCard(ingredient.is_active),
                animationDelay: `${index * 0.03}s`
            }}
        >
            <div style={pageStyles.ingredientCardInner}>
                {/* Image */}
                <SmartAvatar
                    src={resolveImageSource(ingredient.img_url, "https://placehold.co/64x64/f5f5f5/999999?text=Preview")}
                    alt={ingredient.display_name}
                    size={64}
                    shape="square"
                    icon={<ShoppingOutlined />}
                    imageStyle={{ objectFit: "cover" }}
                    style={{
                        borderRadius: 14,
                        border: '2px solid #f0f0f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        flexShrink: 0
                    }}
                />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text 
                            strong 
                            style={{ fontSize: 16, color: '#1a1a2e' }}
                            ellipsis={{ tooltip: ingredient.display_name }}
                        >
                            {ingredient.display_name}
                        </Text>
                        {ingredient.is_active ? (
                            <CheckCircleFilled style={{ color: '#52c41a', fontSize: 14 }} />
                        ) : (
                            <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 14 }} />
                        )}
                    </div>
                    <Text 
                        type="secondary" 
                        style={{ fontSize: 13, display: 'block', marginBottom: 6 }}
                        ellipsis={{ tooltip: ingredient.ingredient_name }}
                    >
                        {ingredient.ingredient_name}
                    </Text>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Tag 
                            color="blue" 
                            style={{ 
                                borderRadius: 8, 
                                margin: 0,
                                fontSize: 11 
                            }}
                        >
                            {ingredient.unit?.display_name || '-'}
                        </Tag>
                        {ingredient.description && (
                            <Tag 
                                style={{ 
                                    borderRadius: 8, 
                                    margin: 0,
                                    fontSize: 11,
                                    background: '#f5f5f5',
                                    border: 'none',
                                    color: '#666'
                                }}
                            >
                                {ingredient.description.length > 20 
                                    ? ingredient.description.substring(0, 20) + '...' 
                                    : ingredient.description
                                }
                            </Tag>
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
                            onEdit(ingredient);
                        }}
                        style={{
                            borderRadius: 10,
                            color: '#1890ff',
                            background: '#e6f7ff'
                        }}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(ingredient);
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



export default IngredientsPageStyles;
