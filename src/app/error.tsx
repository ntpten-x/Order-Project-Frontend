'use client';

import { useEffect } from 'react';
import { Button, Result } from 'antd';
import { useRouter } from 'next/navigation';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        // Log the error to an analytics reporting service if needed
        console.error('Unhandled application error:', error);
    }, [error]);

    return (
        <div 
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: '#f8fafc',
            fontFamily: 'var(--font-family, sans-serif)',
          }}
        >
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: 32,
            padding: '48px 32px',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.05)',
            maxWidth: 560,
            width: '100%',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.6)',
          }}>
            <h1 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 700, color: '#1e293b' }}>
              เกิดข้อผิดพลาดบางอย่าง
            </h1>
            
            <p style={{ fontSize: 16, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>
              ขออภัย เราไม่สามารถดำเนินการตามคำขอของคุณได้ในขณะนี้
            </p>

            <div style={{ 
                background: '#f1f5f9', 
                padding: 16, 
                borderRadius: 12, 
                marginBottom: 32,
                fontFamily: 'monospace',
                fontSize: 13,
                color: '#64748b',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }}>
                {error.message || "Unknown error"}
            </div>
            
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <Button 
                type="primary" 
                onClick={reset}
                size="large"
                style={{ 
                  borderRadius: 16, 
                  fontWeight: 600, 
                  height: 48,
                  padding: '0 24px',
                  background: '#10b981',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  border: 'none',
                }}
              >
                ลองใหม่อีกครั้ง
              </Button>
              <Button 
                onClick={() => router.push('/')}
                size="large"
                style={{ 
                  borderRadius: 16, 
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
