import React, { useMemo } from "react";
import {
    Alert,
    Button,
    Card,
    Col,
    Empty,
    List,
    Grid,
    Modal,
    Row,
    Space,
    Tag,
    Typography,
} from "antd";
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
} from "@ant-design/icons";
import { Order, OrderStatus } from "../../types/api/stock/orders";
import StockImageThumb from "./StockImageThumb";

const { Text, Title } = Typography;

interface OrderDetailModalProps {
    order: Order | null;
    open: boolean;
    onClose: () => void;
    hideActualMetrics?: boolean;
}

function getStatusMeta(status: OrderStatus): { color: string; label: string; icon: React.ReactNode } {
    if (status === OrderStatus.COMPLETED) {
        return { color: "success", label: "เสร็จสิ้น", icon: <CheckCircleOutlined /> };
    }
    if (status === OrderStatus.CANCELLED) {
        return { color: "error", label: "ยกเลิก", icon: <CloseCircleOutlined /> };
    }
    return { color: "warning", label: "รอดำเนินการ", icon: <ClockCircleOutlined /> };
}

function formatDateTime(value?: string): string {
    if (!value) return "-";
    return new Date(value).toLocaleString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function OrderDetailModal({ order, open, onClose, hideActualMetrics = false }: OrderDetailModalProps) {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const items = useMemo(() => order?.ordersItems ?? [], [order?.ordersItems]);

    const totals = useMemo(() => {
        const required = items.reduce((acc, item) => acc + Number(item.quantity_ordered || 0), 0);
        const actual = items.reduce((acc, item) => acc + Number(item.ordersDetail?.actual_quantity || 0), 0);
        const matched = items.filter(
            (item) => item.ordersDetail?.is_purchased && Number(item.ordersDetail.actual_quantity || 0) === Number(item.quantity_ordered || 0)
        ).length;
        return { required, actual, matched };
    }, [items]);

    if (!order) return null;

    const statusMeta = getStatusMeta(order.status);

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={900}
            style={{ maxWidth: "95vw" }}
            data-testid="stock-order-detail-modal"
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Title level={5} style={{ margin: 0 }}>
                        รายละเอียดใบซื้อ #{order.id.slice(0, 8).toUpperCase()}
                    </Title>
                    <Tag color={statusMeta.color} icon={statusMeta.icon} style={{ margin: 0 }}>
                        {statusMeta.label}
                    </Tag>
                </div>
            }
        >
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <Card size="small" style={{ marginBottom: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", textAlign: "center", padding: isMobile ? "4px 0" : "12px 0" }}>
                        <div style={{ flex: 1 }}>
                            <Text type="secondary" style={{ fontSize: isMobile ? 14 : 14, display: "block", whiteSpace: "nowrap" }}>
                                {isMobile ? "ต้องซื้อ" : "รายการที่ต้องซื้อ"}
                            </Text>
                            <Title level={isMobile ? 5 : 4} style={{ margin: 0, marginTop: 4 }}>{totals.required.toLocaleString()}</Title>
                        </div>
                        {!hideActualMetrics && <div style={{ width: 1, height: 28, background: "#f1f5f9" }} />}
                        {!hideActualMetrics && (
                            <div style={{ flex: 1 }}>
                                <Text type="secondary" style={{ fontSize: isMobile ? 14 : 14, display: "block", whiteSpace: "nowrap" }}>
                                    {isMobile ? "ซื้อจริง" : "รายการที่ซื้อจริง"}
                                </Text>
                                <Title level={isMobile ? 5 : 4} style={{ margin: 0, marginTop: 4, color: "#1677ff" }}>{totals.actual.toLocaleString()}</Title>
                            </div>
                        )}
                        {!hideActualMetrics && <div style={{ width: 1, height: 28, background: "#f1f5f9" }} />}
                        {!hideActualMetrics && (
                            <div style={{ flex: 1 }}>
                                <Text type="secondary" style={{ fontSize: isMobile ? 14 : 14, display: "block", whiteSpace: "nowrap" }}>
                                    {isMobile ? "ตรงแผน" : "รายการที่ตรงตามแผน"}
                                </Text>
                                <Title level={isMobile ? 5 : 4} style={{ margin: 0, marginTop: 4, color: "#389e0d" }}>{totals.matched.toLocaleString()}</Title>
                            </div>
                        )}
                    </div>
                </Card>

                <Card size="small" title="ข้อมูลใบซื้อ">
                    <Row gutter={[12, 8]}>
                        <Col xs={24} sm={12}>
                            <Text type="secondary">ผู้สร้างใบซื้อ</Text>
                            <div>
                                <Text strong>{order.ordered_by?.name || order.ordered_by?.username || "-"}</Text>
                            </div>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Text type="secondary">วันที่สร้าง</Text>
                            <div>
                                <Text strong>{formatDateTime(order.create_date)}</Text>
                            </div>
                        </Col>
                    </Row>
                    {order.remark ? (
                        <Alert
                            style={{ marginTop: 12 }}
                            type="info"
                            message={
                                <div>
                                    <Text strong style={{ marginRight: 6 }}>หมายเหตุ :</Text>
                                    {order.remark}
                                </div>
                            }
                            showIcon
                        />
                    ) : null}
                </Card>

                <Card size="small" title={`รายการสินค้า`}>
                    {items.length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีรายการสินค้า" />
                    ) : (
                        <List
                            dataSource={items}
                            renderItem={(item) => {
                                const required = Number(item.quantity_ordered || 0);
                                const actual = Number(item.ordersDetail?.actual_quantity || 0);
                                const diff = actual - required;
                                const isPurchased = Boolean(item.ordersDetail?.is_purchased);

                                let diffTag: React.ReactNode = <Tag>ยังไม่ยืนยัน</Tag>;
                                if (isPurchased && diff === 0) diffTag = <Tag color="success">ครบตามแผน</Tag>;
                                if (isPurchased && diff > 0) diffTag = <Tag color="processing">เกิน {diff.toLocaleString()}</Tag>;
                                if (isPurchased && diff < 0) diffTag = <Tag color="error">ขาด {Math.abs(diff).toLocaleString()}</Tag>;

                                return (
                                    <List.Item>
                                        <div style={{ width: "100%", display: "flex", gap: 12, alignItems: "center" }}>
                                            <StockImageThumb
                                                src={item.ingredient?.img_url}
                                                alt={item.ingredient?.display_name || "ingredient"}
                                                size={56}
                                                borderRadius={10}
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <Text strong ellipsis={{ tooltip: item.ingredient?.display_name }} style={{ display: "block" }}>
                                                    {item.ingredient?.display_name || "-"}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    ต้องซื้อ {required.toLocaleString()} {item.ingredient?.unit?.display_name || "หน่วย"}
                                                </Text>
                                                {!hideActualMetrics && (
                                                    <div>
                                                        <Text strong style={{ fontSize: 12, color: "#1e293b" }}>
                                                            ซื้อจริง {actual.toLocaleString()} {item.ingredient?.unit?.display_name || "หน่วย"}
                                                        </Text>
                                                    </div>
                                                )}
                                            </div>
                                            {!hideActualMetrics && <div>{diffTag}</div>}
                                        </div>
                                    </List.Item>
                                );
                            }}
                        />
                    )}
                </Card>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button onClick={onClose} type="primary" data-testid="stock-order-detail-close">
                        ปิด
                    </Button>
                </div>
            </Space>
        </Modal>
    );
}
