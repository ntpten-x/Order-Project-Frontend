'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Button, message, Modal, Grid, Input, Skeleton, Typography } from 'antd';
import {
    TeamOutlined,
    SearchOutlined,
    ReloadOutlined,
    UserAddOutlined,
    UserOutlined,
    EditOutlined,
    DeleteOutlined,
    ClockCircleOutlined,
    BranchesOutlined,
    RightOutlined,
} from '@ant-design/icons';
import { User } from "../../../types/api/users";
import { useRouter } from 'next/navigation';
import { useSocket } from "../../../hooks/useSocket";
import { useAsyncAction } from "../../../hooks/useAsyncAction";
import { useGlobalLoading } from "../../../contexts/pos/GlobalLoadingContext";
import { useAuth } from "../../../contexts/AuthContext";
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

// ── Role Config ──
const ROLE_CONFIG: Record<string, { color: string; bg: string; emoji: string }> = {
    'Admin': { color: '#D97706', bg: '#FFFBEB', emoji: '👑' },
    'Manager': { color: '#DB2777', bg: '#FDF2F8', emoji: '⭐' },
    'Cashier': { color: '#2563EB', bg: '#EFF6FF', emoji: '💳' },
    'Chef': { color: '#059669', bg: '#ECFDF5', emoji: '👨‍🍳' },
    'Waiter': { color: '#7C3AED', bg: '#F5F3FF', emoji: '🍽️' },
};

const DEFAULT_ROLE_CONFIG = { color: '#64748B', bg: '#F1F5F9', emoji: '👤' };

// ── Responsive CSS ──
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
        if (!authLoading) {
            if (!user || !['Admin', 'Manager'].includes(user.role)) {
                const timer = setTimeout(() => {
                    message.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
                    router.push('/');
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [user, authLoading, router]);

    const fetchUsers = useCallback(async () => {
        execute(async () => {
            const data = await userService.getAllUsers();
            setUsers(data);
        }, 'กำลังโหลดข้อมูลผู้ใช้...');
    }, [execute]);

    useEffect(() => {
        if (authLoading) return;
        if (user?.role === 'Admin' || user?.role === 'Manager') {
            fetchUsers();
        }
    }, [authLoading, user, fetchUsers]);

    useEffect(() => {
        if (!socket) return;

        socket.on(RealtimeEvents.users.create, (newUser: User) => {
            setUsers((prevUsers) => [...prevUsers, newUser]);
            message.success(`ผู้ใช้ใหม่ ${newUser.name || newUser.username} ถูกเพิ่มแล้ว`);
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

    // ── Filtered Users ──
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

    // ── Stats ──
    const stats = useMemo(() => {
        const activeUsers = users.filter(u => u.is_active).length;
        const adminUsers = users.filter(u => u.roles?.roles_name === 'Admin').length;
        return { total: users.length, active: activeUsers, admin: adminUsers };
    }, [users]);

    const handleAdd = () => {
        showLoading();
        router.push('/users/manage/add');
        setTimeout(() => hideLoading(), 1000);
    };

    const handleEdit = (user: User) => {
        router.push(`/users/manage/edit/${user.id}`);
    };

    const handleDelete = (userToDelete: User) => {
        Modal.confirm({
            title: 'ยืนยันการลบผู้ใช้',
            content: `คุณต้องการลบผู้ใช้ "${userToDelete.name || userToDelete.username}" หรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            onOk: async () => {
                await execute(async () => {
                    await userService.deleteUser(userToDelete.id, undefined, csrfToken);
                    message.success(`ลบผู้ใช้ "${userToDelete.name || userToDelete.username}" สำเร็จ`);
                }, "กำลังลบผู้ใช้งาน...");
            },
        });
    };

    const getTimeSince = (date: string) => {
        const now = new Date();
        const d = new Date(date);
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'เมื่อกี้';
        if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
        const hours = Math.floor(diffMins / 60);
        if (hours < 24) return `${hours} ชม.ที่แล้ว`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days} วันที่แล้ว`;
        return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
    };

    // ── Auth Guard ──
    if (authLoading || !user || !['Admin', 'Manager'].includes(user.role)) {
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

            {/* ═══ Header ═══ */}
            <UIPageHeader
                title="จัดการผู้ใช้"
                subtitle={`ทั้งหมด ${users.length} คน`}
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
                            {!isMobile && 'เพิ่มผู้ใช้'}
                        </Button>
                    </div>
                }
            />

            {/* ═══ Search Bar ═══ */}
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
                            placeholder="ค้นหาผู้ใช้ตามชื่อ, username, บทบาท หรือสาขา..."
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
                {/* ═══ Stats Strip ═══ */}
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
                        { label: 'ทั้งหมด', count: stats.total, color: '#3B82F6', bg: '#EFF6FF', emoji: '👥' },
                        { label: 'ใช้งาน', count: stats.active, color: '#10B981', bg: '#ECFDF5', emoji: '✅' },
                        { label: 'แอดมิน', count: stats.admin, color: '#D97706', bg: '#FFFBEB', emoji: '👑' },
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

                {/* ═══ Users List ═══ */}
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
                            <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.7 }}>👤</div>
                            <Text strong style={{ fontSize: 17, display: 'block', color: '#1E293B', marginBottom: 6 }}>
                                {searchValue ? 'ไม่พบผู้ใช้ที่ค้นหา' : 'ยังไม่มีผู้ใช้ในระบบ'}
                            </Text>
                            <Text style={{ color: '#94A3B8', fontSize: 14 }}>
                                {searchValue ? 'ลองค้นหาด้วยคำอื่น' : 'กดปุ่ม "เพิ่มผู้ใช้" เพื่อเริ่มต้น'}
                            </Text>
                            {!searchValue && (
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
                                        เพิ่มผู้ใช้คนแรก
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
                                        {/* ── Card Header ── */}
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
                                                {isActive ? '🟢 ออนไลน์' : '⚪ ออฟไลน์'}
                                            </span>
                                        </div>

                                        {/* ── Card Footer ── */}
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
                                                    {u.last_login_at ? getTimeSince(u.last_login_at) : 'ยังไม่เคยเข้า'}
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
                                                        {u.is_use ? '✓ ใช้งานได้' : '✕ ระงับ'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div style={{ display: 'flex', gap: 6 }}>
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
                                                    aria-label={`แก้ไข ${displayName}`}
                                                >
                                                    <EditOutlined style={{ fontSize: 14 }} />
                                                </button>
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
                                                    aria-label={`ลบ ${displayName}`}
                                                >
                                                    <DeleteOutlined style={{ fontSize: 14 }} />
                                                </button>
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
