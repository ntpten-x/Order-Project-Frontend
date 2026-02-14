"use client";

import React from "react";
import { Typography, Avatar, Tag, Button, Checkbox, InputNumber } from "antd";
import { 
    MinusOutlined, 
    PlusOutlined, 
    CheckCircleFilled, 
    ShoppingCartOutlined,
    ArrowLeftOutlined,
    ShoppingOutlined
} from "@ant-design/icons";
import { resolveImageSource } from "../../../../utils/image/source";
const { Text, Title } = Typography;

// ============ STYLES ============

export const pageStyles = {
    container: {
        paddingBottom: 160,
        backgroundColor: '#f8f9fc',
        minHeight: '100vh'
    },
    header: {
        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
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
    itemCard: (isPurchased: boolean) => ({
        marginBottom: 12,
        borderRadius: 20,
        border: 'none',
        boxShadow: isPurchased 
            ? '0 4px 16px rgba(82, 196, 26, 0.2)' 
            : '0 2px 8px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
    }),
    itemCardInner: (isPurchased: boolean) => ({
        padding: 16,
        display: 'flex',
        alignItems: 'flex-start',
        background: isPurchased 
            ? 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)' 
            : 'white',
        position: 'relative' as const
    }),
    itemCheckbox: {
        marginTop: 6,
        marginRight: 14,
        transform: 'scale(1.3)'
    },
    avatarWrapper: {
        marginRight: 14,
        flexShrink: 0
    },
    itemInfo: {
        flex: 1,
        minWidth: 0
    },
    itemHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6
    },
    orderedTag: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        borderRadius: 12,
        padding: '4px 10px',
        color: 'white',
        fontWeight: 600,
        fontSize: 12
    },
    quantitySection: {
        marginTop: 10
    },
    quantityHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    quantityControls: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
    },
    quantityButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    quantityInput: {
        flex: 1,
        textAlign: 'center' as const,
        height: 40,
        borderRadius: 12,
        fontSize: 16,
        fontWeight: 600
    },
    floatingFooter: {
        position: 'fixed' as const,
        bottom: 70,
        left: 16,
        right: 16,
        zIndex: 99
    },
    confirmButton: (hasItems: boolean) => ({
        height: 56,
        borderRadius: 28,
        fontWeight: 700,
        fontSize: 16,
        boxShadow: hasItems ? '0 8px 24px rgba(82, 196, 26, 0.4)' : undefined,
        background: hasItems ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)' : undefined,
        border: 'none'
    }),
    modalStyles: {
        body: { padding: 0 },
        mask: {
            backdropFilter: 'blur(8px)',
            background: 'rgba(0, 0, 0, 0.45)'
        }
    }
};

// ============ CSS ANIMATIONS ============

export const BuyingPageStyles = () => (
    <style>{`
        .buying-page-modal .ant-modal-content {
            border-radius: 24px !important;
            overflow: hidden;
            padding: 0 !important;
        }
        
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
        
        .purchase-item-card {
            animation: fadeSlideIn 0.4s ease both;
        }
        
        .purchase-item-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important;
        }
        
        .buying-page .ant-input-number {
            border-radius: 12px !important;
        }
        
        .buying-page .ant-input-number-input {
            text-align: center;
            font-weight: 600;
            font-size: 16px;
        }
        
        .buying-page .ant-checkbox-inner {
            border-radius: 6px;
            width: 22px;
            height: 22px;
        }
        
        .buying-page .ant-checkbox-checked .ant-checkbox-inner {
            background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
            border-color: #52c41a;
        }
        
        .buying-page .ant-checkbox-checked .ant-checkbox-inner::after {
            left: 30%;
        }
        
        /* Custom scrollbar */
        .buying-page *::-webkit-scrollbar {
            width: 6px;
        }
        .buying-page *::-webkit-scrollbar-track {
            background: transparent;
        }
        .buying-page *::-webkit-scrollbar-thumb {
            background: #d9d9d9;
            border-radius: 3px;
        }
        .buying-page *::-webkit-scrollbar-thumb:hover {
            background: #bfbfbf;
        }
    `}</style>
);

// ============ HEADER COMPONENT ============

interface HeaderProps {
    orderId?: string;
    onBack: () => void;
}

export const PageHeader = ({ orderId, onBack }: HeaderProps) => (
    <div style={pageStyles.header}>
        {/* Decorative circles */}
        <div style={pageStyles.headerDecoCircle1} />
        <div style={pageStyles.headerDecoCircle2} />
        
        {/* Header Content */}
        <div style={pageStyles.headerContent}>
            <Button 
                type="text" 
                icon={<ArrowLeftOutlined style={{ fontSize: 20, color: 'white' }} />}
                onClick={onBack}
                style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            />
            <div style={pageStyles.headerIconBox}>
                <ShoppingCartOutlined style={{ fontSize: 24, color: 'white' }} />
            </div>
            <div>
                <Text style={{ 
                    color: 'rgba(255,255,255,0.85)', 
                    fontSize: 13,
                    display: 'block'
                }}>
                    ทำการสั่งซื้อ
                </Text>
                <Title level={4} style={{ 
                    color: 'white', 
                    margin: 0,
                    fontWeight: 700,
                    letterSpacing: '0.5px'
                }}>
                    #{orderId?.substring(0, 8).toUpperCase() || '...'}
                </Title>
            </div>
        </div>
    </div>
);

// ============ STATS CARD COMPONENT ============

interface StatsCardProps {
    totalItems: number;
    purchasedItems: number;
    notPurchasedItems: number;
}

export const StatsCard = ({ totalItems, purchasedItems, notPurchasedItems }: StatsCardProps) => (
    <div style={pageStyles.statsCard}>
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#667eea' }}>{totalItems}</span>
            <Text style={pageStyles.statLabel}>รายการทั้งหมด</Text>
        </div>
        <div style={{ width: 1, background: '#f0f0f0' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#52c41a' }}>{purchasedItems}</span>
            <Text style={pageStyles.statLabel}>เลือกซื้อแล้ว</Text>
        </div>
        <div style={{ width: 1, background: '#f0f0f0' }} />
        <div style={pageStyles.statItem}>
            <span style={{ ...pageStyles.statNumber, color: '#faad14' }}>{notPurchasedItems}</span>
            <Text style={pageStyles.statLabel}>ยังไม่เลือก</Text>
        </div>
    </div>
);

// ============ PURCHASE ITEM CARD COMPONENT ============

interface PurchaseItemState {
    ingredient_id: string;
    actual_quantity: number;
    ordered_quantity: number;
    is_purchased: boolean;
    display_name: string;
    unit_name: string;
    img_url?: string;
    description?: string;
}

interface PurchaseItemCardProps {
    item: PurchaseItemState;
    index: number;
    onCheck: (id: string, checked: boolean) => void;
    onQuantityChange: (id: string, val: number | null) => void;
    onSetFullAmount: (id: string) => void;
}

export const PurchaseItemCard = ({ 
    item, 
    index, 
    onCheck, 
    onQuantityChange, 
    onSetFullAmount 
}: PurchaseItemCardProps) => (
    <div
        className="purchase-item-card"
        style={{
            ...pageStyles.itemCard(item.is_purchased),
            animationDelay: `${index * 0.05}s`
        }}
        onClick={() => !item.is_purchased && onCheck(item.ingredient_id, true)}
    >
        <div style={pageStyles.itemCardInner(item.is_purchased)}>
            <Checkbox 
                checked={item.is_purchased} 
                onChange={(e) => {
                    e.stopPropagation();
                    onCheck(item.ingredient_id, e.target.checked);
                }}
                style={pageStyles.itemCheckbox}
            />
            
            {/* Avatar without badge to avoid overlap */}
            <Avatar 
                src={resolveImageSource(item.img_url, "https://placehold.co/72x72/f5f5f5/999999?text=Preview") || undefined} 
                shape="square" 
                size={72} 
                style={{ 
                    borderRadius: 16, 
                    border: item.is_purchased ? '3px solid #52c41a' : '3px solid white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    marginRight: 14,
                    flexShrink: 0
                }}
            />
            
            <div style={pageStyles.itemInfo}>
                {/* Name and Tag in separate rows */}
                <div style={{ marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <Text 
                            strong 
                            style={{ 
                                fontSize: 16, 
                                color: '#1a1a2e'
                            }} 
                            ellipsis={{ tooltip: item.display_name }}
                        >
                            {item.display_name}
                        </Text>
                        {item.is_purchased && (
                            <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />
                        )}
                    </div>
                    {/* Description */}
                    {item.description && (
                        <Text 
                            type="secondary" 
                            style={{ 
                                fontSize: 12, 
                                display: 'block',
                                marginBottom: 4
                            }}
                            ellipsis={{ tooltip: item.description }}
                        >
                            {item.description}
                        </Text>
                    )}
                    {/* Ordered quantity tag */}
                    <Tag style={pageStyles.orderedTag}>
                        สั่ง {item.ordered_quantity} {item.unit_name}
                    </Tag>
                </div>
                
                {!item.is_purchased ? (
                    <Button 
                        size="large" 
                        type="dashed" 
                        block
                        onClick={(e) => {
                            e.stopPropagation();
                            onCheck(item.ingredient_id, true);
                        }}
                        style={{ 
                            color: '#8c8c8c',
                            borderRadius: 12,
                            marginTop: 8
                        }}
                    >
                        <ShoppingOutlined style={{ marginRight: 6 }} />
                        แตะเพื่อเลือกซื้อ
                    </Button>
                ) : (
                    <div 
                        style={pageStyles.quantitySection}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={pageStyles.quantityHeader}>
                            <Text style={{ fontSize: 13, color: '#666' }}>
                                จำนวนที่ซื้อจริง ({item.unit_name})
                            </Text>
                            <Button
                                type="link"
                                size="small"
                                onClick={() => onSetFullAmount(item.ingredient_id)}
                                style={{ 
                                    padding: '4px 8px',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}
                            >
                                เต็มจำนวน
                            </Button>
                        </div>
                        <div style={pageStyles.quantityControls}>
                            <Button 
                                icon={<MinusOutlined />}
                                style={pageStyles.quantityButton}
                                onClick={() => {
                                    const newVal = Math.max(0, item.actual_quantity - 1);
                                    onQuantityChange(item.ingredient_id, newVal);
                                }}
                            />
                            <InputNumber 
                                min={0} 
                                value={item.actual_quantity} 
                                onChange={(v) => onQuantityChange(item.ingredient_id, v)}
                                style={pageStyles.quantityInput}
                                controls={false}
                            />
                            <Button 
                                icon={<PlusOutlined />}
                                style={pageStyles.quantityButton}
                                onClick={() => {
                                    const newVal = item.actual_quantity + 1;
                                    onQuantityChange(item.ingredient_id, newVal);
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
);

// ============ MODAL HEADER COMPONENT ============

export const ModalHeader = () => (
    <div style={{
        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
    }}>
        {/* Decorative circles */}
        <div style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)'
        }} />
        <div style={{
            position: 'absolute',
            bottom: -20,
            left: -20,
            width: 70,
            height: 70,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)'
        }} />
        
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12,
            position: 'relative',
            zIndex: 1
        }}>
            <div style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)'
            }}>
                <CheckCircleFilled style={{ fontSize: 22, color: 'white' }} />
            </div>
            <div>
                <Text style={{ 
                    color: 'rgba(255,255,255,0.9)', 
                    fontSize: 13,
                    display: 'block'
                }}>
                    ยืนยันการสั่งซื้อ
                </Text>
                <Title level={4} style={{ 
                    color: 'white', 
                    margin: 0,
                    fontWeight: 700
                }}>
                    สรุปรายการ
                </Title>
            </div>
        </div>
    </div>
);

// ============ MODAL ITEM CARD COMPONENT ============

interface ModalItemCardProps {
    item: PurchaseItemState;
    index: number;
}

export const ModalItemCard = ({ item, index }: ModalItemCardProps) => {
    const diff = item.actual_quantity - item.ordered_quantity;
    
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: 14,
                background: '#fafafa',
                borderRadius: 16,
                marginBottom: 10,
                animation: `fadeSlideIn 0.3s ease ${index * 0.05}s both`
            }}
        >
            <Avatar 
                src={resolveImageSource(item.img_url, "https://placehold.co/56x56/f5f5f5/999999?text=Preview") || undefined} 
                shape="square" 
                size={56}
                style={{ 
                    borderRadius: 12,
                    border: '2px solid white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
                <Text 
                    strong 
                    style={{ fontSize: 15, display: 'block', color: '#1a1a2e' }}
                    ellipsis={{ tooltip: item.display_name }}
                >
                    {item.display_name}
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Text style={{ fontSize: 13 }}>
                        ซื้อ: <Text strong style={{ color: '#52c41a' }}>{item.actual_quantity}</Text>
                    </Text>
                    <Text type="secondary">/</Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                        สั่ง: {item.ordered_quantity}
                    </Text>
                </div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{
                    padding: '8px 14px',
                    borderRadius: 12,
                    fontWeight: 600,
                    fontSize: 14,
                    background: diff === 0 
                        ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
                        : diff > 0 
                            ? 'linear-gradient(135deg, #1890ff 0%, #69c0ff 100%)'
                            : 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                    color: 'white',
                    minWidth: 60,
                    textAlign: 'center'
                }}>
                    {diff === 0 ? 'ครบ' : diff > 0 ? `+${diff}` : diff}
                </div>
                <Text style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2, display: 'block' }}>
                    {item.unit_name}
                </Text>
            </div>
        </div>
    );
};

// ============ WARNING BANNER COMPONENT ============

interface WarningBannerProps {
    count: number;
}

export const WarningBanner = ({ count }: WarningBannerProps) => (
    <div style={{ 
        marginTop: 16, 
        padding: '14px 16px', 
        background: 'linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)',
        borderRadius: 14, 
        border: '1px solid #ffe58f',
        display: 'flex',
        alignItems: 'center',
        gap: 10
    }}>
        <div style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: '#faad14',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 16,
            fontWeight: 700
        }}>
            !
        </div>
        <Text style={{ color: '#ad6800', fontSize: 13 }}>
            มี <Text strong>{count}</Text> รายการที่ <Text strong>&quot;ไม่ได้เลือก&quot;</Text> (จะถูกบันทึกว่าไม่ได้ซื้อ)
        </Text>
    </div>
);
