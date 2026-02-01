"use client";

import React, { useState, useCallback } from 'react';
import { message, Modal, Typography, Tag, Button, Empty, Select, Card, Space, Badge } from 'antd';
import {
    UnorderedListOutlined,
    PlusOutlined,
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

    return (
        <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 20,
                padding: '32px 24px',
                marginBottom: 24,
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                            width: 64,
                            height: 64,
                            borderRadius: 16,
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <UnorderedListOutlined style={{ fontSize: 28, color: 'white' }} />
                        </div>
                        <div>
                            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, display: 'block' }}>
                                จัดการคิวออเดอร์
                            </Text>
                            <Title level={3} style={{ color: 'white', margin: 0, fontWeight: 700 }}>
                                Order Queue
                            </Title>
                        </div>
                    </div>
                    <Space>
                        <Select
                            value={statusFilter}
                            placeholder="กรองตามสถานะ"
                            allowClear
                            style={{ width: 200 }}
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
                            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}
                        />
                        <Button
                            icon={<SortAscendingOutlined />}
                            onClick={handleReorder}
                            loading={isReordering}
                            style={{ background: 'white', color: '#667eea' }}
                        >
                            จัดเรียงใหม่
                        </Button>
                    </Space>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <Card>
                    <div style={{ textAlign: 'center' }}>
                        <Badge count={pendingQueue.length} showZero>
                            <ClockCircleOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                        </Badge>
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary">รอในคิว</Text>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div style={{ textAlign: 'center' }}>
                        <Badge count={processingQueue.length} showZero>
                            <PlayCircleOutlined style={{ fontSize: 32, color: '#fa8c16' }} />
                        </Badge>
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary">กำลังดำเนินการ</Text>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div style={{ textAlign: 'center' }}>
                        <Badge count={completedQueue.length} showZero>
                            <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                        </Badge>
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary">เสร็จสิ้น</Text>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div style={{ textAlign: 'center' }}>
                        <Badge count={queue.length} showZero>
                            <UnorderedListOutlined style={{ fontSize: 32, color: '#722ed1' }} />
                        </Badge>
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary">ทั้งหมด</Text>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Queue List */}
            {isLoading ? (
                <Card loading={true} />
            ) : queue.length === 0 ? (
                <Card>
                    <Empty description="ยังไม่มีออเดอร์ในคิว" />
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {queue.map((item, index) => (
                        <Card
                            key={item.id}
                            style={{
                                borderRadius: 12,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: 1 }}>
                                    <div style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 12,
                                        background: `linear-gradient(135deg, ${
                                            item.priority === QueuePriority.Urgent ? '#ff4d4f' :
                                            item.priority === QueuePriority.High ? '#fa8c16' :
                                            item.priority === QueuePriority.Normal ? '#1890ff' : '#8c8c8c'
                                        } 0%, ${
                                            item.priority === QueuePriority.Urgent ? '#cf1322' :
                                            item.priority === QueuePriority.High ? '#d48806' :
                                            item.priority === QueuePriority.Normal ? '#096dd9' : '#595959'
                                        } 100%)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: 18,
                                    }}>
                                        {item.queue_position}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                            <Text strong style={{ fontSize: 16 }}>
                                                {item.order?.order_no || 'N/A'}
                                            </Text>
                                            <Tag color={priorityColors[item.priority]}>
                                                {priorityLabels[item.priority]}
                                            </Tag>
                                            <Tag color={statusColors[item.status]}>
                                                {statusLabels[item.status]}
                                            </Tag>
                                        </div>
                                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#8c8c8c' }}>
                                            <Text type="secondary">
                                                สร้างเมื่อ: {dayjs(item.created_at).format('DD/MM/YYYY HH:mm')}
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
                                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                                                หมายเหตุ: {item.notes}
                                            </Text>
                                        )}
                                    </div>
                                </div>
                                <Space>
                                    {item.status === QueueStatus.Pending && (
                                        <Button
                                            type="primary"
                                            icon={<PlayCircleOutlined />}
                                            onClick={() => handleUpdateStatus(item, QueueStatus.Processing)}
                                        >
                                            เริ่มดำเนินการ
                                        </Button>
                                    )}
                                    {item.status === QueueStatus.Processing && (
                                        <Button
                                            type="primary"
                                            icon={<CheckCircleOutlined />}
                                            onClick={() => handleUpdateStatus(item, QueueStatus.Completed)}
                                        >
                                            เสร็จสิ้น
                                        </Button>
                                    )}
                                    {item.status !== QueueStatus.Completed && (
                                        <Button
                                            danger
                                            icon={<CloseCircleOutlined />}
                                            onClick={() => handleUpdateStatus(item, QueueStatus.Cancelled)}
                                        >
                                            ยกเลิก
                                        </Button>
                                    )}
                                    <Button
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleRemove(item)}
                                    >
                                        ลบ
                                    </Button>
                                </Space>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
