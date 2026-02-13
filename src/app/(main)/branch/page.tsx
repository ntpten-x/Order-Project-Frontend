'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Button, App, Typography, Spin, Badge, Grid } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import { Branch } from "../../../types/api/branch";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { 
    BranchPageStyles, 
    pageStyles, 
    StatsCard, 
    BranchCard,
    SearchBar
} from './style';
import { useGlobalLoading } from "../../../contexts/pos/GlobalLoadingContext";
import { useSocket } from "../../../hooks/useSocket";
import { useRealtimeList } from "../../../utils/pos/realtime";
import { useAuth } from "../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../hooks/useEffectivePermissions";
import { branchService } from "../../../services/branch.service";
import { authService } from "../../../services/auth.service";
import { getCsrfTokenCached } from '../../../utils/pos/csrf';
import { useAsyncAction } from "../../../hooks/useAsyncAction";
import { RealtimeEvents } from "../../../utils/realtimeEvents";
import PageContainer from "../../../components/ui/page/PageContainer";
import PageSection from "../../../components/ui/page/PageSection";
import PageStack from "../../../components/ui/page/PageStack";
import UIEmptyState from "../../../components/ui/states/EmptyState";
import UIPageHeader from "../../../components/ui/page/PageHeader";
import ListPagination, { type CreatedSort } from "../../../components/ui/pagination/ListPagination";
import { t } from "../../../utils/i18n";
import { useDebouncedValue } from "../../../utils/useDebouncedValue";
import { DEFAULT_CREATED_SORT, parseCreatedSort } from "../../../lib/list-sort";
const { Title, Text } = Typography;

type FilterType = 'all' | 'active' | 'inactive';

export default function BranchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isUrlReadyRef = useRef(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [createdSort, setCreatedSort] = useState<CreatedSort>(DEFAULT_CREATED_SORT);
  const [totalBranches, setTotalBranches] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const { showLoading, hideLoading } = useGlobalLoading();
  const { socket } = useSocket();
  const { user, loading: authLoading } = useAuth();
  const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
  const canViewBranches = can("branches.page", "view");
  const canManageBranches = can("branches.page", "update");
  const { message, modal } = App.useApp();
  const { execute } = useAsyncAction();

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
        params.set("page", String(nextPage));
        params.set("limit", String(nextPageSize));
        if (filter === "active") params.set("active", "true");
        if (filter === "inactive") params.set("active", "false");
        if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
        params.set("sort_created", createdSort);

        const result = await branchService.getAllPaginated(undefined, params);
        setBranches(result.data);
        setTotalBranches(result.total);
        setPage(result.page);
        setPageSize(nextPageSize);
      }, t("branch.loading"));
    } finally {
      setIsFetching(false);
    }
  }, [execute, filter, page, pageSize, debouncedSearch, createdSort]);

  useRealtimeList(
    socket,
    { create: RealtimeEvents.branches.create, update: RealtimeEvents.branches.update, delete: RealtimeEvents.branches.delete },
    setBranches,
    (item) => item.id,
    (item) => item.is_active !== false
  );

  useEffect(() => {
    if (!authLoading && !permissionLoading && user) {
      if (!canViewBranches) {
        message.error(t("branch.noPermission"));
        router.push('/');
        return;
      }
      if (!isUrlReadyRef.current) return;
      fetchBranches();
    }
  }, [user, authLoading, permissionLoading, canViewBranches, router, fetchBranches, message, page, pageSize, filter]);
  
  const handleAdd = () => {
    if (!canManageBranches) return;
    showLoading();
    router.push('/branch/manager/add');
    setTimeout(() => hideLoading(), 500);
  };

  const handleEdit = (branch: Branch) => {
    if (!canManageBranches) return;
    router.push(`/branch/manager/edit/${branch.id}`);
  };

  const handleDelete = (branch: Branch) => {
    if (!canManageBranches) return;
    modal.confirm({
        title: t("branch.delete.title"),
        content: t("branch.delete.content", { name: branch.branch_name }),
        okText: t("branch.delete.ok"),
        okType: 'danger',
        cancelText: t("branch.delete.cancel"),
        centered: true,
        onOk: async () => {
            try {
                const csrfToken = await getCsrfTokenCached();
                await branchService.delete(branch.id, undefined, csrfToken);
                message.success(t("branch.delete.success", { name: branch.branch_name }));
                fetchBranches();
            } catch {
                message.error(t("branch.delete.error"));
            }
        },
    });
  };

  const handleSwitchBranch = (branch: Branch) => {
    if (!canManageBranches) {
      message.error(t("branch.noPermission"));
      return;
    }
    execute(async () => {
      const csrfToken = await getCsrfTokenCached();
      await authService.switchBranch(branch.id, csrfToken);
      message.success(t("branch.switch.success", { name: branch.branch_name }));
      router.push("/pos");
    }, t("branch.switch.loading"));
  };

  // Filter and search branches
  const filteredBranches = useMemo(() => branches, [branches]);

  const activeBranches = branches.filter(b => b.is_active).length;
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  if (authLoading) {
    return (
        <div style={{ 
            height: '100vh', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: '#f5f5f5'
        }}>
            <Spin size="large" />
        </div>
    );
  }

  return (
    <div style={pageStyles.container}>
      <BranchPageStyles />
      
      <UIPageHeader
        title={t("branch.page.title")}
        subtitle={t("branch.page.subtitle", { count: totalBranches })}
        icon={<ShopOutlined />}
        actions={
          <>
            <Button onClick={() => { void fetchBranches(); }}>{t("branch.actions.refresh")}</Button>
            {canManageBranches && <Button type="primary" onClick={handleAdd}>{t("branch.actions.add")}</Button>}
          </>
        }
      />

      <div style={pageStyles.listContainer}>
        <PageContainer>
        <PageStack gap={isMobile ? 16 : 12}>
          {/* Stats */}
          <StatsCard totalBranches={totalBranches} activeBranches={activeBranches} />

          {/* Search and Filter */}
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={(value) => {
              setPage(1);
              setSearchQuery(value);
            }}
            filter={filter}
            onFilterChange={(next) => {
              setPage(1);
              setFilter(next);
            }}
            resultCount={filteredBranches.length}
            totalCount={totalBranches}
          />

          {/* Branch List */}
          <PageSection 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Title level={4} style={{ margin: 0, fontWeight: 700 }}>{t("branch.section.listTitle")}</Title>
                {searchQuery || filter !== 'all' ? (
                  <Badge 
                    count={filteredBranches.length} 
                    showZero 
                    style={{ backgroundColor: '#6366f1' }}
                  />
                ) : null}
              </div>
            } 
            extra={
              <Text strong style={{ color: '#6366f1', background: '#eef2ff', padding: '4px 12px', borderRadius: 10 }}>
                {t("branch.section.countTag", { filtered: filteredBranches.length, total: totalBranches })}
              </Text>
            }
          >
            {filteredBranches.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: 24,
                  justifyContent: 'center',
                }}
              >
                {filteredBranches.map((branch, index) => (
                  <div
                    key={branch.id}
                    style={{
                      animation: `fadeInUp 0.5s ease-out forwards`,
                      animationDelay: `${Math.min(index * 30, 300)}ms`,
                      opacity: 0,
                    }}
                  >
                    <BranchCard
                      branch={branch}
                      onEdit={canManageBranches ? handleEdit : undefined}
                      onDelete={canManageBranches ? handleDelete : undefined}
                      onSwitch={canManageBranches ? handleSwitchBranch : undefined}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <UIEmptyState
                title={t(searchQuery || filter !== 'all' ? "branch.empty.filtered.title" : "branch.empty.default.title")}
                description={
                  searchQuery || filter !== 'all' 
                    ? t("branch.empty.filtered.description")
                    : t("branch.empty.default.description")
                }
                action={
                  searchQuery || filter !== 'all' ? (
                    <Button onClick={() => { setSearchQuery(''); setFilter('all'); }}>
                      {t("branch.empty.reset")}
                    </Button>
                  ) : (
                    <Button type="primary" onClick={handleAdd}>
                      {t("branch.empty.add")}
                    </Button>
                  )
                }
              />
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
    </div>
  );
}
