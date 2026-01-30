"use client";

import React from 'react';
import { Button, Typography } from 'antd';
import { 
    ArrowLeftOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { CSSProperties } from 'react';

const { Title, Text } = Typography;

export const pageStyles = {
    container: {
        minHeight: '100vh',
        background: '#f8f9fc',
        paddingBottom: 40,
    } as CSSProperties,

    header: {
        background: '#fff',
        padding: '20px 24px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex' as CSSProperties['display'],
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky' as CSSProperties['position'],
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    },

    formCard: {
        maxWidth: 800,
        margin: '32px auto',
        padding: '32px',
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    } as CSSProperties,
};

export const ManagePageStyles = () => (
    <style jsx global>{`
      .manage-form-card .ant-form-item-label label {
        font-weight: 600;
        color: #374151;
      }
      .manage-form-card .ant-input,
      .manage-form-card .ant-input-number,
      .manage-form-card .ant-select-selector {
        border-radius: 12px !important;
        padding-top: 8px;
        padding-bottom: 8px;
      }
    `}</style>
);

interface HeaderProps {
    isEdit: boolean;
    onBack: () => void;
    onDelete?: () => void;
}

export const PageHeader = ({ isEdit, onBack, onDelete }: HeaderProps) => (
    <div style={pageStyles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={onBack}
                style={{ 
                    borderRadius: '50%', 
                    width: 40, height: 40, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: 'none',
                    background: '#f3f4f6'
                }} 
            />
            <div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Title level={4} style={{ margin: 0 }}>
                        {isEdit ? 'แก้ไขข้อมูลสาขา' : 'เพิ่มสาขาใหม่'}
                    </Title>
                    {isEdit && (
                        <div style={{ 
                            background: '#f3f4f6', padding: '2px 8px', borderRadius: 6,
                            fontSize: 12, color: '#6b7280', fontWeight: 600 
                        }}>
                            EDIT MODE
                        </div>
                    )}
                 </div>
                 <Text type="secondary" style={{ fontSize: 13 }}>
                    {isEdit ? 'ปรับปรุงข้อมูลสาขาที่มีอยู่' : 'กรอกข้อมูลเพื่อสร้างสาขาใหม่'}
                 </Text>
            </div>
        </div>

        {isEdit && onDelete && (
            <Button 
                danger 
                icon={<DeleteOutlined />} 
                onClick={onDelete}
                style={{ borderRadius: 12, height: 40 }}
            >
                ลบสาขา
            </Button>
        )}
    </div>
);
