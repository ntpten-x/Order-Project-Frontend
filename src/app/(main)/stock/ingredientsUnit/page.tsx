'use client';

import React, { useEffect, useRef, useState } from 'react';
import { message, Modal, Spin, Typography, Button, Space, Input, Segmented } from 'antd';
import { ExperimentOutlined, ReloadOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IngredientsUnit } from "../../../../types/api/stock/ingredientsUnit";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useSocket } from "../../../../hooks/useSocket";
import { RealtimeEvents } from "../../../../utils/realtimeEvents";
import { useAuth } from "../../../../contexts/AuthContext";
import {
    IngredientsUnitPageStyles,
    pageStyles,
    StatsCard,
    UnitCard,
} from './style';
import PageContainer from "../../../../components/ui/page/PageContainer";
import PageSection from "../../../../components/ui/page/PageSection";
import PageStack from "../../../../components/ui/page/PageStack";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import UIEmptyState from "../../../../components/ui/states/EmptyState";
import ListPagination, { type CreatedSort } from "../../../../components/ui/pagination/ListPagination";
import { t } from "../../../../utils/i18n";
import { useDebouncedValue } from "../../../../utils/useDebouncedValue";
import { DEFAULT_CREATED_SORT, parseCreatedSort } from "../../../../lib/list-sort";

const { Text } = Typography;

import { authService } from "../../../../services/auth.service";

export default function IngredientsUnitPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isUrlReadyRef = useRef(false);
    const { user, loading: authLoading } = useAuth();
    const queryClient = useQueryClient();
    const { showLoading, hideLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [createdSort, setCreatedSort] = useState<CreatedSort>(DEFAULT_CREATED_SORT);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const debouncedSearch = useDebouncedValue(searchText, 300);

    useEffect(() => {
        if (isUrlReadyRef.current) return;
        const pageParam = parseInt(searchParams.get('page') || '1', 10);
        const limitParam = parseInt(searchParams.get('limit') || '20', 10);
        const qParam = searchParams.get('q') || '';
        const statusParam = searchParams.get('status');
        const sortParam = searchParams.get('sort_created');
        setPage(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);
        setPageSize(Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 20);
        setSearchText(qParam);
        setStatusFilter(statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all');
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
        if (createdSort !== DEFAULT_CREATED_SORT) params.set('sort_created', createdSort);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [router, pathname, page, pageSize, debouncedSearch, statusFilter, createdSort]);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                setIsAuthorized(false);
                setTimeout(() => {
                    router.replace('/login');
                }, 1000); 
            } else {
                setIsAuthorized(true);
            }
        }
    }, [user, authLoading, router]);

    const { data: csrfToken = "" } = useQuery({
        queryKey: ['csrfToken'],
        queryFn: () => authService.getCsrfToken(),
        staleTime: 10 * 60 * 1000,
    });

    const { data: pagedData, isLoading, isFetching } = useQuery<{
        data: IngredientsUnit[];
        total: number;
        page: number;
        last_page: number;
    }>({
        queryKey: ['ingredientsUnits', page, pageSize, debouncedSearch, statusFilter, createdSort],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', String(pageSize));
            if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
            if (statusFilter !== 'all') params.set('status', statusFilter);
            params.set('sort_created', createdSort);
            const response = await fetch(`/api/stock/ingredientsUnit/getAll?${params.toString()}`, { cache: 'no-store' });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || t('ingredientsUnit.fetch.error'));
            }
            return await response.json();
        },
        staleTime: 60 * 1000,
        enabled: isAuthorized === true,
    });

    const ingredientsData = pagedData?.data || [];
    const totalUnits = typeof pagedData?.total === 'number' ? pagedData.total : 0;

    const deleteMutation = useMutation({
        mutationFn: async (unit: IngredientsUnit) => {
            const token = csrfToken || await authService.getCsrfToken();
            const response = await fetch(`/api/stock/ingredientsUnit/delete/${unit.id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-Token': token || '',
                },
            });
            if (!response.ok) {
                throw new Error(t('ingredientsUnit.fetch.error'));
            }
            return unit.id;
        },
        onSuccess: (_id, unit) => {
            queryClient.invalidateQueries({ queryKey: ['ingredientsUnits'] });
            message.success(t('ingredientsUnit.delete.success', { name: unit.display_name }));
        },
        onError: (error: unknown) => {
            const errMsg = error instanceof Error ? error.message : t('ingredientsUnit.fetch.error');
            message.error(errMsg);
        },
    });

    useEffect(() => {
        if (!socket || isAuthorized !== true) return;

        socket.on(RealtimeEvents.ingredientsUnit.create, (newItem: IngredientsUnit) => {
            queryClient.invalidateQueries({ queryKey: ['ingredientsUnits'] });
            message.success(t('ingredientsUnit.create.toast', { name: newItem.unit_name }));
        });

        socket.on(RealtimeEvents.ingredientsUnit.update, () => {
            queryClient.invalidateQueries({ queryKey: ['ingredientsUnits'] });
        });

        socket.on(RealtimeEvents.ingredientsUnit.delete, ({ id }: { id: string }) => {
            if (id) queryClient.invalidateQueries({ queryKey: ['ingredientsUnits'] });
        });

        return () => {
            socket.off(RealtimeEvents.ingredientsUnit.create);
            socket.off(RealtimeEvents.ingredientsUnit.update);
            socket.off(RealtimeEvents.ingredientsUnit.delete);
        };
    }, [socket, queryClient, isAuthorized]);

    const handleAdd = () => {
        showLoading();
        router.push('/stock/ingredientsUnit/manage/add');
        setTimeout(() => hideLoading(), 1000);
    };

    const handleEdit = (unit: IngredientsUnit) => {
        showLoading();
        router.push(`/stock/ingredientsUnit/manage/edit/${unit.id}`);
        setTimeout(() => hideLoading(), 1000);
    };

    const handleDelete = (unit: IngredientsUnit) => {
        Modal.confirm({
            title: t('ingredientsUnit.delete.title'),
            content: t('ingredientsUnit.delete.content', { name: unit.display_name }),
            okText: t('ingredientsUnit.delete.ok'),
            okType: 'danger',
            cancelText: t('ingredientsUnit.delete.cancel'),
            centered: true,
            onOk: async () => {
                await deleteMutation.mutateAsync(unit);
            },
        });
    };

    if (authLoading || isAuthorized === null) {
        return (
            <div style={{ 
                display: 'flex', 
                height: '100vh', 
                justifyContent: 'center', 
                alignItems: 'center', 
                flexDirection: 'column', 
                gap: 16 
            }}>
                <Spin size="large" />
                <Text type="secondary">{t('common.checkingAuth')}</Text>
            </div>
        );
    }

    if (isAuthorized === false) {
        return (
            <div style={{ 
                display: 'flex', 
                height: '100vh', 
                justifyContent: 'center', 
                alignItems: 'center', 
                flexDirection: 'column', 
                gap: 16 
            }}>
                <Spin size="large" />
                <Text type="danger">{t('common.noPermissionRedirect')}</Text>
            </div>
        );
    }

    const activeUnits = ingredientsData.filter(u => u.is_active);
    const inactiveUnits = ingredientsData.filter(u => !u.is_active);

    return (
        <div className="ingredients-unit-page" style={pageStyles.container}>
            <IngredientsUnitPageStyles />
            
            <UIPageHeader
                title={t('ingredientsUnit.title')}
                subtitle={t('ingredientsUnit.subtitle', { count: totalUnits })}
                icon={<ExperimentOutlined />}
                actions={
                    <Space size={8} wrap>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => queryClient.invalidateQueries({ queryKey: ['ingredientsUnits'] })}
                            loading={isFetching}
                        >
                            {t('ingredientsUnit.button.refresh')}
                        </Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                            {t('ingredientsUnit.button.add')}
                        </Button>
                    </Space>
                }
            />
            
            <PageContainer>
                <PageStack>
                    <StatsCard 
                        totalUnits={totalUnits}
                        activeUnits={activeUnits.length}
                        inactiveUnits={inactiveUnits.length}
                    />

                    <PageSection title="ค้นหาและตัวกรอง">
                        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr', alignItems: 'center' }}>
                            <Input
                                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                                allowClear
                                placeholder="ค้นหาจากชื่อหน่วยหรือชื่อแสดง..."
                                value={searchText}
                                onChange={(e) => {
                                    setPage(1);
                                    setSearchText(e.target.value);
                                }}
                            />
                            <Segmented<'all' | 'active' | 'inactive'>
                                options={[
                                    { label: 'ทั้งหมด', value: 'all' },
                                    { label: 'ใช้งาน', value: 'active' },
                                    { label: 'ปิดใช้งาน', value: 'inactive' },
                                ]}
                                value={statusFilter}
                                onChange={(value) => {
                                    setPage(1);
                                    setStatusFilter(value);
                                }}
                            />
                        </div>
                    </PageSection>

                    <PageSection
                        title={t('ingredientsUnit.section.list')}
                        extra={<span style={{ fontWeight: 600 }}>{totalUnits}</span>}
                    >
                        {isLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                                <Spin tip={t('ingredientsUnit.loading')} />
                            </div>
                        ) : ingredientsData.length > 0 ? (
                            <div style={pageStyles.listContainer}>
                                {ingredientsData.map((unit, index) => (
                                    <UnitCard
                                        key={unit.id}
                                        unit={unit}
                                        index={index}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        ) : (
                            <UIEmptyState
                                title={t('ingredientsUnit.empty.title')}
                                description={t('ingredientsUnit.empty.desc')}
                                action={
                                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                        {t('ingredientsUnit.button.add')}
                                    </Button>
                                }
                            />
                        )}
                        <ListPagination
                            page={page}
                            pageSize={pageSize}
                            total={totalUnits}
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
