'use client';

import React, { useEffect, useState } from 'react';
import { message, Modal, Spin, Typography, Button, Space } from 'antd';
import { ExperimentOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IngredientsUnit } from "../../../../types/api/stock/ingredientsUnit";
import { useRouter } from 'next/navigation';
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
import PageContainer from "@/components/ui/page/PageContainer";
import PageSection from "@/components/ui/page/PageSection";
import PageStack from "@/components/ui/page/PageStack";
import UIPageHeader from "@/components/ui/page/PageHeader";
import UIEmptyState from "@/components/ui/states/EmptyState";
import { t } from "@/utils/i18n";

const { Text } = Typography;

import { authService } from "../../../../services/auth.service";

export default function IngredientsUnitPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const queryClient = useQueryClient();
    const { showLoading, hideLoading } = useGlobalLoading();
    const { socket } = useSocket();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        if (!authLoading) {
            if (!user || !['Admin', 'Manager'].includes(user.role)) {
                setIsAuthorized(false);
                setTimeout(() => {
                    router.replace('/');
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

    const { data: ingredientsData = [], isLoading, isFetching } = useQuery<IngredientsUnit[]>({
        queryKey: ['ingredientsUnits'],
        queryFn: async () => {
            const response = await fetch('/api/stock/ingredientsUnit/getAll', { cache: 'no-store' });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || t('ingredientsUnit.fetch.error'));
            }
            return await response.json();
        },
        staleTime: 60 * 1000,
        enabled: isAuthorized === true,
    });

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
            queryClient.setQueryData<IngredientsUnit[]>(['ingredientsUnits'], (prev = []) => {
                if (prev.some((item) => item.id === newItem.id)) return prev;
                return [...prev, newItem];
            });
            message.success(t('ingredientsUnit.create.toast', { name: newItem.unit_name }));
        });

        socket.on(RealtimeEvents.ingredientsUnit.update, (updatedItem: IngredientsUnit) => {
            queryClient.setQueryData<IngredientsUnit[]>(['ingredientsUnits'], (prev = []) =>
                prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
            );
        });

        socket.on(RealtimeEvents.ingredientsUnit.delete, ({ id }: { id: string }) => {
            queryClient.setQueryData<IngredientsUnit[]>(['ingredientsUnits'], (prev = []) =>
                prev.filter((item) => item.id !== id)
            );
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
                subtitle={t('ingredientsUnit.subtitle', { count: ingredientsData.length })}
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
                        totalUnits={ingredientsData.length}
                        activeUnits={activeUnits.length}
                        inactiveUnits={inactiveUnits.length}
                    />

                    <PageSection
                        title={t('ingredientsUnit.section.list')}
                        extra={<span style={{ fontWeight: 600 }}>{ingredientsData.length}</span>}
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
                    </PageSection>
                </PageStack>
            </PageContainer>
        </div>
    );
}
