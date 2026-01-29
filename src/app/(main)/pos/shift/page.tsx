"use client";

import React, { useCallback, useEffect, useState, useContext } from "react";
import { Typography, Card, Button, Row, Col, InputNumber, Statistic, Tag, Modal, Spin, Divider, Result, App, Space } from "antd";
import { ClockCircleOutlined, DollarCircleOutlined, CheckCircleOutlined, PlayCircleOutlined, StopOutlined, ArrowLeftOutlined, WalletOutlined, RiseOutlined, FallOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { SocketContext } from "../../../../contexts/SocketContext";
import { shiftsService } from "../../../../services/pos/shifts.service";
import { Shift } from "../../../../types/api/pos/shifts";
import { posPageStyles } from "@/theme/pos";
import { useGlobalLoading } from "@/contexts/pos/GlobalLoadingContext";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);
dayjs.locale('th');

const { Title, Text } = Typography;

export default function ShiftPage() {
    const router = useRouter();
    const { message } = App.useApp();
    const { showLoading, hideLoading } = useGlobalLoading();
    const [currentShift, setCurrentShift] = useState<Shift | null>(null);
    const [summary, setSummary] = useState<any>(null); // Ideally should be typed
    const [isLoading, setIsLoading] = useState(true);
    const [startAmount, setStartAmount] = useState<number>(0);
    const [endAmount, setEndAmount] = useState<number>(0);
    const [openModalVisible, setOpenModalVisible] = useState(false);
    const [closeModalVisible, setCloseModalVisible] = useState(false);
    const { socket } = useContext(SocketContext);

    const fetchCurrentShift = useCallback(async () => {
        setIsLoading(true);
        try {
            const shift = await shiftsService.getCurrentShift();
            setCurrentShift(shift);
            if (shift) {
                const summaryData = await shiftsService.getCurrentSummary();
                setSummary(summaryData);
            } else {
                setSummary(null);
            }
        } catch (error) {
            // Error handled silently for background fetch
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCurrentShift();
    }, [fetchCurrentShift]);
    
    // Listen for real-time updates
    useEffect(() => {
        if (!socket) return;
        
        const handleUpdate = () => {
             fetchCurrentShift();
        };

        socket.on("shifts:update", handleUpdate);
        
        return () => {
            socket.off("shifts:update", handleUpdate);
        };
    }, [socket, fetchCurrentShift]);

    const handleOpenShift = async () => {
        if (startAmount < 0) {
            message.error("กรุณาระบุจำนวนเงินทอนเริ่มต้น");
            return;
        }

        try {
            showLoading("กำลังเปิดกะ...");
            setOpenModalVisible(false);
            const shift = await shiftsService.openShift(startAmount);
            setCurrentShift(shift);
            await fetchCurrentShift(); // Reload with summary
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
            const summaryData = await shiftsService.getSummary(shift.id);
            
            setCurrentShift(null);
            setSummary(null);
            setEndAmount(0);
            message.success("ปิดกะสำเร็จ!");
            
            // Show summary modal
            Modal.info({
                title: 'สรุปกะการทำงาน',
                width: 600,
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
                                    {Object.entries(summaryData.summary.payment_methods || {}).map(([method, amount]: [string, any]) => (
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
                            {Object.entries(summaryData.categories).map(([cat, qty]: [string, any]) => (
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
            <div style={{ ...posPageStyles.container, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Spin size="large" tip="กำลังโหลดข้อมูล..." />
            </div>
        );
    }

    return (
        <div style={posPageStyles.container}>
            {/* Header */}
            <div style={posPageStyles.shiftHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Button 
                        type="text" 
                        icon={<ArrowLeftOutlined style={{ fontSize: 20, color: '#262626' }} />} 
                        onClick={() => router.back()}
                        style={{ background: 'rgba(0,0,0,0.05)', border: 'none' }}
                    />
                    <div>
                        <Title level={2} style={{ margin: 0, color: '#262626' }}>
                            <ClockCircleOutlined style={{ marginRight: 12 }} />
                            จัดการกะ (Shift)
                        </Title>
                        <Text type="secondary">เปิด/ปิดกะการทำงาน และสรุปยอดขาย</Text>
                    </div>
                </div>
                <Tag color={currentShift ? 'green' : 'orange'} style={{ fontSize: 16, padding: '8px 16px' }}>
                    {currentShift ? 'กะเปิดอยู่' : 'ไม่มีกะที่เปิด'}
                </Tag>
            </div>

            {/* Main Content */}
            <Row gutter={[24, 24]} style={{ maxWidth: 1200, margin: '0 auto' }}>
                {currentShift ? (
                    <>
                        {/* Left Side: Shift Status */}
                        <Col xs={24} lg={8}>
                            <Card style={{ ...posPageStyles.card, background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)', border: 'none', height: '100%' }}>
                                <div style={{ textAlign: 'center', color: '#fff', padding: '24px 0' }}>
                                    <CheckCircleOutlined style={{ fontSize: 64, marginBottom: 16 }} />
                                    <Title level={3} style={{ color: '#fff', margin: 0 }}>กะกำลังทำงาน</Title>
                                    <Text style={{ color: 'rgba(255,255,255,0.85)', display: 'block', marginTop: 8 }}>
                                        เปิดเมื่อ: {dayjs(currentShift.open_time).format('DD/MM/YYYY HH:mm น.')}
                                    </Text>
                                    <div style={{ marginTop: 32, background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 24 }}>
                                        <Text style={{ color: '#fff', fontSize: 18 }}>ทำงานมาแล้ว</Text>
                                        <Title level={1} style={{ color: '#fff', margin: '8px 0 0' }}>{getShiftDuration()}</Title>
                                    </div>
                                    
                                    <Divider style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                                    
                                    <Button 
                                        type="primary" 
                                        danger
                                        icon={<StopOutlined />}
                                        size="large"
                                        block
                                        onClick={() => setCloseModalVisible(true)}
                                        style={{ height: 50, fontSize: 18, borderRadius: 12 }}
                                    >
                                        ปิดกะ (Close Shift)
                                    </Button>
                                </div>
                            </Card>
                        </Col>

                        {/* Right Side: Shift Live Summary */}
                        <Col xs={24} lg={16}>
                            <Card style={posPageStyles.card} title={<><RiseOutlined style={{ marginRight: 8 }} />สรุปยอดขายปัจจุบัน (Live Summary)</>}>
                                {summary ? (
                                    <Row gutter={[24, 24]}>
                                        <Col xs={24} sm={12}>
                                            <Statistic 
                                                title="เงินทอนเริ่มต้น" 
                                                value={Number(summary.shift_info.start_amount)} 
                                                prefix={<WalletOutlined style={{ color: '#1890ff' }} />}
                                                suffix="฿"
                                                precision={2}
                                            />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <Statistic 
                                                title="ยอดขายรวม" 
                                                value={Number(summary.summary.total_sales)} 
                                                prefix={<DollarCircleOutlined style={{ color: '#52c41a' }} />}
                                                suffix="฿"
                                                precision={2}
                                                valueStyle={{ color: '#52c41a' }}
                                            />
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <Statistic 
                                                title="กำไรโดยประมาณ" 
                                                value={Number(summary.summary.net_profit)} 
                                                prefix={<RiseOutlined style={{ color: '#fa8c16' }} />}
                                                suffix="฿"
                                                precision={2}
                                                valueStyle={{ color: '#fa8c16' }}
                                            />
                                        </Col>
                                        <Col xs={24} sm={12} md={8}>
                                            <Statistic 
                                                title="รวมจำนวนที่ขายได้" 
                                                value={Object.values(summary.categories).reduce((a: any, b: any) => a + b, 0) as number} 
                                                suffix="ชิ้น"
                                            />
                                        </Col>

                                        <Col xs={24} sm={12} md={8}>
                                            <Statistic 
                                                title="เงินสดที่ต้องมีในเซฟ" 
                                                value={Number(summary.shift_info.start_amount) + Number(summary.summary.payment_methods?.['เงินสด'] || 0)} 
                                                prefix={<CheckCircleOutlined style={{ color: '#1890ff' }} />}
                                                suffix="฿"
                                                precision={2}
                                                valueStyle={{ color: '#439d0bff' }}
                                            />
                                        </Col>

                                        {/* Payment Methods at Top */}
                                        {Object.entries(summary.summary.payment_methods || {}).map(([method, amount]: [string, any]) => {
                                            const getMethodColor = (name: string) => {
                                                if (name === 'เงินสด') return '#1890ff';
                                                if (name === 'พร้อมเพย์') return '#722ed1';
                                                if (name === 'เดลิเวอรี่') return '#eb2f96';
                                                return '#eb2f96';
                                            };
                                            
                                            return (
                                                <Col xs={24} sm={12} md={8} key={method}>
                                                    <Statistic 
                                                        title={`ยอดขาย (${method})`}
                                                        value={Number(amount)} 
                                                        precision={2} 
                                                        prefix="฿" 
                                                        valueStyle={{ color: getMethodColor(method) }}
                                                    />
                                                </Col>
                                            );
                                        })}
                                        
                                        <Col span={24}>
                                            <Divider plain titlePlacement="left">ยอดขายตามช่องทาง (Sales by Channel)</Divider>
                                            <Row gutter={[16, 16]}>
                                                <Col xs={8}>
                                                    <Statistic 
                                                        title="ทานที่ร้าน" 
                                                        value={Number(summary.summary.order_types?.DineIn || 0)} 
                                                        precision={2} 
                                                        prefix="฿" 
                                                    />
                                                </Col>
                                                <Col xs={8}>
                                                    <Statistic 
                                                        title="กลับบ้าน" 
                                                        value={Number(summary.summary.order_types?.TakeAway || 0)} 
                                                        precision={2} 
                                                        prefix="฿" 
                                                    />
                                                </Col>
                                                <Col xs={8}>
                                                    <Statistic 
                                                        title="เดลิเวอรี่" 
                                                        value={Number(summary.summary.order_types?.Delivery || 0)} 
                                                        precision={2} 
                                                        prefix="฿" 
                                                        valueStyle={{ color: '#eb2f96' }}
                                                    />
                                                </Col>
                                            </Row>
                                        </Col>
                                        
                                        <Col span={24}>
                                            <Divider plain titlePlacement="left">สินค้าขายดี 5 อันดับแรก (Top 5 Items)</Divider>
                                            <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 16 }}>
                                                {summary.top_products.length > 0 ? (
                                                    summary.top_products.map((item: any, index: number) => (
                                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: index === 4 ? 0 : 12 }}>
                                                            <div>
                                                                <Tag color="gold">{index + 1}</Tag>
                                                                <Text strong>{item.name}</Text>
                                                            </div>
                                                            <div>
                                                                <Text type="secondary" style={{ marginRight: 16 }}>{item.quantity} {item.unit || 'ชิ้น'}</Text>
                                                                <Text strong>฿{Number(item.revenue).toLocaleString()}</Text>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div style={{ textAlign: 'center', padding: 20 }}>
                                                        <Text type="secondary">ยังไม่มีข้อมูลการขาย</Text>
                                                    </div>
                                                )}
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
                        <Card style={posPageStyles.card}>
                            <Result
                                icon={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                                title="ยังไม่มีกะที่เปิด"
                                subTitle="กรุณาเปิดกะก่อนเริ่มทำงานขาย เพื่อติดตามยอดขายและเงินสดในลิ้นชัก"
                                extra={
                                    <Button 
                                        type="primary" 
                                        icon={<PlayCircleOutlined />}
                                        size="large"
                                        onClick={() => setOpenModalVisible(true)}
                                        style={{ background: '#52c41a', borderColor: '#52c41a', height: 50, padding: '0 40px', borderRadius: 12, fontSize: 18 }}
                                    >
                                        เปิดกะทำงาน (Open Shift)
                                    </Button>
                                }
                            />
                        </Card>
                    </Col>
                )}
            </Row>

            {/* Open Shift Modal */}
            <Modal
                title={<Title level={4}><PlayCircleOutlined style={{ color: '#52c41a', marginRight: 12 }} />เปิดกะใหม่</Title>}
                open={openModalVisible}
                onCancel={() => setOpenModalVisible(false)}
                onOk={handleOpenShift}
                okText="เปิดกะ (Open)"
                cancelText="ยกเลิก"
                okButtonProps={{ style: { background: '#52c41a', borderColor: '#52c41a' } }}
            >
                <div style={{ padding: '16px 0' }}>
                    <Text strong style={{ fontSize: 16 }}>กรุณาระบุจำนวนเงินทอนเริ่มต้นในลิ้นชัก:</Text>
                    <InputNumber
                        style={{ width: '100%', marginTop: 16 }}
                        size="large"
                        min={0}
                        step={100}
                        autoFocus
                        value={startAmount}
                        onChange={(val) => setStartAmount(val || 0)}
                        formatter={(value) => `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => Number(value?.replace(/[฿\s,]/g, '') || 0)}
                        placeholder="เช่น 1,000"
                    />
                </div>
            </Modal>

            {/* Close Shift Modal */}
            <Modal
                title={<Title level={4}><StopOutlined style={{ color: '#ff4d4f', marginRight: 12 }} />ปิดกะการทำงาน</Title>}
                open={closeModalVisible}
                onCancel={() => setCloseModalVisible(false)}
                onOk={handleCloseShift}
                okText="ปิดกะและพิมพ์สรุป"
                okButtonProps={{ danger: true }}
                cancelText="ยกเลิก"
            >
                <div style={{ padding: '16px 0' }}>
                    <Text strong style={{ fontSize: 16 }}>กรุณาระบุจำนวนเงินสดทั้งหมดที่นับได้จริงในลิ้นชัก:</Text>
                    <InputNumber
                        style={{ width: '100%', marginTop: 16 }}
                        size="large"
                        min={0}
                        step={100}
                        autoFocus
                        value={endAmount}
                        onChange={(val) => setEndAmount(val || 0)}
                        formatter={(value) => `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => Number(value?.replace(/[฿\s,]/g, '') || 0)}
                        placeholder="เช่น 5,000"
                    />
                    {summary && (
                        <div style={{ marginTop: 20, padding: 16, background: '#f0f2f5', borderRadius: 12, overflowY: 'auto', maxHeight: 300 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text type="secondary">เงินเริ่มต้น:</Text>
                                <Text strong>฿{Number(summary.shift_info.start_amount).toLocaleString()}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text type="secondary">ยอดขายกะนี้:</Text>
                                <Text strong>฿{Number(summary.summary.total_sales).toLocaleString()}</Text>
                            </div>
                            
                            <Divider style={{ margin: '8px 0' }} />
                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>รายละเอียดวิธีชำระเงิน:</Text>
                            {Object.entries(summary.summary.payment_methods || {}).map(([method, amount]: [string, any]) => (
                                <div key={method} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text>{method}:</Text>
                                    <Text strong>฿{Number(amount).toLocaleString()}</Text>
                                </div>
                            ))}

                            <Divider style={{ margin: '8px 0' }} />
                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>รายละเอียดตามช่องทาง:</Text>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text>ทานที่ร้าน:</Text>
                                <Text strong>฿{Number(summary.summary.order_types?.DineIn || 0).toLocaleString()}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text>กลับบ้าน:</Text>
                                <Text strong>฿{Number(summary.summary.order_types?.TakeAway || 0).toLocaleString()}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text>เดลิเวอรี่:</Text>
                                <Text strong style={{ color: '#eb2f96' }}>฿{Number(summary.summary.order_types?.Delivery || 0).toLocaleString()}</Text>
                            </div>

                            <Divider style={{ margin: '12px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text strong>ควรจะมีเงินรวม:</Text>
                                <Text strong style={{ color: '#1890ff', fontSize: 18 }}>฿{(Number(summary.shift_info.start_amount) + Number(summary.summary.total_sales)).toLocaleString()}</Text>
                            </div>
                            {endAmount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                                    <Text strong>ส่วนต่าง:</Text>
                                    <Text strong style={{ 
                                        color: (endAmount - (Number(summary.shift_info.start_amount) + Number(summary.summary.total_sales))) >= 0 ? '#52c41a' : '#ff4d4f',
                                        fontSize: 18
                                    }}>
                                        {(endAmount - (Number(summary.shift_info.start_amount) + Number(summary.summary.total_sales))) >= 0 ? '+' : ''}
                                        {(endAmount - (Number(summary.shift_info.start_amount) + Number(summary.summary.total_sales))).toLocaleString()} ฿
                                    </Text>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
