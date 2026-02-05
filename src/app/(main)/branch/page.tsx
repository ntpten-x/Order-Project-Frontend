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
import { branchService } from "../../../services/branch.service";
import { authService } from "../../../services/auth.service";
import { getCsrfTokenCached } from '../../../utils/pos/csrf';
import { useAsyncAction } from "../../../hooks/useAsyncAction";
import { readCache, writeCache } from "../../../utils/pos/cache";
import { RealtimeEvents } from "../../../utils/realtimeEvents";
import PageContainer from "@/components/ui/page/PageContainer";
import PageSection from "@/components/ui/page/PageSection";
import PageStack from "@/components/ui/page/PageStack";
import UIEmptyState from "@/components/ui/states/EmptyState";
import UIPageHeader from "@/components/ui/page/PageHeader";

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
  const { message, modal } = App.useApp();
  const { execute } = useAsyncAction();

  const fetchBranches = useCallback(async () => {
    execute(async () => {
      const data = await branchService.getAll();
      setBranches(data);
    }, 'กำลังโหลดข้อมูลสาขา...');
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
    if (!authLoading && user) {
        if (user.role !== 'Admin') {
            message.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
            router.push('/');
            return;
        }
        fetchBranches();
    }
  }, [user, authLoading, router, fetchBranches, message]);
  
  const handleAdd = () => {
    showLoading();
    router.push('/branch/manager/add');
    setTimeout(() => hideLoading(), 500);
  };

  const handleEdit = (branch: Branch) => {
    router.push(`/branch/manager/edit/${branch.id}`);
  };

  const handleDelete = (branch: Branch) => {
    modal.confirm({
        title: 'ยืนยันการลบสาขา',
        content: `คุณต้องการลบสาขา "${branch.branch_name}" หรือไม่?`,
        okText: 'ลบ',
        okType: 'danger',
        cancelText: 'ยกเลิก',
        centered: true,
        onOk: async () => {
            try {
                const csrfToken = await getCsrfTokenCached();
                await branchService.delete(branch.id, undefined, csrfToken);
                message.success(`ลบสาขา "${branch.branch_name}" สำเร็จ`);
                fetchBranches();
            } catch {
                message.error('ไม่สามารถลบสาขาได้');
            }
        },
    });
  };

  const handleSwitchBranch = (branch: Branch) => {
    execute(async () => {
      const csrfToken = await getCsrfTokenCached();
      await authService.switchBranch(branch.id, csrfToken);
      message.success(`สลับไปสาขา "${branch.branch_name}" แล้ว`);
      router.push("/pos");
    }, "กำลังสลับสาขา...");
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
        title="สาขา"
        subtitle={`${branches.length} รายการ`}
        icon={<ShopOutlined />}
        actions={
          <>
            <Button onClick={fetchBranches}>รีเฟรช</Button>
            <Button type="primary" onClick={handleAdd}>เพิ่มสาขา</Button>
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
                <Title level={4} style={{ margin: 0, fontWeight: 700 }}>สาขาทั้งหมด</Title>
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
                {filteredBranches.length} / {branches.length} สาขา
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
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onSwitch={handleSwitchBranch}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <UIEmptyState
                title={searchQuery || filter !== 'all' ? "ไม่พบสาขาที่ค้นหา" : "ไม่พบข้อมูลสาขาในระบบ"}
                description={
                  searchQuery || filter !== 'all' 
                    ? "ลองเปลี่ยนคำค้นหาหรือตัวกรองเพื่อดูผลลัพธ์อื่น" 
                    : "กรุณาเพิ่มสาขาเพื่อให้สามารถเริ่มต้นการจัดการข้อมูลหรือเข้าสู่ระบบ POS ได้"
                }
                action={
                  searchQuery || filter !== 'all' ? (
                    <Button onClick={() => { setSearchQuery(''); setFilter('all'); }}>
                      ล้างตัวกรอง
                    </Button>
                  ) : (
                    <Button type="primary" onClick={handleAdd}>
                      เพิ่มสาขาใหม่
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
