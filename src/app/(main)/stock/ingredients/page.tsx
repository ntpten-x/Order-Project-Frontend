'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { message, Modal, Spin, Typography, Button, Space, Input, Segmented } from 'antd';
import { ExperimentOutlined, ReloadOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Ingredients } from "../../../../types/api/stock/ingredients";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { useSocket } from "../../../../hooks/useSocket";
import { useAuth } from "../../../../contexts/AuthContext";
import { useRealtimeList } from "../../../../utils/pos/realtime";
import { RealtimeEvents } from "../../../../utils/realtimeEvents";
import {
    IngredientsPageStyles,
    pageStyles,
    StatsCard,
    IngredientCard,
} from './style';

const { Text } = Typography;

import { authService } from "../../../../services/auth.service";
import PageContainer from "../../../../components/ui/page/PageContainer";
import PageSection from "../../../../components/ui/page/PageSection";
import PageStack from "../../../../components/ui/page/PageStack";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import UIEmptyState from "../../../../components/ui/states/EmptyState";
import ListPagination, { type CreatedSort } from "../../../../components/ui/pagination/ListPagination";
import { t } from "../../../../utils/i18n";
import { useDebouncedValue } from "../../../../utils/useDebouncedValue";
import { DEFAULT_CREATED_SORT, parseCreatedSort } from "../../../../lib/list-sort";

export default function IngredientsPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isUrlReadyRef = useRef(false);
    const { user, loading: authLoading } = useAuth();
    const [ingredients, setIngredients] = useState<Ingredients[]>([]);
    const { execute } = useAsyncAction();
    const { showLoading, hideLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const [csrfToken, setCsrfToken] = useState<string>("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [createdSort, setCreatedSort] = useState<CreatedSort>(DEFAULT_CREATED_SORT);
    const [totalIngredients, setTotalIngredients] = useState(0);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const debouncedSearch = useDebouncedValue(searchText, 300);

    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        const fetchCsrf = async () => {
             const token = await authService.getCsrfToken();
             setCsrfToken(token);
        };
        fetchCsrf();
    }, []);

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

    const fetchIngredients = useCallback(async (nextPage: number = page, nextPageSize: number = pageSize) => {
        execute(async () => {
            const params = new URLSearchParams();
            params.set("page", String(nextPage));
            params.set("limit", String(nextPageSize));
            if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
            if (statusFilter !== 'all') params.set("status", statusFilter);
            params.set("sort_created", createdSort);
            const response = await fetch(`/api/stock/ingredients?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || t("stock.ingredients.loadError"));
            }
            const payload = await response.json();
            setIngredients(Array.isArray(payload?.data) ? payload.data : []);
            setTotalIngredients(typeof payload?.total === "number" ? payload.total : 0);
            setPage(typeof payload?.page === "number" ? payload.page : nextPage);
            setPageSize(nextPageSize);
        }, t("stock.ingredients.loading"));
    }, [execute, page, pageSize, debouncedSearch, statusFilter, createdSort]);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                setIsAuthorized(false);
                setTimeout(() => {
                    router.replace('/login');
                }, 1000); 
            } else {
                setIsAuthorized(true);
                if (!isUrlReadyRef.current) return;
                fetchIngredients();
            }
        }
    }, [user, authLoading, router, fetchIngredients, page, pageSize]);

    useRealtimeList(
        socket,
        {
            create: RealtimeEvents.ingredients.create,
            update: RealtimeEvents.ingredients.update,
            delete: RealtimeEvents.ingredients.delete,
        },
        setIngredients
    );

    const handleAdd = () => {
        showLoading();
        router.push('/stock/ingredients/manage/add');
        setTimeout(() => hideLoading(), 1000);
    };

    const handleEdit = (ingredient: Ingredients) => {
        showLoading();
        router.push(`/stock/ingredients/manage/edit/${ingredient.id}`);
        setTimeout(() => hideLoading(), 1000);
    };

    const handleDelete = (ingredient: Ingredients) => {
        Modal.confirm({
            title: t("stock.ingredients.deleteTitle"),
            content: t("stock.ingredients.deleteContent", { name: ingredient.display_name }),
            okText: t("branch.delete.ok"),
            okType: 'danger',
            cancelText: t("branch.delete.cancel"),
            centered: true,
            onOk: async () => {
                await execute(async () => {
                    const response = await fetch(`/api/stock/ingredients/delete/${ingredient.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        }
                    });
                    if (!response.ok) {
                        throw new Error(t("stock.ingredients.deleteError"));
                    }
                    await fetchIngredients(page, pageSize);
                    message.success(t("stock.ingredients.deleteSuccess", { name: ingredient.display_name }));
                }, t("stock.ingredients.deleting"));
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
                <Text type="secondary">{t("stock.ingredients.checkingAuth")}</Text>
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
                <Text type="danger">{t("stock.ingredients.redirecting")}</Text>
            </div>
        );
    }

    const activeIngredients = ingredients.filter(i => i.is_active);
    const inactiveIngredients = ingredients.filter(i => !i.is_active);

    return (
        <div className="ingredients-page" style={pageStyles.container}>
            <IngredientsPageStyles />
            
            <UIPageHeader
                title={t("stock.ingredients.title")}
                subtitle={t("stock.ingredients.subtitle", { count: totalIngredients })}
                icon={<ExperimentOutlined />}
                actions={
                    <Space size={8} wrap>
                        <Button icon={<ReloadOutlined />} onClick={() => { void fetchIngredients(); }}>{t("stock.ingredients.refresh")}</Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>{t("stock.ingredients.add")}</Button>
                    </Space>
                }
            />
            
            <PageContainer>
                <PageStack>
                    {/* Stats Card */}
                    <StatsCard 
                        totalIngredients={totalIngredients}
                        activeIngredients={activeIngredients.length}
                        inactiveIngredients={inactiveIngredients.length}
                    />

                    <PageSection title="ค้นหาและตัวกรอง">
                        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr', alignItems: 'center' }}>
                            <Input
                                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                                allowClear
                                placeholder="ค้นหาจากชื่อวัตถุดิบ ชื่อระบบ หรือคำอธิบาย..."
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

                    {/* Ingredients List */}
                    <PageSection
                        title={t("stock.ingredients.listTitle")}
                        extra={<span style={{ fontWeight: 600 }}>{totalIngredients}</span>}
                    >
                        {ingredients.length > 0 ? (
                            <div style={pageStyles.listContainer}>
                                {ingredients.map((ingredient, index) => (
                                    <IngredientCard
                                        key={ingredient.id}
                                        ingredient={ingredient}
                                        index={index}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        ) : (
                            <UIEmptyState
                                title={t("stock.ingredients.emptyTitle")}
                                description={t("stock.ingredients.emptyDescription")}
                                action={
                                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                                        {t("stock.ingredients.emptyAction")}
                                    </Button>
                                }
                            />
                        )}
                        <ListPagination
                            page={page}
                            pageSize={pageSize}
                            total={totalIngredients}
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
