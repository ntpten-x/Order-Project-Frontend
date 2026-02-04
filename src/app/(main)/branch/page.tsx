'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button, App, Typography, Spin, Space } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import { Branch } from "../../../types/api/branch";
import { useRouter } from 'next/navigation';
import { 
    BranchPageStyles, 
    pageStyles, 
    StatsCard, 
    BranchCard 
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
import PageContainer from "@/components/ui/page/PageContainer";
import PageSection from "@/components/ui/page/PageSection";
import PageStack from "@/components/ui/page/PageStack";
import UIPageHeader from "@/components/ui/page/PageHeader";
import UIEmptyState from "@/components/ui/states/EmptyState";

const { Title, Text } = Typography;
const BRANCH_CACHE_KEY = "pos:branches";
const BRANCH_CACHE_TTL = 5 * 60 * 1000;

export default function BranchPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
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
    { create: "branches:create", update: "branches:update", delete: "branches:delete" },
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

  const activeBranches = branches.filter(b => b.is_active).length;

  return (
    <div style={pageStyles.container}>
      <BranchPageStyles />
      
      {/* Header */}
      <UIPageHeader
        title="????"
        subtitle={`${branches.length} ??????`}
        icon={<ShopOutlined />}
        actions={
          <Space size={8} wrap>
            <Button onClick={fetchBranches}>??????</Button>
            <Button type="primary" onClick={handleAdd}>?????????</Button>
          </Space>
        }
      />

      <PageContainer>
        <PageStack>
          {/* Stats */}
          <StatsCard totalBranches={branches.length} activeBranches={activeBranches} />

          <PageSection title="??????????" extra={<span style={{ fontWeight: 600 }}>{branches.length}</span>}>
            {branches.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: 24,
                  justifyContent: 'center',
                }}
              >
                {branches.map((branch, index) => (
                  <div
                    key={branch.id}
                    style={{
                      animation: `fadeInUp 0.6s ease-out forwards`,
                      animationDelay: `${index * 50}ms`,
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
                title="??????????????????"
                description="?????????????????????????????????"
                action={
                  <Button type="primary" onClick={handleAdd}>
                    ?????????
                  </Button>
                }
              />
            )}
          </PageSection>
        </PageStack>
      </PageContainer>
    </div>
  );
}

