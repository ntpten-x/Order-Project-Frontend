"use client";

import React, { useEffect, useState } from "react";
import { Typography, Table, Tag, Card, Row, Col, Spin, DatePicker, message, Button } from "antd";
import { HistoryOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { posHistoryService } from "../../../../services/pos/posHistory.service";
import { PosHistory } from "../../../../types/api/pos/posHistory";
import { pageStyles, colors } from "../style";
import dayjs from "dayjs";
import 'dayjs/locale/th';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
dayjs.locale('th');

export default function POSHistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState<PosHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const res = await posHistoryService.getAll(undefined, page, pageSize);
            setHistory(res.data);
            setTotal(res.total);
        } catch (error) {
            console.error("Fetch history failed:", error);
            message.error("ไม่สามารถโหลดข้อมูลประวัติได้");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [page, pageSize]);

    const columns = [
        {
            title: 'วันที่',
            dataIndex: 'create_date',
            key: 'create_date',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm')
        },
        {
            title: 'Order No.',
            dataIndex: 'order_no',
            key: 'order_no',
        },
        {
            title: 'ประเภท',
            dataIndex: 'order_type',
            key: 'order_type',
            render: (type: string) => <Tag color="blue">{type}</Tag>
        },
        {
            title: 'ยอดสุทธิ',
            dataIndex: 'total_amount',
            key: 'total_amount',
            align: 'right' as const,
            render: (amount: number) => <Text strong>฿{Number(amount).toLocaleString()}</Text>
        },
        {
            title: 'สถานะ',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => <Tag color="green">{status}</Tag>
        },
        {
            title: 'จัดการ',
            key: 'action',
            render: (_: unknown, record: PosHistory) => (
                <Button 
                    type="primary" 
                    size="small" 
                    onClick={() => router.push(`/pos/history/${record.id}`)}
                >
                    ดูรายละเอียด
                </Button>
            )
        }
    ];

    return (
        <div style={pageStyles.container}>
             <div style={{ ...pageStyles.heroParams, paddingBottom: 60 }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div style={pageStyles.sectionTitle}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <HistoryOutlined style={{ fontSize: 32, color: '#fff' }} />
                            <div>
                                <Title level={3} style={{ margin: 0, color: '#fff' }}>ประวัติการขาย (History)</Title>
                                <Text style={{ color: 'rgba(255,255,255,0.85)' }}>รายการออเดอร์ที่ดำเนินการเสร็จสิ้น</Text>
                            </div>
                         </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: '-30px auto 30px', padding: '0 24px', position: 'relative', zIndex: 20 }}>
                <Card style={{ borderRadius: 12 }}>
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                         <Button icon={<ReloadOutlined />} onClick={fetchHistory}>รีโหลด</Button>
                    </div>
                    <Table 
                        dataSource={history} 
                        columns={columns} 
                        rowKey="id"
                        loading={isLoading}
                        pagination={{
                            current: page,
                            pageSize: pageSize,
                            total: total,
                            onChange: (p, ps) => {
                                setPage(p);
                                setPageSize(ps);
                            },
                             showSizeChanger: true
                        }}
                    />
                </Card>
            </div>
        </div>
    );
}
