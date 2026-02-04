"use client";

import React from 'react';
import { Card, Statistic, Button, Tag, Tooltip, Typography, Badge, Input, Segmented, Flex, Grid } from 'antd';
import { 
    ShopOutlined, 
    PlusOutlined, 
    ReloadOutlined, 
    EditOutlined, 
    DeleteOutlined, 
    SwapOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    SearchOutlined,
    ClearOutlined
} from '@ant-design/icons';
import { Branch } from "../../../types/api/branch";
import { CSSProperties } from 'react';
import { theme } from 'antd';

const { Title, Text } = Typography;
const { useToken } = theme;

export const pageStyles = {
    container: {
        minHeight: '100vh',
        background: '#f8f9fc',
        paddingBottom: 40,
        width: '100%',
        overflowX: 'hidden',
        boxSizing: 'border-box',
    } as CSSProperties,
    
    header: {
        background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', // Purple gradient for Branch
        padding: '24px 16px 90px',
        position: 'relative' as CSSProperties['position'],
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 0,
        boxShadow: '0 10px 30px -10px rgba(124, 58, 237, 0.4)',
        width: '100%',
        boxSizing: 'border-box' as const,
        overflow: 'hidden',
    },

    listContainer: {
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 16px',
        position: 'relative' as CSSProperties['position'],
        zIndex: 2,
        width: '100%',
        boxSizing: 'border-box',
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
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .decorative-shape {
        position: absolute;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border-radius: 50%;
        pointer-events: none;
      }
      .shape-1 { width: 300px; height: 300px; right: -100px; top: -100px; }
      .shape-2 { width: 150px; height: 150px; left: 10%; bottom: 20px; animation: float 6s ease-in-out infinite; }
      
      /* Prevent horizontal scroll */
      body, html {
        overflow-x: hidden !important;
        max-width: 100vw;
      }
      
      .action-btn {
        opacity: 0.7;
        transition: all 0.2s;
      }
      .action-btn:hover {
        opacity: 1;
        transform: scale(1.1);
      }

      .branch-card-hover {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .branch-card-hover:hover {
        transform: translateY(-6px) scale(1.02);
      }
    `}</style>
);

interface HeaderProps {
    onRefresh: () => void;
    onAdd: () => void;
}

export const PageHeader = ({ onRefresh, onAdd }: HeaderProps) => {
    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    
    return (
        <div style={pageStyles.header}>
            <div className="decorative-shape shape-1" />
            <div className="decorative-shape shape-2" />
            
            <div style={{ 
                maxWidth: 1200, 
                margin: '0 auto', 
                position: 'relative', 
                zIndex: 1, 
                padding: isMobile ? '0 16px' : '0 24px',
                width: '100%',
                boxSizing: 'border-box' as const,
                overflow: 'hidden'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: isMobile ? 16 : 20 }}>
                    <div style={{ flex: 1, minWidth: isMobile ? 0 : 280 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                             <div style={{ 
                                 background: 'rgba(255,255,255,0.25)', 
                                 padding: 12, 
                                 borderRadius: 16,
                                 display: 'flex',
                                 backdropFilter: 'blur(8px)',
                                 boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                 border: '1px solid rgba(255,255,255,0.3)'
                             }}>
                                <ShopOutlined style={{ fontSize: isMobile ? 24 : 30, color: '#fff' }} />
                             </div>
                             <div>
                                 <Title level={2} style={{ 
                                     margin: 0, 
                                     color: '#fff', 
                                     fontWeight: 800, 
                                     fontSize: isMobile ? 22 : 28, 
                                     lineHeight: 1.2 
                                 }}>
                                    จัดการสาขา
                                 </Title>
                                 <Text style={{ 
                                     color: 'rgba(255,255,255,0.95)', 
                                     fontSize: isMobile ? 13 : 15, 
                                     display: 'block',
                                     marginTop: 4,
                                     fontWeight: 400
                                 }}>
                                    บริหารจัดการข้อมูลสาขาในระบบ
                                 </Text>
                             </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: isMobile ? 8 : 12, flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
                        <Button 
                            icon={<ReloadOutlined />} 
                            onClick={onRefresh}
                            size={isMobile ? "middle" : "large"}
                            style={{ 
                                background: 'rgba(255,255,255,0.2)', 
                                border: '1px solid rgba(255,255,255,0.35)',
                                color: '#fff',
                                borderRadius: 12,
                                backdropFilter: 'blur(8px)',
                                fontWeight: 500,
                                height: isMobile ? 40 : 44,
                                padding: isMobile ? '0 16px' : '0 20px',
                                flex: isMobile ? 1 : 'none',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            รีเฟรช
                        </Button>
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            onClick={onAdd}
                            size={isMobile ? "middle" : "large"}
                            style={{ 
                                background: '#fff', 
                                color: '#7c3aed',
                                border: 'none',
                                borderRadius: 12,
                                fontWeight: 600,
                                boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
                                height: isMobile ? 40 : 44,
                                padding: isMobile ? '0 20px' : '0 24px',
                                flex: isMobile ? 1 : 'none',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
                            }}
                        >
                            เพิ่มสาขา
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface StatsCardProps {
    totalBranches: number;
    activeBranches: number;
}

export const StatsCard = ({ totalBranches, activeBranches }: StatsCardProps) => {
    const { token } = useToken();
    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const inactiveBranches = totalBranches - activeBranches;
    
    return (
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: isMobile ? 10 : 20, 
            marginTop: isMobile ? 24 : -20,
            marginBottom: isMobile ? 16 : 20,
            position: 'relative',
            zIndex: 2,
            maxWidth: 1200,
            marginLeft: 'auto',
            marginRight: 'auto',
            padding: isMobile ? '0 12px' : '0 24px',
            justifyContent: 'center',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            <Card 
                variant="borderless" 
                style={{ 
                    borderRadius: isMobile ? 14 : 18, 
                    boxShadow: isMobile ? '0 4px 12px rgba(124, 58, 237, 0.1)' : '0 8px 24px rgba(124, 58, 237, 0.12)',
                    background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
                    border: `1px solid ${token.colorBorderSecondary}`,
                    transition: 'all 0.3s ease',
                    animation: 'slideDown 0.5s ease-out 0.1s backwards',
                    width: '100%',
                    padding: isMobile ? '12px' : undefined
                }}
                bodyStyle={isMobile ? { padding: '16px 12px' } : undefined}
                hoverable
            >
                <Statistic 
                    title={
                        <Text 
                            type="secondary" 
                            style={{ 
                                fontSize: isMobile ? 10 : 13, 
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                lineHeight: 1.2
                            }}
                        >
                            สาขาทั้งหมด
                        </Text>
                    }
                    value={totalBranches} 
                    prefix={
                        <div style={{
                            background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                            padding: isMobile ? 6 : 10,
                            borderRadius: isMobile ? 8 : 12,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)'
                        }}>
                            <ShopOutlined style={{ color: '#7c3aed', fontSize: isMobile ? 14 : 20 }} />
                        </div>
                    } 
                    styles={{ 
                        content: { 
                            fontWeight: 800,
                            fontSize: isMobile ? 22 : 32,
                            color: '#7c3aed',
                            marginTop: isMobile ? 4 : 8,
                            lineHeight: 1.2
                        } 
                    }}
                />
            </Card>
            <Card 
                variant="borderless" 
                style={{ 
                    borderRadius: isMobile ? 14 : 18, 
                    boxShadow: isMobile ? '0 4px 12px rgba(16, 185, 129, 0.1)' : '0 8px 24px rgba(16, 185, 129, 0.12)',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                    border: `1px solid ${token.colorBorderSecondary}`,
                    transition: 'all 0.3s ease',
                    animation: 'slideDown 0.5s ease-out 0.2s backwards',
                    width: '100%',
                    padding: isMobile ? '12px' : undefined
                }}
                bodyStyle={isMobile ? { padding: '16px 12px' } : undefined}
                hoverable
            >
                <Statistic 
                    title={
                        <Text 
                            type="secondary" 
                            style={{ 
                                fontSize: isMobile ? 10 : 13, 
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                lineHeight: 1.2
                            }}
                        >
                            เปิดให้บริการ
                        </Text>
                    }
                    value={activeBranches} 
                    prefix={
                        <Badge 
                            status="processing" 
                            color="#10b981"
                            style={{
                                background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                                padding: isMobile ? 4 : 8,
                                borderRadius: isMobile ? 8 : 12,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
                                minWidth: isMobile ? 20 : undefined,
                                minHeight: isMobile ? 20 : undefined
                            }}
                        />
                    }
                    styles={{ 
                        content: { 
                            color: '#10b981', 
                            fontWeight: 800,
                            fontSize: isMobile ? 22 : 32,
                            marginTop: isMobile ? 4 : 8,
                            lineHeight: 1.2
                        } 
                    }}
                />
            </Card>
            {inactiveBranches > 0 && (
                <Card 
                    variant="borderless" 
                    style={{ 
                        borderRadius: isMobile ? 14 : 18, 
                        boxShadow: isMobile ? '0 4px 12px rgba(107, 114, 128, 0.08)' : '0 8px 24px rgba(107, 114, 128, 0.08)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                        border: `1px solid ${token.colorBorderSecondary}`,
                        transition: 'all 0.3s ease',
                        animation: 'slideDown 0.5s ease-out 0.3s backwards',
                        width: '100%',
                        gridColumn: isMobile ? '1 / -1' : 'auto',
                        padding: isMobile ? '12px' : undefined
                    }}
                    bodyStyle={isMobile ? { padding: '16px 12px' } : undefined}
                    hoverable
                >
                    <Statistic 
                        title={
                            <Text 
                                type="secondary" 
                                style={{ 
                                    fontSize: isMobile ? 10 : 13, 
                                    fontWeight: 500,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    lineHeight: 1.2
                                }}
                            >
                                ปิดปรับปรุง
                            </Text>
                        }
                        value={inactiveBranches} 
                        styles={{ 
                            content: { 
                                color: '#6b7280', 
                                fontWeight: 800,
                                fontSize: isMobile ? 22 : 32,
                                marginTop: isMobile ? 4 : 8,
                                lineHeight: 1.2
                            } 
                        }}
                    />
                </Card>
            )}
        </div>
    );
};

interface BranchCardProps {
    branch: Branch;
    onEdit: (branch: Branch) => void;
    onDelete: (branch: Branch) => void;
    onSwitch: (branch: Branch) => void;
}

export const BranchCard = ({ branch, onEdit, onDelete, onSwitch }: BranchCardProps) => {
    const { token } = useToken();
    
    return (
        <Card 
            hoverable 
            className="branch-card-hover"
            style={pageStyles.branchCard(branch.is_active)}
            styles={{ 
                body: { padding: 24 },
                actions: {
                    background: token.colorFillTertiary,
                    borderTop: `1px solid ${token.colorBorderSecondary}`
                }
            }}
            actions={[
                <Tooltip title="สลับไปสาขานี้" key="switch">
                    <Button
                        type="text"
                        icon={<SwapOutlined style={{ color: '#3b82f6', fontSize: 16 }} />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSwitch(branch);
                        }}
                        style={{ height: '100%', borderRadius: 0 }}
                    >
                        สลับ
                    </Button>
                </Tooltip>,
                <Tooltip title="แก้ไขข้อมูล" key="edit">
                    <Button 
                        type="text" 
                        icon={<EditOutlined style={{ color: '#8b5cf6', fontSize: 16 }} />} 
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(branch);
                        }}
                        style={{ height: '100%', borderRadius: 0 }}
                    >
                        แก้ไข
                    </Button>
                </Tooltip>,
                <Tooltip title="ลบสาขา" key="delete">
                    <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined style={{ fontSize: 16 }} />} 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(branch);
                        }}
                        style={{ height: '100%', borderRadius: 0 }}
                    >
                        ลบ
                    </Button>
                </Tooltip>
            ]}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                <div style={{ 
                    width: 72, 
                    height: 72, 
                    borderRadius: 18, 
                    background: branch.is_active 
                        ? 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' 
                        : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: branch.is_active ? '2px solid #a78bfa' : '2px solid #d1d5db',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: branch.is_active 
                        ? '0 4px 12px rgba(124, 58, 237, 0.15)' 
                        : '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}>
                     <ShopOutlined style={{ 
                         fontSize: 32, 
                         color: branch.is_active ? '#7c3aed' : '#9ca3af',
                         transition: 'all 0.3s ease'
                     }} />
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <Title 
                                level={4} 
                                style={{ 
                                    margin: 0, 
                                    marginBottom: 6, 
                                    color: '#1f2937',
                                    fontWeight: 700,
                                    fontSize: 18,
                                    lineHeight: 1.3
                                }}
                                ellipsis
                            >
                                {branch.branch_name}
                            </Title>
                            <Tag 
                                color="purple" 
                                style={{ 
                                    borderRadius: 8, 
                                    border: 'none', 
                                    padding: '2px 10px',
                                    fontSize: 12,
                                    fontWeight: 500,
                                    background: '#f5f3ff',
                                    color: '#7c3aed'
                                }}
                            >
                                {branch.branch_code}
                            </Tag>
                        </div>
                        <Tooltip title={branch.is_active ? "เปิดดำเนินการ" : "ปิดปรับปรุง"}>
                            <div style={{ 
                                width: 14, 
                                height: 14, 
                                borderRadius: '50%', 
                                background: branch.is_active ? '#10b981' : '#d1d5db',
                                boxShadow: branch.is_active 
                                    ? '0 0 0 4px rgba(16, 185, 129, 0.15)' 
                                    : 'none',
                                flexShrink: 0,
                                marginTop: 4
                            }} />
                        </Tooltip>
                    </div>
                </div>
            </div>

            <div style={{ 
                background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)', 
                padding: 16, 
                borderRadius: 14,
                border: `1px solid ${token.colorBorderSecondary}`,
                marginBottom: 16
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                    <EnvironmentOutlined style={{ color: '#6b7280', fontSize: 16, marginTop: 2, flexShrink: 0 }} />
                    <Text 
                        ellipsis 
                        style={{ 
                            color: '#374151', 
                            fontSize: 13, 
                            flex: 1,
                            lineHeight: 1.5
                        }}
                    >
                        {branch.address || 'ไม่ระบุที่อยู่'}
                    </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <PhoneOutlined style={{ color: '#6b7280', fontSize: 16, flexShrink: 0 }} />
                    <Text style={{ color: '#374151', fontSize: 13, fontWeight: 500 }}>
                        {branch.phone || 'ไม่ระบุเบอร์โทร'}
                    </Text>
                </div>
            </div>

            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingTop: 12,
                borderTop: `1px solid ${token.colorBorderSecondary}`
            }}>
                 <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
                     Tax ID: {branch.tax_id || '-'}
                 </Text>
                 {branch.is_active ? (
                    <Tag 
                        color="success" 
                        style={{ 
                            margin: 0, 
                            borderRadius: 8, 
                            border: 'none',
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 10px'
                        }}
                    >
                        เปิดใช้งาน
                    </Tag>
                 ) : (
                    <Tag 
                        style={{ 
                            margin: 0, 
                            borderRadius: 8, 
                            border: 'none', 
                            background: '#f3f4f6',
                            color: '#6b7280',
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 10px'
                        }}
                    >
                        ปิดใช้งาน
                    </Tag>
                 )}
            </div>
        </Card>
    );
};

interface SearchBarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    filter: 'all' | 'active' | 'inactive';
    onFilterChange: (value: 'all' | 'active' | 'inactive') => void;
    resultCount: number;
    totalCount: number;
}

export const SearchBar = ({ 
    searchQuery, 
    onSearchChange, 
    filter, 
    onFilterChange,
    resultCount,
    totalCount
}: SearchBarProps) => {
    const { token } = useToken();
    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    
    return (
        <Card
            size="small"
            variant="outlined"
            style={{ 
                borderRadius: isMobile ? 14 : 16,
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorderSecondary}`,
                animation: 'slideDown 0.4s ease-out',
                marginTop: isMobile ? 0 : 0
            }}
            bodyStyle={{ padding: isMobile ? 16 : 20 }}
        >
            <Flex vertical gap={isMobile ? 12 : 16}>
                <Input
                    size="large"
                    placeholder="ค้นหาสาขา (ชื่อ, รหัส, ที่อยู่, เบอร์โทร)"
                    prefix={<SearchOutlined style={{ color: token.colorTextSecondary }} />}
                    suffix={
                        searchQuery ? (
                            <Button
                                type="text"
                                size="small"
                                icon={<ClearOutlined />}
                                onClick={() => onSearchChange('')}
                                style={{ 
                                    color: token.colorTextSecondary,
                                    padding: 0,
                                    width: 20,
                                    height: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            />
                        ) : null
                    }
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    style={{
                        borderRadius: 12,
                        fontSize: 15
                    }}
                />
                
                <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                    <Segmented
                        value={filter}
                        onChange={(value) => onFilterChange(value as 'all' | 'active' | 'inactive')}
                        options={[
                            { label: 'ทั้งหมด', value: 'all' },
                            { label: 'เปิดใช้งาน', value: 'active' },
                            { label: 'ปิดใช้งาน', value: 'inactive' },
                        ]}
                        style={{
                            borderRadius: 10,
                            background: token.colorFillTertiary
                        }}
                    />
                    
                    {(searchQuery || filter !== 'all') && (
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            พบ <Text strong style={{ color: token.colorPrimary }}>{resultCount}</Text> จาก {totalCount} สาขา
                        </Text>
                    )}
                </Flex>
            </Flex>
        </Card>
    );
};
