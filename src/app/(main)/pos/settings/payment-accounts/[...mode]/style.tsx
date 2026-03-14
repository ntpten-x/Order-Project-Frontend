import { CSSProperties } from 'react';
import { posColors } from '../../../../../../theme/pos';

// ============ PAYMENT ACCOUNTS STYLES ============

export const pageStyles = {
    container: {
        minHeight: '100dvh',
        background: posColors.background,
        fontFamily: "var(--font-sans), 'Sarabun', sans-serif",
        paddingBottom: 60,
    } as CSSProperties,

    heroHeader: {
        background: `linear-gradient(145deg, #eb2f96 0%, #c41d7f 100%)`,
        padding: '20px 20px 60px',
        position: 'relative' as const,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        boxShadow: '0 8px 24px rgba(235, 47, 150, 0.2)',
        overflow: 'hidden',
    } as CSSProperties,

    heroDecoCircle1: {
        position: 'absolute' as const,
        top: -60,
        right: -60,
        width: 160,
        height: 160,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
    } as CSSProperties,

    heroDecoCircle2: {
        position: 'absolute' as const,
        bottom: -40,
        left: -40,
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
    } as CSSProperties,

    headerContent: {
        maxWidth: 1200,
        margin: '0 auto',
        position: 'relative' as const,
        zIndex: 10,
    } as CSSProperties,

    headerRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap' as const,
        gap: 16,
    } as CSSProperties,

    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
    } as CSSProperties,

    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        background: 'rgba(255,255,255,0.2)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.3)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    } as CSSProperties,

    headerIconBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.2)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    } as CSSProperties,

    contentWrapper: {
        maxWidth: 1200,
        margin: '-40px auto 30px',
        padding: '0 20px',
        position: 'relative' as const,
        zIndex: 20,
    } as CSSProperties,

    card: {
        borderRadius: 20,
        border: 'none',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        transition: 'all 0.3s ease',
    } as CSSProperties,

    cardActive: {
        border: `2px solid ${posColors.primary}`,
        boxShadow: `0 8px 24px ${posColors.primary}15`,
    } as CSSProperties,

    accountIconBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        background: '#eb2f9610',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    } as CSSProperties,

    accountNumber: {
        background: '#f8fafc',
        borderRadius: 12,
        padding: '12px 16px',
        border: '1px solid #e2e8f0',
    } as CSSProperties,

    addButton: {
        borderRadius: 14,
        height: 52,
        padding: '0 28px',
        fontWeight: 600,
        background: 'rgba(255,255,255,0.95)',
        border: 'none',
        color: '#eb2f96',
        boxShadow: '0 4px 12px rgba(235, 47, 150, 0.15)',
    } as CSSProperties,
};
