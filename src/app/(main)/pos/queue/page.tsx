"use client";

import React, { useState, useCallback } from 'react';
import { message, Modal, Typography, Tag, Button, Empty, Select, Space, Badge } from 'antd';
import {
    UnorderedListOutlined,
    ReloadOutlined,
    PlayCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    SortAscendingOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useOrderQueue } from '../../../../hooks/pos/useOrderQueue';
import { OrderQueue, QueueStatus, QueuePriority } from '../../../../types/api/pos/orderQueue';
import { useRoleGuard } from '../../../../utils/pos/accessControl';
import { AccessGuardFallback } from '../../../../components/pos/AccessGuard';
import { useQueuePrefetching } from '../../../../hooks/pos/usePrefetching';
import { queueStyles, queueResponsiveStyles } from '../../../../theme/pos/queue/style';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

const { Text, Title } = Typography;
dayjs.locale('th');

const priorityColors: Record<QueuePriority, string> = {
    [QueuePriority.Low]: 'default',
    [QueuePriority.Normal]: 'blue',
    [QueuePriority.High]: 'orange',
    [QueuePriority.Urgent]: 'red',
};

const priorityLabels: Record<QueuePriority, string> = {
    [QueuePriority.Low]: 'ต่ำ',
    [QueuePriority.Normal]: 'ปกติ',
    [QueuePriority.High]: 'สูง',
    [QueuePriority.Urgent]: 'ด่วน',
};

const statusColors: Record<QueueStatus, string> = {
    [QueueStatus.Pending]: 'default',
    [QueueStatus.Processing]: 'processing',
    [QueueStatus.Completed]: 'success',
    [QueueStatus.Cancelled]: 'error',
};

const statusLabels: Record<QueueStatus, string> = {
    [QueueStatus.Pending]: 'รอ',
    [QueueStatus.Processing]: 'กำลังดำเนินการ',
    [QueueStatus.Completed]: 'เสร็จสิ้น',
    [QueueStatus.Cancelled]: 'ยกเลิก',
};

export default function OrderQueuePage() {
    const router = useRouter();
    const [statusFilter, setStatusFilter] = useState<QueueStatus | undefined>(undefined);
    const { queue, isLoading, addToQueue, updateStatus, removeFromQueue, reorderQueue, isReordering } = useOrderQueue(statusFilter);
    const { isAuthorized, isChecking } = useRoleGuard({ requiredRole: "Admin" });
    
    // Prefetch queue data
    useQueuePrefetching();

    const handleUpdateStatus = (queueItem: OrderQueue, newStatus: QueueStatus) => {
        updateStatus(
            { id: queueItem.id, data: { status: newStatus } },
            {
                onSuccess: () => {
                    message.success('อัปเดตสถานะสำเร็จ');
                },
            }
        );
    };

    const handleRemove = (queueItem: OrderQueue) => {
        Modal.confirm({
            title: 'ยืนยันการลบออกจากคิว',
            content: `คุณต้องการลบออเดอร์ "${queueItem.order?.order_no || queueItem.order_id}" ออกจากคิวหรือไม่?`,
            okText: 'ลบ',
            okType: 'danger',
            cancelText: 'ยกเลิก',
            centered: true,
            onOk: () => {
                removeFromQueue(queueItem.id, {
                    onSuccess: () => {
                        message.success('ลบออกจากคิวสำเร็จ');
                    },
                });
            },
        });
    };

    const handleReorder = () => {
        reorderQueue(undefined, {
            onSuccess: () => {
                message.success('จัดเรียงคิวใหม่สำเร็จ');
            },
        });
    };

    if (isChecking) {
        return <AccessGuardFallback message="กำลังตรวจสอบสิทธิ์การใช้งาน..." />;
    }

    if (!isAuthorized) {
        return <AccessGuardFallback message="คุณไม่มีสิทธิ์เข้าถึงหน้านี้" tone="danger" />;
    }

    const pendingQueue = queue.filter(q => q.status === QueueStatus.Pending);
    const processingQueue = queue.filter(q => q.status === QueueStatus.Processing);
    const completedQueue = queue.filter(q => q.status === QueueStatus.Completed);

    const getPriorityGradient = (priority: QueuePriority) => {
        switch (priority) {
            case QueuePriority.Urgent:
                return 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)';
            case QueuePriority.High:
                return 'linear-gradient(135deg, #fa8c16 0%, #d48806 100%)';
            case QueuePriority.Normal:
                return 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)';
            default:
                return 'linear-gradient(135deg, #8c8c8c 0%, #595959 100%)';
        }
    };

    return (
        <>
            <style jsx global>{queueResponsiveStyles}</style>
            <div style={queueStyles.container}>
                {/* Header */}
                <div style={queueStyles.header} className="queue-header-mobile">
                    <div style={{
                        position: 'absolute',
                        top: -50,
                        right: -50,
                        width: 200,
                        height: 200,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)',
                        pointerEvents: 'none',
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: -30,
                        left: -30,
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.06)',
                        pointerEvents: 'none',
                    }} />
                    
                    <div style={queueStyles.headerContent}>
                        <div style={queueStyles.headerTop}>
                            <div style={queueStyles.headerLeft}>
                                <div style={queueStyles.headerIconBox} className="queue-header-icon-mobile">
                                    <UnorderedListOutlined style={{ fontSize: 24, color: 'white' }} />
                                </div>
                                <div style={queueStyles.headerTitleBox}>
                                    <Text style={queueStyles.headerSubtitle} className="queue-header-subtitle-mobile">
                                        จัดการคิวออเดอร์
                                    </Text>
                                    <Title level={3} style={queueStyles.headerTitle} className="queue-header-title-mobile">
                                        Order Queue
                                    </Title>
                                </div>
                            </div>
                            <div style={queueStyles.headerActions}>
                                <Select
                                    value={statusFilter}
                                    placeholder="กรองสถานะ"
                                    allowClear
                                    style={{ width: 140, minWidth: 120 }}
                                    size="middle"
                                    onChange={setStatusFilter}
                                >
                                    {Object.values(QueueStatus).map(status => (
                                        <Select.Option key={status} value={status}>
                                            {statusLabels[status]}
                                        </Select.Option>
                                    ))}
                                </Select>
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={() => window.location.reload()}
                                    style={{ 
                                        background: 'rgba(255,255,255,0.2)', 
                                        color: 'white', 
                                        border: 'none',
                                        borderRadius: 10,
                                    }}
                                    size="middle"
                                />
                                <Button
                                    icon={<SortAscendingOutlined />}
                                    onClick={handleReorder}
                                    loading={isReordering}
                                    style={{ 
                                        background: 'white', 
                                        color: '#667eea',
                                        borderRadius: 10,
                                        fontWeight: 600,
                                    }}
                                    size="middle"
                                >
                                    <span className="hide-on-mobile">จัดเรียง</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div style={{ maxWidth: 1400, margin: '0 auto', padding: '48px 16px 80px' }}>
                    {/* Stats */}
                    <div style={queueStyles.statsGrid} className="queue-stats-grid-mobile">
                        <div style={queueStyles.statCard} className="queue-stat-card-mobile">
                            <Badge count={pendingQueue.length} showZero offset={[10, -5]}>
                                <ClockCircleOutlined style={{ ...queueStyles.statIcon, color: '#1890ff' }} className="queue-stat-icon-mobile" />
                            </Badge>
                            <Text style={queueStyles.statLabel}>รอในคิว</Text>
                        </div>
                        <div style={queueStyles.statCard} className="queue-stat-card-mobile">
                            <Badge count={processingQueue.length} showZero offset={[10, -5]}>
                                <PlayCircleOutlined style={{ ...queueStyles.statIcon, color: '#fa8c16' }} className="queue-stat-icon-mobile" />
                            </Badge>
                            <Text style={queueStyles.statLabel}>กำลังดำเนินการ</Text>
                        </div>
                        <div style={queueStyles.statCard} className="queue-stat-card-mobile">
                            <Badge count={completedQueue.length} showZero offset={[10, -5]}>
                                <CheckCircleOutlined style={{ ...queueStyles.statIcon, color: '#52c41a' }} className="queue-stat-icon-mobile" />
                            </Badge>
                            <Text style={queueStyles.statLabel}>เสร็จสิ้น</Text>
                        </div>
                        <div style={queueStyles.statCard} className="queue-stat-card-mobile">
                            <Badge count={queue.length} showZero offset={[10, -5]}>
                                <UnorderedListOutlined style={{ ...queueStyles.statIcon, color: '#722ed1' }} className="queue-stat-icon-mobile" />
                            </Badge>
                            <Text style={queueStyles.statLabel}>ทั้งหมด</Text>
                        </div>
                    </div>

                    {/* Queue List */}
                    {isLoading ? (
                        <div style={queueStyles.emptyCard}>
                            <Empty description="กำลังโหลด..." />
                        </div>
                    ) : queue.length === 0 ? (
                        <div style={queueStyles.emptyCard}>
                            <Empty description="ยังไม่มีออเดอร์ในคิว" />
                        </div>
                    ) : (
                        <div style={queueStyles.queueList}>
                            {queue.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={`queue-card-hover queue-card-animate queue-card-delay-${(index % 4) + 1}`}
                                    style={queueStyles.queueCard}
                                >
                                    <div style={queueStyles.queueCardContent} className="queue-card-content-mobile">
                                        <div style={queueStyles.queueCardTop}>
                                            <div 
                                                style={{
                                                    ...queueStyles.queuePosition,
                                                    background: getPriorityGradient(item.priority),
                                                }}
                                                className="queue-position-mobile"
                                            >
                                                {item.queue_position}
                                            </div>
                                            <div style={queueStyles.queueInfo}>
                                                <Text strong style={queueStyles.queueOrderNo} className="queue-order-no-mobile">
                                                    {item.order?.order_no || 'N/A'}
                                                </Text>
                                                <div style={queueStyles.queueTags}>
                                                    <Tag color={priorityColors[item.priority]} style={{ margin: 0, borderRadius: 8 }}>
                                                        {priorityLabels[item.priority]}
                                                    </Tag>
                                                    <Tag color={statusColors[item.status]} style={{ margin: 0, borderRadius: 8 }}>
                                                        {statusLabels[item.status]}
                                                    </Tag>
                                                </div>
                                                <div style={queueStyles.queueMeta}>
                                                    <Text type="secondary">
                                                        สร้าง: {dayjs(item.created_at).format('DD/MM/YYYY HH:mm')}
                                                    </Text>
                                                    {item.started_at && (
                                                        <Text type="secondary">
                                                            เริ่ม: {dayjs(item.started_at).format('HH:mm')}
                                                        </Text>
                                                    )}
                                                    {item.completed_at && (
                                                        <Text type="secondary">
                                                            เสร็จ: {dayjs(item.completed_at).format('HH:mm')}
                                                        </Text>
                                                    )}
                                                </div>
                                                {item.notes && (
                                                    <div style={queueStyles.queueNotes}>
                                                        <Text type="secondary">หมายเหตุ: {item.notes}</Text>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div style={queueStyles.queueActions} className="queue-actions-mobile">
                                            {item.status === QueueStatus.Pending && (
                                                <Button
                                                    type="primary"
                                                    icon={<PlayCircleOutlined />}
                                                    onClick={() => handleUpdateStatus(item, QueueStatus.Processing)}
                                                    size="middle"
                                                    style={{ borderRadius: 10 }}
                                                >
                                                    เริ่มดำเนินการ
                                                </Button>
                                            )}
                                            {item.status === QueueStatus.Processing && (
                                                <Button
                                                    type="primary"
                                                    icon={<CheckCircleOutlined />}
                                                    onClick={() => handleUpdateStatus(item, QueueStatus.Completed)}
                                                    size="middle"
                                                    style={{ borderRadius: 10, background: '#52c41a', borderColor: '#52c41a' }}
                                                >
                                                    เสร็จสิ้น
                                                </Button>
                                            )}
                                            {item.status !== QueueStatus.Completed && (
                                                <Button
                                                    danger
                                                    icon={<CloseCircleOutlined />}
                                                    onClick={() => handleUpdateStatus(item, QueueStatus.Cancelled)}
                                                    size="middle"
                                                    style={{ borderRadius: 10 }}
                                                >
                                                    ยกเลิก
                                                </Button>
                                            )}
                                            <Button
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => handleRemove(item)}
                                                size="middle"
                                                style={{ borderRadius: 10 }}
                                            >
                                                ลบ
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
