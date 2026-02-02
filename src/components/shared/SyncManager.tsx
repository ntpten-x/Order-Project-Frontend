"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { message, notification } from 'antd';
import { useNetwork } from '../../hooks/useNetwork';
import { offlineQueueService, offlineQueuePolicy } from '../../services/pos/offline.queue.service';
import { ordersService } from '../../services/pos/orders.service';
import { paymentsService } from '../../services/pos/payments.service';
import { orderQueueService } from '../../services/pos/orderQueue.service';
import { authService } from '../../services/auth.service';
import { DisconnectOutlined } from '@ant-design/icons';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const SyncManager: React.FC = () => {
    const isOnline = useNetwork();
    const [isSyncing, setIsSyncing] = useState(false);

    const processQueue = useCallback(async () => {
        if (isSyncing) return;
        const queued = offlineQueueService.getQueue();
        if (queued.length === 0) return;

        setIsSyncing(true);
        const hideLoading = message.loading('กำลังซิงค์รายการที่ค้างอยู่...', 0);
        let success = 0;
        let failed = 0;

        // remove items exceeded retry before start
        offlineQueueService.pruneExceeded();
        const actions = offlineQueueService.getQueue();

        try {
            const csrfToken = await authService.getCsrfToken();

            for (const action of actions) {
                try {
                    const waitMs = offlineQueuePolicy.backoff(action.retryCount);
                    if (waitMs > 0) await sleep(waitMs);

                    if (action.type === 'CREATE_ORDER') {
                        await ordersService.create(action.payload, undefined, csrfToken);
                    } else if (action.type === 'UPDATE_ORDER') {
                        const { orderId, data } = action.payload;
                        await ordersService.update(orderId, data, undefined, csrfToken);
                    } else if (action.type === 'ADD_ITEM') {
                        const { orderId, itemData } = action.payload;
                        await ordersService.addItem(orderId, itemData, undefined, csrfToken);
                    } else if (action.type === 'UPDATE_ITEM') {
                        const { itemId, itemData } = action.payload;
                        await ordersService.updateItem(itemId, itemData, undefined, csrfToken);
                    } else if (action.type === 'DELETE_ITEM') {
                        const { itemId } = action.payload;
                        await ordersService.deleteItem(itemId, undefined, csrfToken);
                    } else if (action.type === 'PAYMENT') {
                        const { orderId, paymentData } = action.payload;
                        await paymentsService.create({ ...paymentData, order_id: orderId }, undefined, csrfToken);
                    } else if (action.type === 'UPDATE_QUEUE_STATUS') {
                        const { queueId, status } = action.payload;
                        await orderQueueService.updateStatus(queueId, { status }, undefined);
                    }

                    offlineQueueService.removeFromQueue(action.id);
                    success++;
                } catch (error) {
                    const nextRetry = action.retryCount + 1;
                    if (nextRetry > offlineQueuePolicy.maxRetry) {
                        offlineQueueService.removeFromQueue(action.id);
                        failed++;
                    } else {
                        const errorMessage = error instanceof Error ? error.message : undefined;
                        offlineQueueService.incrementRetry(action.id, errorMessage);
                    }
                }
            }
        } finally {
            hideLoading();
            setIsSyncing(false);
            if (success > 0) {
                message.success(`ซิงค์สำเร็จ ${success} รายการ`);
            }
            if (failed > 0) {
                notification.error({
                    message: 'ซิงค์บางรายการไม่สำเร็จ',
                    description: `${failed} รายการเกินจำนวน retry ที่กำหนด`,
                    placement: 'bottomRight',
                    duration: 3,
                });
            }
        }
    }, [isSyncing]);

    useEffect(() => {
        if (isOnline) {
            processQueue();
        } else {
            notification.warning({
                message: 'ออฟไลน์',
                description: 'รายการจะถูกเก็บเข้าคิวและซิงค์ให้อัตโนมัติเมื่อออนไลน์',
                icon: <DisconnectOutlined style={{ color: '#faad14' }} />,
                duration: 2,
                placement: 'bottomRight',
            });
        }
    }, [isOnline, processQueue]);

    return null; // Logic only component
};
