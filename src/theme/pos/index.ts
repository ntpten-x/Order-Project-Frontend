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
    kitchenBg: '#0f172a',
    kitchenCard: 'rgba(30, 41, 59, 0.7)',
    kitchenBorder: 'rgba(255, 255, 255, 0.1)',
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
        background: '#0f172a',
        padding: '24px 24px 100px',
        color: '#f8fafc',
        fontFamily: "'Inter', 'Sarabun', sans-serif",
    } as CSSProperties,

    kitchenGlassCard: {
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
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
    // CHANNEL SELECTION SPECIFIC STYLES - MOVED TO src/theme/pos/channels/style.ts
    // ==========================================================================
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
