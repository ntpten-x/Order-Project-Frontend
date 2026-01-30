import { CSSProperties } from 'react';
import { orderColors } from './orders/style';

export const paymentColors = {
    ...orderColors, // Inherit base colors

    // Payment specific overrides or additions if needed
    cash: '#10b981',
    qr: '#1d4ed8',
    creditCard: '#f59e0b',

    totalCardBg: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    summaryBg: '#fafafa',
};

export const paymentPageStyles = {
    // Layout
    container: {
        minHeight: '100vh',
        background: paymentColors.background,
        fontFamily: "'Inter', 'Sarabun', sans-serif",
    } as CSSProperties,

    heroSection: {
        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
        padding: '32px 24px 70px',
        position: 'relative' as const,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        boxShadow: '0 8px 24px rgba(24, 144, 255, 0.25)',
        marginBottom: -40,
        zIndex: 1,
        overflow: 'hidden',
    } as CSSProperties,

    contentWrapper: {
        maxWidth: 1200,
        margin: '0 auto',
        position: 'relative' as const,
        zIndex: 10,
    } as CSSProperties,

    // Typography
    pageTitle: {
        margin: 0,
        color: '#fff',
        fontSize: 'clamp(20px, 5vw, 28px)',
        fontWeight: 700,
    } as CSSProperties,

    pageSubtitle: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 14,
    } as CSSProperties,

    // Cards
    card: {
        borderRadius: 12,
        overflow: 'hidden',
        border: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    } as CSSProperties,

    // Payment Methods
    methodCard: {
        border: `2px solid #f0f0f0`,
        borderRadius: 12,
        padding: 16,
        textAlign: 'center' as const,
        cursor: 'pointer',
        background: '#fff',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    } as CSSProperties,

    methodCardSelected: {
        borderColor: paymentColors.primary,
        background: '#eff6ff',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
    } as CSSProperties,

    // QR & Input Areas
    inputArea: {
        background: '#f8fafc',
        padding: 20,
        borderRadius: 12,
        border: `1px solid ${paymentColors.border}`,
    } as CSSProperties,

    qrArea: {
        textAlign: 'center' as const,
        background: '#fff',
        padding: 24,
        borderRadius: 16,
        border: `1px dashed ${paymentColors.primary}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    } as CSSProperties,

    // Summary Box
    summaryBox: {
        marginTop: 'auto',
        background: paymentColors.backgroundSecondary,
        padding: 16,
        borderRadius: 12,
    } as CSSProperties,
};
