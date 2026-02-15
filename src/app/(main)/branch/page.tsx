'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  App,
  Button,
  Flex,
  Grid,
  Skeleton,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import {
  BranchesOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Branch } from '../../../types/api/branch';
import { useGlobalLoading } from '../../../contexts/pos/GlobalLoadingContext';
import { useSocket } from '../../../hooks/useSocket';
import { useRealtimeList } from '../../../utils/pos/realtime';
import { useAuth } from '../../../contexts/AuthContext';
import { useEffectivePermissions } from '../../../hooks/useEffectivePermissions';
import { branchService } from '../../../services/branch.service';
import { authService } from '../../../services/auth.service';
import { getCsrfTokenCached } from '../../../utils/pos/csrf';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { RealtimeEvents } from '../../../utils/realtimeEvents';
import PageContainer from '../../../components/ui/page/PageContainer';
import PageSection from '../../../components/ui/page/PageSection';
import PageStack from '../../../components/ui/page/PageStack';
import UIEmptyState from '../../../components/ui/states/EmptyState';
import UIPageHeader from '../../../components/ui/page/PageHeader';
import { AccessGuardFallback } from '../../../components/pos/AccessGuard';
import ListPagination, { type CreatedSort } from '../../../components/ui/pagination/ListPagination';
import { StatsGroup } from '../../../components/ui/card/StatsGroup';
import { SearchInput } from '../../../components/ui/input/SearchInput';
import { SearchBar } from '../../../components/ui/page/SearchBar';
import { ModalSelector } from '../../../components/ui/select/ModalSelector';
import { t } from '../../../utils/i18n';
import { useDebouncedValue } from '../../../utils/useDebouncedValue';
import { DEFAULT_CREATED_SORT, parseCreatedSort } from '../../../lib/list-sort';

const { Text } = Typography;
const { useBreakpoint } = Grid;

type FilterType = 'all' | 'active' | 'inactive';

interface BranchCardProps {
  branch: Branch;
  canManageBranches: boolean;
  canSwitchBranch: boolean;
  isCurrentBranch: boolean;
  onEdit: (branch: Branch) => void;
  onDelete: (branch: Branch) => void;
  onSwitch: (branch: Branch) => void;
}

const BranchCard = ({ branch, canManageBranches, canSwitchBranch, isCurrentBranch, onEdit, onDelete, onSwitch }: BranchCardProps) => {
  const isActive = branch.is_active !== false;

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
        cursor: canManageBranches ? 'pointer' : 'default',
      }}
      onClick={() => canManageBranches && onEdit(branch)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: isActive ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${isActive ? '#10B98155' : '#DC262655'}`,
            display: 'grid',
            placeItems: 'center',
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          <BranchesOutlined style={{ color: isActive ? '#047857' : '#B91C1C' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text strong style={{ fontSize: 15, color: '#0f172a' }} ellipsis={{ tooltip: branch.branch_name }}>
              {branch.branch_name}
            </Text>
            {isCurrentBranch ? (
              <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                กำลังใช้งาน
              </Tag>
            ) : null}
            <Tag color={isActive ? 'green' : 'default'} style={{ marginInlineEnd: 0 }}>
              {isActive ? t('branch.stats.active') : t('branch.stats.inactive')}
            </Tag>
            <Tag style={{ marginInlineEnd: 0, border: 'none', background: '#EFF6FF', color: '#1D4ED8' }}>
              {branch.branch_code}
            </Tag>
          </div>

          <Space size={10} wrap style={{ marginTop: 4 }}>
            {branch.phone ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {branch.phone}
              </Text>
            ) : null}
            {branch.address ? (
              <Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: branch.address }}>
                {branch.address}
              </Text>
            ) : null}
          </Space>
        </div>

        <Space size={6}>
          {canManageBranches ? (
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                onEdit(branch);
              }}
              style={{ borderRadius: 10, background: '#EEF2FF', color: '#4F46E5', width: 34, height: 34 }}
              aria-label={`edit-branch-${branch.id}`}
            />
          ) : null}
          {canManageBranches ? (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                onDelete(branch);
              }}
              style={{ borderRadius: 10, background: '#FEF2F2', width: 34, height: 34 }}
              aria-label={`delete-branch-${branch.id}`}
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
          <ClockCircleOutlined /> {branch.tax_id ? `เลขผู้เสียภาษี: ${branch.tax_id}` : 'ไม่ระบุเลขผู้เสียภาษี'}
        </Text>

        {canSwitchBranch ? (
          <Button
            size="small"
            icon={<SwapOutlined />}
            disabled={!isActive || isCurrentBranch}
            onClick={(event) => {
              event.stopPropagation();
              onSwitch(branch);
            }}
            style={{
              borderRadius: 8,
              border: 'none',
              background: isActive ? '#E0F2FE' : '#F1F5F9',
              color: isActive ? '#0369A1' : '#64748B',
              fontWeight: 600,
            }}
          >
            สลับสาขา
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default function BranchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isUrlReadyRef = useRef(false);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [createdSort, setCreatedSort] = useState<CreatedSort>(DEFAULT_CREATED_SORT);
  const [totalBranches, setTotalBranches] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const { showLoading, hideLoading } = useGlobalLoading();
  const { socket } = useSocket();
  const { user, loading: authLoading, checkAuth } = useAuth();
  const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
  const canViewBranches = can('branches.page', 'view');
  const canManageBranches = can('branches.page', 'update');
  const canSwitchBranch = user?.role === "Admin";
  const { message: messageApi, modal } = App.useApp();
  const { execute } = useAsyncAction();
  const unauthorizedNotifiedRef = useRef(false);

  useEffect(() => {
    if (isUrlReadyRef.current) return;
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = parseInt(searchParams.get('limit') || '20', 10);
    const qParam = searchParams.get('q') || '';
    const statusParam = searchParams.get('status');
    const sortParam = searchParams.get('sort_created');

    setPage(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);
    setPageSize(Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 20);
    setSearchQuery(qParam);
    setFilter(statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all');
    setCreatedSort(parseCreatedSort(sortParam));
    isUrlReadyRef.current = true;
  }, [searchParams]);

  useEffect(() => {
    if (!isUrlReadyRef.current) return;
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(pageSize));
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
    if (filter !== 'all') params.set('status', filter);
    if (createdSort !== DEFAULT_CREATED_SORT) params.set('sort_created', createdSort);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, page, pageSize, debouncedSearch, filter, createdSort]);

  const fetchBranches = useCallback(async (nextPage: number = page, nextPageSize: number = pageSize) => {
    setIsFetching(true);
    try {
      await execute(async () => {
        const params = new URLSearchParams();
        params.set('page', String(nextPage));
        params.set('limit', String(nextPageSize));
        if (filter === 'active') params.set('active', 'true');
        if (filter === 'inactive') params.set('active', 'false');
        if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
        params.set('sort_created', createdSort);

        const result = await branchService.getAllPaginated(undefined, params);
        setBranches(result.data);
        setTotalBranches(result.total);
        setPage(result.page);
        setPageSize(nextPageSize);
        setHasLoaded(true);
      }, t('branch.loading'));
    } finally {
      setIsFetching(false);
    }
  }, [execute, filter, page, pageSize, debouncedSearch, createdSort]);

  useRealtimeList(
    socket,
    {
      create: RealtimeEvents.branches.create,
      update: RealtimeEvents.branches.update,
      delete: RealtimeEvents.branches.delete,
    },
    setBranches,
    (item) => item.id,
    (item) => item.is_active !== false
  );

  useEffect(() => {
    if (!authLoading && !permissionLoading && user) {
      if (!canViewBranches) {
        if (!unauthorizedNotifiedRef.current) {
          unauthorizedNotifiedRef.current = true;
          messageApi.error(t('branch.noPermission'));
        }
        return;
      }
      if (!isUrlReadyRef.current) return;
      void fetchBranches();
    }
    if (canViewBranches) {
      unauthorizedNotifiedRef.current = false;
    }
  }, [user, authLoading, permissionLoading, canViewBranches, fetchBranches, messageApi]);

  useEffect(() => {
    if (!user) return;
    // Fetch active admin branch selection (httpOnly cookie) for correct UI display.
    fetch("/api/auth/active-branch", { credentials: "include", cache: "no-store" })
      .then((res) => res.json().catch(() => null))
      .then((data: { active_branch_id?: string | null } | null) => {
        setActiveBranchId(typeof data?.active_branch_id === "string" ? data!.active_branch_id : null);
      })
      .catch(() => {
        setActiveBranchId(null);
      });
  }, [user?.id]);

  const handleAdd = () => {
    if (!canManageBranches) return;
    showLoading(t('branch.loading'));
    router.push('/branch/manager/add');
    setTimeout(() => hideLoading(), 800);
  };

  const handleEdit = (branch: Branch) => {
    if (!canManageBranches) return;
    router.push(`/branch/manager/edit/${branch.id}`);
  };

  const handleDelete = (branch: Branch) => {
    if (!canManageBranches) return;
    modal.confirm({
      title: t('branch.delete.title'),
      content: t('branch.delete.content', { name: branch.branch_name }),
      okText: t('branch.delete.ok'),
      okType: 'danger',
      cancelText: t('branch.delete.cancel'),
      centered: true,
      onOk: async () => {
        try {
          const csrfToken = await getCsrfTokenCached();
          await branchService.delete(branch.id, undefined, csrfToken);
          messageApi.success(t('branch.delete.success', { name: branch.branch_name }));
          await fetchBranches();
        } catch {
          messageApi.error(t('branch.delete.error'));
        }
      },
    });
  };

  const handleSwitchBranch = (branch: Branch) => {
    if (!canSwitchBranch) {
      messageApi.error('คุณไม่มีสิทธิ์สลับสาขา');
      return;
    }

    void execute(async () => {
      const csrfToken = await getCsrfTokenCached();
      await authService.switchBranch(branch.id, csrfToken);
      await checkAuth();
      setActiveBranchId(branch.id);
      window.dispatchEvent(new CustomEvent("active-branch-changed", { detail: { activeBranchId: branch.id } }));
      messageApi.success(t('branch.switch.success', { name: branch.branch_name }));
    }, t('branch.switch.loading'));
  };

  const activeBranches = branches.filter((item) => item.is_active).length;
  const inactiveBranches = Math.max(branches.length - activeBranches, 0);
  const assignedBranchId = user?.branch?.id || user?.branch_id || null;
  const assignedBranchLabel = user?.branch
    ? `${user.branch.branch_name} (${user.branch.branch_code})`
    : (user?.branch_id || '-');
  const currentBranchId = canSwitchBranch ? (activeBranchId || assignedBranchId) : assignedBranchId;
  const currentBranchLabel = (() => {
    const found = branches.find((b) => b.id === currentBranchId);
    if (found) return `${found.branch_name} (${found.branch_code})`;
    return assignedBranchLabel;
  })();
  const filteredBranches = useMemo(() => {
    if (!currentBranchId) return branches;
    const idx = branches.findIndex((b) => b.id === currentBranchId);
    if (idx <= 0) return branches;
    const selected = branches[idx];
    return [selected, ...branches.slice(0, idx), ...branches.slice(idx + 1)];
  }, [branches, currentBranchId]);

  if (authLoading || permissionLoading) {
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

  if (!user || !canViewBranches) {
    return <AccessGuardFallback message={t('branch.noPermission')} tone="danger" />;
  }

  const showInitialSkeleton = !hasLoaded && isFetching;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: 100 }}>
      <UIPageHeader
        title={t('branch.page.title')}
        subtitle={
          <Space size={8} wrap>
            <span>{t('branch.page.subtitle', { count: totalBranches })}</span>
            <Tag style={{ marginInlineEnd: 0 }} color="blue">
              สาขาปัจจุบัน: {currentBranchLabel}
            </Tag>
            {canSwitchBranch ? (
              <Tag style={{ marginInlineEnd: 0 }} color="default">
                สาขาที่ผูกกับผู้ใช้: {assignedBranchLabel}
              </Tag>
            ) : null}
          </Space>
        }
        icon={<BranchesOutlined style={{ fontSize: 20 }} />}
        actions={
          <Space size={8} wrap>
            <Button icon={<ReloadOutlined />} onClick={() => { void fetchBranches(); }} loading={isFetching} />
            {canManageBranches ? (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                {!isMobile ? t('branch.actions.add') : ''}
              </Button>
            ) : null}
          </Space>
        }
      />

      <PageContainer>
        <PageStack>
          <StatsGroup
            stats={[
              { label: t('branch.stats.total'), value: totalBranches },
              { label: t('branch.stats.active'), value: activeBranches, color: '#0f766e' },
              { label: t('branch.stats.inactive'), value: inactiveBranches, color: '#b91c1c' },
            ]}
          />

          <PageSection title="ค้นหาและตัวกรอง">
            <SearchBar bodyStyle={{ padding: 12 }}>
              <SearchInput
                placeholder={t('branch.search.placeholder')}
                value={searchQuery}
                onChange={(value) => {
                  setPage(1);
                  setSearchQuery(value);
                }}
              />
              <Flex gap={10} wrap="wrap">
                <div style={{ flex: isMobile ? '1 1 100%' : '1 1 220px' }}>
                  <ModalSelector<FilterType>
                    title={t('branch.search.filter.title')}
                    value={filter}
                    options={[
                      { label: t('branch.search.filter.all'), value: 'all' },
                      { label: t('branch.search.filter.active'), value: 'active' },
                      { label: t('branch.search.filter.inactive'), value: 'inactive' },
                    ]}
                    onChange={(value) => {
                      setPage(1);
                      setFilter(value);
                    }}
                    placeholder={t('branch.search.filter.placeholder')}
                  />
                </div>
              </Flex>
            </SearchBar>
          </PageSection>

          <PageSection title={t('branch.section.listTitle')} extra={<span style={{ fontWeight: 600 }}>{filteredBranches.length}</span>}>
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
            ) : filteredBranches.length === 0 ? (
              <UIEmptyState
                title={searchQuery || filter !== 'all' ? t('branch.empty.filtered.title') : t('branch.empty.default.title')}
                description={searchQuery || filter !== 'all' ? t('branch.empty.filtered.description') : t('branch.empty.default.description')}
                action={
                  searchQuery || filter !== 'all' ? (
                    <Button
                      onClick={() => {
                        setPage(1);
                        setSearchQuery('');
                        setFilter('all');
                      }}
                    >
                      {t('branch.empty.reset')}
                    </Button>
                  ) : (
                    <Button type="primary" onClick={handleAdd} disabled={!canManageBranches}>
                      {t('branch.empty.add')}
                    </Button>
                  )
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
                {filteredBranches.map((item) => (
                  <BranchCard
                    key={item.id}
                    branch={item}
                    canManageBranches={canManageBranches}
                    canSwitchBranch={canSwitchBranch}
                    isCurrentBranch={Boolean(currentBranchId) && item.id === currentBranchId}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onSwitch={handleSwitchBranch}
                  />
                ))}
              </div>
            )}

            <ListPagination
              page={page}
              pageSize={pageSize}
              total={totalBranches}
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
