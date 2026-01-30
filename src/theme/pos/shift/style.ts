
import { CSSProperties } from 'react';

// ============ STYLES ============

export const pageStyles = {
    container: {
        paddingBottom: 100,
        backgroundColor: '#f8f9fc',
        minHeight: '100vh',
        fontFamily: "'Inter', 'Sarabun', sans-serif",
    } as CSSProperties,

    header: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Green for money/shift
        padding: '24px 24px 60px 24px',
        position: 'relative' as const,
        overflow: 'hidden' as const,
        marginBottom: -40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)'
    } as CSSProperties,

    headerDecoCircle1: {
        position: 'absolute' as const,
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)'
    } as CSSProperties,

    headerDecoCircle2: {
        position: 'absolute' as const,
        bottom: -30,
        left: -30,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)'
    } as CSSProperties,

    headerContent: {
        position: 'relative' as const,
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: 1200,
        margin: '0 auto'
    } as CSSProperties,

    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 16
    } as CSSProperties,

    headerIconBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    } as CSSProperties,

    headerTitleBox: {
        display: 'flex',
        flexDirection: 'column' as const
    } as CSSProperties,

    headerTitle: {
        color: 'white',
        fontSize: 24,
        margin: 0,
        fontWeight: 700,
        letterSpacing: '0.5px',
        lineHeight: 1.2
    } as CSSProperties,

    headerSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        display: 'block'
    } as CSSProperties,

    contentContainer: {
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px',
        position: 'relative' as const,
        zIndex: 10
    } as CSSProperties,

    card: {
        borderRadius: 24,
        border: 'none',
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        background: 'white',
        overflow: 'hidden',
        height: '100%'
    } as CSSProperties,

    activeShiftCard: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        textAlign: 'center' as const,
        padding: '40px 24px',
        position: 'relative' as const,
        overflow: 'hidden' as const
    } as CSSProperties,

    summaryCard: {
        background: 'white',
        padding: '24px'
    } as CSSProperties,

    statisticValue: (color: string) => ({
        color: color,
        fontWeight: 600
    }) as CSSProperties,

    noShiftCard: {
        textAlign: 'center' as const,
        padding: '60px 20px',
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: 24,
        border: '1px dashed #d9d9d9'
    } as CSSProperties,

    sectionDivider: {
        margin: '24px 0'
    } as CSSProperties,

    trendUp: {
        color: '#52c41a'
    } as CSSProperties,

    trendDown: {
        color: '#ff4d4f'
    } as CSSProperties
};

export const globalStyles = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    .pulse-animation {
        animation: pulse 2s infinite ease-in-out;
    }
    
    .shift-modal .ant-modal-content {
        border-radius: 20px;
        overflow: hidden;
    }
    
    .shift-modal .ant-modal-header {
        background: transparent;
    }
    
    .stat-card-inner {
        transition: all 0.3s ease;
        padding: 16px;
        border-radius: 16px;
        background: #f8fafc;
    }
    
    .stat-card-inner:hover {
        background: #f1f5f9;
        transform: translateY(-2px);
    }
`;
