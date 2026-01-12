"use client";

import React from "react";
import Image from "next/image";
import { Typography, Button } from "antd";
import { 
    ArrowLeftOutlined,
    SaveOutlined,
    DeleteOutlined,
    PlusCircleOutlined,
    EditOutlined,
    ShopOutlined
} from "@ant-design/icons";

const { Text, Title } = Typography;

// ============ STYLES ============

export const pageStyles = {
    container: {
        paddingBottom: 100,
        backgroundColor: '#f8f9fc',
        minHeight: '100vh'
    },
    header: (isEdit: boolean) => ({
        background: isEdit 
            ? 'linear-gradient(135deg, #faad14 0%, #fa8c16 100%)'
            : 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
        padding: '20px 20px 60px 20px',
        position: 'relative' as const,
        overflow: 'hidden' as const
    }),
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
    formCard: {
        margin: '-40px 16px 0 16px',
        padding: '24px',
        background: 'white',
        borderRadius: 20,
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        position: 'relative' as const,
        zIndex: 10
    },
    formSection: {
        marginBottom: 20
    },
    formLabel: {
        fontSize: 14,
        fontWeight: 600,
        color: '#1a1a2e',
        marginBottom: 8,
        display: 'block'
    },
    actionButtons: {
        display: 'flex',
        gap: 12,
        marginTop: 24,
        paddingTop: 20,
        borderTop: '1px solid #f0f0f0'
    }
};

// ============ CSS ANIMATIONS ============

export const ManagePageStyles = () => (
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
        
        .manage-form-card {
            animation: fadeSlideIn 0.4s ease both;
        }
        
        .manage-page .ant-input,
        .manage-page .ant-input-number,
        .manage-page .ant-select-selector,
        .manage-page .ant-input-affix-wrapper {
            border-radius: 12px !important;
            border: 2px solid #f0f0f0 !important;
            transition: all 0.3s ease !important;
        }
        
        .manage-page .ant-input:focus,
        .manage-page .ant-input-focused,
        .manage-page .ant-input-number:focus,
        .manage-page .ant-input-number-focused,
        .manage-page .ant-select-focused .ant-select-selector,
        .manage-page .ant-input-affix-wrapper:focus,
        .manage-page .ant-input-affix-wrapper-focused {
            border-color: #1890ff !important;
            box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1) !important;
        }
        
        .manage-page .ant-input-lg,
        .manage-page .ant-select-lg .ant-select-selector {
            padding: 12px 16px !important;
            height: auto !important;
        }
        
        .manage-page .ant-form-item-label > label {
            font-weight: 600;
            color: #1a1a2e;
            font-size: 14px;
        }
        
        .manage-page .ant-form-item-required::before {
            display: none !important;
        }
        
        .manage-page .ant-form-item-required::after {
            content: '*' !important;
            display: inline-block !important;
            color: #ff4d4f !important;
            margin-left: 4px !important;
        }
        
        .manage-page .ant-switch {
            min-width: 50px;
        }
        
        .manage-page .ant-switch-checked {
            background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
        }
        
        .manage-page textarea.ant-input {
            border-radius: 12px !important;
        }
        
        .manage-page .ant-input-number-lg {
            width: 100%;
        }
    `}</style>
);

// ============ HEADER COMPONENT ============

interface HeaderProps {
    isEdit: boolean;
    onBack: () => void;
    onDelete?: () => void;
}

export const PageHeader = ({ isEdit, onBack, onDelete }: HeaderProps) => (
    <div style={pageStyles.header(isEdit)}>
        <div style={pageStyles.headerDecoCircle1} />
        <div style={pageStyles.headerDecoCircle2} />
        
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
                {isEdit ? (
                    <EditOutlined style={{ fontSize: 24, color: 'white' }} />
                ) : (
                    <PlusCircleOutlined style={{ fontSize: 24, color: 'white' }} />
                )}
            </div>
            <div style={{ flex: 1 }}>
                <Text style={{ 
                    color: 'rgba(255,255,255,0.85)', 
                    fontSize: 13,
                    display: 'block'
                }}>
                    {isEdit ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}
                </Text>
                <Title level={4} style={{ 
                    color: 'white', 
                    margin: 0,
                    fontWeight: 700,
                    letterSpacing: '0.5px'
                }}>
                    {isEdit ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}
                </Title>
            </div>
            {isEdit && onDelete && (
                <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={onDelete}
                    style={{
                        background: 'rgba(255,77,79,0.9)',
                        borderColor: 'transparent',
                        color: 'white',
                        borderRadius: 12,
                        height: 40,
                        fontWeight: 600
                    }}
                >
                    ลบ
                </Button>
            )}
        </div>
    </div>
);

// ============ IMAGE PREVIEW COMPONENT ============

interface ImagePreviewProps {
    url?: string;
    name?: string;
}

export const ImagePreview = ({ url, name }: ImagePreviewProps) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        background: '#fafafa',
        borderRadius: 16,
        marginTop: 12
    }}>
        <div style={{
            width: 80,
            height: 80,
            borderRadius: 14,
            border: '2px solid white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0
        }}>
            {url ? (
                <Image
                    src={url}
                    alt={name || 'Preview'}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="80px"
                />
            ) : (
                <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <ShopOutlined style={{ fontSize: 28, color: '#1890ff', opacity: 0.5 }} />
                </div>
            )}
        </div>
        <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>
                {name || 'ตัวอย่างรูปภาพ'}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
                {url ? 'แสดงตัวอย่างจาก URL' : 'ยังไม่มีรูปภาพ'}
            </Text>
        </div>
    </div>
);

// ============ ACTION BUTTONS COMPONENT ============

interface ActionButtonsProps {
    isEdit: boolean;
    loading: boolean;
    onCancel: () => void;
}

export const ActionButtons = ({ isEdit, loading, onCancel }: ActionButtonsProps) => (
    <div style={pageStyles.actionButtons}>
        <Button
            size="large"
            onClick={onCancel}
            style={{
                flex: 1,
                borderRadius: 14,
                height: 48
            }}
        >
            ยกเลิก
        </Button>
        <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            icon={<SaveOutlined />}
            style={{
                flex: 2,
                borderRadius: 14,
                height: 48,
                background: isEdit 
                    ? 'linear-gradient(135deg, #faad14 0%, #fa8c16 100%)'
                    : 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                border: 'none',
                fontWeight: 600,
                boxShadow: isEdit 
                    ? '0 4px 12px rgba(250, 173, 20, 0.4)'
                    : '0 4px 12px rgba(82, 196, 26, 0.4)'
            }}
        >
            {isEdit ? 'อัปเดต' : 'บันทึก'}
        </Button>
    </div>
);

export default ManagePageStyles;
