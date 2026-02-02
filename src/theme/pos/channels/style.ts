import { CSSProperties } from 'react';
import { posColors, channelColors } from '../index';

/**
 * Channel Selection Page Styles
 * "Soft Modern Clarity" Design - Clean, mobile-first, eye-friendly
 */

// =============================================================================
// Main Channel Selection Page
// =============================================================================
export const channelsStyles = {
  channelsContainer: {
    minHeight: '100dvh',
    background: '#F8FAFC',
    fontFamily: "'Sarabun', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    paddingBottom: 100,
  } as CSSProperties,

  // Header - Softer gradient, more rounded
  channelsHeader: {
    background: `linear-gradient(145deg, #6366F1 0%, #818CF8 50%, #A5B4FC 100%)`,
    padding: '28px 20px 52px',
    textAlign: 'center' as const,
    position: 'relative' as const,
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    boxShadow: '0 8px 32px rgba(99, 102, 241, 0.15)',
  } as CSSProperties,

  channelsHeaderContent: {
    maxWidth: 600,
    margin: '0 auto',
    position: 'relative' as const,
    zIndex: 10,
  } as CSSProperties,

  channelsHeaderIcon: {
    fontSize: 44,
    color: '#fff',
    marginBottom: 12,
    opacity: 0.95,
    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))',
  } as CSSProperties,

  channelsHeaderTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 700,
    margin: 0,
    marginBottom: 6,
    letterSpacing: '-0.02em',
    textShadow: '0 2px 12px rgba(0,0,0,0.1)',
  } as CSSProperties,

  channelsHeaderSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    fontWeight: 400,
    letterSpacing: '0.02em',
  } as CSSProperties,

  // Cards Container - Centered with good spacing
  channelsCardsContainer: {
    maxWidth: 960,
    margin: '-28px auto 0',
    padding: '0 16px 100px',
    position: 'relative' as const,
    zIndex: 20,
  } as CSSProperties,

  // Individual Channel Card - Soft, clean design
  channelCard: {
    height: '100%',
    borderRadius: 24,
    border: '1px solid rgba(226, 232, 240, 0.8)',
    background: '#FFFFFF',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    cursor: 'pointer',
  } as CSSProperties,

  channelCardInner: {
    padding: '36px 24px 32px',
    textAlign: 'center' as const,
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
    minHeight: 220,
  } as CSSProperties,

  // Icon Container - Large, prominent
  channelIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    position: 'relative' as const,
    transition: 'all 0.3s ease',
  } as CSSProperties,

  channelIcon: {
    fontSize: 44,
    position: 'relative' as const,
    zIndex: 2,
    transition: 'transform 0.3s ease',
  } as CSSProperties,

  channelDecorativeGlow: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '140%',
    height: '140%',
    borderRadius: '50%',
    opacity: 0.12,
    filter: 'blur(20px)',
    transition: 'all 0.3s ease',
  } as CSSProperties,

  channelCardTitle: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 4,
    color: '#1E293B',
    letterSpacing: '-0.01em',
  } as CSSProperties,

  channelCardSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: 500,
    letterSpacing: '0.02em',
  } as CSSProperties,

  // Stats Badge - Clear and readable
  channelStatsBadge: {
    marginTop: 20,
    padding: '10px 18px',
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    transition: 'all 0.2s ease',
    minWidth: 120,
    justifyContent: 'center',
  } as CSSProperties,

  channelActiveIndicator: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    display: 'inline-block',
  } as CSSProperties,

  channelLoadingSkeleton: {
    width: 100,
    height: 28,
    borderRadius: 10,
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    marginTop: 20,
  } as CSSProperties,
};

// =============================================================================
// Channel Sub-Pages (Dine-In, Takeaway, Delivery)
// =============================================================================
export const channelPageStyles = {
  // Header - Softer gradient with smooth corners
  channelHeader: {
    background: `linear-gradient(145deg, ${channelColors.dineIn.primary} 0%, #60A5FA 50%, #93C5FD 100%)`,
    padding: '20px 16px 48px',
    position: 'relative' as CSSProperties['position'],
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15)',
  } as CSSProperties,

  channelHeaderContent: {
    maxWidth: 1400,
    margin: '0 auto',
    position: 'relative' as CSSProperties['position'],
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap' as CSSProperties['flexWrap'],
  } as CSSProperties,

  // Back Button - Pill shape with blur
  channelBackButton: {
    color: '#fff',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(255, 255, 255, 0.18)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    padding: '10px 18px',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    flexShrink: 0,
    fontWeight: 600,
    backdropFilter: 'blur(12px)',
  } as CSSProperties,

  channelTitleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 0,
  } as CSSProperties,

  // Header Icon - Larger with glow
  channelHeaderIcon: {
    fontSize: 32,
    color: '#fff',
    flexShrink: 0,
    filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.15))',
  } as CSSProperties,

  channelHeaderTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    lineHeight: 1.2,
    textShadow: '0 2px 8px rgba(0,0,0,0.12)',
    letterSpacing: '-0.01em',
  } as CSSProperties,

  channelHeaderSubtitle: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: '0.02em',
  } as CSSProperties,

  // Stats Bar - Glass effect
  channelStatsBar: {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.18)',
    padding: '10px 20px',
    borderRadius: 16,
    backdropFilter: 'blur(16px)',
    flexShrink: 0,
    border: '1px solid rgba(255, 255, 255, 0.25)',
  } as CSSProperties,

  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  } as CSSProperties,

  statDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    boxShadow: '0 0 8px currentColor',
  } as CSSProperties,

  statText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: 'nowrap' as CSSProperties['whiteSpace'],
  } as CSSProperties,

  // Content Container
  channelContentContainer: {
    maxWidth: 1400,
    margin: '-24px auto 0',
    padding: '0 16px 100px',
    position: 'relative' as CSSProperties['position'],
    zIndex: 20,
  } as CSSProperties,

  // Table/Order Cards - Clean, elegant
  channelPageCard: {
    borderRadius: 24,
    border: '1.5px solid rgba(226, 232, 240, 0.9)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    cursor: 'pointer',
    background: '#FFFFFF',
    position: 'relative' as CSSProperties['position'],
  } as CSSProperties,

  channelPageCardInner: {
    padding: '28px 20px 24px',
    textAlign: 'center' as CSSProperties['textAlign'],
    position: 'relative' as CSSProperties['position'],
    zIndex: 2,
    minHeight: 160,
    display: 'flex',
    flexDirection: 'column' as CSSProperties['flexDirection'],
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,

  // Icon in cards - Larger, more prominent
  channelPageCardIcon: {
    fontSize: 42,
    marginBottom: 14,
    display: 'block',
    transition: 'transform 0.3s ease',
  } as CSSProperties,

  channelPageCardMainText: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 0,
    color: posColors.text,
    lineHeight: 1.1,
    display: 'block',
    letterSpacing: '-0.02em',
  } as CSSProperties,

  // Status Badge - More readable
  channelPageCardStatusBadge: {
    padding: '8px 16px',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    display: 'inline-block',
    marginTop: 10,
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap',
    minWidth: 'fit-content',
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

  // Order Card Specific (Takeaway/Delivery)
  orderCard: {
    borderRadius: 20,
    border: '1px solid rgba(226, 232, 240, 0.8)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    cursor: 'pointer',
    background: '#FFFFFF',
  } as CSSProperties,

  orderCardHeader: {
    padding: '14px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
  } as CSSProperties,

  orderCardContent: {
    padding: '18px',
  } as CSSProperties,

  orderCardFooter: {
    padding: '12px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(248, 250, 252, 0.5)',
    borderTop: '1px solid rgba(226, 232, 240, 0.3)',
  } as CSSProperties,

  // Add Button
  addOrderButton: {
    height: 52,
    borderRadius: 16,
    padding: '0 28px',
    fontWeight: 700,
    fontSize: 15,
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    transition: 'all 0.25s ease',
  } as CSSProperties,

  // Empty State
  emptyStateContainer: {
    background: '#FFFFFF',
    borderRadius: 28,
    padding: '80px 32px',
    textAlign: 'center' as CSSProperties['textAlign'],
    boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
    border: '1px solid rgba(226, 232, 240, 0.6)',
  } as CSSProperties,
};

// =============================================================================
// Responsive Styles - Mobile First
// =============================================================================
export const channelsResponsiveStyles = `
  /* ===========================================
     Base - Mobile First (< 480px)
     =========================================== */
  .channels-header-mobile {
    padding: 24px 16px 44px !important;
    border-bottom-left-radius: 28px !important;
    border-bottom-right-radius: 28px !important;
  }
  .channels-header-icon-mobile { 
    font-size: 40px !important; 
  }
  .channels-header-title-mobile { 
    font-size: 24px !important; 
    letter-spacing: -0.02em !important;
  }
  .channels-header-subtitle-mobile { 
    font-size: 14px !important; 
  }
  .channels-cards-container-mobile {
    margin-top: -24px !important;
    padding: 0 12px 100px !important;
  }
  .channels-card-inner-mobile { 
    padding: 28px 16px 24px !important;
    min-height: 200px !important;
  }
  .channels-icon-wrapper-mobile {
    width: 80px !important;
    height: 80px !important;
    margin-bottom: 16px !important;
    border-radius: 24px !important;
  }
  .channels-channel-icon-mobile { 
    font-size: 36px !important; 
  }
  .channels-card-title-mobile { 
    font-size: 20px !important; 
  }
  .channels-card-subtitle-mobile { 
    font-size: 13px !important; 
  }
  .channels-stats-badge-mobile {
    padding: 8px 14px !important;
    font-size: 13px !important;
    margin-top: 16px !important;
    min-width: 100px !important;
    border-radius: 12px !important;
  }

  /* Channel Page Headers - Mobile */
  .dine-in-header-mobile,
  .takeaway-header-mobile,
  .delivery-header-mobile {
    padding: 14px 14px 40px !important;
    border-bottom-left-radius: 24px !important;
    border-bottom-right-radius: 24px !important;
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
    padding: 8px 14px !important;
    font-size: 14px !important;
    border-radius: 12px !important;
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
    gap: 20px !important;
    margin-top: 8px !important;
    padding: 10px 16px !important;
    border-radius: 12px !important;
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
    font-size: 32px !important; 
  }
  .dine-in-table-name-mobile { 
    font-size: 28px !important; 
  }

  /* ===========================================
     Mobile Large (480px - 768px)
     =========================================== */
  @media (min-width: 480px) {
    .channels-header-mobile {
      padding: 28px 20px 48px !important;
    }
    .channels-header-icon-mobile { 
      font-size: 44px !important; 
    }
    .channels-header-title-mobile { 
      font-size: 26px !important; 
    }
    .channels-cards-container-mobile {
      margin-top: -26px !important;
      padding: 0 16px 100px !important;
    }
    .channels-card-inner-mobile { 
      padding: 32px 20px 28px !important;
      min-height: 210px !important;
    }
    .channels-icon-wrapper-mobile {
      width: 88px !important;
      height: 88px !important;
      margin-bottom: 18px !important;
    }
    .channels-channel-icon-mobile { 
      font-size: 40px !important; 
    }
    .channels-card-title-mobile { 
      font-size: 21px !important; 
    }
    .channels-stats-badge-mobile {
      padding: 10px 16px !important;
      font-size: 14px !important;
    }
  }

  /* ===========================================
     Tablet (768px - 1024px)
     =========================================== */
  @media (min-width: 768px) {
    .channels-header-mobile {
      padding: 32px 24px 56px !important;
      border-bottom-left-radius: 32px !important;
      border-bottom-right-radius: 32px !important;
    }
    .channels-header-icon-mobile { 
      font-size: 48px !important; 
    }
    .channels-header-title-mobile { 
      font-size: 28px !important; 
    }
    .channels-header-subtitle-mobile { 
      font-size: 15px !important; 
    }
    .channels-cards-container-mobile {
      margin-top: -32px !important;
      padding: 0 24px 100px !important;
    }
    .channels-card-inner-mobile { 
      padding: 36px 24px 32px !important;
      min-height: 220px !important;
    }
    .channels-icon-wrapper-mobile {
      width: 96px !important;
      height: 96px !important;
      margin-bottom: 20px !important;
      border-radius: 28px !important;
    }
    .channels-channel-icon-mobile { 
      font-size: 44px !important; 
    }
    .channels-card-title-mobile { 
      font-size: 22px !important; 
    }
    .channels-card-subtitle-mobile { 
      font-size: 14px !important; 
    }
    .channels-stats-badge-mobile {
      padding: 10px 18px !important;
      font-size: 14px !important;
      margin-top: 20px !important;
      min-width: 120px !important;
    }

    /* Channel Pages - Tablet */
    .dine-in-header-mobile,
    .takeaway-header-mobile,
    .delivery-header-mobile {
      padding: 18px 24px 48px !important;
      border-bottom-left-radius: 28px !important;
      border-bottom-right-radius: 28px !important;
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
    .dine-in-header-icon-mobile { 
      font-size: 28px !important; 
    }
    .dine-in-header-title-mobile { 
      font-size: 20px !important; 
    }
    .dine-in-content-mobile { 
      padding: 0 24px 28px !important; 
    }
    .dine-in-table-icon-mobile { 
      font-size: 36px !important; 
    }
    .dine-in-table-name-mobile { 
      font-size: 32px !important; 
    }
  }

  /* ===========================================
     Desktop (1024px+)
     =========================================== */
  @media (min-width: 1024px) {
    .channels-cards-container-mobile { 
      max-width: 960px !important; 
    }
    .channels-card-inner-mobile { 
      padding: 40px 28px 36px !important;
      min-height: 240px !important;
    }
    .channels-icon-wrapper-mobile {
      width: 100px !important;
      height: 100px !important;
    }
    .channels-channel-icon-mobile { 
      font-size: 48px !important; 
    }
    .dine-in-content-mobile { 
      padding: 0 28px 32px !important; 
    }
  }

  /* ===========================================
     Card Hover Effects
     =========================================== */
  .channel-card-hover {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }
  .channel-card-hover:hover {
    transform: translateY(-8px) !important;
    box-shadow: 0 20px 40px rgba(99, 102, 241, 0.12), 
                0 8px 16px rgba(0, 0, 0, 0.06) !important;
  }
  .channel-card-hover:hover .icon-wrapper {
    transform: scale(1.08) !important;
  }
  .channel-card-hover:hover .decorative-glow {
    opacity: 0.2 !important;
    filter: blur(24px) !important;
  }
  .channel-card-hover:active {
    transform: translateY(-4px) scale(0.99) !important;
  }

  /* Touch devices */
  @media (hover: none) {
    .channel-card-hover:active,
    .table-card-hover:active {
      transform: scale(0.98) !important;
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.1) !important;
    }
    .channel-card-hover:hover {
      transform: none !important;
    }
  }

  /* ===========================================
     Animations
     =========================================== */
  .fade-in-up {
    animation: fadeInUp 0.4s ease-out forwards;
  }
  .card-delay-1 { animation-delay: 0.08s; opacity: 0; }
  .card-delay-2 { animation-delay: 0.16s; opacity: 0; }
  .card-delay-3 { animation-delay: 0.24s; opacity: 0; }

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

  /* Pulse animation for active indicator */
  .pulse-animation {
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { 
      transform: scale(1);
      box-shadow: 0 0 0 0 currentColor;
    }
    50% { 
      transform: scale(1.1);
      box-shadow: 0 0 8px 2px currentColor;
    }
  }

  /* Header decorative elements */
  .header-pattern {
    background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px) !important;
    background-size: 20px 20px !important;
    opacity: 0.6 !important;
  }
  .header-circle.circle-1 {
    width: 240px !important;
    height: 240px !important;
    top: -120px !important;
    right: -80px !important;
    background: rgba(255, 255, 255, 0.06) !important;
  }
  .header-circle.circle-2 {
    width: 160px !important;
    height: 160px !important;
    bottom: -80px !important;
    left: -40px !important;
    background: rgba(255, 255, 255, 0.05) !important;
  }

  /* Header icon float animation */
  .header-icon-animate {
    animation: floatIcon 4s ease-in-out infinite;
  }
  @keyframes floatIcon {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  /* ===========================================
     Utility
     =========================================== */
  .hide-on-mobile { display: inline !important; }
  @media (max-width: 768px) {
    .hide-on-mobile { display: none !important; }
  }
`;
