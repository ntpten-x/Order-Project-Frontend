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

// Responsive Global Styles for Channels
export const channelsResponsiveStyles = `
    /* Mobile First - Base Styles (up to 480px) */
    .channels-header-mobile {
        padding: 32px 16px 50px !important;
        border-bottom-left-radius: 24px !important;
        border-bottom-right-radius: 24px !important;
    }

    .channels-header-icon-mobile {
        font-size: 40px !important;
        margin-bottom: 12px !important;
    }

    .channels-header-title-mobile {
        font-size: 24px !important;
        margin-bottom: 6px !important;
    }

    .channels-header-subtitle-mobile {
        font-size: 14px !important;
    }

    .channels-cards-container-mobile {
        margin-top: -32px !important;
        padding: 0 16px 100px !important;
    }

    .channels-card-inner-mobile {
        padding: 32px 20px !important;
    }

    .channels-icon-wrapper-mobile {
        width: 100px !important;
        height: 100px !important;
        margin-bottom: 20px !important;
    }

    .channels-channel-icon-mobile {
        font-size: 44px !important;
    }

    .channels-card-title-mobile {
        font-size: 20px !important;
        margin-bottom: 6px !important;
    }

    .channels-card-subtitle-mobile {
        font-size: 13px !important;
    }

    .channels-stats-badge-mobile {
        padding: 6px 12px !important;
        font-size: 13px !important;
        margin-top: 16px !important;
    }

    /* Channel Pages Mobile Styles */
    .dine-in-header-mobile,
    .takeaway-header-mobile,
    .delivery-header-mobile {
        padding: 20px 16px 50px !important;
        border-bottom-left-radius: 20px !important;
        border-bottom-right-radius: 20px !important;
        margin-bottom: 20px !important;
    }

    .dine-in-header-content-mobile,
    .takeaway-header-content-mobile,
    .delivery-header-content-mobile {
        flex-wrap: wrap !important;
        gap: 12px !important;
    }

    .dine-in-back-button-mobile,
    .takeaway-back-button-mobile,
    .delivery-back-button-mobile {
        padding: 6px 10px !important;
        font-size: 14px !important;
    }

    .dine-in-title-section-mobile,
    .takeaway-title-section-mobile,
    .delivery-title-section-mobile {
        flex: 1 1 100% !important;
        order: 2 !important;
    }

    .dine-in-stats-bar-mobile,
    .takeaway-stats-bar-mobile,
    .delivery-stats-bar-mobile {
        order: 3 !important;
        width: 100% !important;
        justify-content: space-around !important;
        margin-top: 8px !important;
    }

    .dine-in-header-icon-mobile,
    .takeaway-header-icon-mobile,
    .delivery-header-icon-mobile {
        font-size: 24px !important;
    }

    .dine-in-header-title-mobile,
    .takeaway-header-title-mobile,
    .delivery-header-title-mobile {
        font-size: 18px !important;
    }

    .dine-in-content-mobile {
        padding: 0 12px 20px !important;
    }

    .dine-in-table-card-mobile {
        margin-bottom: 0 !important;
    }

    .dine-in-table-icon-mobile {
        font-size: 40px !important;
    }

    .dine-in-table-name-mobile {
        font-size: 32px !important;
    }

    .takeaway-order-card,
    .delivery-order-card {
        margin-bottom: 0 !important;
    }

    /* Takeaway & Delivery Order Cards Mobile */
    .takeaway-order-card .ant-card-body,
    .delivery-order-card {
        padding: 12px !important;
    }

    .takeaway-order-card .ant-card-body > div:first-child {
        padding: 10px 12px !important;
    }

    .takeaway-order-card .ant-card-body > div:last-child {
        padding: 12px !important;
    }

    /* Small Mobile (481px - 767px) */
    @media (min-width: 481px) {
        .channels-header-mobile {
            padding: 40px 20px 60px !important;
        }

        .channels-header-icon-mobile {
            font-size: 48px !important;
        }

        .channels-header-title-mobile {
            font-size: 28px !important;
        }

        .channels-cards-container-mobile {
            padding: 0 20px 100px !important;
        }

        .channels-card-inner-mobile {
            padding: 40px 28px !important;
        }

        .channels-icon-wrapper-mobile {
            width: 120px !important;
            height: 120px !important;
        }

        .channels-channel-icon-mobile {
            font-size: 52px !important;
        }

        .channels-card-title-mobile {
            font-size: 24px !important;
        }
    }

    /* Tablet (768px+) */
    @media (min-width: 768px) {
        .channels-header-mobile {
            padding: 48px 24px 80px !important;
            border-bottom-left-radius: 32px !important;
            border-bottom-right-radius: 32px !important;
        }

        .channels-header-icon-mobile {
            font-size: 56px !important;
            margin-bottom: 16px !important;
        }

        .channels-header-title-mobile {
            font-size: 36px !important;
            margin-bottom: 8px !important;
        }

        .channels-header-subtitle-mobile {
            font-size: 18px !important;
        }

        .channels-cards-container-mobile {
            margin-top: -40px !important;
            padding: 0 24px 80px !important;
        }

        .channels-card-inner-mobile {
            padding: 48px 32px !important;
        }

        .channels-icon-wrapper-mobile {
            width: 140px !important;
            height: 140px !important;
            margin-bottom: 32px !important;
        }

        .channels-channel-icon-mobile {
            font-size: 64px !important;
        }

        .channels-card-title-mobile {
            font-size: 28px !important;
            margin-bottom: 8px !important;
        }

        .channels-card-subtitle-mobile {
            font-size: 16px !important;
        }

        .channels-stats-badge-mobile {
            padding: 8px 16px !important;
            font-size: 14px !important;
            margin-top: 20px !important;
        }

        /* Channel Pages Tablet */
        .dine-in-header-mobile,
        .takeaway-header-mobile,
        .delivery-header-mobile {
            padding: 24px 20px 60px !important;
            border-bottom-left-radius: 24px !important;
            border-bottom-right-radius: 24px !important;
        }

        .dine-in-header-content-mobile,
        .takeaway-header-content-mobile,
        .delivery-header-content-mobile {
            flex-wrap: nowrap !important;
        }

        .dine-in-title-section-mobile,
        .takeaway-title-section-mobile,
        .delivery-title-section-mobile {
            flex: 1 !important;
            order: 0 !important;
        }

        .dine-in-stats-bar-mobile,
        .takeaway-stats-bar-mobile,
        .delivery-stats-bar-mobile {
            order: 0 !important;
            width: auto !important;
            margin-top: 0 !important;
        }

        .dine-in-header-icon-mobile,
        .takeaway-header-icon-mobile,
        .delivery-header-icon-mobile {
            font-size: 28px !important;
        }

        .dine-in-header-title-mobile,
        .takeaway-header-title-mobile,
        .delivery-header-title-mobile {
            font-size: 20px !important;
        }

        .dine-in-content-mobile {
            padding: 0 20px 24px !important;
        }

        .dine-in-table-icon-mobile {
            font-size: 42px !important;
        }

        .dine-in-table-name-mobile {
            font-size: 36px !important;
        }
    }

    /* Desktop (1024px+) */
    @media (min-width: 1024px) {
        .channels-cards-container-mobile {
            max-width: 1200px !important;
        }

        .dine-in-content-mobile {
            padding: 0 24px 24px !important;
        }
    }

    /* Touch-friendly interactions */
    @media (max-width: 768px) {
        .channel-card-hover,
        .dine-in-table-card,
        .takeaway-order-card,
        .delivery-order-card {
            -webkit-tap-highlight-color: rgba(0, 0, 0, 0.05);
        }

        .channel-card-hover:active,
        .dine-in-table-card:active,
        .takeaway-order-card:active,
        .delivery-order-card:active {
            transform: scale(0.98) !important;
        }
    }

    /* Animations */
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .fade-in-up {
        animation: fadeInUp 0.5s ease-out forwards;
    }

    .card-delay-1 { animation-delay: 0.1s; opacity: 0; }
    .card-delay-2 { animation-delay: 0.2s; opacity: 0; }
    .card-delay-3 { animation-delay: 0.3s; opacity: 0; }

    /* Utility Classes */
    .hide-on-mobile {
        display: inline !important;
    }

    .show-on-mobile-inline {
        display: none !important;
    }

    @media (max-width: 768px) {
        .hide-on-mobile {
            display: none !important;
        }

        .show-on-mobile-inline {
            display: inline !important;
        }

        .takeaway-add-button-mobile,
        .delivery-add-button-mobile {
            width: 100% !important;
        }

        .takeaway-content-mobile,
        .delivery-content-mobile {
            padding: 0 12px 20px !important;
        }
    }

    @media (min-width: 769px) {
        .takeaway-add-button-mobile,
        .delivery-add-button-mobile {
            width: auto !important;
        }
    }

    /* Order Cards Mobile Optimization */
    @media (max-width: 768px) {
        .takeaway-order-col-mobile,
        .delivery-order-col-mobile {
            margin-bottom: 12px !important;
        }

        .takeaway-order-card,
        .delivery-order-card {
            border-radius: 16px !important;
        }

        .takeaway-order-card .ant-card-body,
        .delivery-order-card > div {
            padding: 14px !important;
        }
    }

    /* Better spacing for mobile cards */
    @media (max-width: 480px) {
        .takeaway-order-card .ant-card-body > div:first-child,
        .delivery-order-card > div:first-child {
            padding: 10px 12px !important;
        }

        .takeaway-order-card .ant-card-body > div:last-child,
        .delivery-order-card > div:last-child {
            padding: 12px !important;
        }
    }
`;
