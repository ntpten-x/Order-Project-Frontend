
"use client";

import React, { useEffect, useState } from 'react';
import { message, notification } from 'antd';
import { useNetwork } from '../../hooks/useNetwork';
import { offlineQueueService } from '../../services/pos/offline.queue.service';
import { ordersService } from '../../services/pos/orders.service';
import { authService } from '../../services/auth.service';
import { LoadingOutlined, WifiOutlined, DisconnectOutlined } from '@ant-design/icons';

export const SyncManager: React.FC = () => {
    const isOnline = useNetwork();
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (isOnline) {
            processQueue();
        } else {
            // Optional: Notify user they are offline
            // notification.warning({ 
            //     message: 'Offline Mode', 
            //     description: 'ระบบกำลังทำงานแบบออฟไลน์ ข้อมูลจะถูกบันทึกเมื่อเชื่อมต่ออินเทอร์เน็ต',
            //     placement: 'bottomRight',
            //     duration: 3
            // });
        }
    }, [isOnline]);

    const processQueue = async () => {
        const queue = offlineQueueService.getQueue();
        if (queue.length === 0) return;

        setIsSyncing(true);
        const hideLoading = message.loading('กำลังเชื่อมต่อข้อมูล...', 0);

        try {
            const csrfToken = await authService.getCsrfToken();
            let successCount = 0;

            for (const action of queue) {
                try {
                    if (action.type === 'ADD_ITEM') {
                        const { orderId, itemData } = action.payload;
                        await ordersService.addItem(orderId, itemData, undefined, csrfToken);
                        offlineQueueService.removeFromQueue(action.id);
                        successCount++;
                    } else if (action.type === 'CREATE_ORDER') {
                         await ordersService.create(action.payload, undefined, csrfToken);
                         offlineQueueService.removeFromQueue(action.id);
                         successCount++;
                    }
                } catch (error) {
                    console.error(`Failed to process action ${action.id}:`, error);
                    // Decide whether to remove or keep. For now, keep to retry later?
                    // Or remove if 400 (Bad Request).
                    // If Network Error, keep.
                }
            }

            if (successCount > 0) {
                message.success(`ซิงค์ข้อมูลสำเร็จ ${successCount} รายการ`);
            }
        } catch (error) {
            console.error("Sync failed:", error);
        } finally {
            hideLoading();
            setIsSyncing(false);
        }
    };

    return null; // Logic only component
};
