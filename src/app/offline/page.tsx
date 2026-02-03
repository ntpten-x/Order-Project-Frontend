"use client";

import React from 'react';
import { Button } from 'antd';
import { WifiOutlined, ReloadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
    const router = useRouter();

    const handleRetry = () => {
        if (navigator.onLine) {
            router.refresh();
        } else {
            window.location.reload();
        }
    };

    return (
        <div 
            style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '100vh',
                padding: '24px',
                background: '#f8fafc',
            }}
        >
            <div 
                style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(20px)',
                    padding: '48px 32px',
                    borderRadius: 32,
                    boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.05)',
                    maxWidth: 480,
                    width: '100%',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    textAlign: 'center',
                }}
            >
                <div style={{
                    width: 80,
                    height: 80,
                    background: '#fff7ed',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    color: '#f59e0b',
                    fontSize: 36,
                    boxShadow: '0 8px 16px rgba(245, 158, 11, 0.15)',
                }}>
                    <WifiOutlined />
                </div>

                <h1 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 700, color: '#1e293b' }}>
                    ขาดการเชื่อมต่อ
                </h1>
                
                <p style={{ fontSize: 16, color: '#64748b', marginBottom: 32, lineHeight: 1.6 }}>
                    ดูเหมือนว่าคุณจะไม่ได้เชื่อมต่ออินเทอร์เน็ต<br/>กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง
                </p>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <Button 
                        type="primary" 
                        icon={<ReloadOutlined />}
                        onClick={handleRetry}
                        size="large"
                        style={{
                            borderRadius: 14,
                            height: 48,
                            padding: '0 24px',
                            fontSize: 16,
                            background: '#f59e0b',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                        }}
                    >
                        ลองอีกครั้ง
                    </Button>
                    <Button 
                        onClick={() => router.push('/')}
                        size="large"
                        style={{
                            borderRadius: 14,
                            height: 48,
                            padding: '0 24px',
                            color: '#64748b',
                            borderColor: '#cbd5e1',
                        }}
                    >
                        กลับหน้าหลัก
                    </Button>
                </div>
            </div>
        </div>
    );
}
