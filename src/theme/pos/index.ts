import { CSSProperties } from 'react';

/**
 * POS Theme Index
 * Unified color system and shared styles for the POS module
 * Modern Minimal Design - Clean, accessible, mobile-first
 */

// =============================================================================
// CORE COLORS - Soft Modern Palette
// =============================================================================
export const posColors = {
    // Primary Colors
    primary: '#6366F1',         // Indigo-500 - main brand
    primaryLight: '#EEF2FF',    // Indigo-50 - backgrounds
    primaryDark: '#4F46E5',     // Indigo-600 - hover

    // Semantic Colors
    success: '#10B981',         // Emerald-500
    successLight: '#ECFDF5',    // Emerald-50
    warning: '#F59E0B',         // Amber-500
    warningLight: '#FFFBEB',    // Amber-50
    error: '#EF4444',           // Red-500
    errorLight: '#FEF2F2',      // Red-50
    info: '#3B82F6',            // Blue-500
    infoLight: '#EFF6FF',       // Blue-50

    // Neutral Colors
    background: '#F8FAFC',      // Slate-50
    cardBg: '#FFFFFF',
    border: '#E2E8F0',          // Slate-200
    borderLight: '#F1F5F9',     // Slate-100

    // Text Colors
    text: '#1E293B',            // Slate-800
    textSecondary: '#64748B',   // Slate-500
    textMuted: '#94A3B8',       // Slate-400
    textInverse: '#FFFFFF',

    // Module Specific
    dineIn: '#3B82F6',          // Blue-500
    takeaway: '#10B981',        // Emerald-500
    delivery: '#8B5CF6',        // Violet-500
    kitchen: '#F97316',         // Orange-500
    shift: '#10B981',           // Emerald-500

    // Kitchen Dark Theme
    kitchenBg: '#0F172A',       // Slate-900
    kitchenCard: 'rgba(30, 41, 59, 0.8)',
    kitchenBorder: 'rgba(255, 255, 255, 0.1)',
};

// =============================================================================
// CHANNEL COLORS - For sales channel cards
// =============================================================================
export const channelColors = {
    dineIn: {
        primary: '#3B82F6',
        light: '#EFF6FF',
        border: '#BFDBFE',
        gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
        iconBg: 'rgba(59, 130, 246, 0.1)',
    },
    takeaway: {
        primary: '#10B981',
        light: '#ECFDF5',
        border: '#A7F3D0',
        gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        iconBg: 'rgba(16, 185, 129, 0.1)',
    },
    delivery: {
        primary: '#8B5CF6',
        light: '#F5F3FF',
        border: '#DDD6FE',
        gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
        iconBg: 'rgba(139, 92, 246, 0.1)',
    },
};

// =============================================================================
// TABLE STATUS COLORS
// =============================================================================
export const tableColors = {
    available: {
        primary: '#10B981',
        light: '#ECFDF5',
        border: '#A7F3D0',
        gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        text: '#065F46',
    },
    occupied: {
        primary: '#F59E0B',
        light: '#FFFBEB',
        border: '#FCD34D',
        gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        text: '#92400E',
    },
    inactive: {
        primary: '#94A3B8',
        light: '#F8FAFC',
        border: '#CBD5E1',
        gradient: 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)',
        text: '#475569',
    },
    waitingForPayment: {
        primary: '#3B82F6',
        light: '#EFF6FF',
        border: '#BFDBFE',
        gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
        text: '#1E40AF',
    },
};

// =============================================================================
// ORDER STATUS COLORS
// =============================================================================
export const orderStatusColors = {
    pending: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
    cooking: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
    served: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
    waitingForPayment: { bg: '#E0E7FF', text: '#3730A3', border: '#A5B4FC' },
    completed: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
    cancelled: { bg: '#F3F4F6', text: '#4B5563', border: '#D1D5DB' },
};

// =============================================================================
// PAGE STYLES
// =============================================================================
export const posPageStyles = {
    // Base container
    container: {
        minHeight: '100vh',
        background: posColors.background,
        fontFamily:
            "var(--font-sans), 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        paddingBottom: 100,
    } as CSSProperties,

    // Standard page header
    header: {
        background: `linear-gradient(135deg, ${posColors.primary} 0%, ${posColors.primaryDark} 100%)`,
        padding: '16px 16px 48px',
        position: 'relative' as const,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        overflow: 'hidden',
    } as CSSProperties,

    // Hero-style header (larger)
    heroHeader: {
        background: `linear-gradient(135deg, ${posColors.primary} 0%, ${posColors.primaryDark} 100%)`,
        padding: '24px 20px 56px',
        position: 'relative' as const,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)',
        marginBottom: -40,
        zIndex: 1,
        overflow: 'hidden',
    } as CSSProperties,

    // Content wrapper (goes after header)
    contentWrapper: {
        maxWidth: 1200,
        margin: '-32px auto 0',
        padding: '0 16px',
        position: 'relative' as const,
        zIndex: 10,
    } as CSSProperties,

    // Standard card
    card: {
        borderRadius: 16,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        border: `1px solid ${posColors.border}`,
        overflow: 'hidden',
        background: posColors.cardBg,
    } as CSSProperties,

    // Item card (in lists)
    itemCard: {
        marginBottom: 8,
        borderRadius: 12,
        border: `1px solid ${posColors.borderLight}`,
        transition: 'all 0.2s ease',
        background: posColors.cardBg,
    } as CSSProperties,

    // Kitchen specific styles
    kitchenContainer: {
        minHeight: '100vh',
        background: posColors.kitchenBg,
        padding: '16px 16px 100px',
        color: '#F8FAFC',
        fontFamily:
            "var(--font-sans), 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    } as CSSProperties,

    kitchenGlassCard: {
        background: posColors.kitchenCard,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${posColors.kitchenBorder}`,
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
    } as CSSProperties,

    kitchenHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        flexWrap: 'wrap' as const,
        gap: 12,
    } as CSSProperties,

    // Section title
    sectionTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
        fontSize: 16,
        fontWeight: 600,
        color: posColors.text,
    } as CSSProperties,
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get channel color scheme
 */
export const getChannelColorScheme = (channel: 'dineIn' | 'takeaway' | 'delivery') => {
    return channelColors[channel] || channelColors.dineIn;
};

/**
 * Get table status color scheme
 */
export const getTableStatusColors = (status: 'available' | 'occupied' | 'inactive' | 'waitingForPayment') => {
    return tableColors[status] || tableColors.inactive;
};

/**
 * Create gradient header style
 */
export const createHeaderGradient = (startColor: string, endColor: string): CSSProperties => ({
    ...posPageStyles.header,
    background: `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`,
});
