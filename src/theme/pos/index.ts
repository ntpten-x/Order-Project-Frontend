import { CSSProperties } from 'react';

// ============================================================================
// COLORS
// ============================================================================
export const posColors = {
    primary: '#1890ff',       // Blue for headers
    secondary: '#13c2c2',     // Teal for accents
    success: '#52c41a',       // Green for cart/actions
    warning: '#faad14',       // Orange/Yellow for warnings
    error: '#ff4d4f',         // Red for errors
    background: '#f5f5f5',    // Light gray background
    cardBg: '#ffffff',        // White cards
    text: '#262626',          // Dark text
    textSecondary: '#8c8c8c', // Gray secondary text
    border: '#f0f0f0',

    // Module Specific
    id_dineIn: '#1890ff',
    id_takeaway: '#52c41a', // prefix id_ to avoid collision if needed, or just use naming convention
    id_delivery: '#722ed1',
    kitchen: '#ff6b35',
    shift: '#10b981', // Greenish for money/shift
};

export const channelColors = {
    dineIn: {
        primary: '#1890ff',
        light: '#e6f7ff',
        border: '#91d5ff',
        gradient: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    },
    takeaway: {
        primary: '#52c41a',
        light: '#f6ffed',
        border: '#b7eb8f',
        gradient: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
    },
    delivery: {
        primary: '#722ed1',
        light: '#f9f0ff',
        border: '#d3adf7',
        gradient: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
    },
};

// ============================================================================
// SHARED STYLES
// ============================================================================
export const posPageStyles = {
    container: {
        minHeight: '100vh',
        background: posColors.background,
        fontFamily: "'Inter', 'Sarabun', sans-serif",
    } as CSSProperties,

    // Standard Hero Header used in pages
    heroParams: {
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

    // Kitchen has a distinct dark look
    kitchenContainer: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: 24,
    } as CSSProperties,

    kitchenHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap' as const,
        gap: 16,
    } as CSSProperties,

    // Shift Page specific
    shiftHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    } as CSSProperties,

    // Common Section Title
    sectionTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        color: '#fff',
    } as CSSProperties,

    // Standard content wrapper
    contentWrapper: {
        maxWidth: 1400,
        margin: '-40px auto 30px',
        padding: '0 24px',
        position: 'relative' as const,
        zIndex: 20,
    } as CSSProperties,

    // Card Styles
    card: {
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: 'none',
        overflow: 'hidden',
        background: posColors.cardBg,
    } as CSSProperties,

    itemCard: {
        marginBottom: 8,
        borderRadius: 8,
        transition: 'all 0.3s ease',
    } as CSSProperties,

    // ==========================================================================
    // CHANNEL SELECTION SPECIFIC STYLES
    // ==========================================================================

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

    // NEW: Shared Channel Page Styles (from Dine-In)
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

// ============================================================================
// SHARED COLOR SCHEMES FOR CARDS (Tables/Orders)
// ============================================================================
export const tableColors = {
    available: {
        primary: '#52c41a',
        light: '#f6ffed',
        border: '#b7eb8f',
        gradient: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
    },
    occupied: {
        primary: '#fa8c16',
        light: '#fff7e6',
        border: '#ffd591',
        gradient: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
    },
    inactive: {
        primary: '#8c8c8c',
        light: '#fafafa',
        border: '#d9d9d9',
        gradient: 'linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%)',
    },
    waitingForPayment: {
        primary: '#1890ff',
        light: '#e6f7ff',
        border: '#91d5ff',
        gradient: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
    },
};
