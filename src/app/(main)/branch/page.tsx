'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Button, App, Typography, Spin, Badge, Grid } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import { Branch } from "../../../types/api/branch";
import { useRouter } from 'next/navigation';
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
import { readCache, writeCache } from "../../../utils/pos/cache";
import { RealtimeEvents } from "../../../utils/realtimeEvents";
import PageContainer from "../../../components/ui/page/PageContainer";
import PageSection from "../../../components/ui/page/PageSection";
import PageStack from "../../../components/ui/page/PageStack";
import UIEmptyState from "../../../components/ui/states/EmptyState";
import UIPageHeader from "../../../components/ui/page/PageHeader";
import { t } from "../../../utils/i18n";

const { Title, Text } = Typography;
const BRANCH_CACHE_KEY = "pos:branches";
const BRANCH_CACHE_TTL = 5 * 60 * 1000;

type FilterType = 'all' | 'active' | 'inactive';

export default function BranchPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const { showLoading, hideLoading } = useGlobalLoading();
  const { socket } = useSocket();
  const { user, loading: authLoading } = useAuth();
  const { can, loading: permissionLoading } = useEffectivePermissions({ enabled: Boolean(user?.id) });
  const canViewBranches = can("branches.page", "view");
  const canManageBranches = can("branches.page", "update");
  const { message, modal } = App.useApp();
  const { execute } = useAsyncAction();

  const fetchBranches = useCallback(async () => {
    execute(async () => {
      const data = await branchService.getAll();
      setBranches(data);
    }, t("branch.loading"));
  }, [execute]);

  useRealtimeList(
    socket,
    { create: RealtimeEvents.branches.create, update: RealtimeEvents.branches.update, delete: RealtimeEvents.branches.delete },
    setBranches,
    (item) => item.id,
    (item) => item.is_active !== false
  );

  useEffect(() => {
    const cached = readCache<Branch[]>(BRANCH_CACHE_KEY, BRANCH_CACHE_TTL);
    if (cached?.length) {
      setBranches(cached);
    }
  }, []);

  useEffect(() => {
    if (branches.length > 0) {
      writeCache(BRANCH_CACHE_KEY, branches);
    }
  }, [branches]);

  useEffect(() => {
    if (!authLoading && !permissionLoading && user) {
      if (!canViewBranches) {
        message.error(t("branch.noPermission"));
        router.push('/');
        return;
      }
      fetchBranches();
    }
  }, [user, authLoading, permissionLoading, canViewBranches, router, fetchBranches, message]);
  
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
  const filteredBranches = useMemo(() => {
    let result = branches;

    // Apply status filter
    if (filter === 'active') {
      result = result.filter(b => b.is_active);
    } else if (filter === 'inactive') {
      result = result.filter(b => !b.is_active);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(b => 
        b.branch_name.toLowerCase().includes(query) ||
        b.branch_code.toLowerCase().includes(query) ||
        (b.address && b.address.toLowerCase().includes(query)) ||
        (b.phone && b.phone.includes(query))
      );
    }

    return result;
  }, [branches, filter, searchQuery]);

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
        subtitle={t("branch.page.subtitle", { count: branches.length })}
        icon={<ShopOutlined />}
        actions={
          <>
            <Button onClick={fetchBranches}>{t("branch.actions.refresh")}</Button>
            {canManageBranches && <Button type="primary" onClick={handleAdd}>{t("branch.actions.add")}</Button>}
          </>
        }
      />

      <div style={pageStyles.listContainer}>
        <PageContainer>
        <PageStack gap={isMobile ? 16 : 12}>
          {/* Stats */}
          <StatsCard totalBranches={branches.length} activeBranches={activeBranches} />

          {/* Search and Filter */}
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filter={filter}
            onFilterChange={setFilter}
            resultCount={filteredBranches.length}
            totalCount={branches.length}
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
                {t("branch.section.countTag", { filtered: filteredBranches.length, total: branches.length })}
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
          </PageSection>
        </PageStack>
        </PageContainer>
      </div>
    </div>
  );
}
