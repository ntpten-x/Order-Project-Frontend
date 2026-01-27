"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Typography, Card, Button, Row, Col, InputNumber, Statistic, Tag, Modal, Spin, message, Divider, Result } from "antd";
import { ClockCircleOutlined, DollarCircleOutlined, CheckCircleOutlined, PlayCircleOutlined, StopOutlined, ArrowLeftOutlined, WalletOutlined, RiseOutlined, FallOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { shiftsService } from "../../../../services/pos/shifts.service";
import { Shift } from "../../../../types/api/pos/shifts";
import dayjs from "dayjs";
import 'dayjs/locale/th';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);
dayjs.locale('th');

const { Title, Text } = Typography;

// Styles
const pageStyles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #1e3a5f 100%)',
        padding: 24,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    card: {
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    },
};

export default function ShiftPage() {
    const router = useRouter();
    const [currentShift, setCurrentShift] = useState<Shift | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [startAmount, setStartAmount] = useState<number>(0);
    const [endAmount, setEndAmount] = useState<number>(0);
    const [openModalVisible, setOpenModalVisible] = useState(false);
    const [closeModalVisible, setCloseModalVisible] = useState(false);
    const [processing, setProcessing] = useState(false);

    const fetchCurrentShift = useCallback(async () => {
        setIsLoading(true);
        try {
            const shift = await shiftsService.getCurrentShift();
            setCurrentShift(shift);
        } catch (error) {
            console.error("Fetch shift error:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCurrentShift();
    }, [fetchCurrentShift]);

    const handleOpenShift = async () => {
        if (startAmount < 0) {
            message.error("กรุณาระบุจำนวนเงินทอนเริ่มต้น");
            return;
        }

        setProcessing(true);
        try {
            const shift = await shiftsService.openShift(startAmount);
            setCurrentShift(shift);
            setOpenModalVisible(false);
            setStartAmount(0);
            message.success("เปิดกะสำเร็จ!");
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "ไม่สามารถเปิดกะได้";
            message.error(errorMessage);
        } finally {
            setProcessing(false);
        }
    };

    const handleCloseShift = async () => {
        if (endAmount < 0) {
            message.error("กรุณาระบุจำนวนเงินที่นับได้");
            return;
        }

        setProcessing(true);
        try {
            const shift = await shiftsService.closeShift(endAmount);
            setCurrentShift(null);
            setCloseModalVisible(false);
            setEndAmount(0);
            message.success("ปิดกะสำเร็จ!");
            // Show summary modal
            Modal.info({
                title: 'สรุปกะการทำงาน',
                width: 500,
                content: (
                    <div style={{ padding: 16 }}>
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Statistic title="เงินเริ่มต้น" value={shift.start_amount} prefix="฿" />
                            </Col>
                            <Col span={12}>
                                <Statistic title="ยอดขาย (คาดหวัง)" value={(shift.expected_amount || 0) - Number(shift.start_amount)} prefix="฿" />
                            </Col>
                            <Col span={12}>
                                <Statistic title="เงินที่ควรมี" value={shift.expected_amount} prefix="฿" />
                            </Col>
                            <Col span={12}>
                                <Statistic title="เงินที่นับได้จริง" value={shift.end_amount} prefix="฿" />
                            </Col>
                            <Col span={24}>
                                <Divider />
                                <Statistic 
                                    title="ผลต่าง" 
                                    value={shift.diff_amount} 
                                    prefix={Number(shift.diff_amount || 0) >= 0 ? <RiseOutlined /> : <FallOutlined />}
                                    suffix="฿"
                                    valueStyle={{ color: Number(shift.diff_amount || 0) >= 0 ? '#52c41a' : '#ff4d4f' }}
                                />
                            </Col>
                        </Row>
                    </div>
                ),
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "ไม่สามารถปิดกะได้";
            message.error(errorMessage);
        } finally {
            setProcessing(false);
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
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={pageStyles.container}>
            {/* Header */}
            <div style={pageStyles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Button 
                        type="text" 
                        icon={<ArrowLeftOutlined style={{ fontSize: 20, color: '#fff' }} />} 
                        onClick={() => router.back()}
                        style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)' }}
                    />
                    <div>
                        <Title level={2} style={{ margin: 0, color: '#fff' }}>
                            <ClockCircleOutlined style={{ marginRight: 12 }} />
                            จัดการกะ (Shift)
                        </Title>
                        <Text style={{ color: 'rgba(255,255,255,0.7)' }}>เปิด/ปิดกะการทำงาน และสรุปยอดขาย</Text>
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
                        {/* Active Shift Card */}
                        <Col xs={24} lg={12}>
                            <Card style={{ ...pageStyles.card, background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)', border: 'none' }}>
                                <div style={{ textAlign: 'center', color: '#fff' }}>
                                    <CheckCircleOutlined style={{ fontSize: 64, marginBottom: 16 }} />
                                    <Title level={3} style={{ color: '#fff', margin: 0 }}>กะกำลังทำงาน</Title>
                                    <Text style={{ color: 'rgba(255,255,255,0.85)', display: 'block', marginTop: 8 }}>
                                        เปิดเมื่อ: {dayjs(currentShift.open_time).format('DD/MM/YYYY HH:mm น.')}
                                    </Text>
                                    <div style={{ marginTop: 24, background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 16 }}>
                                        <Text style={{ color: '#fff', fontSize: 18 }}>ทำงานมาแล้ว</Text>
                                        <Title level={2} style={{ color: '#fff', margin: '8px 0 0' }}>{getShiftDuration()}</Title>
                                    </div>
                                </div>
                            </Card>
                        </Col>

                        {/* Shift Info */}
                        <Col xs={24} lg={12}>
                            <Card style={pageStyles.card} title={<><WalletOutlined style={{ marginRight: 8 }} />ข้อมูลกะ</>}>
                                <Statistic 
                                    title="เงินทอนเริ่มต้น" 
                                    value={currentShift.start_amount} 
                                    prefix={<DollarCircleOutlined style={{ color: '#1890ff' }} />}
                                    suffix="฿"
                                    valueStyle={{ fontSize: 32 }}
                                />
                                <Divider />
                                <Button 
                                    type="primary" 
                                    danger
                                    icon={<StopOutlined />}
                                    size="large"
                                    block
                                    onClick={() => setCloseModalVisible(true)}
                                >
                                    ปิดกะ
                                </Button>
                            </Card>
                        </Col>
                    </>
                ) : (
                    /* No Active Shift */
                    <Col xs={24}>
                        <Card style={pageStyles.card}>
                            <Result
                                icon={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                                title="ยังไม่มีกะที่เปิด"
                                subTitle="กรุณาเปิดกะก่อนเริ่มทำงานขาย"
                                extra={
                                    <Button 
                                        type="primary" 
                                        icon={<PlayCircleOutlined />}
                                        size="large"
                                        onClick={() => setOpenModalVisible(true)}
                                        style={{ background: '#52c41a', borderColor: '#52c41a' }}
                                    >
                                        เปิดกะ
                                    </Button>
                                }
                            />
                        </Card>
                    </Col>
                )}
            </Row>

            {/* Open Shift Modal */}
            <Modal
                title={<><PlayCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />เปิดกะใหม่</>}
                open={openModalVisible}
                onCancel={() => setOpenModalVisible(false)}
                onOk={handleOpenShift}
                okText="เปิดกะ"
                cancelText="ยกเลิก"
                confirmLoading={processing}
            >
                <div style={{ padding: '24px 0' }}>
                    <Text>กรุณาระบุจำนวนเงินทอนเริ่มต้นในลิ้นชัก:</Text>
                    <InputNumber
                        style={{ width: '100%', marginTop: 16 }}
                        size="large"
                        min={0}
                        step={100}
                        value={startAmount}
                        onChange={(val) => setStartAmount(val || 0)}
                        formatter={(value) => `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => Number(value?.replace(/฿\s?|(,*)/g, '') || 0)}
                        placeholder="เช่น 1,000"
                    />
                </div>
            </Modal>

            {/* Close Shift Modal */}
            <Modal
                title={<><StopOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />ปิดกะ</>}
                open={closeModalVisible}
                onCancel={() => setCloseModalVisible(false)}
                onOk={handleCloseShift}
                okText="ปิดกะ"
                okButtonProps={{ danger: true }}
                cancelText="ยกเลิก"
                confirmLoading={processing}
            >
                <div style={{ padding: '24px 0' }}>
                    <Text>กรุณาระบุจำนวนเงินที่นับได้จริงในลิ้นชัก:</Text>
                    <InputNumber
                        style={{ width: '100%', marginTop: 16 }}
                        size="large"
                        min={0}
                        step={100}
                        value={endAmount}
                        onChange={(val) => setEndAmount(val || 0)}
                        formatter={(value) => `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => Number(value?.replace(/฿\s?|(,*)/g, '') || 0)}
                        placeholder="เช่น 5,000"
                    />
                    {currentShift && (
                        <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                            <Text type="secondary">
                                เงินเริ่มต้น: ฿{Number(currentShift.start_amount).toLocaleString()}
                            </Text>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
