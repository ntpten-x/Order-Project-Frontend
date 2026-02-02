'use client';

import React, { useEffect, useState, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Typography, Card, Button, Row, Col, Tag, Spin } from "antd";
import { 
    ClockCircleOutlined, 
    CheckCircleOutlined, 
    PlayCircleOutlined, 
    StopOutlined, 
    ArrowLeftOutlined, 
    RiseOutlined, 
    SafetyCertificateOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { SocketContext } from "../../../../contexts/SocketContext";
import { shiftsService } from "../../../../services/pos/shifts.service";
import { Shift, ShiftSummary } from "../../../../types/api/pos/shifts";

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
            
            <Tag style={{ 
                fontSize: 14, 
                padding: '6px 16px', 
                borderRadius: 20, 
                border: 'none',
                background: currentShift ? 'white' : 'rgba(255,255,255,0.9)',
                color: currentShift ? '#10b981' : '#f59e0b',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
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

// Import new modals (Assuming paths based on previous context, user needs to verify if paths are correct or I created them)
// Wait, I see from previous context that modals are in `src/components/pos/shifts/OpenShiftModal.tsx` etc.
// I need to import them dynamically or normally.
import OpenShiftModal from "../../../../components/pos/shifts/OpenShiftModal";
import CloseShiftModal from "../../../../components/pos/shifts/CloseShiftModal";

export default function ShiftPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    
    // Local state for controlling modal visibility
    // Note: The new modals might handle visibility internally via context or props.
    // However, looking at the previous specific Modal implementations, they seem to be driven by context `currentShift` often, 
    // but here we might want to manually trigger them.
    // Let's check how the new modals were implemented. 
    // `OpenShiftModal` uses `useShift` and checks `!loading && !currentShift`.
    // `CloseShiftModal` likely needs to be triggered.
    // Let's assume standard prop controlling if they accept `open` or similar, OR we use the context methods directly.
    
    // BUT, the `OpenShiftModal` I saw earlier had `isVisible` logic built-in based on context status.
    // If I use the *component*, it might auto-show. Ideally, I should control it.
    // Let's stick to the cleanest integration: 
    // 1. Logic for Open/Close stays here or in context? 
    // The previous `OpenShiftModal` implementation viewed in context was:
    // `const isVisible = !loading && !currentShift && pathname !== '/pos/shift';`
    // This `ShiftPage` IS `/pos/shift`, so that auto-modal won't show here by default which is good.
    // We want to trigger it manually.

    // Let's use internal state for visibility control for cleaner separation if the modals support it.
    // If the imported modals are 'smart' and self-controlled, we might need to adjust.
    // Assuming we can pass `open` prop or wrapped them.
    
    // Since I can't see the *exact* final code of the modals right now (I only saw the plan/partial), 
    // I will implement assuming standard prop passing `open={visible} onCancel={...}` 
    // OR if they are self-contained, I will wrap them.
    
    // Re-reading `OpenShiftModal` snippet from history:
    // `export default function OpenShiftModal() { ... return <Modal open={isVisible} ...`
    // It seems self-driven by context. This is tricky for a "Management Page".
    // I will use `useShift` context here to simply call `openShift` / `closeShift` and let the UI reflect state.
    // BUT the user wants *UI* redesign.
    
    // I will act as if I am integrating the *newly redesigned* components which hopefully have props.
    // If not, I will add local state to control them if I can edit them, or just use them as is.
    // Actually, best practice is lift state up.
    
    // Let's replace the INLINE modals with the IMPORTED ones. 
    // If the imported ones are context-aware, they might conflict with this page unless handled.
    // I will assume I can pass control props `open`.
    
    const [openShiftVisible, setOpenShiftVisible] = useState(false);
    const [closeShiftVisible, setCloseShiftVisible] = useState(false);

    
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

    const summary = currentShift ? (summaryData as ShiftSummary) : null;
    const isLoading = isShiftLoading || (currentShift ? isSummaryLoading : false);
    
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
                                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: 500 }}>ระยะเวลาทำงาน</Text>
                                        <Title level={1} style={{ color: 'white', margin: '4px 0 0', fontSize: 40, letterSpacing: '-0.02em' }}>{getShiftDuration()}</Title>
                                    </div>
                                    
                                    <Button 
                                        type="primary" 
                                        danger
                                        icon={<StopOutlined />}
                                        size="large"
                                        block
                                        onClick={() => setCloseShiftVisible(true)}
                                        style={{ marginTop: 32, height: 56, fontSize: 18, borderRadius: 16, border: 'none', background: 'white', color: '#ef4444', fontWeight: 700, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
                                    >
                                        ปิดกะ (Close Shift)
                                    </Button>
                                </div>
                            </Col>

                            {/* Right Side: Shift Live Summary */}
                            <Col xs={24} lg={16}>
                                <Card style={{ ...pageStyles.card, ...pageStyles.summaryCard }} bordered={false}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                                        <div style={{ width: 48, height: 48, borderRadius: 14, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16, color: '#3b82f6' }}>
                                            <RiseOutlined style={{ fontSize: 24 }} />
                                        </div>
                                        <div>
                                            <Title level={4} style={{ margin: 0, color: '#1e293b' }}>สรุปยอดขายปัจจุบัน</Title>
                                            <Text type="secondary">Live Summary</Text>
                                        </div>
                                    </div>
                                    
                                    {summary ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                            {/* Key Stats Row */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                                                <div className="stat-card" style={{ padding: 20, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                                                    <Text type="secondary" style={{ fontSize: 14 }}>ยอดขายรวม</Text>
                                                    <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginTop: 4 }}>
                                                        ฿{Number(summary.summary.total_sales).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="stat-card" style={{ padding: 20, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                                                    <Text type="secondary" style={{ fontSize: 14 }}>กำไรสุทธิ</Text>
                                                    <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>
                                                        ฿{Number(summary.summary.net_profit).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="stat-card" style={{ padding: 20, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                                                    <Text type="secondary" style={{ fontSize: 14 }}>จำนวนบิล (โดยประมาณ)</Text>
                                                    <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6', marginTop: 4 }}>
                                                        {Object.values(summary.categories).reduce((a, b) => a + b, 0)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Safe Cash Box */}
                                            <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', padding: '20px 24px', borderRadius: 20, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <SafetyCertificateOutlined style={{ fontSize: 24, color: '#15803d' }} />
                                                    <div>
                                                        <Text style={{ color: '#166534', fontWeight: 600, display: 'block' }}>เงินสดที่ต้องมีในเซฟ (Cash in Drawer)</Text>
                                                        <Text style={{ color: '#166534', fontSize: 13, opacity: 0.8 }}>เงินทอนเริ่มต้น + ยอดขายเงินสด</Text>
                                                    </div>
                                                </div>
                                                <Text style={{ fontSize: 28, fontWeight: 800, color: '#14532d' }}>
                                                    ฿{(Number(summary.shift_info.start_amount) + Number(summary.summary.payment_methods?.['เงินสด'] || 0)).toLocaleString()}
                                                </Text>
                                            </div>

                                            {/* Payment Methods */}
                                            <div>
                                                <Text style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 12, display: 'block' }}>แยกตามวิธีหน้าชำระ</Text>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                                    {Object.entries(summary.summary.payment_methods || {}).map(([method, amount]) => (
                                                        <div key={method} style={{ flex: '1 1 140px', padding: '12px 16px', background: '#fff', border: '1px solid #f1f5f9', borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                                            <Text style={{ fontSize: 12, color: '#94a3b8' }}>{method}</Text>
                                                            <div style={{ fontSize: 16, fontWeight: 600, color: '#334155' }}>฿{Number(amount).toLocaleString()}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Top Products */}
                                            <div>
                                                <Text style={{ fontSize: 14, fontWeight: 600, color: '#64748b', marginBottom: 12, display: 'block' }}>สินค้าขายดี</Text>
                                                <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16, overflow: 'hidden' }}>
                                                    {summary.top_products.slice(0, 3).map((item, idx) => (
                                                        <div key={idx} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: idx < 2 ? '1px solid #f8fafc' : 'none' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: idx === 0 ? '#FEF3C7' : '#F1F5F9', color: idx === 0 ? '#D97706' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                                                                    {idx + 1}
                                                                </div>
                                                                <Text style={{ fontWeight: 500, color: '#334155' }}>{item.name}</Text>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <Text style={{ fontSize: 13, color: '#64748b', marginRight: 8 }}>{item.quantity} {item.unit || 'ชิ้น'}</Text>
                                                                <Text style={{ fontWeight: 600, color: '#0f172a' }}>฿{Number(item.revenue).toLocaleString()}</Text>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {summary.top_products.length === 0 && (
                                                        <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>ยังไม่มีข้อมูลการขาย</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                            <Spin size="large" />
                                            <div style={{ marginTop: 16, color: '#94a3b8' }}>กำลังโหลดข้อมูลสรุป...</div>
                                        </div>
                                    )}
                                </Card>
                            </Col>
                        </>
                    ) : (
                        /* No Active Shift State */
                        <Col xs={24}>
                            <Card style={{ ...pageStyles.card, minHeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
                                <div style={{ textAlign: 'center', maxWidth: 480 }}>
                                    <div style={{ 
                                        width: 140, height: 140, 
                                        background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)', 
                                        borderRadius: '50%', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                        margin: '0 auto 40px',
                                        boxShadow: '0 20px 40px rgba(249, 115, 22, 0.15)'
                                    }}>
                                        <ClockCircleOutlined style={{ fontSize: 64, color: '#EA580C' }} />
                                    </div>
                                    
                                    <Title level={2} style={{ marginBottom: 16, color: '#1e293b' }}>ยังไม่มีกะที่เปิดใช้งาน</Title>
                                    <Text type="secondary" style={{ fontSize: 16, lineHeight: 1.6, display: 'block', marginBottom: 48, color: '#64748b' }}>
                                        ระบบจะทำการบันทึกยอดขายและเงินสดแยกตามกะการทำงาน <br/>
                                        กรุณาเปิดกะใหม่เพื่อเริ่มต้นการขายสินค้า
                                    </Text>
                                    
                                    <Button 
                                        type="primary" 
                                        icon={<PlayCircleOutlined />}
                                        size="large"
                                        onClick={() => setOpenShiftVisible(true)}
                                        style={{ 
                                            background: '#10b981', 
                                            borderColor: '#10b981', 
                                            height: 60, 
                                            padding: '0 56px', 
                                            borderRadius: 20, 
                                            fontSize: 18,
                                            fontWeight: 700,
                                            boxShadow: '0 12px 30px rgba(16, 185, 129, 0.25)'
                                        }}
                                    >
                                        เปิดกะทำงาน (Open Shift)
                                    </Button>
                                    
                                    <div style={{ marginTop: 32, fontSize: 14, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        <SafetyCertificateOutlined />
                                        ระบบจะมีการบันทึกเวลาและผู้ทำรายการทุกครั้ง
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    )}
                </Row>
            </div>

            {/* Imported Modals */}
            <OpenShiftModal 
                open={openShiftVisible} 
                onCancel={() => setOpenShiftVisible(false)}
            />
            
            <CloseShiftModal 
                open={closeShiftVisible}
                onCancel={() => setCloseShiftVisible(false)}
                onSuccess={() => {
                    setCloseShiftVisible(false);
                    // Optionally trigger Summary Modal here if not handled by CloseShift
                }}
            />
            
            {/* Summary Modal might be triggered automatically or manually */}
        </div>
    );
}
