'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Button,
    Grid,
    Input,
    Modal,
    Segmented,
    Select,
    Skeleton,
    Space,
    Spin,
    Tag,
    Typography,
    message,
} from 'antd';
import {
    BranchesOutlined,
    ClockCircleOutlined,
    DeleteOutlined,
    EditOutlined,
    ReloadOutlined,
    SafetyCertificateOutlined,
    SearchOutlined,
    TeamOutlined,
    UserAddOutlined,
} from '@ant-design/icons';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { User } from '../../../types/api/users';
import { useSocket } from '../../../hooks/useSocket';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { useGlobalLoading } from '../../../contexts/pos/GlobalLoadingContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useEffectivePermissions } from '../../../hooks/useEffectivePermissions';
import { authService } from '../../../services/auth.service';
import { userService } from '../../../services/users.service';
import { RealtimeEvents } from '../../../utils/realtimeEvents';
import { useDebouncedValue } from '../../../utils/useDebouncedValue';
import PageContainer from '../../../components/ui/page/PageContainer';
import PageSection from '../../../components/ui/page/PageSection';
import PageStack from '../../../components/ui/page/PageStack';
import UIPageHeader from '../../../components/ui/page/PageHeader';
import UIEmptyState from '../../../components/ui/states/EmptyState';
import ListPagination, { type CreatedSort } from '../../../components/ui/pagination/ListPagination';
import { DEFAULT_CREATED_SORT, parseCreatedSort } from '../../../lib/list-sort';

const { Text } = Typography;
const { useBreakpoint } = Grid;

type StatusFilter = 'all' | 'active' | 'inactive';

const ROLE_CONFIG: Record<string, { color: string; bg: string; emoji: string }> = {
    Admin: { color: '#D97706', bg: '#FFFBEB', emoji: '👑' },
    Manager: { color: '#DB2777', bg: '#FDF2F8', emoji: '🎯' },
    Cashier: { color: '#2563EB', bg: '#EFF6FF', emoji: '💳' },
    Chef: { color: '#059669', bg: '#ECFDF5', emoji: '👨‍🍳' },
    Waiter: { color: '#7C3AED', bg: '#F5F3FF', emoji: '🍽️' },
};

const DEFAULT_ROLE_CONFIG = { color: '#64748B', bg: '#F1F5F9', emoji: '👤' };

interface StatsCardProps {
    total: number;
    active: number;
    inactive: number;
}

const StatsCard = ({ total, active, inactive }: StatsCardProps) => (
    <div
        style={{
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 8,
            padding: 14,
        }}
    >
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', display: 'block' }}>{total}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ทั้งหมด</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#0f766e', display: 'block' }}>{active}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ใช้งาน</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#b91c1c', display: 'block' }}>{inactive}</span>
            <Text style={{ fontSize: 12, color: '#64748b' }}>ระงับ</Text>
        </div>
    </div>
);

interface UserCardProps {
    user: User;
    canUpdateUsers: boolean;
    canDeleteUsers: boolean;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
}

const UserCard = ({ user, canUpdateUsers, canDeleteUsers, onEdit, onDelete }: UserCardProps) => {
    const roleName = user.roles?.roles_name || '';
    const roleConf = ROLE_CONFIG[roleName] || DEFAULT_ROLE_CONFIG;
    const displayName = user.name || user.username;
    const isActive = Boolean(user.is_active);

    return (
        <div
            style={{
                background: '#fff',
                borderRadius: 16,
                border: '1px solid #E2E8F0',
                boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
                padding: 14,
                display: 'grid',
                gap: 10,
                cursor: canUpdateUsers ? 'pointer' : 'default',
            }}
            onClick={() => canUpdateUsers && onEdit(user)}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: roleConf.bg,
                        border: `1px solid ${roleConf.color}35`,
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 20,
                        flexShrink: 0,
                    }}
                >
                    {roleConf.emoji}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Text strong style={{ fontSize: 15, color: '#0f172a' }} ellipsis={{ tooltip: displayName }}>
                            {displayName}
                        </Text>
                        <Tag color={isActive ? 'green' : 'default'} style={{ marginInlineEnd: 0 }}>
                            {isActive ? 'ใช้งาน' : 'ระงับ'}
                        </Tag>
                        <Tag style={{ marginInlineEnd: 0, border: 'none', background: roleConf.bg, color: roleConf.color }}>
                            {user.roles?.display_name || roleName || 'N/A'}
                        </Tag>
                    </div>

                    <Space size={10} wrap style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>@{user.username}</Text>
                        {user.branch?.branch_name ? (
                            <Tag style={{ margin: 0, border: 'none', background: '#F0F9FF', color: '#0369A1' }}>
                                <BranchesOutlined /> {user.branch.branch_name}
                            </Tag>
                        ) : null}
                    </Space>
                </div>

                <Space size={6}>
                    {canUpdateUsers ? (
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={(event) => {
                                event.stopPropagation();
                                onEdit(user);
                            }}
                            style={{ borderRadius: 10, background: '#EEF2FF', color: '#4F46E5', width: 34, height: 34 }}
                            aria-label={`แก้ไข ${displayName}`}
                        />
                    ) : null}
                    {canDeleteUsers ? (
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(event) => {
                                event.stopPropagation();
                                onDelete(user);
                            }}
                            style={{ borderRadius: 10, background: '#FEF2F2', width: 34, height: 34 }}
                            aria-label={`ลบ ${displayName}`}
                        />
                    ) : null}
                </Space>
            </div>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid #F1F5F9',
                    paddingTop: 8,
                }}
            >
                <Text type="secondary" style={{ fontSize: 12 }}>
                    <ClockCircleOutlined /> {user.last_login_at ? getTimeSince(user.last_login_at) : 'ยังไม่เคยเข้า'}
                </Text>

                {user.is_use !== undefined ? (
                    <Tag
                        style={{
                            margin: 0,
                            border: 'none',
                            background: user.is_use ? '#ECFDF5' : '#FEF2F2',
                            color: user.is_use ? '#047857' : '#DC2626',
                            fontWeight: 600,
                        }}
                    >
                        {user.is_use ? 'ใช้งานได้' : 'ระงับ'}
                    </Tag>
                ) : null}
            </div>
        </div>
    );
};

function getTimeSince(date: string) {
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
}

export default function UsersPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const isUrlReadyRef = useRef(false);

    const [users, setUsers] = useState<User[]>([]);
    const [csrfToken, setCsrfToken] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [isFetching, setIsFetching] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [createdSort, setCreatedSort] = useState<CreatedSort>(DEFAULT_CREATED_SORT);
    const [totalUsers, setTotalUsers] = useState(0);

    const debouncedSearch = useDebouncedValue(searchValue, 300);

    useEffect(() => {
        if (isUrlReadyRef.current) return;
        const pageParam = parseInt(searchParams.get('page') || '1', 10);
        const limitParam = parseInt(searchParams.get('limit') || '20', 10);
        const qParam = searchParams.get('q') || '';
        const statusParam = searchParams.get('status');
        const roleParam = searchParams.get('role') || 'all';
        const sortParam = searchParams.get('sort_created');

        setPage(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);
        setPageSize(Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 20);
        setSearchValue(qParam);
        setStatusFilter(statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all');
        setRoleFilter(roleParam || 'all');
        setCreatedSort(parseCreatedSort(sortParam));
        isUrlReadyRef.current = true;
    }, [searchParams]);

    useEffect(() => {
        if (!isUrlReadyRef.current) return;
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(pageSize));
        if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (roleFilter !== 'all') params.set('role', roleFilter);
        if (createdSort !== DEFAULT_CREATED_SORT) params.set('sort_created', createdSort);
        const href = `${pathname}?${params.toString()}`;
        router.replace(href, { scroll: false });
    }, [router, pathname, page, pageSize, debouncedSearch, statusFilter, roleFilter, createdSort]);

    const { socket } = useSocket();
    const { execute } = useAsyncAction();
    const { showLoading, hideLoading } = useGlobalLoading();
    const { user, loading: authLoading } = useAuth();
    const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });

    const canViewUsers = can('users.page', 'view');
    const canCreateUsers = can('users.page', 'create');
    const canUpdateUsers = can('users.page', 'update');
    const canDeleteUsers = can('users.page', 'delete');

    const fetchUsers = useCallback(async (nextPage: number = page, nextPageSize: number = pageSize) => {
        setIsFetching(true);
        try {
            await execute(async () => {
                const params = new URLSearchParams();
                params.set('page', String(nextPage));
                params.set('limit', String(nextPageSize));
                if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
                if (statusFilter !== 'all') params.set('status', statusFilter);
                if (roleFilter !== 'all') params.set('role', roleFilter);
                params.set('sort_created', createdSort);
                const data = await userService.getAllUsersPaginated(undefined, params);
                setUsers(data.data);
                setTotalUsers(data.total);
                setPage(data.page);
                setPageSize(nextPageSize);
                setHasLoaded(true);
            }, 'กำลังโหลดข้อมูลผู้ใช้...');
        } finally {
            setIsFetching(false);
        }
    }, [execute, page, pageSize, debouncedSearch, roleFilter, statusFilter, createdSort]);

    useEffect(() => {
        const fetchCsrf = async () => {
            const token = await authService.getCsrfToken();
            setCsrfToken(token);
        };

        fetchCsrf();
    }, []);

    useEffect(() => {
        if (!authLoading && !permissionLoading && (!user || !canViewUsers)) {
            const timer = setTimeout(() => {
                message.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
                router.push('/');
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [authLoading, permissionLoading, user, canViewUsers, router]);

    useEffect(() => {
        if (authLoading) return;
        if (!isUrlReadyRef.current) return;
        if (canViewUsers) {
            fetchUsers();
        }
    }, [authLoading, canViewUsers, fetchUsers, page, pageSize]);

    useEffect(() => {
        if (!socket) return;

        socket.on(RealtimeEvents.users.create, (newUser: User) => {
            setUsers((prevUsers) => [...prevUsers, newUser]);
            message.success(`ผู้ใช้ใหม่ ${newUser.name || newUser.username} ถูกเพิ่มแล้ว`);
        });

        socket.on(RealtimeEvents.users.update, (updatedUser: User) => {
            setUsers((prevUsers) => prevUsers.map((item) => (item.id === updatedUser.id ? updatedUser : item)));
        });

        socket.on(RealtimeEvents.users.delete, ({ id }: { id: string }) => {
            setUsers((prevUsers) => prevUsers.filter((item) => item.id !== id));
        });

        socket.on(RealtimeEvents.users.status, ({ id, is_active }: { id: string; is_active: boolean }) => {
            setUsers((prevUsers) => prevUsers.map((item) => (item.id === id ? { ...item, is_active } : item)));
        });

        return () => {
            socket.off(RealtimeEvents.users.create);
            socket.off(RealtimeEvents.users.update);
            socket.off(RealtimeEvents.users.delete);
            socket.off(RealtimeEvents.users.status);
        };
    }, [socket]);

    const roleOptions = useMemo(() => {
        const roleMap = new Map<string, string>();
        users.forEach((item) => {
            const value = item.roles?.roles_name;
            if (!value) return;
            roleMap.set(value, item.roles?.display_name || value);
        });

        return [
            { value: 'all', label: 'ทุกบทบาท' },
            ...Array.from(roleMap.entries()).map(([value, label]) => ({ value, label })),
        ];
    }, [users]);

    const stats = useMemo(() => {
        const activeUsers = users.filter((item) => item.is_active).length;
        const inactiveUsers = Math.max(users.length - activeUsers, 0);
        return { total: totalUsers, active: activeUsers, inactive: inactiveUsers };
    }, [users, totalUsers]);

    const filteredUsers = useMemo(() => {
        return users;
    }, [users]);

    const handleAdd = () => {
        if (!canCreateUsers) {
            message.error('คุณไม่มีสิทธิ์เพิ่มผู้ใช้');
            return;
        }

        showLoading('กำลังเปิดหน้าจัดการผู้ใช้...');
        router.push('/users/manage/add');
        setTimeout(() => hideLoading(), 800);
    };

    const handleGoPermissions = () => {
        showLoading('กำลังเปิดหน้าจัดการสิทธิ์...');
        router.push('/users/permissions');
        setTimeout(() => hideLoading(), 800);
    };

    const handleEdit = (selectedUser: User) => {
        if (!canUpdateUsers) {
            message.error('คุณไม่มีสิทธิ์แก้ไขผู้ใช้');
            return;
        }

        router.push(`/users/manage/edit/${selectedUser.id}`);
    };

    const handleDelete = (userToDelete: User) => {
        if (!canDeleteUsers) {
            message.error('คุณไม่มีสิทธิ์ลบผู้ใช้');
            return;
        }

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
                    await fetchUsers(page, pageSize);
                }, 'กำลังลบผู้ใช้งาน...');
            },
        });
    };

    if (authLoading || permissionLoading || !user || !canViewUsers) {
        return (
            <div
                style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#F8FAFC',
                }}
            >
                <Spin size="large" />
            </div>
        );
    }

    const showInitialSkeleton = !hasLoaded && isFetching;

    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: 100 }}>
            <UIPageHeader
                title="ผู้ใช้งาน"
                subtitle={`ทั้งหมด ${totalUsers} คน`}
                icon={<TeamOutlined style={{ fontSize: 20 }} />}
                actions={
                    <Space size={8} wrap>
                        <Button icon={<ReloadOutlined />} onClick={() => { void fetchUsers(); }} loading={isFetching} />
                        <Button icon={<SafetyCertificateOutlined />} onClick={handleGoPermissions}>
                            {!isMobile ? 'จัดการสิทธิ์' : ''}
                        </Button>
                        {canCreateUsers ? (
                            <Button type="primary" icon={<UserAddOutlined />} onClick={handleAdd}>
                                {!isMobile ? 'เพิ่มผู้ใช้' : ''}
                            </Button>
                        ) : null}
                    </Space>
                }
            />

            <PageContainer>
                <PageStack>
                    <StatsCard total={stats.total} active={stats.active} inactive={stats.inactive} />

                    <PageSection title="ค้นหาและตัวกรอง">
                        <div style={{ display: 'grid', gap: 10 }}>
                            <Input
                                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                                allowClear
                                placeholder="ค้นหาจากชื่อผู้ใช้, username, บทบาท หรือสาขา..."
                                value={searchValue}
                                onChange={(event) => {
                                    setPage(1);
                                    setSearchValue(event.target.value);
                                }}
                            />
                            <Segmented<StatusFilter>
                                options={[
                                    { label: 'ทั้งหมด', value: 'all' },
                                    { label: 'ใช้งาน', value: 'active' },
                                    { label: 'ระงับ', value: 'inactive' },
                                ]}
                                value={statusFilter}
                                onChange={(value) => {
                                    setPage(1);
                                    setStatusFilter(value);
                                }}
                            />
                            <Select
                                value={roleFilter}
                                options={roleOptions}
                                onChange={(value) => {
                                    setPage(1);
                                    setRoleFilter(value);
                                }}
                                placeholder="เลือกบทบาท"
                            />
                        </div>
                    </PageSection>

                    <PageSection title="รายการผู้ใช้" extra={<span style={{ fontWeight: 600 }}>{filteredUsers.length}</span>}>
                        {showInitialSkeleton ? (
                            <div style={{ display: 'grid', gap: 10 }}>
                                {[1, 2, 3].map((item) => (
                                    <div
                                        key={item}
                                        style={{
                                            background: '#fff',
                                            borderRadius: 16,
                                            border: '1px solid #F1F5F9',
                                            padding: 16,
                                        }}
                                    >
                                        <Skeleton active avatar paragraph={{ rows: 2 }} />
                                    </div>
                                ))}
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <UIEmptyState
                                title={debouncedSearch || roleFilter !== 'all' || statusFilter !== 'all' ? 'ไม่พบผู้ใช้ตามเงื่อนไข' : 'ยังไม่มีผู้ใช้'}
                                description={debouncedSearch || roleFilter !== 'all' || statusFilter !== 'all' ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง' : 'เพิ่มผู้ใช้แรกเพื่อเริ่มใช้งาน'}
                                action={
                                    !debouncedSearch && roleFilter === 'all' && statusFilter === 'all' && canCreateUsers ? (
                                        <Button type="primary" icon={<UserAddOutlined />} onClick={handleAdd}>
                                            เพิ่มผู้ใช้
                                        </Button>
                                    ) : null
                                }
                            />
                        ) : (
                            <div
                                style={{
                                    display: 'grid',
                                    gap: 10,
                                    gridTemplateColumns: isMobile ? '1fr' : screens.lg ? 'repeat(2, 1fr)' : '1fr',
                                }}
                            >
                                {filteredUsers.map((item) => (
                                    <UserCard
                                        key={item.id}
                                        user={item}
                                        canUpdateUsers={canUpdateUsers}
                                        canDeleteUsers={canDeleteUsers}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        )}
                        <ListPagination
                            page={page}
                            pageSize={pageSize}
                            total={totalUsers}
                            loading={isFetching}
                            onPageChange={setPage}
                            onPageSizeChange={(size) => {
                                setPage(1);
                                setPageSize(size);
                            }}
                            sortCreated={createdSort}
                            onSortCreatedChange={(next) => {
                                setPage(1);
                                setCreatedSort(next);
                            }}
                        />
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
