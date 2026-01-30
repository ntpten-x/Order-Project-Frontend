import { CSSProperties } from 'react';
// import { posColors, channelColors } from '../index';

export const channelsStyles = {
    channelsContainer: {
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f0f2f5 0%, #ffffff 100%)',
        fontFamily: "'Inter', 'Sarabun', sans-serif",
    } as CSSProperties,

    channelsHeader: {
        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
        padding: '48px 24px',
        textAlign: 'center' as const,
        position: 'relative' as const,
        overflow: 'hidden',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        boxShadow: '0 8px 32px rgba(24, 144, 255, 0.2)',
    } as CSSProperties,

    channelsHeaderContent: {
        maxWidth: 800,
        margin: '0 auto',
        position: 'relative' as const,
        zIndex: 10,
    } as CSSProperties,

    channelsHeaderIcon: {
        fontSize: 56,
        color: '#fff',
        marginBottom: 16,
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
    } as CSSProperties,

    channelsHeaderTitle: {
        color: '#fff',
        fontSize: 36,
        fontWeight: 700,
        margin: 0,
        marginBottom: 8,
        textShadow: '0 2px 8px rgba(0,0,0,0.1)',
    } as CSSProperties,

    channelsHeaderSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 18,
        fontWeight: 400,
    } as CSSProperties,

    channelsCardsContainer: {
        maxWidth: 1200,
        margin: '-40px auto 0',
        padding: '0 24px 80px',
        position: 'relative' as const,
        zIndex: 20,
    } as CSSProperties,

    channelCard: {
        height: '100%',
        borderRadius: 24,
        border: 'none',
        background: '#fff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        cursor: 'pointer',
    } as CSSProperties,

    channelCardInner: {
        padding: '48px 32px',
        textAlign: 'center' as const,
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative' as const,
    } as CSSProperties,

    channelIconWrapper: {
        width: 140,
        height: 140,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 32px',
        position: 'relative' as const,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    } as CSSProperties,

    channelIcon: {
        fontSize: 64,
        position: 'relative' as const,
        zIndex: 2,
    } as CSSProperties,

    channelCardTitle: {
        fontSize: 28,
        fontWeight: 700,
        marginBottom: 8,
        color: '#262626',
    } as CSSProperties,

    channelCardSubtitle: {
        fontSize: 16,
        color: '#8c8c8c',
        fontWeight: 400,
    } as CSSProperties,

    channelStatsBadge: {
        marginTop: 20,
        padding: '8px 16px',
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        transition: 'all 0.3s ease',
    } as CSSProperties,

    channelActiveIndicator: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        display: 'inline-block',
    } as CSSProperties,

    channelLoadingSkeleton: {
        width: 100,
        height: 32,
        borderRadius: 12,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        marginTop: 20,
    } as CSSProperties,

    channelDecorativeGlow: {
        position: 'absolute' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        opacity: 0.2,
        filter: 'blur(20px)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    } as CSSProperties,
};

// Styles for specific channel pages (Dine-In, Delivery, Takeaway)
export const channelPageStyles = {
    channelHeader: {
        padding: '24px 16px',
        position: 'relative' as CSSProperties['position'],
        overflow: 'hidden',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        marginBottom: 24,
    } as CSSProperties,

    channelHeaderContent: {
        maxWidth: 1400,
        margin: '0 auto',
        position: 'relative' as CSSProperties['position'],
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap' as CSSProperties['flexWrap'],
    } as CSSProperties,

    channelBackButton: {
        color: '#fff',
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(255,255,255,0.15)',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: 10,
        padding: '6px 12px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    } as CSSProperties,

    channelTitleSection: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    } as CSSProperties,

    channelHeaderIcon: {
        fontSize: 28,
        color: '#fff',
    } as CSSProperties,

    channelHeaderTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 700,
        margin: 0,
        lineHeight: 1.2,
    } as CSSProperties,

    channelHeaderSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        fontWeight: 400,
    } as CSSProperties,

    channelStatsBar: {
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        background: 'rgba(255,255,255,0.15)',
        padding: '8px 14px',
        borderRadius: 10,
        backdropFilter: 'blur(10px)',
        flexShrink: 0,
    } as CSSProperties,

    statItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
    } as CSSProperties,

    statDot: {
        width: 8,
        height: 8,
        borderRadius: '50%',
    } as CSSProperties,

    statText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 500,
        whiteSpace: 'nowrap' as CSSProperties['whiteSpace'],
    } as CSSProperties,

    channelPageCard: {
        borderRadius: 16,
        border: 'none',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative' as CSSProperties['position'],
    } as CSSProperties,

    channelPageCardInner: {
        padding: '24px 16px',
        textAlign: 'center' as CSSProperties['textAlign'],
        position: 'relative' as CSSProperties['position'],
        zIndex: 2,
    } as CSSProperties,

    channelPageCardIcon: {
        fontSize: 42,
        marginBottom: 10,
        display: 'block',
    } as CSSProperties,

    channelPageCardMainText: {
        fontSize: 36,
        fontWeight: 800,
        marginBottom: 0,
        color: '#1f1f1f',
        lineHeight: 1,
        letterSpacing: '-1px',
        display: 'block',
    } as CSSProperties,

    channelPageCardStatusBadge: {
        padding: '4px 12px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        display: 'inline-block',
        marginTop: 10,
    } as CSSProperties,

    channelPageCardGradientOverlay: {
        position: 'absolute' as CSSProperties['position'],
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.05,
        pointerEvents: 'none' as CSSProperties['pointerEvents'],
    } as CSSProperties,
};
