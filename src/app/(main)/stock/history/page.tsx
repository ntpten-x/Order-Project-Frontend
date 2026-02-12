"use client";

import React, { useEffect, useState } from "react";
import { Button, message, Modal, Pagination, Spin } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HistoryOutlined } from "@ant-design/icons";
import { Order, OrderStatus } from "../../../../types/api/stock/orders";
import OrderDetailModal from "../../../../components/stock/OrderDetailModal";
import { useSocket } from "../../../../hooks/useSocket";
import { useAuth } from "../../../../contexts/AuthContext";
import { useEffectivePermissions } from "../../../../hooks/useEffectivePermissions";
import { authService } from "../../../../services/auth.service";
import PageContainer from "../../../../components/ui/page/PageContainer";
import UIPageHeader from "../../../../components/ui/page/PageHeader";
import PageSection from "../../../../components/ui/page/PageSection";
import UIEmptyState from "../../../../components/ui/states/EmptyState";
import { t } from "../../../../utils/i18n";
import { LegacyRealtimeEvents, RealtimeEvents } from "../../../../utils/realtimeEvents";
import {
    HistoryPageStyles,
    pageStyles,
    StatsCard,
    OrderCard,
} from "./style";

export default function HistoryPage() {
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const { socket } = useSocket();
    const { user } = useAuth();
    const { can } = useEffectivePermissions({ enabled: Boolean(user?.id) });
    const canDeleteOrders = can("stock.orders.page", "delete");
    const queryClient = useQueryClient();
    
    // Pagination State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { data: csrfToken = "" } = useQuery({
        queryKey: ['csrfToken'],
        queryFn: () => authService.getCsrfToken(),
        staleTime: 10 * 60 * 1000,
    });

    const { data: ordersResult, isLoading, isFetching } = useQuery<{ data: Order[]; total: number }, Error>({
        queryKey: ['stockHistory', page, pageSize],
        queryFn: async () => {
            const response = await fetch(`/api/stock/orders?status=completed,cancelled&page=${page}&limit=${pageSize}`, { cache: "no-store" });
            if (!response.ok) throw new Error(t('stockHistory.fetch.error'));
            const result = await response.json();
            if (Array.isArray(result)) {
                return { data: result, total: result.length };
            }
            return { data: result.data, total: result.total };
        },
        placeholderData: (prev) => prev,
        staleTime: 60 * 1000,
    });

    const orders: Order[] = ordersResult?.data ?? [];
    const total = ordersResult?.total ?? 0;

    const deleteMutation = useMutation({
        mutationFn: async (orderId: string) => {
            const token = csrfToken || await authService.getCsrfToken();
            const response = await fetch(`/api/stock/orders/${orderId}`, { 
                method: 'DELETE',
                headers: {
                    'X-CSRF-Token': token || ''
                }
            });
            if (!response.ok) throw new Error(t('stockHistory.delete.error'));
            return orderId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stockHistory'] });
            message.success(t('stockHistory.delete.success'));
        },
        onError: () => {
            message.error(t('stockHistory.delete.error'));
        }
    });

    const handleDeleteOrder = (order: Order) => {
        Modal.confirm({
            title: t('stockHistory.delete.title'),
            content: t('stockHistory.delete.content', { code: order.id.substring(0, 8).toUpperCase() }),
            okText: t('stockHistory.delete.ok'),
            okType: 'danger',
            cancelText: t('stockHistory.delete.cancel'),
            centered: true,
            onOk: async () => {
                await deleteMutation.mutateAsync(order.id);
            }
        });
    };

    // Listen for updates and refetch list
    useEffect(() => {
        if (!socket) return;

        const handleRefresh = () => {
             queryClient.invalidateQueries({ queryKey: ['stockHistory'] });
        };

        socket.on(RealtimeEvents.stockOrders.create, handleRefresh);
        socket.on(RealtimeEvents.stockOrders.update, handleRefresh);
        socket.on(RealtimeEvents.stockOrders.status, handleRefresh);
        socket.on(RealtimeEvents.stockOrders.delete, handleRefresh);
        socket.on(RealtimeEvents.stockOrders.detailUpdate, handleRefresh);
        socket.on(LegacyRealtimeEvents.stockOrdersUpdated, handleRefresh);

        return () => {
            socket.off(RealtimeEvents.stockOrders.create, handleRefresh);
            socket.off(RealtimeEvents.stockOrders.update, handleRefresh);
            socket.off(RealtimeEvents.stockOrders.status, handleRefresh);
            socket.off(RealtimeEvents.stockOrders.delete, handleRefresh);
            socket.off(RealtimeEvents.stockOrders.detailUpdate, handleRefresh);
            socket.off(LegacyRealtimeEvents.stockOrdersUpdated, handleRefresh);
        };
    }, [socket, queryClient]);

    const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED);
    const cancelledOrders = orders.filter(o => o.status === OrderStatus.CANCELLED);

    if (isLoading && orders.length === 0) {
        return (
            <div style={{ minHeight: "100vh", background: pageStyles.container.backgroundColor as string }}>
                <HistoryPageStyles />
                <UIPageHeader
                    title={t('stockHistory.title')}
                    subtitle={t('stockHistory.subtitle')}
                    icon={<HistoryOutlined />}
                    actions={
                        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['stockHistory'] })} loading={isFetching}>
                            {t('stockHistory.refresh')}
                        </Button>
                    }
                />
                <PageContainer>
                    <PageSection>
                        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
                            <Spin size="large" />
                        </div>
                    </PageSection>
                </PageContainer>
            </div>
        );
    }

    return (
        <div className="history-page" style={pageStyles.container}>
            <HistoryPageStyles />
            
            <UIPageHeader
                title={t('stockHistory.title')}
                subtitle={t('stockHistory.subtitle')}
                icon={<HistoryOutlined />}
                actions={
                    <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['stockHistory'] })} loading={isFetching}>
                        {t('stockHistory.refresh')}
                    </Button>
                }
            />
            
            <PageContainer>
                <PageSection>
                    <StatsCard
                        totalOrders={total}
                        completedOrders={completedOrders.length}
                        cancelledOrders={cancelledOrders.length}
                    />
                </PageSection>

                <PageSection
                    title={t('stockHistory.sectionAll')}
                    extra={<span style={{ fontWeight: 600 }}>{t('stockHistory.count', { total })}</span>}
                >
                    <div style={pageStyles.listContainer}>
                        {orders.length > 0 ? (
                            <>
                                {orders.map((order: Order, index: number) => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        index={index}
                                        onView={setViewingOrder}
                                        onDelete={handleDeleteOrder}
                                        canDelete={canDeleteOrders}
                                    />
                                ))}

                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                                    <Pagination
                                        current={page}
                                        pageSize={pageSize}
                                        total={total}
                                        onChange={(p, s) => {
                                            setPage(p);
                                            setPageSize(s);
                                        }}
                                        showSizeChanger
                                        showTotal={(tCount) => t('stockHistory.paginationTotal', { total: tCount })}
                                    />
                                </div>
                            </>
                        ) : (
                            <UIEmptyState title={t('stockHistory.empty.title')} description={t('stockHistory.empty.desc')} />
                        )}
                    </div>
                </PageSection>
            
                <OrderDetailModal
                    open={!!viewingOrder}
                    order={viewingOrder}
                    onClose={() => setViewingOrder(null)}
                />
            </PageContainer>
        </div>
    );
}
