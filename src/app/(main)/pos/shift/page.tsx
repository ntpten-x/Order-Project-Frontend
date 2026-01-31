'use client';

import React, { useEffect, useState, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Typography, Card, Button, Row, Col, InputNumber, Statistic, Tag, Modal, Spin, Divider, App } from "antd";
import { 
    ClockCircleOutlined, 
    DollarCircleOutlined, 
    CheckCircleOutlined, 
    PlayCircleOutlined, 
    StopOutlined, 
    ArrowLeftOutlined, 
    WalletOutlined, 
    RiseOutlined, 
    FallOutlined,
    SafetyCertificateOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { SocketContext } from "../../../../contexts/SocketContext";
import { shiftsService } from "../../../../services/pos/shifts.service";
import { Shift, ShiftSummary } from "../../../../types/api/pos/shifts";
import { useGlobalLoading } from "../../../../contexts/pos/GlobalLoadingContext";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import duration from 'dayjs/plugin/duration';
import { pageStyles, globalStyles } from "../../../../theme/pos/shift/style";

dayjs.extend(duration);
dayjs.locale('th');

const { Title, Text } = Typography;

// ============ HEADER COMPONENT ============

const PageHeader = ({ currentShift, onBack }: { currentShift: Shift | null, onBack: () => void }) => (
    <div style={pageStyles.header}>
        <div style={pageStyles.headerDecoCircle1} />
        <div style={pageStyles.headerDecoCircle2} />
        
        <div style={pageStyles.headerContent}>
            <div style={pageStyles.headerLeft}>
                <Button 
                    type="text" 
                    icon={<ArrowLeftOutlined style={{ fontSize: 20, color: 'white' }} />} 
                    onClick={onBack}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: 12 }}
                />
                <div style={pageStyles.headerIconBox}>
                    <ClockCircleOutlined style={{ fontSize: 28, color: 'white' }} />
                </div>
                <div style={pageStyles.headerTitleBox}>
                    <Text style={pageStyles.headerSubtitle}>
                        จัดการข้อมูล
                    </Text>
                    <Title level={4} style={pageStyles.headerTitle}>
                        กะการทำงาน (Shift)
                    </Title>
                </div>
            </div>
            
            <Tag color={currentShift ? '#success' : '#warning'} style={{ 
                fontSize: 14, 
                padding: '6px 16px', 
                borderRadius: 20, 
                border: 'none',
                background: currentShift ? 'white' : 'white',
                color: currentShift ? '#10b981' : '#f59e0b',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                {currentShift ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="pulse-animation" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>
                        เปิดใช้งานอยู่
                    </span>
                ) : (
                     <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}></span>
                        ปิดใช้งาน
                    </span>
                )}
            </Tag>
        </div>
    </div>
);

export default function ShiftPage() {
    const router = useRouter();
    const { message } = App.useApp();
    const { showLoading, hideLoading } = useGlobalLoading();
    const queryClient = useQueryClient();
    const [startAmount, setStartAmount] = useState<number>(0);
    const [endAmount, setEndAmount] = useState<number>(0);
    const [openModalVisible, setOpenModalVisible] = useState(false);
    const [closeModalVisible, setCloseModalVisible] = useState(false);
    const { socket } = useContext(SocketContext);

    const {
        data: currentShift = null,
        isLoading: isShiftLoading
    } = useQuery<Shift | null>({
        queryKey: ["shiftCurrent"],
        queryFn: async () => {
            return await shiftsService.getCurrentShift();
        },
        staleTime: 2000,
    });

    const {
        data: summaryData = null,
        isLoading: isSummaryLoading
    } = useQuery<ShiftSummary | null>({
        queryKey: ["shiftSummary", currentShift?.id || "none"],
        queryFn: async () => {
            return (await shiftsService.getCurrentSummary()) as ShiftSummary;
        },
        enabled: !!currentShift,
        staleTime: 2000,
    });

    useEffect(() => {
        if (!socket) return;
        const handleShiftUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ["shiftCurrent"] });
            queryClient.invalidateQueries({ queryKey: ["shiftSummary"] });
        };
        socket.on("shifts:update", handleShiftUpdate);
        return () => {
            socket.off("shifts:update", handleShiftUpdate);
        };
    }, [socket, queryClient]);

    const summary = currentShift ? (summaryData as ShiftSummary) : null;
    const isLoading = isShiftLoading || (currentShift ? isSummaryLoading : false);
    
    // Listen for real-time updates
    useEffect(() => {
        if (!socket) return;
        
        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ["shiftCurrent"] });
            queryClient.invalidateQueries({ queryKey: ["shiftSummary"] });
        };

        socket.on("shifts:update", handleUpdate);
        
        return () => {
            socket.off("shifts:update", handleUpdate);
        };
    }, [socket, queryClient]);

    const handleOpenShift = async () => {
        if (startAmount < 0) {
            message.error("กรุณาระบุจำนวนเงินทอนเริ่มต้น");
            return;
        }

        try {
            showLoading("กำลังเปิดกะ...");
            setOpenModalVisible(false);
            await shiftsService.openShift(startAmount);
            queryClient.invalidateQueries({ queryKey: ["shiftCurrent"] });
            queryClient.invalidateQueries({ queryKey: ["shiftSummary"] });
            setStartAmount(0);
            message.success("เปิดกะสำเร็จ!");
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "ไม่สามารถเปิดกะได้";
            message.error(errorMessage);
        } finally {
            hideLoading();
        }
    };

    const handleCloseShift = async () => {
        if (endAmount < 0) {
            message.error("กรุณาระบุจำนวนเงินที่นับได้");
            return;
        }

        try {
            showLoading("กำลังปิดกะและคำนวณยอด...");
            setCloseModalVisible(false);
            const shift = await shiftsService.closeShift(endAmount);
            const summaryData = (await shiftsService.getSummary(shift.id)) as ShiftSummary;
            
            setEndAmount(0);
            message.success("ปิดกะสำเร็จ!");
            queryClient.invalidateQueries({ queryKey: ["shiftCurrent"] });
            queryClient.invalidateQueries({ queryKey: ["shiftSummary"] });
            
            // Show summary modal
            Modal.info({
                title: 'สรุปกะการทำงาน',
                width: 600,
                className: 'shift-modal',
                content: (
                    <div style={{ padding: '16px 0' }}>
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Statistic title="เงินเริ่มต้น" value={Number(summaryData.shift_info.start_amount)} prefix="฿" />
                            </Col>
                            <Col span={12}>
                                <Statistic title="ยอดขายรวม" value={Number(summaryData.summary.total_sales)} prefix="฿" valueStyle={{ color: '#1890ff' }} />
                            </Col>
                            <Col span={12}>
                                <Statistic title="กำไรสุทธิ" value={Number(summaryData.summary.net_profit)} prefix="฿" valueStyle={{ color: '#52c41a' }} />
                            </Col>
                            <Col span={12}>
                                <Statistic title="เงินที่ควรมี (ทั้งหมดในเซฟ)" value={Number(summaryData.shift_info.start_amount) + Number(summaryData.summary.payment_methods?.['เงินสด'] || 0)} prefix="฿" valueStyle={{ color: '#1890ff' }} />
                            </Col>
                            <Col span={12}>
                                <Statistic 
                                    title="เงินที่นับได้จริง" 
                                    value={Number(summaryData.shift_info.end_amount)} 
                                    prefix="฿" 
                                    suffix={
                                        Number(summaryData.shift_info.diff_amount) !== 0 && (
                                            <span style={{ 
                                                fontSize: '14px', 
                                                marginLeft: '8px',
                                                color: Number(summaryData.shift_info.diff_amount) > 0 ? '#52c41a' : '#ff4d4f' 
                                            }}>
                                                ({Number(summaryData.shift_info.diff_amount) > 0 ? '+' : ''}{Number(summaryData.shift_info.diff_amount).toLocaleString()})
                                            </span>
                                        )
                                    }
                                />
                            </Col>
                            
                            <Col span={24}>
                                <Divider style={{ margin: '8px 0' }} />
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>ยอดขายแยกตามวิธีชำระเงิน</Text>
                                <Row gutter={16}>
                                    {Object.entries(summaryData.summary.payment_methods || {}).map(([method, amount]) => (
                                        <Col span={8} key={method}>
                                            <Statistic 
                                                title={method} 
                                                value={Number(amount)} 
                                                prefix="฿" 
                                                valueStyle={{ 
                                                    fontSize: 16,
                                                    color: method === 'เงินสด' ? '#1890ff' : (method === 'พร้อมเพย์' ? '#722ed1' : '#eb2f96')
                                                }} 
                                            />
                                        </Col>
                                    ))}
                                </Row>

                                <Divider style={{ margin: '8px 0' }} />
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>ยอดขายแยกตามช่องทาง</Text>
                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Statistic title="ทานที่ร้าน" value={Number(summaryData.summary.order_types?.DineIn || 0)} prefix="฿" valueStyle={{ fontSize: 16 }} />
                                    </Col>
                                    <Col span={8}>
                                        <Statistic title="กลับบ้าน" value={Number(summaryData.summary.order_types?.TakeAway || 0)} prefix="฿" valueStyle={{ fontSize: 16 }} />
                                    </Col>
                                    <Col span={8}>
                                        <Statistic title="เดลิเวอรี่" value={Number(summaryData.summary.order_types?.Delivery || 0)} prefix="฿" valueStyle={{ fontSize: 16, color: '#eb2f96' }} />
                                    </Col>
                                </Row>
                                <Divider style={{ margin: '8px 0' }} />
                            </Col>

                            <Col span={24}>
                                <Divider />
                                <Statistic 
                                    title="ส่วนต่าง (Short/Over)" 
                                    value={Number(summaryData.shift_info.diff_amount)} 
                                    prefix={Number(summaryData.shift_info.diff_amount) >= 0 ? <RiseOutlined /> : <FallOutlined />}
                                    suffix="฿"
                                    valueStyle={{ color: Number(summaryData.shift_info.diff_amount) >= 0 ? '#52c41a' : '#ff4d4f' }}
                                />
                            </Col>
                        </Row>
                        
                        <Divider plain>จำนวนที่ขายได้แยกตามหมวดหมู่</Divider>
                        <div style={{ maxHeight: 200, overflow: 'auto' }}>
                            {Object.entries(summaryData.categories).map(([cat, qty]) => (
                                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text>{cat}:</Text>
                                    <Text strong>{qty} ชิ้น</Text>
                                </div>
                            ))}
                        </div>
                    </div>
                ),
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "ไม่สามารถปิดกะได้";
            message.error(errorMessage);
        } finally {
            hideLoading();
        }
    };

    const getShiftDuration = () => {
        if (!currentShift) return '';
        const dur = dayjs.duration(dayjs().diff(dayjs(currentShift.open_time)));
        const hours = Math.floor(dur.asHours());
        const minutes = dur.minutes();
        return `${hours} ชม. ${minutes} นาที`;
    };

    if (isLoading) {
        return (
            <div style={{ ...pageStyles.container, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Spin size="large" tip="กำลังโหลดข้อมูล..." />
            </div>
        );
    }

    return (
        <div style={pageStyles.container}>
            <style>{globalStyles}</style>
            
            {/* Header */}
            <PageHeader currentShift={currentShift} onBack={() => router.back()} />

            {/* Main Content */}
            <div style={pageStyles.contentContainer}>
                <Row gutter={[24, 24]}>
                    {currentShift ? (
                        <>
                            {/* Left Side: Shift Status */}
                            <Col xs={24} lg={8}>
                                <div style={{ ...pageStyles.card, ...pageStyles.activeShiftCard }}>
                                    <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                                    <div style={{ position: 'absolute', bottom: -10, left: -20, width: 80, height: 80, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                                    
                                    <CheckCircleOutlined style={{ fontSize: 64, marginBottom: 16, color: 'white' }} />
                                    <Title level={3} style={{ color: 'white', margin: 0 }}>กะกำลังทำงาน</Title>
                                    <Text style={{ color: 'rgba(255,255,255,0.85)', display: 'block', marginTop: 8 }}>
                                        เริ่มเมื่อ: {dayjs(currentShift.open_time).format('DD/MM/YYYY HH:mm น.')}
                                    </Text>
                                    
                                    <div style={{ marginTop: 32, background: 'rgba(255,255,255,0.2)', borderRadius: 16, padding: '24px 16px', backdropFilter: 'blur(4px)' }}>
                                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>ระยะเวลาทำงาน</Text>
                                        <Title level={1} style={{ color: 'white', margin: '4px 0 0', fontSize: 36 }}>{getShiftDuration()}</Title>
                                    </div>
                                    
                                    <Button 
                                        type="primary" 
                                        danger
                                        icon={<StopOutlined />}
                                        size="large"
                                        block
                                        onClick={() => setCloseModalVisible(true)}
                                        style={{ marginTop: 32, height: 50, fontSize: 16, borderRadius: 12, border: 'none', background: 'white', color: '#ff4d4f', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    >
                                        ปิดกะ (Close Shift)
                                    </Button>
                                </div>
                            </Col>

                            {/* Right Side: Shift Live Summary */}
                            <Col xs={24} lg={16}>
                                <Card style={{ ...pageStyles.card, ...pageStyles.summaryCard }} bordered={false}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                            <RiseOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                                        </div>
                                        <Title level={4} style={{ margin: 0 }}>สรุปยอดขายปัจจุบัน (Live Summary)</Title>
                                    </div>
                                    
                                    {summary ? (
                                        <Row gutter={[16, 16]}>
                                            <Col xs={24} sm={12} md={8}>
                                                <div className="stat-card-inner">
                                                    <Statistic 
                                                        title={<span style={{ color: '#64748b' }}>เงินทอนเริ่มต้น</span>}
                                                        value={Number(summary.shift_info.start_amount)} 
                                                        prefix={<WalletOutlined style={{ color: '#1890ff' }} />}
                                                        suffix="฿"
                                                        precision={0}
                                                        valueStyle={{ fontWeight: 600, color: '#1e293b' }}
                                                    />
                                                </div>
                                            </Col>
                                            <Col xs={24} sm={12} md={8}>
                                                <div className="stat-card-inner">
                                                    <Statistic 
                                                        title={<span style={{ color: '#64748b' }}>ยอดขายรวม</span>}
                                                        value={Number(summary.summary.total_sales)} 
                                                        prefix={<DollarCircleOutlined style={{ color: '#10b981' }} />}
                                                        suffix="฿"
                                                        precision={0}
                                                        valueStyle={{ fontWeight: 600, color: '#10b981' }}
                                                    />
                                                </div>
                                            </Col>
                                            <Col xs={24} sm={12} md={8}>
                                                <div className="stat-card-inner">
                                                     <Statistic 
                                                        title={<span style={{ color: '#64748b' }}>กำไรโดยประมาณ</span>}
                                                        value={Number(summary.summary.net_profit)} 
                                                        prefix={<RiseOutlined style={{ color: '#f59e0b' }} />}
                                                        suffix="฿"
                                                        precision={0}
                                                        valueStyle={{ fontWeight: 600, color: '#f59e0b' }}
                                                    />
                                                </div>
                                            </Col>
                                            
                                            <Col span={24}>
                                                <Divider style={{ margin: '12px 0' }} />
                                            </Col>

                                            <Col xs={24} sm={12} md={8}>
                                                <Statistic 
                                                    title="รวมจำนวนที่ขายได้" 
                                                    value={Object.values(summary.categories).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0) as number} 
                                                    suffix="ชิ้น"
                                                    valueStyle={{ fontWeight: 600 }}
                                                />
                                            </Col>

                                            <Col xs={24} sm={12} md={16}>
                                                <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <Text style={{ color: '#15803d' }}>
                                                            <SafetyCertificateOutlined style={{ marginRight: 6 }} />
                                                            เงินสดที่ต้องมีในเซฟ
                                                        </Text>
                                                        <Text strong style={{ fontSize: 20, color: '#15803d' }}>
                                                            ฿{(Number(summary.shift_info.start_amount) + Number(summary.summary.payment_methods?.['เงินสด'] || 0)).toLocaleString()}
                                                        </Text>
                                                    </div>
                                                </div>
                                            </Col>

                                            <Col span={24}>
                                                <div style={{ marginTop: 24 }}>
                                                    <Text strong style={{ fontSize: 14, color: '#64748b', display: 'block', marginBottom: 16 }}>ยอดขายตามวิธีชำระเงิน</Text>
                                                    <Row gutter={[12, 12]}>
                                                        {Object.entries(summary.summary.payment_methods || {}).map(([method, amount]) => {
                                                            const getMethodColor = (name: string) => {
                                                                if (name === 'เงินสด') return '#1890ff';
                                                                if (name === 'พร้อมเพย์') return '#722ed1';
                                                                return '#eb2f96';
                                                            };
                                                            
                                                            return (
                                                                <Col xs={12} sm={8} key={method}>
                                                                    <div style={{ borderLeft: `3px solid ${getMethodColor(method)}`, paddingLeft: 12 }}>
                                                                        <Text style={{ fontSize: 12, color: '#64748b' }}>{method}</Text>
                                                                        <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>
                                                                            ฿{Number(amount).toLocaleString()}
                                                                        </div>
                                                                    </div>
                                                                </Col>
                                                            );
                                                        })}
                                                    </Row>
                                                </div>
                                            </Col>
                                            
                                            <Col span={24}>
                                                <div style={{ marginTop: 12 }}>
                                                    <Text strong style={{ fontSize: 14, color: '#64748b', display: 'block', marginBottom: 16 }}>สินค้าขายดี 5 อันดับแรก</Text>
                                                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16 }}>
                                                        {summary.top_products.length > 0 ? (
                                                            summary.top_products.map((item, index) => (
                                                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: index === 4 ? 0 : 12, paddingBottom: index === 4 ? 0 : 12, borderBottom: index === 4 ? 'none' : '1px solid #e2e8f0' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                                        <div style={{ 
                                                                            width: 24, height: 24, borderRadius: '50%', 
                                                                            background: index === 0 ? '#fef3c7' : (index === 1 ? '#f1f5f9' : '#f1f5f9'),
                                                                            color: index === 0 ? '#d97706' : '#64748b',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            fontWeight: 700, fontSize: 12
                                                                        }}>
                                                                            {index + 1}
                                                                        </div>
                                                                        <Text strong style={{ color: '#334155' }}>{item.name}</Text>
                                                                    </div>
                                                                    <div style={{ textAlign: 'right' }}>
                                                                        <Text type="secondary" style={{ marginRight: 12, fontSize: 12 }}>{item.quantity} {item.unit || 'ชิ้น'}</Text>
                                                                        <Text strong style={{ color: '#1e293b' }}>฿{Number(item.revenue).toLocaleString()}</Text>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div style={{ textAlign: 'center', padding: 20 }}>
                                                                <Text type="secondary">ยังไม่มีข้อมูลการขาย</Text>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                            <Spin />
                                            <div style={{ marginTop: 16 }}>กำลังคำนวณสรุปยอด...</div>
                                        </div>
                                    )}
                                </Card>
                            </Col>
                        </>
                    ) : (
                        /* No Active Shift */
                        <Col xs={24}>
                            <Card style={{ ...pageStyles.card, minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ textAlign: 'center', maxWidth: 400 }}>
                                    <div style={{ width: 120, height: 120, background: '#fff7ed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                                        <ClockCircleOutlined style={{ fontSize: 60, color: '#f97316' }} />
                                    </div>
                                    <Title level={2} style={{ marginBottom: 16 }}>ยังไม่มีกะที่เปิด</Title>
                                    <Text type="secondary" style={{ fontSize: 16, display: 'block', marginBottom: 40 }}>
                                        กรุณาเปิดกะก่อนเริ่มทำงานขาย เพื่อติดตามยอดขายและเงินสดในลิ้นชัก ระบบจะบันทึกเวลาและยอดเงินเริ่มต้น
                                    </Text>
                                    
                                    <Button 
                                        type="primary" 
                                        icon={<PlayCircleOutlined />}
                                        size="large"
                                        onClick={() => setOpenModalVisible(true)}
                                        style={{ 
                                            background: '#10b981', 
                                            borderColor: '#10b981', 
                                            height: 56, 
                                            padding: '0 48px', 
                                            borderRadius: 16, 
                                            fontSize: 18,
                                            fontWeight: 600,
                                            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
                                        }}
                                    >
                                        เปิดกะทำงาน (Open Shift)
                                    </Button>
                                    
                                    <div style={{ marginTop: 32, fontSize: 13, color: '#94a3b8' }}>
                                        <SafetyCertificateOutlined style={{ marginRight: 6 }} />
                                        ระบบจะทำการตรวจสอบสิทธิ์ก่อนเปิดกะ
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    )}
                </Row>
            </div>

            {/* Open Shift Modal */}
            <Modal
                title={<span style={{ display: 'flex', alignItems: 'center' }}><PlayCircleOutlined style={{ color: '#10b981', marginRight: 12, fontSize: 24 }} /> <span style={{ fontSize: 20 }}>เปิดกะใหม่</span></span>}
                open={openModalVisible}
                onCancel={() => setOpenModalVisible(false)}
                onOk={handleOpenShift}
                okText="ยืนยันเปิดกะ"
                cancelText="ยกเลิก"
                okButtonProps={{ style: { background: '#10b981', borderColor: '#10b981', height: 40 }, size: 'large' }}
                cancelButtonProps={{ size: 'large', type: 'text' }}
                width={500}
                centered
                className="shift-modal"
            >
                <div style={{ padding: '24px 0' }}>
                    <Text style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>กรุณาระบุจำนวนเงินทอนเริ่มต้นในลิ้นชัก:</Text>
                    <InputNumber
                        style={{ width: '100%', borderRadius: 12 }}
                        size="large"
                        min={0}
                        step={100}
                        autoFocus
                        value={startAmount}
                        onChange={(val) => setStartAmount(val || 0)}
                        formatter={(value) => `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => Number(value?.replace(/[฿\s,]/g, '') || 0)}
                        placeholder="0.00"
                        addonBefore={<WalletOutlined />}
                    />
                    <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                         {[1000, 2000, 3000, 5000].map(amt => (
                             <Tag 
                                key={amt} 
                                style={{ borderRadius: 16, padding: '4px 12px', cursor: 'pointer' }}
                                onClick={() => setStartAmount(amt)}
                             >
                                ฿{amt.toLocaleString()}
                             </Tag>
                         ))}
                    </div>
                </div>
            </Modal>

            {/* Close Shift Modal */}
            <Modal
                title={<span style={{ display: 'flex', alignItems: 'center' }}><StopOutlined style={{ color: '#ef4444', marginRight: 12, fontSize: 24 }} /> <span style={{ fontSize: 20 }}>ปิดกะการทำงาน</span></span>}
                open={closeModalVisible}
                onCancel={() => setCloseModalVisible(false)}
                onOk={handleCloseShift}
                okText="ยืนยันปิดกะ"
                okButtonProps={{ danger: true, size: 'large', style: { height: 40 } }}
                cancelButtonProps={{ size: 'large', type: 'text' }}
                cancelText="ยกเลิก"
                width={500}
                centered
            >
                <div style={{ padding: '24px 0 12px' }}>
                    <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: 16, borderRadius: 12, marginBottom: 24 }}>
                        <Text strong style={{ color: '#c2410c' }}>คำเตือน:</Text> <Text style={{ color: '#9a3412' }}>เมื่อปิดกะแล้วจะไม่สามารถทำการขายต่อได้ จนกว่าจะเปิดกะใหม่</Text>
                    </div>
                    
                    <Text style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>ระบุจำนวนเงินสดที่นับได้จริง (Counted Cash):</Text>
                    <InputNumber
                        style={{ width: '100%', borderRadius: 12 }}
                        size="large"
                        min={0}
                        step={100}
                        autoFocus
                        value={endAmount}
                        onChange={(val) => setEndAmount(val || 0)}
                        formatter={(value) => `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => Number(value?.replace(/[฿\s,]/g, '') || 0)}
                        placeholder="0.00"
                        addonBefore={<WalletOutlined />}
                    />
                    
                     {summary && (
                        <div style={{ marginTop: 24, padding: 20, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <Text type="secondary">เงินเริ่มต้นในลิ้นชัก</Text>
                                <Text>฿{Number(summary.shift_info.start_amount).toLocaleString()}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <Text type="secondary">ยอดขายเงินสดวันนี้</Text>
                                <Text>฿{Number(summary.summary.payment_methods?.['เงินสด'] || 0).toLocaleString()}</Text>
                            </div>
                            
                            <Divider style={{ margin: '12px 0' }} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text strong>ยอดเงินสดที่ควรมี</Text>
                                <Text strong style={{ color: '#1e293b', fontSize: 18 }}>฿{(Number(summary.shift_info.start_amount) + Number(summary.summary.payment_methods?.['เงินสด'] || 0)).toLocaleString()}</Text>
                            </div>
                            
                            {endAmount > 0 && (
                                <>
                                    <Divider style={{ margin: '12px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text strong>ส่วนต่าง (Diff)</Text>
                                        <Tag color={(endAmount - (Number(summary.shift_info.start_amount) + Number(summary.summary.payment_methods?.['เงินสด'] || 0))) >= 0 ? 'success' : 'error'} style={{ fontSize: 16, padding: '4px 12px', margin: 0, borderRadius: 12 }}>
                                            {(endAmount - (Number(summary.shift_info.start_amount) + Number(summary.summary.payment_methods?.['เงินสด'] || 0))) >= 0 ? '+' : ''}
                                            {(endAmount - (Number(summary.shift_info.start_amount) + Number(summary.summary.payment_methods?.['เงินสด'] || 0))).toLocaleString()} ฿
                                        </Tag>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
