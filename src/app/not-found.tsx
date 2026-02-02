"use client";

import React from 'react';
import { Result, Button, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { HomeOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function NotFound() {
  const router = useRouter();

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{
        background: '#f8fafc',
        padding: 24,
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
        <Result
          status="404"
          title={
            <span style={{ fontSize: 72, fontWeight: 800, color: '#e2e8f0', lineHeight: 1, display: 'block', marginBottom: 16 }}>
              404
            </span>
          }
          subTitle={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Text style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
                ไม่พบหน้าที่คุณต้องการ
              </Text>
              <Text style={{ fontSize: 15, color: '#64748b' }}>
                หน้าเว็บที่คุณพยายามเข้าถึงอาจถูกย้าย<br/>หรือไม่มีอยู่ในระบบ
              </Text>
            </div>
          }
          extra={
            <Button 
              type="primary" 
              icon={<HomeOutlined />}
              onClick={() => router.push('/')}
              size="large"
              style={{
                borderRadius: 14,
                height: 48,
                padding: '0 24px',
                fontSize: 16,
                background: '#10b981',
                border: 'none',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                marginTop: 16,
              }}
            >
              กลับสู่หน้าหลัก
            </Button>
          }
        />
      </div>
    </div>
  );
}
