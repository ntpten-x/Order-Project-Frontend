"use client";

import React from 'react';
import { Result, Button } from 'antd';
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
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh',
            padding: '20px'
        }}>
            <Result
                icon={<WifiOutlined style={{ color: '#faad14' }} />}
                title="คุณอยู่ในโหมดออฟไลน์"
                subTitle="กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณและลองอีกครั้ง"
                extra={[
                    <Button 
                        type="primary" 
                        key="retry" 
                        icon={<ReloadOutlined />}
                        onClick={handleRetry}
                    >
                        ลองอีกครั้ง
                    </Button>,
                    <Button 
                        key="back" 
                        onClick={() => router.push('/')}
                    >
                        กลับหน้าหลัก
                    </Button>
                ]}
            />
        </div>
    );
}
