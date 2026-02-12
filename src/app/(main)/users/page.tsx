'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Button, message, Modal, Grid, Input, Skeleton, Typography } from 'antd';
import {
    TeamOutlined,
    SearchOutlined,
    ReloadOutlined,
    UserAddOutlined,
    EditOutlined,
    DeleteOutlined,
    ClockCircleOutlined,
    BranchesOutlined,
} from '@ant-design/icons';
import { User } from "../../../types/api/users";
import { useRouter } from 'next/navigation';
import { useSocket } from "../../../hooks/useSocket";
import { useAsyncAction } from "../../../hooks/useAsyncAction";
import { useGlobalLoading } from "../../../contexts/pos/GlobalLoadingContext";
import { useAuth } from "../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../hooks/useEffectivePermissions";
import { Spin } from 'antd';
import { authService } from "../../../services/auth.service";
import { userService } from "../../../services/users.service";
import { RealtimeEvents } from "../../../utils/realtimeEvents";
import PageContainer from "../../../components/ui/page/PageContainer";
import PageSection from "../../../components/ui/page/PageSection";
import UIPageHeader from "../../../components/ui/page/PageHeader";
import { useDebouncedValue } from "../../../utils/useDebouncedValue";

const { Text } = Typography;
const { useBreakpoint } = Grid;

// โ”€โ”€ Role Config โ”€โ”€
const ROLE_CONFIG: Record<string, { color: string; bg: string; emoji: string }> = {
    'Admin': { color: '#D97706', bg: '#FFFBEB', emoji: '๐‘‘' },
    'Manager': { color: '#DB2777', bg: '#FDF2F8', emoji: 'โญ' },
    'Cashier': { color: '#2563EB', bg: '#EFF6FF', emoji: '๐’ณ' },
    'Chef': { color: '#059669', bg: '#ECFDF5', emoji: '๐‘จโ€๐ณ' },
    'Waiter': { color: '#7C3AED', bg: '#F5F3FF', emoji: '๐ฝ๏ธ' },
};

const DEFAULT_ROLE_CONFIG = { color: '#64748B', bg: '#F1F5F9', emoji: '๐‘ค' };

// โ”€โ”€ Responsive CSS โ”€โ”€
const responsiveCSS = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .users-page-card {
    animation: fadeInUp 0.35s cubic-bezier(0.4, 0, 0.2, 1) both;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .users-page-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(15,23,42,0.10) !important;
  }
  .users-page-card:active {
    transform: scale(0.98);
  }

  .users-search-input .ant-input {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }
  .users-search-input .ant-input-affix-wrapper {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  .users-refresh-btn {
    transition: all 0.3s ease;
  }
  .users-refresh-btn:hover {
    background: rgba(59,130,246,0.08) !important;
  }

  .users-action-btn {
    transition: all 0.2s ease;
  }
  .users-action-btn:hover {
    transform: scale(1.05);
  }

  @media (hover: none) and (pointer: coarse) {
    .users-page-card:active {
      transform: scale(0.97);
      opacity: 0.9;
    }
  }
`;

export default function UsersPage() {
    const router = useRouter();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const [users, setUsers] = useState<User[]>([]);
    const { socket } = useSocket();
    const { execute } = useAsyncAction();
    const { showLoading, hideLoading } = useGlobalLoading();
    const { user, loading: authLoading } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canViewUsers = can("users.page", "view");
    const canCreateUsers = can("users.page", "create");
    const canUpdateUsers = can("users.page", "update");
    const canDeleteUsers = can("users.page", "delete");
    const [csrfToken, setCsrfToken] = useState<string>("");
    const [searchValue, setSearchValue] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const debouncedSearch = useDebouncedValue(searchValue, 300);

    useEffect(() => {
        const fetchCsrf = async () => {
            const token = await authService.getCsrfToken();
            setCsrfToken(token);
        };
        fetchCsrf();
    }, []);

    // Protect Route
    useEffect(() => {
        if (!authLoading && !permissionLoading) {
            if (!user || !canViewUsers) {
                const timer = setTimeout(() => {
                    message.error("เธเธธเธ“เนเธกเนเธกเธตเธชเธดเธ—เธเธดเนเน€เธเนเธฒเธ–เธถเธเธซเธเนเธฒเธเธตเน");
                    router.push('/');
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [user, authLoading, canViewUsers, permissionLoading, router]);

    const fetchUsers = useCallback(async () => {
        execute(async () => {
            const data = await userService.getAllUsers();
            setUsers(data);
        }, 'เธเธณเธฅเธฑเธเนเธซเธฅเธ”เธเนเธญเธกเธนเธฅเธเธนเนเนเธเน...');
    }, [execute]);

    useEffect(() => {
        if (authLoading) return;
        if (canViewUsers) {
            fetchUsers();
        }
    }, [authLoading, canViewUsers, fetchUsers]);

    useEffect(() => {
        if (!socket) return;

        socket.on(RealtimeEvents.users.create, (newUser: User) => {
            setUsers((prevUsers) => [...prevUsers, newUser]);
            message.success(`เธเธนเนเนเธเนเนเธซเธกเน ${newUser.name || newUser.username} เธ–เธนเธเน€เธเธดเนเธกเนเธฅเนเธง`);
        });
        socket.on(RealtimeEvents.users.update, (updatedUser: User) => {
            setUsers((prevUsers) =>
                prevUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user))
            );
        });
        socket.on(RealtimeEvents.users.delete, ({ id }: { id: string }) => {
            setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
        });
        socket.on(RealtimeEvents.users.status, ({ id, is_active }: { id: string, is_active: boolean }) => {
            setUsers((prevUsers) =>
                prevUsers.map((user) => (user.id === id ? { ...user, is_active } : user))
            );
        });

        return () => {
            socket.off(RealtimeEvents.users.create);
            socket.off(RealtimeEvents.users.update);
            socket.off(RealtimeEvents.users.delete);
            socket.off(RealtimeEvents.users.status);
        };
    }, [socket]);

    // โ”€โ”€ Filtered Users โ”€โ”€
    const filteredUsers = useMemo(() => {
        if (!debouncedSearch) return users;
        const q = debouncedSearch.toLowerCase();
        return users.filter(u =>
            (u.name || '').toLowerCase().includes(q) ||
            u.username.toLowerCase().includes(q) ||
            (u.roles?.display_name || u.roles?.roles_name || '').toLowerCase().includes(q) ||
            (u.branch?.branch_name || '').toLowerCase().includes(q)
        );
    }, [users, debouncedSearch]);

    // โ”€โ”€ Stats โ”€โ”€
    const stats = useMemo(() => {
        const activeUsers = users.filter(u => u.is_active).length;
        const adminUsers = users.filter(u => u.roles?.roles_name === 'Admin').length;
        return { total: users.length, active: activeUsers, admin: adminUsers };
    }, [users]);

    const handleAdd = () => {
        if (!canCreateUsers) {
            message.error("You do not have permission to create users.");
            return;
        }
        showLoading();
        router.push('/users/manage/add');
        setTimeout(() => hideLoading(), 1000);
    };

    const handleEdit = (user: User) => {
        if (!canUpdateUsers) {
            message.error("You do not have permission to update users.");
            return;
        }
        router.push(`/users/manage/edit/${user.id}`);
    };

    const handleDelete = (userToDelete: User) => {
        if (!canDeleteUsers) {
            message.error("You do not have permission to delete users.");
            return;
        }
        Modal.confirm({
            title: 'เธขเธทเธเธขเธฑเธเธเธฒเธฃเธฅเธเธเธนเนเนเธเน',
            content: `เธเธธเธ“เธ•เนเธญเธเธเธฒเธฃเธฅเธเธเธนเนเนเธเน "${userToDelete.name || userToDelete.username}" เธซเธฃเธทเธญเนเธกเน?`,
            okText: 'เธฅเธ',
            okType: 'danger',
            cancelText: 'เธขเธเน€เธฅเธดเธ',
            centered: true,
            onOk: async () => {
                await execute(async () => {
                    await userService.deleteUser(userToDelete.id, undefined, csrfToken);
                    message.success(`เธฅเธเธเธนเนเนเธเน "${userToDelete.name || userToDelete.username}" เธชเธณเน€เธฃเนเธ`);
                }, "เธเธณเธฅเธฑเธเธฅเธเธเธนเนเนเธเนเธเธฒเธ...");
            },
        });
    };

    const getTimeSince = (date: string) => {
        const now = new Date();
        const d = new Date(date);
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'เน€เธกเธทเนเธญเธเธตเน';
        if (diffMins < 60) return `${diffMins} เธเธฒเธ—เธตเธ—เธตเนเนเธฅเนเธง`;
        const hours = Math.floor(diffMins / 60);
        if (hours < 24) return `${hours} เธเธก.เธ—เธตเนเนเธฅเนเธง`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days} เธงเธฑเธเธ—เธตเนเนเธฅเนเธง`;
        return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
    };

    // โ”€โ”€ Auth Guard โ”€โ”€
    if (authLoading || permissionLoading || !user || !canViewUsers) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#F8FAFC'
            }}>
                <Spin size="large" />
            </div>
        );
    }

    const isLoading = users.length === 0;

    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: 100 }}>
            <style dangerouslySetInnerHTML={{ __html: responsiveCSS }} />

            {/* โ•โ•โ• Header โ•โ•โ• */}
            <UIPageHeader
                title="เธเธฑเธ”เธเธฒเธฃเธเธนเนเนเธเน"
                subtitle={`เธ—เธฑเนเธเธซเธกเธ” ${users.length} เธเธ`}
                icon={<TeamOutlined style={{ fontSize: 20 }} />}
                actions={
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            className="users-refresh-btn"
                            onClick={() => setShowSearch(!showSearch)}
                            style={{
                                width: 40, height: 40,
                                borderRadius: 12,
                                border: '1px solid #E2E8F0',
                                background: '#fff',
                                display: 'grid', placeItems: 'center',
                                cursor: 'pointer',
                                color: showSearch ? '#3B82F6' : '#64748B',
                            }}
                        >
                            <SearchOutlined style={{ fontSize: 18 }} />
                        </button>
                        <button
                            className="users-refresh-btn"
                            onClick={fetchUsers}
                            style={{
                                width: 40, height: 40,
                                borderRadius: 12,
                                border: '1px solid #E2E8F0',
                                background: '#fff',
                                display: 'grid', placeItems: 'center',
                                cursor: 'pointer',
                                color: '#64748B',
                            }}
                        >
                            <ReloadOutlined style={{ fontSize: 18 }} />
                        </button>
                        {canCreateUsers && (
                            <Button
                                type="primary"
                                icon={<UserAddOutlined />}
                                onClick={handleAdd}
                                style={{
                                    height: 40,
                                    borderRadius: 12,
                                    fontWeight: 600,
                                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(59,130,246,0.25)',
                                }}
                            >
                                {!isMobile && 'เน€เธเธดเนเธกเธเธนเนเนเธเน'}
                            </Button>
                        )}
                    </div>
                }
            />

            {/* โ•โ•โ• Search Bar โ•โ•โ• */}
            {showSearch && (
                <div style={{
                    maxWidth: 1200,
                    margin: '0 auto',
                    padding: isMobile ? '12px 16px 0' : '16px 24px 0',
                }}>
                    <div className="users-search-input" style={{
                        background: '#fff',
                        borderRadius: 14,
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
                        overflow: 'hidden',
                    }}>
                        <Input
                            prefix={<SearchOutlined style={{ color: '#94A3B8', fontSize: 16 }} />}
                            placeholder="เธเนเธเธซเธฒเธเธนเนเนเธเนเธ•เธฒเธกเธเธทเนเธญ, username, เธเธ—เธเธฒเธ— เธซเธฃเธทเธญเธชเธฒเธเธฒ..."
                            value={searchValue}
                            onChange={e => setSearchValue(e.target.value)}
                            allowClear
                            style={{
                                padding: '12px 16px',
                                fontSize: 15,
                                border: 'none',
                                background: 'transparent',
                            }}
                        />
                    </div>
                </div>
            )}

            <PageContainer>
                {/* โ•โ•โ• Stats Strip โ•โ•โ• */}
                <div style={{
                    display: 'flex',
                    gap: 10,
                    marginTop: 16,
                    marginBottom: 20,
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    paddingBottom: 4,
                }}>
                    {[
                        { label: 'เธ—เธฑเนเธเธซเธกเธ”', count: stats.total, color: '#3B82F6', bg: '#EFF6FF', emoji: '๐‘ฅ' },
                        { label: 'เนเธเนเธเธฒเธ', count: stats.active, color: '#10B981', bg: '#ECFDF5', emoji: 'โ…' },
                        { label: 'เนเธญเธ”เธกเธดเธ', count: stats.admin, color: '#D97706', bg: '#FFFBEB', emoji: '๐‘‘' },
                    ].map(stat => (
                        <div key={stat.label} style={{
                            flex: '1 0 0',
                            minWidth: 100,
                            background: stat.bg,
                            borderRadius: 14,
                            padding: isMobile ? '12px 10px' : '14px 16px',
                            textAlign: 'center',
                            border: `1px solid ${stat.color}15`,
                            boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
                        }}>
                            <div style={{ fontSize: isMobile ? 18 : 22, marginBottom: 2 }}>{stat.emoji}</div>
                            <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: stat.color, lineHeight: 1.2 }}>
                                {stat.count}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginTop: 2 }}>
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* โ•โ•โ• Users List โ•โ•โ• */}
                <PageSection>
                    {isLoading ? (
                        <div style={{ padding: 20 }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{
                                    background: '#fff',
                                    borderRadius: 16,
                                    padding: 20,
                                    marginBottom: 12,
                                    border: '1px solid #F1F5F9',
                                }}>
                                    <Skeleton active avatar paragraph={{ rows: 2 }} />
                                </div>
                            ))}
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                        }}>
                            <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.7 }}>๐‘ค</div>
                            <Text strong style={{ fontSize: 17, display: 'block', color: '#1E293B', marginBottom: 6 }}>
                                {searchValue ? 'เนเธกเนเธเธเธเธนเนเนเธเนเธ—เธตเนเธเนเธเธซเธฒ' : 'เธขเธฑเธเนเธกเนเธกเธตเธเธนเนเนเธเนเนเธเธฃเธฐเธเธ'}
                            </Text>
                            <Text style={{ color: '#94A3B8', fontSize: 14 }}>
                                {searchValue ? 'เธฅเธญเธเธเนเธเธซเธฒเธ”เนเธงเธขเธเธณเธญเธทเนเธ' : 'เธเธ”เธเธธเนเธก "เน€เธเธดเนเธกเธเธนเนเนเธเน" เน€เธเธทเนเธญเน€เธฃเธดเนเธกเธ•เนเธ'}
                            </Text>
                            {!searchValue && canCreateUsers && (
                                <div style={{ marginTop: 20 }}>
                                    <Button type="primary" icon={<UserAddOutlined />} onClick={handleAdd}
                                        style={{
                                            borderRadius: 12,
                                            fontWeight: 600,
                                            height: 44,
                                            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                                            border: 'none',
                                        }}
                                    >
                                        เน€เธเธดเนเธกเธเธนเนเนเธเนเธเธเนเธฃเธ
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile
                                ? '1fr'
                                : screens.lg ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                            gap: 12,
                        }}>
                            {filteredUsers.map((u, index) => {
                                const roleName = u.roles?.roles_name || '';
                                const roleConf = ROLE_CONFIG[roleName] || DEFAULT_ROLE_CONFIG;
                                const displayName = u.name || u.username;
                                const isActive = u.is_active || false;

                                return (
                                    <div
                                        key={u.id}
                                        className="users-page-card"
                                        style={{
                                            background: '#fff',
                                            borderRadius: 18,
                                            border: `1px solid ${isActive ? '#D1FAE520' : '#E2E8F0'}`,
                                            boxShadow: '0 2px 12px rgba(15,23,42,0.04)',
                                            overflow: 'hidden',
                                            animationDelay: `${index * 0.04}s`,
                                        }}
                                    >
                                        {/* โ”€โ”€ Card Header โ”€โ”€ */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            padding: '16px 16px 12px',
                                        }}>
                                            {/* Avatar */}
                                            <div style={{
                                                position: 'relative',
                                                flexShrink: 0,
                                            }}>
                                                <div style={{
                                                    width: 48, height: 48,
                                                    borderRadius: 16,
                                                    background: roleConf.bg,
                                                    display: 'grid',
                                                    placeItems: 'center',
                                                    fontSize: 22,
                                                    border: `2px solid ${roleConf.color}30`,
                                                }}>
                                                    {roleConf.emoji}
                                                </div>
                                                {/* Online dot */}
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: -2, right: -2,
                                                    width: 14, height: 14,
                                                    borderRadius: '50%',
                                                    background: isActive ? '#10B981' : '#CBD5E1',
                                                    border: '2.5px solid #fff',
                                                    boxShadow: isActive ? '0 0 0 3px rgba(16,185,129,0.2)' : 'none',
                                                }} className={isActive ? 'users-status-dot' : ''} />
                                            </div>

                                            {/* Name + Role */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    marginBottom: 4,
                                                }}>
                                                    <Text strong style={{
                                                        fontSize: 15,
                                                        color: '#1E293B',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}>
                                                        {displayName}
                                                    </Text>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        padding: '2px 8px',
                                                        borderRadius: 20,
                                                        background: roleConf.bg,
                                                        color: roleConf.color,
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        whiteSpace: 'nowrap',
                                                        flexShrink: 0,
                                                    }}>
                                                        {u.roles?.display_name || roleName || 'N/A'}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    flexWrap: 'wrap',
                                                }}>
                                                    <Text style={{
                                                        fontSize: 12,
                                                        color: '#94A3B8',
                                                    }}>
                                                        @{u.username}
                                                    </Text>
                                                    {u.branch && (
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 3,
                                                            padding: '1px 7px',
                                                            borderRadius: 8,
                                                            background: '#F0F9FF',
                                                            color: '#0369A1',
                                                            fontSize: 11,
                                                            fontWeight: 600,
                                                        }}>
                                                            <BranchesOutlined style={{ fontSize: 10 }} />
                                                            {u.branch.branch_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status Pill */}
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: 20,
                                                background: isActive ? '#ECFDF5' : '#F1F5F9',
                                                color: isActive ? '#059669' : '#94A3B8',
                                                fontSize: 11,
                                                fontWeight: 700,
                                                whiteSpace: 'nowrap',
                                                flexShrink: 0,
                                            }}>
                                                {isActive ? '๐ข เธญเธญเธเนเธฅเธเน' : 'โช เธญเธญเธเนเธฅเธเน'}
                                            </span>
                                        </div>

                                        {/* โ”€โ”€ Card Footer โ”€โ”€ */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '10px 16px',
                                            background: '#FAFBFC',
                                            borderTop: '1px solid #F1F5F9',
                                        }}>
                                            {/* Meta info */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                color: '#94A3B8',
                                                fontSize: 12,
                                            }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                                                    <ClockCircleOutlined style={{ fontSize: 12 }} />
                                                    {u.last_login_at ? getTimeSince(u.last_login_at) : 'เธขเธฑเธเนเธกเนเน€เธเธขเน€เธเนเธฒ'}
                                                </span>
                                                {u.is_use !== undefined && (
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 3,
                                                        padding: '1px 7px', borderRadius: 8,
                                                        background: u.is_use ? '#ECFDF5' : '#FEF2F2',
                                                        color: u.is_use ? '#059669' : '#DC2626',
                                                        fontSize: 11, fontWeight: 600,
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        {u.is_use ? 'โ“ เนเธเนเธเธฒเธเนเธ”เน' : 'โ• เธฃเธฐเธเธฑเธ'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {canUpdateUsers && (
                                                    <button
                                                        className="users-action-btn"
                                                        onClick={(e) => { e.stopPropagation(); handleEdit(u); }}
                                                        style={{
                                                            width: 34, height: 34,
                                                            borderRadius: 10,
                                                            border: '1px solid #E2E8F0',
                                                            background: '#fff',
                                                            display: 'grid', placeItems: 'center',
                                                            cursor: 'pointer',
                                                            color: '#3B82F6',
                                                        }}
                                                        aria-label={`เนเธเนเนเธ ${displayName}`}
                                                    >
                                                        <EditOutlined style={{ fontSize: 14 }} />
                                                    </button>
                                                )}
                                                {canDeleteUsers && (
                                                    <button
                                                        className="users-action-btn"
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(u); }}
                                                        style={{
                                                            width: 34, height: 34,
                                                            borderRadius: 10,
                                                            border: '1px solid #FEE2E2',
                                                            background: '#FEF2F2',
                                                            display: 'grid', placeItems: 'center',
                                                            cursor: 'pointer',
                                                            color: '#EF4444',
                                                        }}
                                                        aria-label={`เธฅเธ ${displayName}`}
                                                    >
                                                        <DeleteOutlined style={{ fontSize: 14 }} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </PageSection>
            </PageContainer>
        </div>
    );
}

