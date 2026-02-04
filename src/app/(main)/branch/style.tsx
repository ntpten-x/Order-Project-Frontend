"use client";

import React from 'react';
import { Card, Statistic, Button, Tag, Tooltip, Typography, Badge } from 'antd';
import { 
    ShopOutlined, 
    PlusOutlined, 
    ReloadOutlined, 
    EditOutlined, 
    DeleteOutlined, 
    SwapOutlined,
    PhoneOutlined,
    EnvironmentOutlined
} from '@ant-design/icons';
import { Branch } from "../../../types/api/branch";
import { CSSProperties } from 'react';

const { Title, Text } = Typography;

export const pageStyles = {
    container: {
        minHeight: '100vh',
        background: '#f8f9fc',
        paddingBottom: 40,
    } as CSSProperties,
    
    header: {
        background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', // Purple gradient for Branch
        padding: '30px 24px 80px',
        position: 'relative' as CSSProperties['position'],
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: -40,
        boxShadow: '0 10px 30px -10px rgba(124, 58, 237, 0.4)',
    },

    listContainer: {
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px',
        position: 'relative' as CSSProperties['position'],
        zIndex: 2,
    },

    branchCard: (isActive: boolean) => ({
        borderRadius: 20,
        border: 'none',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: '#fff',
        boxShadow: isActive 
            ? '0 10px 30px rgba(124, 58, 237, 0.15)' 
            : '0 4px 20px rgba(0,0,0,0.05)',
        transform: isActive ? 'translateY(-4px)' : 'none',
        position: 'relative' as CSSProperties['position'],
    } as CSSProperties),
};

export const BranchPageStyles = () => (
    <style jsx global>{`
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
        100% { transform: translateY(0px); }
      }
      .decorative-shape {
        position: absolute;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border-radius: 50%;
      }
      .shape-1 { width: 300px; height: 300px; right: -100px; top: -100px; }
      .shape-2 { width: 150px; height: 150px; left: 10%; bottom: 20px; animation: float 6s ease-in-out infinite; }
      
      .action-btn {
        opacity: 0.7;
        transition: all 0.2s;
      }
      .action-btn:hover {
        opacity: 1;
        transform: scale(1.1);
      }
    `}</style>
);

interface HeaderProps {
    onRefresh: () => void;
    onAdd: () => void;
}

export const PageHeader = ({ onRefresh, onAdd }: HeaderProps) => (
    <div style={pageStyles.header}>
        <div className="decorative-shape shape-1" />
        <div className="decorative-shape shape-2" />
        
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                         <div style={{ 
                             background: 'rgba(255,255,255,0.2)', 
                             padding: 10, 
                             borderRadius: 14,
                             display: 'flex',
                             backdropFilter: 'blur(4px)'
                         }}>
                            <ShopOutlined style={{ fontSize: 28, color: '#fff' }} />
                         </div>
                         <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 800 }}>
                            จัดการสาขา
                         </Title>
                    </div>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, display: 'block', paddingLeft: 4 }}>
                        บริหารจัดการข้อมูลสาขาในระบบ
                    </Text>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <Button 
                        icon={<ReloadOutlined />} 
                        onClick={onRefresh}
                        size="large"
                        style={{ 
                            background: 'rgba(255,255,255,0.15)', 
                            border: '1px solid rgba(255,255,255,0.3)',
                            color: '#fff',
                            borderRadius: 12,
                            backdropFilter: 'blur(4px)'
                        }}
                    >
                        รีเฟรช
                    </Button>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={onAdd}
                        size="large"
                        style={{ 
                            background: '#fff', 
                            color: '#7c3aed',
                            border: 'none',
                            borderRadius: 12,
                            fontWeight: 600,
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                        }}
                    >
                        เพิ่มสาขา
                    </Button>
                </div>
            </div>
        </div>
    </div>
);

interface StatsCardProps {
    totalBranches: number;
    activeBranches: number;
}

export const StatsCard = ({ totalBranches, activeBranches }: StatsCardProps) => (
    <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 16, 
        marginTop: -40, 
        marginBottom: 32,
        position: 'relative',
        zIndex: 2,
        maxWidth: 1200,
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '0 24px',
        justifyContent: 'center'
    }}>
        <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
            <Statistic 
                title={<Text type="secondary">สาขาทั้งหมด</Text>}
                value={totalBranches} 
                prefix={<ShopOutlined style={{ color: '#8b5cf6', background: '#f5f3ff', padding: 8, borderRadius: '50%' }} />} 
                styles={{ content: { fontWeight: 700 } }}
            />
        </Card>
        <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
            <Statistic 
                title={<Text type="secondary">เปิดให้บริการ</Text>}
                value={activeBranches} 
                styles={{ content: { color: '#10b981', fontWeight: 700 } }}
                prefix={<Badge status="processing" color="#10b981" />}
            />
        </Card>
    </div>
);

interface BranchCardProps {
    branch: Branch;
    onEdit: (branch: Branch) => void;
    onDelete: (branch: Branch) => void;
    onSwitch: (branch: Branch) => void;
}

export const BranchCard = ({ branch, onEdit, onDelete, onSwitch }: BranchCardProps) => {
    return (
        <Card 
            hoverable 
            style={pageStyles.branchCard(branch.is_active)}
            styles={{ body: { padding: 20 } }}
            actions={[
                <Tooltip title="สลับไปสาขานี้" key="switch">
                    <Button
                        type="text"
                        icon={<SwapOutlined style={{ color: '#3b82f6' }} />}
                        onClick={() => onSwitch(branch)}
                    >
                        สลับ
                    </Button>
                </Tooltip>,
                <Tooltip title="แก้ไขข้อมูล" key="edit">
                    <Button type="text" icon={<EditOutlined style={{ color: '#8b5cf6' }} />} onClick={() => onEdit(branch)}>แก้ไข</Button>
                </Tooltip>,
                <Tooltip title="ลบสาขา" key="delete">
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => onDelete(branch)}>ลบ</Button>
                </Tooltip>
            ]}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                <div style={{ 
                    width: 64, height: 64, 
                    borderRadius: 16, 
                    background: branch.is_active ? '#f5f3ff' : '#f3f4f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: branch.is_active ? '2px solid #a78bfa' : '2px solid transparent',
                    transition: 'all 0.3s ease'
                }}>
                     <ShopOutlined style={{ fontSize: 28, color: branch.is_active ? '#7c3aed' : '#9ca3af' }} />
                </div>
                
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <Title level={4} style={{ margin: 0, marginBottom: 4, color: '#1f2937' }}>
                                {branch.branch_name}
                            </Title>
                            <Tag color="purple" style={{ borderRadius: 12, border: 'none', padding: '0 10px' }}>
                                Code: {branch.branch_code}
                            </Tag>
                        </div>
                        <Tooltip title={branch.is_active ? "เปิดดำเนินการ" : "ปิดปรับปรุง"}>
                            {branch.is_active ? (
                                <div style={{ 
                                    width: 12, height: 12, borderRadius: '50%', 
                                    background: '#10b981', 
                                    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)' 
                                }} />
                            ) : (
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#d1d5db' }} />
                            )}
                        </Tooltip>
                    </div>
                </div>
            </div>

            <div style={{ background: '#f9fafb', padding: 12, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <EnvironmentOutlined style={{ color: '#9ca3af' }} />
                    <Text ellipsis style={{ color: '#4b5563', fontSize: 13, flex: 1 }}>
                        {branch.address || '-'}
                    </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PhoneOutlined style={{ color: '#9ca3af' }} />
                    <Text style={{ color: '#4b5563', fontSize: 13 }}>
                        {branch.phone || '-'}
                    </Text>
                </div>
            </div>

            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <Text type="secondary" style={{ fontSize: 12 }}>Tax ID: {branch.tax_id || '-'}</Text>
                 {branch.is_active ? (
                    <Tag color="#10b981" style={{ margin: 0, borderRadius: 12, border: 'none' }}>Active</Tag>
                 ) : (
                    <Tag style={{ margin: 0, borderRadius: 12, border: 'none', background: '#f3f4f6' }}>Inactive</Tag>
                 )}
            </div>
        </Card>
    );
};
