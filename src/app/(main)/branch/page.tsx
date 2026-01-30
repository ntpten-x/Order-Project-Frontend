'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button, App, Typography, Spin } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import { Branch } from "../../../types/api/branch";
import { useRouter } from 'next/navigation';
import { 
    BranchPageStyles, 
    pageStyles, 
    PageHeader, 
    StatsCard, 
    BranchCard 
} from './style';
import { useGlobalLoading } from "../../../contexts/pos/GlobalLoadingContext";
import { useAuth } from "../../../contexts/AuthContext";
import { branchService } from "../../../services/branch.service";
import { getCsrfTokenCached } from '../../../utils/pos/csrf';
import { useAsyncAction } from "../../../hooks/useAsyncAction";

const { Title, Text } = Typography;

export default function BranchPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const { showLoading, hideLoading } = useGlobalLoading();
  const { user, loading: authLoading } = useAuth();
  const { message, modal } = App.useApp();
  const { execute } = useAsyncAction();

  const fetchBranches = useCallback(async () => {
    execute(async () => {
      const data = await branchService.getAll();
      setBranches(data);
    }, 'กำลังโหลดข้อมูลสาขา...');
  }, [execute]);

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
      <PageHeader 
        onRefresh={fetchBranches}
        onAdd={handleAdd}
      />
      
      {/* Stats */}
      <StatsCard 
        totalBranches={branches.length}
        activeBranches={activeBranches}
      />

      {/* Main Content */}
      <div style={pageStyles.listContainer}>
          {branches.length > 0 ? (
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24, justifyContent: 'center' }}>
                {branches.map((branch, index) => (
                    <div key={branch.id} style={{ animation: `fadeInUp 0.6s ease-out forwards`, animationDelay: `${index * 50}ms`, opacity: 0 }}>
                        <BranchCard 
                            branch={branch} 
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    </div>
                ))}
             </div>
          ) : (
            <div style={{ 
                background: 'white', 
                borderRadius: 20, 
                padding: '60px 20px', 
                textAlign: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
                <ShopOutlined style={{ fontSize: 64, color: '#e5e7eb', marginBottom: 16 }} />
                 <Title level={3} style={{ color: '#374151', margin: 0 }}>ยังไม่มีข้อมูลสาขา</Title>
                 <Text type="secondary">เริ่มต้นด้วยการเพิ่มสาขาแรกของคุณ</Text>
                 <div style={{ marginTop: 24 }}>
                    <Button type="primary" onClick={handleAdd}>เพิ่มสาขา</Button>
                 </div>
            </div>
          )}
      </div>
    </div>
  );
}
