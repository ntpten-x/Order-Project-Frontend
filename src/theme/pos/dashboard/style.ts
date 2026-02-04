import { CSSProperties } from 'react';
import { posColors } from '../index';

// Dashboard Colors - Soft Modern Clarity Theme
export const dashboardColors = {
    // Base colors (inheriting posColors)
    ...posColors,

    // Dashboard-specific
    headerGradient: 'linear-gradient(145deg, #4F46E5 0%, #6366F1 50%, #818CF8 100%)',
    headerShadow: '0 8px 24px rgba(79, 70, 229, 0.2)',

    // Card accents
    cardShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
    cardHoverShadow: '0 8px 28px rgba(0, 0, 0, 0.1)',

    // Stat colors
    salesColor: '#4F46E5',
    ordersColor: '#10B981',
    discountColor: '#EF4444',
    dineInColor: '#3B82F6',
    takeAwayColor: '#10B981',
    deliveryColor: '#EC4899',
};

// Dashboard Page Styles
export const dashboardStyles = {
    container: {
        minHeight: '100vh',
        background: dashboardColors.background,
        fontFamily: "var(--font-sans), 'Sarabun', sans-serif",
        paddingBottom: 60,
    } as CSSProperties,

    heroSection: {
        background: dashboardColors.headerGradient,
        padding: '24px 24px 70px',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        boxShadow: dashboardColors.headerShadow,
        position: 'relative' as const,
        overflow: 'hidden' as const,
    } as CSSProperties,

    heroDecoCircle1: {
        position: 'absolute' as const,
        top: -60,
        right: -60,
        width: 180,
        height: 180,
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

    heroContent: {
        maxWidth: 1200,
        margin: '0 auto',
        position: 'relative' as const,
        zIndex: 10,
    } as CSSProperties,

    heroHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
    } as CSSProperties,

    heroIconBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.2)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    } as CSSProperties,

    heroTitle: {
        margin: 0,
        color: '#fff',
        fontSize: 26,
        fontWeight: 700,
    } as CSSProperties,

    heroSubtitle: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 14,
        display: 'block',
    } as CSSProperties,

    // Content area
    contentWrapper: {
        maxWidth: 1200,
        margin: '-50px auto 0',
        padding: '0 24px',
        position: 'relative' as const,
        zIndex: 20,
    } as CSSProperties,

    // Stat Cards
    statCard: {
        borderRadius: 20,
        border: 'none',
        boxShadow: dashboardColors.cardShadow,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
    } as CSSProperties,

    statCardInner: {
        padding: 24,
    } as CSSProperties,

    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    } as CSSProperties,

    // Data Tables
    tableCard: {
        borderRadius: 20,
        border: 'none',
        boxShadow: dashboardColors.cardShadow,
        overflow: 'hidden',
    } as CSSProperties,

    tableHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        borderBottom: `1px solid ${dashboardColors.borderLight}`,
    } as CSSProperties,

    tableTitle: {
        fontSize: 18,
        fontWeight: 600,
        margin: 0,
        color: dashboardColors.text,
    } as CSSProperties,

    // Actions
    actionButton: {
        borderRadius: 12,
        height: 40,
        fontWeight: 500,
        transition: 'all 0.2s ease',
    } as CSSProperties,

    refreshButton: {
        background: 'rgba(255,255,255,0.2)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.3)',
        color: '#fff',
        borderRadius: 12,
    } as CSSProperties,

    exportButton: {
        background: 'rgba(255,255,255,0.95)',
        border: 'none',
        color: dashboardColors.primary,
        borderRadius: 12,
        fontWeight: 600,
    } as CSSProperties,

    // Filter row
    filterRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap' as const,
    } as CSSProperties,

    datePickerWrapper: {
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 12,
        overflow: 'hidden',
    } as CSSProperties,
};

// Dashboard Detail Page Styles
export const dashboardDetailStyles = {
    ...dashboardStyles,

    receiptCard: {
        borderRadius: 20,
        boxShadow: dashboardColors.cardShadow,
        overflow: 'hidden',
        maxWidth: 500,
        margin: '0 auto',
    } as CSSProperties,

    receiptHeader: {
        background: dashboardColors.borderLight,
        padding: 24,
        textAlign: 'center' as const,
        borderBottom: `1px solid ${dashboardColors.borderLight}`,
    } as CSSProperties,

    receiptBody: {
        padding: 24,
    } as CSSProperties,

    receiptRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: `1px solid ${dashboardColors.borderLight}`,
    } as CSSProperties,

    receiptTotal: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 0',
        marginTop: 8,
    } as CSSProperties,

    timelineCard: {
        borderRadius: 16,
        boxShadow: dashboardColors.cardShadow,
        padding: 20,
    } as CSSProperties,

    backButton: {
        height: 44,
        width: 44,
        borderRadius: 14,
        background: 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    } as CSSProperties,
};

// Responsive Global Styles
export const dashboardResponsiveStyles = `
    /* Base Animations */
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(16px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes scaleIn {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    .dashboard-card-animate {
        animation: fadeInUp 0.4s ease forwards;
        opacity: 0;
    }

    .dashboard-card-delay-1 { animation-delay: 0.1s; }
    .dashboard-card-delay-2 { animation-delay: 0.2s; }
    .dashboard-card-delay-3 { animation-delay: 0.3s; }

    .scale-hover {
        transition: all 0.2s ease !important;
    }

    .scale-hover:hover {
        transform: translateY(-4px) !important;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1) !important;
    }

    /* Mobile First - Base Styles */
    .dashboard-hero-mobile {
        padding: 20px 16px 60px !important;
        border-bottom-left-radius: 20px !important;
        border-bottom-right-radius: 20px !important;
    }

    .dashboard-title-mobile {
        font-size: 22px !important;
    }

    .dashboard-content-mobile {
        padding: 0 16px !important;
        margin-top: -45px !important;
    }

    .dashboard-stat-card-mobile {
        border-radius: 16px !important;
        margin-bottom: 12px !important;
    }

    .dashboard-filter-mobile {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 8px !important;
    }

    /* Tablet (768px+) */
    @media (min-width: 768px) {
        .dashboard-hero-mobile {
            padding: 24px 24px 70px !important;
            border-bottom-left-radius: 24px !important;
            border-bottom-right-radius: 24px !important;
        }

        .dashboard-title-mobile {
            font-size: 26px !important;
        }

        .dashboard-content-mobile {
            padding: 0 24px !important;
        }

        .dashboard-filter-mobile {
            flex-direction: row !important;
            align-items: center !important;
        }
    }

    /* Desktop (1024px+) */
    @media (min-width: 1024px) {
        .dashboard-stat-card-mobile:hover {
            transform: translateY(-4px) !important;
        }
    }

    /* Touch-friendly */
    @media (max-width: 768px) {
        .dashboard-stat-card-mobile {
            -webkit-tap-highlight-color: rgba(79, 70, 229, 0.1);
        }

        .dashboard-table-mobile .ant-table-thead > tr > th {
            padding: 12px 8px !important;
            font-size: 12px !important;
        }

        .dashboard-table-mobile .ant-table-tbody > tr > td {
            padding: 10px 8px !important;
            font-size: 13px !important;
        }
    }
`;
