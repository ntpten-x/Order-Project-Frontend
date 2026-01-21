import { CSSProperties } from 'react';

// Color Palette for Orders Page
export const ordersColors = {
  // Primary - Blue/Indigo theme for orders
  primary: '#1890ff',
  primaryLight: '#e6f7ff',
  primaryDark: '#096dd9',
  primaryGradient: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
  
  // Status Colors
  pending: '#faad14',
  pendingLight: '#fff7e6',
  cooking: '#1890ff',
  cookingLight: '#e6f7ff',
  served: '#52c41a',
  servedLight: '#f6ffed',
  paid: '#13c2c2',
  paidLight: '#e6fffb',
  cancelled: '#ff4d4f',
  cancelledLight: '#fff1f0',
  
  // Channel Colors
  dineIn: '#722ed1',
  takeAway: '#fa8c16',
  delivery: '#eb2f96',
  
  // Base Colors
  text: '#262626',
  textSecondary: '#8c8c8c',
  textLight: '#bfbfbf',
  background: '#f0f2f5',
  white: '#ffffff',
  border: '#d9d9d9',
  borderLight: '#f0f0f0',
};

// Typography
export const ordersTypography = {
  pageTitle: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.2,
    margin: 0,
  } as CSSProperties,
  
  pageSubtitle: {
    fontSize: 14,
    fontWeight: 400,
    opacity: 0.9,
  } as CSSProperties,
  
  cardTitle: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.3,
  } as CSSProperties,
  
  cardRef: {
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.2,
  } as CSSProperties,
  
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: ordersColors.textSecondary,
  } as CSSProperties,
};

// Main Container Styles
export const ordersStyles = {
  // Page Container
  container: {
    minHeight: '100vh',
    background: ordersColors.background,
    paddingBottom: 40,
  } as CSSProperties,

  // Hero Header
  header: {
    background: ordersColors.primaryGradient,
    padding: '32px 24px',
    marginBottom: 32,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  } as CSSProperties,

  headerContent: {
    maxWidth: 1400,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    color: '#fff',
  } as CSSProperties,

  headerIcon: {
    fontSize: 48,
    background: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,

  headerTextContainer: {
    flex: 1,
  } as CSSProperties,

  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 700,
    margin: 0,
    lineHeight: 1.2,
  } as CSSProperties,

  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 4,
    display: 'block',
  } as CSSProperties,

  // Content Container
  contentWrapper: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '0 24px',
  } as CSSProperties,

  // Filter Section
  filterSection: {
    background: '#fff',
    borderRadius: 16,
    padding: '12px 16px',
    marginBottom: 24,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as CSSProperties['flexWrap'],
    gap: 16,
    border: '1px solid #f0f2f5',
  } as CSSProperties,

  filterLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#f8fafc',
    padding: '6px 12px',
    borderRadius: 10,
  } as CSSProperties,

  filterRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap' as CSSProperties['flexWrap'],
  } as CSSProperties,

  statsText: {
    fontSize: 13,
    color: ordersColors.textSecondary,
    fontWeight: 500,
  } as CSSProperties,

  // Order Card
  orderCard: {
    borderRadius: 12,
    overflow: 'hidden',
    border: 'none',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    height: '100%',
  } as CSSProperties,

  orderCardHover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  } as CSSProperties,

  // Card Header
  cardHeader: {
    padding: '14px 16px',
    borderBottom: `1px solid ${ordersColors.borderLight}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(to bottom, #fafafa 0%, #ffffff 100%)',
  } as CSSProperties,

  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  } as CSSProperties,

  // Card Body
  cardBody: {
    padding: '16px 18px',
  } as CSSProperties,

  // Reference Section
  refSection: {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: `1px solid ${ordersColors.borderLight}`,
  } as CSSProperties,

  refLabel: {
    ...ordersTypography.label,
    marginBottom: 4,
    display: 'block',
  } as CSSProperties,

  refValue: {
    ...ordersTypography.cardRef,
    color: ordersColors.text,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  } as CSSProperties,

  // Items Summary
  itemsSummary: {
    background: ordersColors.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
    border: `1px solid ${ordersColors.primaryDark}20`,
  } as CSSProperties,

  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    fontSize: 13,
  } as CSSProperties,

  summaryRowBold: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTop: `1px solid ${ordersColors.primary}30`,
    fontWeight: 600,
    fontSize: 14,
  } as CSSProperties,

  // Total Amount
  totalSection: {
    background: 'linear-gradient(135deg, #f6ffed 0%, #e6fffb 100%)',
    padding: '10px 14px',
    borderRadius: 8,
    marginBottom: 14,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: `1px solid ${ordersColors.served}30`,
  } as CSSProperties,

  totalLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: ordersColors.textSecondary,
  } as CSSProperties,

  totalAmount: {
    fontSize: 20,
    fontWeight: 700,
    color: '#52c41a',
  } as CSSProperties,

  // Metadata Section
  metaSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: ordersColors.textSecondary,
    fontSize: 12,
    marginBottom: 14,
  } as CSSProperties,

  // Action Button
  actionButton: {
    borderRadius: 8,
    fontWeight: 600,
    height: 40,
    fontSize: 14,
  } as CSSProperties,

  // Empty State
  emptyState: {
    background: '#fff',
    borderRadius: 12,
    padding: 60,
    textAlign: 'center' as CSSProperties['textAlign'],
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  } as CSSProperties,

  // Loading State
  loadingState: {
    background: '#fff',
    borderRadius: 12,
    padding: 60,
    textAlign: 'center' as CSSProperties['textAlign'],
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  } as CSSProperties,
};

// Mobile Responsive Styles (to be used with styled-jsx or inline media queries)
export const ordersResponsiveStyles = `
  @media (max-width: 768px) {
    .orders-header {
      padding: 24px 16px !important;
    }

    .orders-header-icon {
      font-size: 36px !important;
      padding: 12px !important;
    }

    .orders-page-title {
      font-size: 22px !important;
    }

    .orders-page-subtitle {
      font-size: 13px !important;
    }

    .orders-content-wrapper {
      padding: 0 16px !important;
    }

    .orders-filter-section {
      padding: 12px 16px !important;
    }

    .orders-card-body {
      padding: 14px 16px !important;
    }

    .orders-ref-value {
      font-size: 16px !important;
    }

    .orders-total-amount {
      font-size: 18px !important;
    }
  }

  @media (max-width: 480px) {
    .orders-header {
      padding: 20px 12px !important;
    }

    .orders-content-wrapper {
      padding: 0 12px !important;
    }

    .orders-card-header {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 8px;
    }

    .orders-filter-section {
      flex-direction: column;
      align-items: stretch !important;
    }
  }
`;
