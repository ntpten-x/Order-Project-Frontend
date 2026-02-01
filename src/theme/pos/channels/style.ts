import { CSSProperties } from 'react';
import { posColors, channelColors } from '../index';

/**
 * Channel Selection Page Styles
 * Modern Minimal Design - Clean cards, soft colors, mobile-first
 */

// =============================================================================
// Main Channel Selection Page
// =============================================================================
export const channelsStyles = {
    channelsContainer: {
        minHeight: '100vh',
        background: posColors.background,
        fontFamily: "'Inter', 'Sarabun', -apple-system, BlinkMacSystemFont, sans-serif",
        paddingBottom: 100,
    } as CSSProperties,

    // Header - Compact, clean gradient
    channelsHeader: {
        background: `linear-gradient(135deg, ${posColors.primary} 0%, ${posColors.primaryDark} 100%)`,
        padding: '32px 20px 56px',
        textAlign: 'center' as const,
        position: 'relative' as const,
        overflow: 'hidden',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)',
    } as CSSProperties,

    channelsHeaderContent: {
        maxWidth: 600,
        margin: '0 auto',
        position: 'relative' as const,
        zIndex: 10,
    } as CSSProperties,

    channelsHeaderIcon: {
        fontSize: 40,
        color: '#fff',
        marginBottom: 12,
        opacity: 0.9,
    } as CSSProperties,

    channelsHeaderTitle: {
        color: '#fff',
        fontSize: 26,
        fontWeight: 700,
        margin: 0,
        marginBottom: 4,
    } as CSSProperties,

    channelsHeaderSubtitle: {
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: 14,
        fontWeight: 400,
    } as CSSProperties,

    // Cards Container
    channelsCardsContainer: {
        maxWidth: 900,
        margin: '-32px auto 0',
        padding: '0 16px 80px',
        position: 'relative' as const,
        zIndex: 20,
    } as CSSProperties,

    // Individual Channel Card
    channelCard: {
        height: '100%',
        borderRadius: 16,
        border: `1px solid ${posColors.border}`,
        background: posColors.cardBg,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.25s ease',
        overflow: 'hidden',
        cursor: 'pointer',
    } as CSSProperties,

    channelCardInner: {
        padding: '32px 20px',
        textAlign: 'center' as const,
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative' as const,
    } as CSSProperties,

    // Icon Container
    channelIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
        position: 'relative' as const,
        transition: 'all 0.25s ease',
    } as CSSProperties,

    channelIcon: {
        fontSize: 36,
        position: 'relative' as const,
        zIndex: 2,
    } as CSSProperties,

    channelDecorativeGlow: {
        position: 'absolute' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '120%',
        height: '120%',
        borderRadius: '50%',
        opacity: 0.15,
        filter: 'blur(16px)',
        transition: 'all 0.3s ease',
    } as CSSProperties,

    channelCardTitle: {
        fontSize: 18,
        fontWeight: 700,
        marginBottom: 4,
        color: posColors.text,
    } as CSSProperties,

    channelCardSubtitle: {
        fontSize: 13,
        color: posColors.textMuted,
        fontWeight: 400,
    } as CSSProperties,

    // Stats Badge
    channelStatsBadge: {
        marginTop: 16,
        padding: '6px 12px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        transition: 'all 0.2s ease',
    } as CSSProperties,

    channelActiveIndicator: {
        width: 6,
        height: 6,
        borderRadius: '50%',
        display: 'inline-block',
    } as CSSProperties,

    channelLoadingSkeleton: {
        width: 80,
        height: 24,
        borderRadius: 8,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        marginTop: 16,
    } as CSSProperties,
};

// =============================================================================
// Channel Sub-Pages (Dine-In, Takeaway, Delivery)
// =============================================================================
export const channelPageStyles = {
    // Header
    channelHeader: {
        background: `linear-gradient(135deg, ${channelColors.dineIn.primary} 0%, #2563EB 100%)`,
        padding: '16px 16px 40px',
        position: 'relative' as CSSProperties['position'],
        overflow: 'hidden',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    } as CSSProperties,

    channelHeaderContent: {
        maxWidth: 1200,
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
        gap: 4,
        background: 'rgba(255, 255, 255, 0.12)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 10,
        padding: '6px 12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        flexShrink: 0,
    } as CSSProperties,

    channelTitleSection: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flex: 1,
        minWidth: 0,
    } as CSSProperties,

    channelHeaderIcon: {
        fontSize: 24,
        color: '#fff',
        flexShrink: 0,
    } as CSSProperties,

    channelHeaderTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 600,
        margin: 0,
        lineHeight: 1.3,
    } as CSSProperties,

    channelHeaderSubtitle: {
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: 12,
        fontWeight: 400,
    } as CSSProperties,

    // Stats Bar
    channelStatsBar: {
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.12)',
        padding: '6px 12px',
        borderRadius: 10,
        backdropFilter: 'blur(8px)',
        flexShrink: 0,
    } as CSSProperties,

    statItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 5,
    } as CSSProperties,

    statDot: {
        width: 6,
        height: 6,
        borderRadius: '50%',
    } as CSSProperties,

    statText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: 'nowrap' as CSSProperties['whiteSpace'],
    } as CSSProperties,

    // Content Cards
    channelPageCard: {
        borderRadius: 14,
        border: `1px solid ${posColors.border}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        cursor: 'pointer',
        background: posColors.cardBg,
        position: 'relative' as CSSProperties['position'],
    } as CSSProperties,

    channelPageCardInner: {
        padding: '20px 16px',
        textAlign: 'center' as CSSProperties['textAlign'],
        position: 'relative' as CSSProperties['position'],
        zIndex: 2,
    } as CSSProperties,

    channelPageCardIcon: {
        fontSize: 32,
        marginBottom: 8,
        display: 'block',
    } as CSSProperties,

    channelPageCardMainText: {
        fontSize: 28,
        fontWeight: 700,
        marginBottom: 0,
        color: posColors.text,
        lineHeight: 1.1,
        display: 'block',
    } as CSSProperties,

    channelPageCardStatusBadge: {
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        display: 'inline-block',
        marginTop: 8,
    } as CSSProperties,

    channelPageCardGradientOverlay: {
        position: 'absolute' as CSSProperties['position'],
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.04,
        pointerEvents: 'none' as CSSProperties['pointerEvents'],
    } as CSSProperties,
};

// =============================================================================
// Responsive Styles
// =============================================================================
export const channelsResponsiveStyles = `
  /* Base - Mobile First */
  .channels-header-mobile {
    padding: 24px 16px 44px !important;
    border-bottom-left-radius: 20px !important;
    border-bottom-right-radius: 20px !important;
  }
  .channels-header-icon-mobile { font-size: 36px !important; }
  .channels-header-title-mobile { font-size: 22px !important; }
  .channels-header-subtitle-mobile { font-size: 13px !important; }
  .channels-cards-container-mobile {
    margin-top: -28px !important;
    padding: 0 12px 90px !important;
  }
  .channels-card-inner-mobile { padding: 24px 16px !important; }
  .channels-icon-wrapper-mobile {
    width: 64px !important;
    height: 64px !important;
    margin-bottom: 12px !important;
    border-radius: 16px !important;
  }
  .channels-channel-icon-mobile { font-size: 28px !important; }
  .channels-card-title-mobile { font-size: 16px !important; }
  .channels-card-subtitle-mobile { font-size: 12px !important; }
  .channels-stats-badge-mobile {
    padding: 5px 10px !important;
    font-size: 12px !important;
    margin-top: 12px !important;
  }

  /* Channel Page Headers */
  .dine-in-header-mobile,
  .takeaway-header-mobile,
  .delivery-header-mobile {
    padding: 12px 12px 36px !important;
  }
  .dine-in-header-content-mobile,
  .takeaway-header-content-mobile,
  .delivery-header-content-mobile {
    flex-wrap: wrap !important;
    gap: 10px !important;
  }
  .dine-in-back-button-mobile,
  .takeaway-back-button-mobile,
  .delivery-back-button-mobile {
    padding: 5px 10px !important;
    font-size: 13px !important;
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
    justify-content: center !important;
    gap: 16px !important;
    margin-top: 4px !important;
  }
  .dine-in-header-icon-mobile,
  .takeaway-header-icon-mobile,
  .delivery-header-icon-mobile { font-size: 20px !important; }
  .dine-in-header-title-mobile,
  .takeaway-header-title-mobile,
  .delivery-header-title-mobile { font-size: 16px !important; }
  .dine-in-content-mobile { padding: 0 12px 16px !important; }
  .dine-in-table-card-mobile { margin-bottom: 0 !important; }
  .dine-in-table-icon-mobile { font-size: 28px !important; }
  .dine-in-table-name-mobile { font-size: 24px !important; }

  /* Tablet (768px+) */
  @media (min-width: 768px) {
    .channels-header-mobile {
      padding: 32px 24px 56px !important;
      border-bottom-left-radius: 24px !important;
      border-bottom-right-radius: 24px !important;
    }
    .channels-header-icon-mobile { font-size: 40px !important; }
    .channels-header-title-mobile { font-size: 26px !important; }
    .channels-header-subtitle-mobile { font-size: 14px !important; }
    .channels-cards-container-mobile {
      margin-top: -32px !important;
      padding: 0 20px 80px !important;
    }
    .channels-card-inner-mobile { padding: 32px 24px !important; }
    .channels-icon-wrapper-mobile {
      width: 80px !important;
      height: 80px !important;
      margin-bottom: 16px !important;
    }
    .channels-channel-icon-mobile { font-size: 36px !important; }
    .channels-card-title-mobile { font-size: 18px !important; }
    .channels-card-subtitle-mobile { font-size: 13px !important; }
    .channels-stats-badge-mobile {
      padding: 6px 12px !important;
      font-size: 13px !important;
    }

    /* Channel Pages Tablet */
    .dine-in-header-mobile,
    .takeaway-header-mobile,
    .delivery-header-mobile {
      padding: 16px 20px 44px !important;
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
    .dine-in-header-icon-mobile { font-size: 24px !important; }
    .dine-in-header-title-mobile { font-size: 18px !important; }
    .dine-in-content-mobile { padding: 0 20px 24px !important; }
    .dine-in-table-icon-mobile { font-size: 32px !important; }
    .dine-in-table-name-mobile { font-size: 28px !important; }
  }

  /* Desktop (1024px+) */
  @media (min-width: 1024px) {
    .channels-cards-container-mobile { max-width: 900px !important; }
    .dine-in-content-mobile { padding: 0 24px 24px !important; }
  }

  /* Touch interactions */
  @media (hover: none) {
    .channel-card-hover:active,
    .table-card-hover:active {
      transform: scale(0.98) !important;
    }
  }

  /* Fade animations */
  .fade-in-up {
    animation: fadeInUp 0.3s ease-out forwards;
  }
  .card-delay-1 { animation-delay: 0.05s; opacity: 0; }
  .card-delay-2 { animation-delay: 0.1s; opacity: 0; }
  .card-delay-3 { animation-delay: 0.15s; opacity: 0; }

  /* Utility */
  .hide-on-mobile { display: inline !important; }
  @media (max-width: 768px) {
    .hide-on-mobile { display: none !important; }
  }
`;
