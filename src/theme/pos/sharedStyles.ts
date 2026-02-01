import { CSSProperties } from 'react';

/**
 * POS Shared Styles
 * Modern Minimal Design - Reusable style factories and base styles
 */

// =============================================================================
// Design Tokens
// =============================================================================
export const tokens = {
    colors: {
        primary: '#6366F1',
        primaryLight: '#EEF2FF',
        success: '#10B981',
        successLight: '#ECFDF5',
        warning: '#F59E0B',
        warningLight: '#FFFBEB',
        error: '#EF4444',
        errorLight: '#FEF2F2',
        info: '#3B82F6',
        infoLight: '#EFF6FF',

        bg: '#F8FAFC',
        card: '#FFFFFF',
        border: '#E2E8F0',
        borderLight: '#F1F5F9',

        text: '#1E293B',
        textSecondary: '#64748B',
        textMuted: '#94A3B8',
    },
    radius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
    },
    shadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
        md: '0 4px 12px rgba(0, 0, 0, 0.06)',
        lg: '0 8px 24px rgba(0, 0, 0, 0.08)',
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
    },
};

// =============================================================================
// Base Page Styles
// =============================================================================
const sharedBaseStyles = {
    container: {
        paddingBottom: 100,
        backgroundColor: tokens.colors.bg,
        minHeight: '100dvh', // Dynamic viewport height for mobile
        width: '100%',
        overflowX: 'hidden',
    } as CSSProperties,

    // Compact header - less dramatic gradient
    header: {
        background: `linear-gradient(135deg, ${tokens.colors.primary} 0%, #4F46E5 100%)`,
        padding: '16px 16px 48px 16px',
        position: 'relative' as const,
        overflow: 'hidden' as const,
        borderBottomLeftRadius: tokens.radius.xl,
        borderBottomRightRadius: tokens.radius.xl,
    } as CSSProperties,

    headerDecoCircle1: {
        position: 'absolute' as const,
        top: -40,
        right: -40,
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
    } as CSSProperties,

    headerDecoCircle2: {
        position: 'absolute' as const,
        bottom: -20,
        left: -20,
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
    } as CSSProperties,

    headerContent: {
        position: 'relative' as const,
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    } as CSSProperties,

    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    } as CSSProperties,

    headerIconBox: {
        width: 44,
        height: 44,
        borderRadius: tokens.radius.md,
        background: 'rgba(255,255,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        flexShrink: 0,
    } as CSSProperties,

    headerTitle: {
        color: '#fff',
        margin: 0,
        fontSize: 18,
        fontWeight: 600,
    } as CSSProperties,

    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        margin: 0,
    } as CSSProperties,

    headerActions: {
        display: 'flex',
        gap: 8,
        flexShrink: 0,
    } as CSSProperties,

    // Stats Card - Floating below header
    statsCard: {
        margin: '-32px 16px 0 16px',
        padding: 16,
        background: tokens.colors.card,
        borderRadius: tokens.radius.lg,
        boxShadow: tokens.shadow.md,
        display: 'flex',
        justifyContent: 'space-around',
        position: 'relative' as const,
        zIndex: 10,
    } as CSSProperties,

    statItem: {
        textAlign: 'center' as const,
        flex: 1,
    } as CSSProperties,

    statNumber: {
        fontSize: 22,
        fontWeight: 700,
        display: 'block',
        color: tokens.colors.text,
    } as CSSProperties,

    statLabel: {
        fontSize: 12,
        color: tokens.colors.textMuted,
        marginTop: 2,
    } as CSSProperties,

    // Content Area
    listContainer: {
        padding: '16px 16px 0 16px',
    } as CSSProperties,

    sectionTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        fontSize: 15,
        fontWeight: 600,
        color: tokens.colors.text,
    } as CSSProperties,
};

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create page styles with custom header gradient
 */
export const createSharedPageStyles = (headerGradient: string) => ({
    ...sharedBaseStyles,
    header: { ...sharedBaseStyles.header, background: headerGradient },
});

/**
 * Create card style - active/inactive states
 */
export const createCardStyle = (isActive: boolean): CSSProperties => ({
    marginBottom: 12,
    borderRadius: tokens.radius.lg,
    border: `1px solid ${isActive ? tokens.colors.border : tokens.colors.borderLight}`,
    boxShadow: isActive ? tokens.shadow.sm : 'none',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
    background: tokens.colors.card,
    opacity: isActive ? 1 : 0.6,
});

/**
 * Card inner content style
 */
export const cardInnerStyle: CSSProperties = {
    padding: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
};

/**
 * Action button style - consistent across pages
 */
export const actionButtonStyle: CSSProperties = {
    borderRadius: tokens.radius.md,
    fontWeight: 500,
    height: 40,
};

/**
 * Generate page-specific global CSS
 */
export const sharedGlobalStyles = (pageSelector: string, cardSelector: string) => `
  /* Card animations */
  ${cardSelector} {
    animation: fadeSlideIn 0.3s ease both;
  }
  
  ${cardSelector}:hover {
    transform: translateY(-2px);
    box-shadow: ${tokens.shadow.md} !important;
  }
  
  ${cardSelector}:active {
    transform: scale(0.99);
  }
  
  /* Scrollbar */
  ${pageSelector} *::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }
  ${pageSelector} *::-webkit-scrollbar-track {
    background: transparent;
  }
  ${pageSelector} *::-webkit-scrollbar-thumb {
    background: #CBD5E1;
    border-radius: 3px;
  }
  ${pageSelector} *::-webkit-scrollbar-thumb:hover {
    background: #94A3B8;
  }
`;

// Export base styles for direct use
export const sharedStyles = sharedBaseStyles;
export default sharedBaseStyles;
