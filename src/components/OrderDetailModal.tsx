import React from "react";
import { Modal, Descriptions, Table, Tag, Typography, Avatar, Button } from "antd";
import { Order, OrderStatus } from "@/types/api/orders";

const { Text } = Typography;

interface OrderDetailModalProps {
    order: Order | null;
    open: boolean;
    onClose: () => void;
}

export default function OrderDetailModal({ order, open, onClose }: OrderDetailModalProps) {
    if (!order) return null;

    const columns = [
        {
            title: 'รูปภาพ',
            dataIndex: ['ingredient', 'img_url'],
            key: 'img',
            render: (src: string, record: any) => (
                <Avatar 
                    src={src || 'https://placehold.co/40x40?text=No+Img'} 
                    shape="square" 
                    size={50} 
                    alt={record.ingredient?.display_name} 
                />
            ),
            width: 80
        },
        {
            title: 'สินค้า',
            dataIndex: ['ingredient', 'display_name'],
            key: 'name',
            render: (text: string) => <Text strong>{text || 'Unknown'}</Text>
        },
        {
            title: 'จำนวน',
            key: 'quantity',
            render: (record: any) => (
                <Text>
                    {record.quantity_ordered} {record.ingredient?.unit?.display_name || '-'}
                </Text>
            )
        }
    ];

    return (
        <Modal
            title={`รายละเอียดออเดอร์ #${order.id.substring(0, 8)}`}
            open={open}
            onCancel={onClose}
            footer={[
                <Button key="close" onClick={onClose}>ปิด</Button>
            ]}
            width={700}
        >
            <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
                <Descriptions.Item label="ผู้สั่ง">{order.ordered_by?.username || 'Unknown'}</Descriptions.Item>
                <Descriptions.Item label="วันที่สั่ง">{new Date(order.create_date).toLocaleString('th-TH')}</Descriptions.Item>
                <Descriptions.Item label="สถานะ">
                    <Tag color={
                        order.status === OrderStatus.PENDING ? 'gold' :
                        order.status === OrderStatus.COMPLETED ? 'green' : 'red'
                    }>
                        {order.status.toUpperCase()}
                    </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="หมายเหตุ">{order.remark || '-'}</Descriptions.Item>
            </Descriptions>

            <Text strong style={{ display: 'block', marginBottom: 12 }}>รายการสินค้า ({order.ordersItems?.length || 0})</Text>
            
            <Table 
                dataSource={order.ordersItems}
                columns={columns}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ y: 300 }}
            />
        </Modal>
    );
}
