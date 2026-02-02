import { Spin } from "antd";

export default function Loading() {
    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto"
            style={{
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
            }}
        >
            <div style={{
                padding: 32,
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 24,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                border: '1px solid rgba(255, 255, 255, 0.6)',
            }}>
                <Spin size="large" />
                <span style={{ 
                    color: '#64748b', 
                    fontWeight: 500, 
                    fontSize: 14,
                    letterSpacing: '0.02em',
                }}>
                    กำลังโหลด...
                </span>
            </div>
        </div>
    );
}