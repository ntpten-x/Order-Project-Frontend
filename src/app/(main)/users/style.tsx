"use client";

import React from 'react';
import { Card, Statistic, Button, Avatar, Tag, Tooltip, Typography, Badge } from 'antd';
import { 
    TeamOutlined, 
    UserOutlined, 
    UserAddOutlined, 
    ReloadOutlined, 
    EditOutlined, 
    DeleteOutlined, 
} from '@ant-design/icons';
import { User } from "../../../types/api/users";
import { CSSProperties } from 'react';
import { t } from "../../../utils/i18n";

const { Title, Text } = Typography;

export const pageStyles = {
    container: {
        minHeight: '100vh',
        background: '#f8f9fc',
        paddingBottom: 40,
    } as CSSProperties,
    
    header: {
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', // Blue gradient
        padding: '30px 24px 80px',
        position: 'relative' as CSSProperties['position'],
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: -40,
        boxShadow: '0 10px 30px -10px rgba(37, 99, 235, 0.4)',
    },

    listContainer: {
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px',
        position: 'relative' as CSSProperties['position'],
        zIndex: 2,
    },

    userCard: (isActive: boolean) => ({
        borderRadius: 20,
        border: 'none',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: '#fff',
        boxShadow: isActive 
            ? '0 10px 30px rgba(37, 99, 235, 0.15)' 
            : '0 4px 20px rgba(0,0,0,0.05)',
        transform: isActive ? 'translateY(-4px)' : 'none',
        position: 'relative' as CSSProperties['position'],
    } as CSSProperties),
};

export const UserPageStyles = () => (
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
                            <TeamOutlined style={{ fontSize: 28, color: '#fff' }} />
                         </div>
                         <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 800 }}>
                            {t("users.headerTitle")}
                         </Title>
                    </div>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, display: 'block', paddingLeft: 4 }}>
                        {t("users.headerSubtitle")}
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
                        {t("users.refresh")}
                    </Button>
                    <Button 
                        type="primary" 
                        icon={<UserAddOutlined />} 
                        onClick={onAdd}
                        size="large"
                        style={{ 
                            background: '#fff', 
                            color: '#2563eb',
                            border: 'none',
                            borderRadius: 12,
                            fontWeight: 600,
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                        }}
                    >
                        {t("users.add")}
                    </Button>
                </div>
            </div>
        </div>
    </div>
);

interface StatsCardProps {
    totalUsers: number;
    activeUsers: number;
    onlineUsers: number; // Reusing is_active as "Online" logic for now based on user implementation
}

export const StatsCard = ({ totalUsers, activeUsers, onlineUsers }: StatsCardProps) => (
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
        justifyContent: 'center' // Center grid items on mobile
    }}>
        <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
            <Statistic 
                title={<Text type="secondary">{t("users.stats.total")}</Text>}
                value={totalUsers} 
                prefix={<TeamOutlined style={{ color: '#3b82f6', background: '#eff6ff', padding: 8, borderRadius: '50%' }} />} 
                styles={{ content: { fontWeight: 700 } }}
            />
        </Card>
        <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
            <Statistic 
                title={<Text type="secondary">{t("users.stats.active")}</Text>}
                value={activeUsers} 
                styles={{ content: { color: '#10b981', fontWeight: 700 } }}
                prefix={<Badge status="processing" color="#10b981" />}
            />
        </Card>
        <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
             <Statistic 
                title={<Text type="secondary">{t("users.stats.online")}</Text>}
                value={onlineUsers} 
                styles={{ content: { color: '#f59e0b', fontWeight: 700 } }}
                prefix={<UserOutlined style={{ color: '#f59e0b', background: '#fffbeb', padding: 8, borderRadius: '50%' }} />}
            />
        </Card>
    </div>
);

interface UserCardProps {
    user: User;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
}

export const UserCard = ({ user, onEdit, onDelete }: UserCardProps) => {
    const roleName = user.roles?.roles_name || '';
    
    const getRoleColor = (role: string) => {
        if (role === 'Admin') return 'gold';
        if (role === 'Manager') return 'magenta'; // Ant Design pink/magenta
        return 'blue';
    };

    const getAvatarColor = (role: string) => {
        if (role === 'Admin') return '#f59e0b'; // Gold
        if (role === 'Manager') return '#eb2f96'; // Pink
        return '#3b82f6'; // Blue
    };
    
    return (
        <Card 
            hoverable 
            style={pageStyles.userCard(user.is_active || false)}
            styles={{ body: { padding: 20 } }}
            actions={[
                <Tooltip title={t("users.card.edit")} key="edit">
                    <Button type="text" icon={<EditOutlined style={{ color: '#3b82f6' }} />} onClick={() => onEdit(user)}>{t("users.card.edit")}</Button>
                </Tooltip>,
                <Tooltip title={t("users.card.delete")} key="delete">
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => onDelete(user)}>{t("users.card.delete")}</Button>
                </Tooltip>
            ]}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                <Avatar 
                    size={64} 
                    style={{ 
                        backgroundColor: getAvatarColor(roleName),
                        fontSize: 24,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        border: user.is_active ? '3px solid #10b981' : '3px solid transparent', // Add green ring if active
                        transition: 'all 0.3s ease'
                    }}
                    icon={<UserOutlined />}
                />
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <Title level={4} style={{ margin: 0, marginBottom: 4, color: '#1f2937' }}>
                                {user.name || user.username}
                            </Title>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <Tag color={getRoleColor(roleName)} style={{ borderRadius: 12, border: 'none', padding: '0 10px', margin: 0 }}>
                                    {user.roles?.display_name || user.roles?.roles_name || 'N/A'}
                                </Tag>
                                {user.branch && (
                                    <Tag color="cyan" style={{ borderRadius: 12, border: 'none', padding: '0 10px', margin: 0 }}>
                                        {user.branch.branch_name}
                                    </Tag>
                                )}
                            </div>
                        </div>
                        <Tooltip title={user.is_active ? t("users.card.active") : t("users.card.inactive")}>
                            {user.is_active ? (
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t("users.card.active")}</Text>
                    {user.is_active ? (
                        <Tag color="#10b981" style={{ margin: 0, borderRadius: 12, border: 'none', padding: '0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                             <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px rgba(255,255,255,0.8)' }} />
                             <span style={{ fontWeight: 600 }}>{t("users.card.active")}</span>
                        </Tag>
                    ) : (
                        <Tag style={{ margin: 0, borderRadius: 12, border: 'none', background: '#f3f4f6', color: '#9ca3af' }}>
                            {t("users.card.inactive")}
                        </Tag>
                    )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t("users.card.canUse")}</Text>
                    <Badge status={user.is_use ? "success" : "error"} text={<span style={{ fontSize: 12 }}>{user.is_use ? '{t("users.card.canUse")}' : '{t("users.card.cannotUse")}'}</span>} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t("users.card.lastLogin")}</Text>
                    <Text style={{ fontSize: 12, fontWeight: 500 }}>
                        {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('th-TH') : '-'}
                    </Text>
                </div>
            </div>
        </Card>
    );
};
