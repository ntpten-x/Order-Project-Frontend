"use client";

import type { CSSProperties } from "react";

import { Card, Statistic, Button, Typography, Flex, Grid, theme, Space } from 'antd';
import { 
    FileSearchOutlined, 
    ReloadOutlined, 
    FilterOutlined,
} from '@ant-design/icons';
import { SearchInput } from '../../../components/ui/input/SearchInput';
import { SearchBar as SearchBarContainer } from '../../../components/ui/page/SearchBar';

const { Text } = Typography;

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
        background: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)', // Indigo gradient for Audit
        padding: '24px 16px 90px',
        position: 'relative' as CSSProperties['position'],
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 0,
        boxShadow: '0 10px 30px -10px rgba(79, 70, 229, 0.4)',
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
        boxSizing: 'border-box' as const,
    },

    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 12,
    } as CSSProperties,

    tableCard: {
        borderRadius: 20,
        boxShadow: "0 10px 34px rgba(15, 23, 42, 0.05)",
        border: "1px solid #edf1f7",
        background: '#fff',
        overflow: 'hidden',
    } as CSSProperties,

    jsonBlock: {
        background: "#0b1021",
        color: "#e8f0ff",
        borderRadius: 12,
        padding: 12,
        fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: 12,
        lineHeight: 1.5,
        maxHeight: 320,
        overflow: "auto",
        border: "1px solid #151b33",
    } as CSSProperties,
};

export const AuditPageStyles = () => (
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
      
      .audit-table .ant-table-tbody > tr:hover > td {
        background: #f5f7ff !important;
      }
      .audit-table .ant-table-cell {
        font-size: 13px;
      }
      .audit-chip {
        border-radius: 999px;
        padding: 4px 10px;
        font-weight: 600;
      }
      .audit-drawer .ant-drawer-body {
        padding: 18px;
      }
    `}</style>
);

interface StatsCardProps {
    total: number;
    currentPage: number;
    filtersActive: number;
}

export const StatsCard = ({ total, currentPage, filtersActive }: StatsCardProps) => {
    const { token } = theme.useToken();
    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    
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
                    boxShadow: '0 8px 24px rgba(79, 70, 229, 0.12)',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f5f7ff 100%)',
                    border: `1px solid ${token.colorBorderSecondary}`,
                    transition: 'all 0.3s ease',
                    width: '100%',
                }}
                hoverable
            >
                <Statistic 
                    title={<Text type="secondary" style={{ fontSize: isMobile ? 10 : 13, fontWeight: 500, textTransform: 'uppercase' }}>จำนวน Log ทั้งหมด</Text>}
                    value={total} 
                    prefix={<FileSearchOutlined style={{ color: '#4f46e5', fontSize: isMobile ? 14 : 20 }} />} 
                    valueStyle={{ color: '#4f46e5', fontWeight: 800, fontSize: isMobile ? 22 : 32 }}
                />
            </Card>
            <Card 
                variant="borderless" 
                style={{ 
                    borderRadius: isMobile ? 14 : 18, 
                    boxShadow: '0 8px 24px rgba(79, 70, 229, 0.08)',
                    background: '#fff',
                    border: `1px solid ${token.colorBorderSecondary}`,
                    transition: 'all 0.3s ease',
                    width: '100%',
                }}
                hoverable
            >
                <Statistic 
                    title={<Text type="secondary" style={{ fontSize: isMobile ? 10 : 13, fontWeight: 500, textTransform: 'uppercase' }}>บันทึกในหน้านี้</Text>}
                    value={currentPage} 
                    suffix={` รายการ`}
                    valueStyle={{ fontWeight: 800, fontSize: isMobile ? 22 : 32 }}
                />
            </Card>
            <Card 
                variant="borderless" 
                style={{ 
                    borderRadius: isMobile ? 14 : 18, 
                    boxShadow: '0 8px 24px rgba(250, 140, 22, 0.1)',
                    background: filtersActive ? 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)' : '#fff',
                    border: `1px solid ${token.colorBorderSecondary}`,
                    transition: 'all 0.3s ease',
                    width: '100%',
                }}
                hoverable
            >
                <Statistic 
                    title={<Text type="secondary" style={{ fontSize: isMobile ? 10 : 13, fontWeight: 500, textTransform: 'uppercase' }}>ตัวกรองที่ใช้</Text>}
                    value={filtersActive} 
                    suffix=" ตัว"
                    valueStyle={{ fontWeight: 800, fontSize: isMobile ? 22 : 32, color: filtersActive ? "#fa8c16" : undefined }}
                />
            </Card>
        </div>
    );
};

interface SearchBarProps {
    search: string;
    onSearchChange: (val: string) => void;
    filtersActive: number;
    onReset: () => void;
    onRefresh: () => void;
    loading: boolean;
}

export const SearchBar = ({ search, onSearchChange, filtersActive, onReset, onRefresh, loading }: SearchBarProps) => {
    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    return (
        <SearchBarContainer bodyStyle={{ padding: isMobile ? 16 : 20 }}>
            <SearchInput
                placeholder="ค้นหา (ผู้ใช้, รายละเอียด, Entity)"
                value={search}
                onChange={onSearchChange}
            />
            
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Space size={8}>
                    <Button 
                        icon={<ReloadOutlined />} 
                        onClick={onRefresh} 
                        loading={loading}
                        style={{ borderRadius: 8 }}
                    >
                        รีเฟรช
                    </Button>
                    <Button 
                        icon={<FilterOutlined />} 
                        onClick={onReset} 
                        disabled={filtersActive === 0}
                        style={{ borderRadius: 8 }}
                    >
                        ล้างตัวกรอง
                    </Button>
                </Space>
                
                {filtersActive > 0 && (
                    <Text type="secondary" style={{ fontSize: 13 }}>
                            ตรวจพบตัวกรองกำลังทำงาน {filtersActive} รายการ
                    </Text>
                )}
            </Flex>
        </SearchBarContainer>
    );
};
