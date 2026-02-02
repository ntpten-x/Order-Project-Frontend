import { CSSProperties } from 'react';
import { posColors } from '../index';

// ============================================
// Order Theme Constants - Soft Modern Clarity
// ============================================
export const orderColors = {
  // Primary - Softer blues
  primary: '#3B82F6',
  primaryLight: '#EFF6FF',
  primaryDark: '#2563EB',
  primaryGradient: 'linear-gradient(145deg, #3B82F6 0%, #60A5FA 50%, #93C5FD 100%)',

  // Status Colors - Softer palette
  pending: '#F59E0B',
  pendingLight: '#FFFBEB',
  cooking: '#3B82F6',
  cookingLight: '#EFF6FF',
  served: '#10B981',
  servedLight: '#ECFDF5',
  paid: '#06B6D4',
  paidLight: '#ECFEFF',
  cancelled: '#EF4444',
  cancelledLight: '#FEF2F2',

  // Compatibility Aliases
  success: '#10B981',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  warning: '#F59E0B',
  priceTotal: '#059669',

  waitingForPayment: '#8B5CF6',
  waitingForPaymentLight: '#F5F3FF',

  // Channel Colors
  dineIn: '#3B82F6',
  takeAway: '#F59E0B',
  delivery: '#8B5CF6',

  // Base Colors - Slate tones
  text: '#1E293B',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  textMuted: posColors.textMuted,
  background: '#F8FAFC',
  backgroundSecondary: '#F1F5F9',
  white: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Card Shadow
  cardShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
  cardShadowHover: '0 12px 32px rgba(0, 0, 0, 0.08)',
};

export const orderDetailColors = orderColors;


export const orderTypography = {
  pageTitle: {
    fontSize: 26,
    fontWeight: 700,
    lineHeight: 1.2,
    margin: 0,
    color: orderColors.text,
  } as CSSProperties,

  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    lineHeight: 1.4,
    color: orderColors.text,
  } as CSSProperties,

  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 1.3,
    color: orderColors.text,
  } as CSSProperties,

  cardRef: {
    fontSize: 17,
    fontWeight: 700,
    lineHeight: 1.2,
    color: orderColors.text,
  } as CSSProperties,

  label: {
    fontSize: 13,
    fontWeight: 500,
    color: orderColors.textSecondary,
  } as CSSProperties,
};

export const orderDetailTypography = orderTypography;


export const orderBreakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1200,
};

// ============================================
// Styles for Orders List Page
// ============================================
export const ordersStyles = {
  // Page Container
  container: {
    minHeight: '100vh',
    background: orderColors.background,
    paddingBottom: 100,
  } as CSSProperties,

  // Hero Header - Softer gradient
  header: {
    background: orderColors.primaryGradient,
    padding: '20px 20px 48px',
    boxShadow: '0 4px 20px rgba(59, 130, 246, 0.15)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  } as CSSProperties,

  headerContent: {
    maxWidth: 1400,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    color: '#fff',
  } as CSSProperties,

  headerIcon: {
    fontSize: 44,
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    borderRadius: 16,
    padding: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255,255,255,0.3)',
  } as CSSProperties,

  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  } as CSSProperties,

  headerTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 700,
    margin: 0,
    lineHeight: 1.2,
    textShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as CSSProperties,

  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 4,
    display: 'block',
    fontWeight: 500,
  } as CSSProperties,

  // Content Container
  contentWrapper: {
    maxWidth: 1400,
    margin: '-24px auto 0',
    padding: '0 20px',
    position: 'relative' as const,
    zIndex: 10,
  } as CSSProperties,

  // Filter Section
  filterSection: {
    background: '#fff',
    borderRadius: 20,
    padding: '14px 18px',
    marginBottom: 20,
    boxShadow: orderColors.cardShadow,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as CSSProperties['flexWrap'],
    gap: 14,
    border: '1px solid rgba(226, 232, 240, 0.8)',
  } as CSSProperties,

  filterLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#f8fafc',
    padding: '8px 14px',
    borderRadius: 12,
  } as CSSProperties,

  filterRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap' as CSSProperties['flexWrap'],
  } as CSSProperties,

  statsText: {
    fontSize: 13,
    color: orderColors.textSecondary,
    fontWeight: 500,
  } as CSSProperties,

  // Order Card - Modern design
  orderCard: {
    borderRadius: 20,
    overflow: 'hidden',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    boxShadow: orderColors.cardShadow,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    height: '100%',
    cursor: 'pointer',
    background: orderColors.white,
  } as CSSProperties,

  orderCardHover: {
    transform: 'translateY(-6px)',
    boxShadow: orderColors.cardShadowHover,
    borderColor: orderColors.primary,
  } as CSSProperties,

  // Card Header
  cardHeader: {
    padding: '16px 18px',
    borderBottom: `1px solid ${orderColors.borderLight}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(to bottom, #fafafa 0%, #ffffff 100%)',
  } as CSSProperties,

  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  } as CSSProperties,

  // Card Body
  cardBody: {
    padding: '18px 20px',
  } as CSSProperties,

  // Reference Section
  refSection: {
    marginBottom: 16,
    paddingBottom: 14,
    borderBottom: `1px solid ${orderColors.borderLight}`,
  } as CSSProperties,

  refLabel: {
    ...orderTypography.label,
    marginBottom: 4,
    display: 'block',
  } as CSSProperties,

  refValue: {
    ...orderTypography.cardRef,
    color: orderColors.text,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  } as CSSProperties,

  // Items Summary
  itemsSummary: {
    background: orderColors.primaryLight,
    padding: '14px 16px',
    borderRadius: 14,
    marginBottom: 16,
    border: `1px solid ${orderColors.primaryDark}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    borderTop: `1px solid ${orderColors.primary}30`,
    fontWeight: 600,
    fontSize: 14,
  } as CSSProperties,

  // Total Amount
  totalSection: {
    background: `linear-gradient(135deg, ${orderColors.servedLight} 0%, #D1FAE5 100%)`,
    padding: '14px 16px',
    borderRadius: 14,
    marginBottom: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: `1px solid ${orderColors.served}25`,
  } as CSSProperties,

  totalLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: orderColors.textSecondary,
  } as CSSProperties,

  totalAmount: {
    fontSize: 22,
    fontWeight: 700,
    color: orderColors.priceTotal,
  } as CSSProperties,

  // Metadata Section
  metaSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: orderColors.textSecondary,
    fontSize: 13,
  } as CSSProperties,

  // Action Button
  actionButton: {
    borderRadius: 12,
    fontWeight: 600,
    height: 44,
    fontSize: 14,
    width: '100%',
  } as CSSProperties,

  // Empty State
  emptyState: {
    background: '#fff',
    borderRadius: 20,
    padding: 60,
    textAlign: 'center' as CSSProperties['textAlign'],
    boxShadow: orderColors.cardShadow,
  } as CSSProperties,

  // Loading State
  loadingState: {
    background: '#fff',
    borderRadius: 20,
    padding: 60,
    textAlign: 'center' as CSSProperties['textAlign'],
    boxShadow: orderColors.cardShadow,
  } as CSSProperties,
};

// ============================================
// Styles for Order Detail Page
// ============================================
export const orderDetailStyles = {
  // Page Container
  container: {
    minHeight: '100vh',
    background: orderColors.background,
    paddingBottom: 100,
  } as CSSProperties,

  // Compact Header - Glass effect
  header: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: '14px 20px',
    borderBottom: `1px solid ${orderColors.borderLight}`,
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  } as CSSProperties,

  headerContent: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  } as CSSProperties,

  headerBackButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    background: orderColors.primaryLight,
    border: '1px solid rgba(59, 130, 246, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: orderColors.primary,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as CSSProperties,

  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    color: orderColors.text,
    flex: 1,
  } as CSSProperties,

  headerSubtitle: {
    fontSize: 12,
    color: orderColors.textSecondary,
  } as CSSProperties,

  tableNameBadge: {
    background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 15,
    padding: '6px 16px',
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    margin: 0,
    height: 'fit-content',
  } as CSSProperties,

  channelBadge: {
    fontWeight: 600,
    fontSize: 12,
    borderRadius: 10,
    padding: '4px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    height: 30,
    border: 'none',
  } as CSSProperties,

  headerMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  } as CSSProperties,

  headerMetaSeparator: {
    height: 14,
    width: 1,
    background: '#e2e8f0',
    margin: '0 2px',
  } as CSSProperties,

  // Content Container
  contentWrapper: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '20px',
  } as CSSProperties,

  // Card Styles - Modern design
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: orderColors.cardShadow,
    border: '1px solid rgba(226, 232, 240, 0.8)',
    marginBottom: 20,
    background: orderColors.white,
  } as CSSProperties,

  cardHeader: {
    background: orderColors.white,
    padding: '16px 20px',
    borderBottom: `1px solid ${orderColors.borderLight}`,
  } as CSSProperties,

  // Summary Card
  summaryCard: {
    borderRadius: 20,
    boxShadow: orderColors.cardShadow,
    background: orderColors.white,
    padding: 20,
    border: '1px solid rgba(226, 232, 240, 0.8)',
  } as CSSProperties,

  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
  } as CSSProperties,

  summaryList: {
    background: '#F8FAFC',
    padding: '14px 16px',
    borderRadius: 14,
    marginBottom: '18px',
    border: '1px solid #E2E8F0',
  } as CSSProperties,

  summaryMainRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 0',
    marginTop: '4px',
  } as CSSProperties,

  summaryItemRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: 14,
    padding: '14px 0',
    borderBottom: '1px dashed #E2E8F0',
  } as CSSProperties,

  summaryItemImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    objectFit: 'cover' as const,
    flexShrink: 0,
    border: '1px solid #F1F5F9',
  } as CSSProperties,

  summaryItemContent: {
    flex: 1,
    minWidth: 0,
  } as CSSProperties,

  summaryDetailText: {
    fontSize: 12,
    color: orderColors.success,
    marginTop: 2,
    paddingLeft: 0,
  } as CSSProperties,

  // Empty State
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px 24px',
    background: orderColors.backgroundSecondary,
    borderRadius: 16,
  } as CSSProperties,

  // Loading State
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '80vh',
    width: '100%',
  } as CSSProperties,

  // Complete State Card
  completeCard: {
    background: `linear-gradient(135deg, ${orderColors.servedLight} 0%, #D1FAE5 100%)`,
    padding: '24px',
    borderRadius: 16,
    border: `1px solid ${orderColors.served}25`,
    textAlign: 'center' as const,
  } as CSSProperties,

  // Order Item Card (Mobile)
  itemCard: {
    background: orderColors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    border: `1px solid ${orderColors.border}`,
    transition: 'all 0.2s ease',
  } as CSSProperties,

  itemCardActive: {
    borderLeft: `4px solid ${orderColors.primary}`,
  } as CSSProperties,

  itemCardServed: {
    background: orderColors.backgroundSecondary,
    borderLeft: `4px solid ${orderColors.served}`,
  } as CSSProperties,

  // Action Bar (Floating)
  floatingActions: {
    position: 'fixed' as const,
    bottom: 120,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(12px)',
    padding: '12px 20px',
    borderRadius: 20,
    boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
    zIndex: 1000,
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    minWidth: 'max-content',
    border: `1px solid ${orderColors.border}`,
  } as CSSProperties,

  floatingActionButton: {
    borderRadius: 14,
    height: 44,
    padding: '0 24px',
    fontSize: 14,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  } as CSSProperties,

  bulkActionButtonDesktop: {
    padding: '0 14px',
    height: 36,
    fontSize: 13,
    borderRadius: 10,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s ease',
  } as CSSProperties,

  actionButtonSecondary: {
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    border: `1px solid ${orderColors.border}`,
    background: orderColors.white,
    color: orderColors.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    padding: 0,
  } as CSSProperties,

  unserveButton: {
    borderRadius: 12,
    height: 34,
    fontSize: 12,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    border: `1px solid ${orderColors.danger}`,
    color: orderColors.danger,
    backgroundColor: orderColors.dangerLight,
    transition: 'all 0.2s ease',
  } as CSSProperties,

  actionButtonPrimary: {
    height: 36,
    padding: '0 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    background: `linear-gradient(135deg, ${orderColors.primary} 0%, ${orderColors.primaryDark} 100%)`,
    color: orderColors.white,
    border: 'none',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: `0 4px 12px ${orderColors.primary}30`,
  } as CSSProperties,

  // Product Thumbnails
  productThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    objectFit: "cover" as const,
    border: `1px solid ${orderColors.borderLight}`,
  } as CSSProperties,

  productThumbPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 12,
    background: `linear-gradient(135deg, ${orderColors.primaryLight} 0%, #DBEAFE 100%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: orderColors.primary,
    fontSize: 20,
    opacity: 0.6,
  } as CSSProperties,

  categoryTag: {
    fontSize: 10,
    borderRadius: 6,
    padding: "2px 8px",
    margin: "2px 0 0 0",
    fontWeight: 600,
    border: 'none',
  } as CSSProperties,

  priceTag: {
    fontSize: 14,
    color: orderColors.primary,
    fontWeight: 600,
  } as CSSProperties,

  masterCheckboxWrapper: {
    display: 'inline-flex',
    padding: '8px',
    background: orderColors.primaryLight,
    borderRadius: '10px',
    border: `1px solid ${orderColors.primary}30`,
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)',
    transition: 'all 0.2s ease',
  } as CSSProperties,

  masterCheckbox: {
    transform: 'scale(1.2)',
  } as CSSProperties,
};

// ============================================
// Modal Styles
// ============================================
export const modalStyles = {
  // Fullscreen modal for mobile
  mobileModal: {
    top: 0,
    margin: 0,
    padding: 0,
    maxWidth: '100vw',
  } as CSSProperties,

  // Modal header
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '18px 20px',
    borderBottom: `1px solid ${orderColors.borderLight}`,
    background: orderColors.white,
  } as CSSProperties,

  // Quantity control
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    padding: '18px',
    background: orderColors.primaryLight,
    borderRadius: 16,
    border: `1px solid ${orderColors.primary}20`,
  } as CSSProperties,

  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
  } as CSSProperties,

  quantityDisplay: {
    fontSize: 28,
    fontWeight: 700,
    color: orderColors.primary,
    minWidth: 48,
    textAlign: 'center' as const,
  } as CSSProperties,

  // Price display
  priceCard: {
    background: `linear-gradient(135deg, ${orderColors.servedLight} 0%, #D1FAE5 100%)`,
    padding: '18px 22px',
    borderRadius: 16,
    border: `1px solid ${orderColors.served}25`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as CSSProperties,

  priceValue: {
    fontSize: 20,
    fontWeight: 700,
    color: orderColors.priceTotal,
  } as CSSProperties,

  // Action buttons
  actionButtons: {
    display: 'flex',
    gap: 14,
    padding: '18px 20px',
    borderTop: `1px solid ${orderColors.borderLight}`,
    background: orderColors.white,
  } as CSSProperties,

  primaryButton: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    fontWeight: 600,
    fontSize: 15,
    background: `linear-gradient(135deg, ${orderColors.primary} 0%, ${orderColors.primaryDark} 100%)`,
    border: 'none',
    boxShadow: `0 6px 16px ${orderColors.primary}30`,
  } as CSSProperties,

  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    fontWeight: 500,
    fontSize: 15,
    border: `1px solid ${orderColors.border}`,
    background: orderColors.white,
  } as CSSProperties,
};

// ============================================
// AddItemsModal Styles
// ============================================
export const addItemsModalStyles = {
  // Search bar
  searchBar: {
    padding: '14px 20px',
    borderBottom: `1px solid ${orderColors.borderLight}`,
    position: 'sticky' as const,
    top: 0,
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    zIndex: 10,
  } as CSSProperties,

  searchInput: {
    borderRadius: 14,
    height: 48,
    border: `1px solid ${orderColors.border}`,
  } as CSSProperties,

  // Product grid
  productGrid: {
    display: 'grid',
    gap: 14,
    padding: 20,
  } as CSSProperties,

  // Product Card
  productCard: {
    borderRadius: 18,
    overflow: 'hidden',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    border: `1px solid ${orderColors.border}`,
    background: orderColors.white,
  } as CSSProperties,

  productCardHover: {
    transform: 'translateY(-4px)',
    boxShadow: orderColors.cardShadowHover,
    borderColor: orderColors.primary,
  } as CSSProperties,

  productImage: {
    width: '100%',
    height: 110,
    objectFit: 'cover' as const,
  } as CSSProperties,

  productPlaceholder: {
    width: '100%',
    height: 110,
    background: `linear-gradient(135deg, ${orderColors.primaryLight} 0%, #DBEAFE 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: orderColors.primary,
    fontSize: 14,
    opacity: 0.5,
  } as CSSProperties,

  productInfo: {
    padding: '12px 14px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  } as CSSProperties,

  productName: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 6,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    color: orderColors.text,
  } as CSSProperties,

  productPrice: {
    fontSize: 16,
    fontWeight: 700,
    color: orderColors.primary,
  } as CSSProperties,

  // Detail section
  detailSection: {
    padding: '20px',
  } as CSSProperties,

  detailImage: {
    width: '100%',
    maxHeight: 200,
    objectFit: 'cover' as const,
    borderRadius: 16,
    boxShadow: orderColors.cardShadow,
  } as CSSProperties,

  // Detail items (extras)
  detailItemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    padding: '10px 14px',
    background: orderColors.backgroundSecondary,
    borderRadius: 12,
    border: `1px solid ${orderColors.border}`,
  } as CSSProperties,
};

// ============================================
// Responsive CSS Styles (List & Detail)
// ============================================
export const ordersResponsiveStyles = `
  /* ===== Mobile (< 768px) ===== */
  @media (max-width: 768px) {
    /* List Page */
    .orders-header {
      padding: 20px 16px 44px !important;
      border-radius: 0 0 20px 20px !important;
    }

    .orders-header-icon {
      font-size: 32px !important;
      padding: 12px !important;
      border-radius: 14px !important;
    }

    .orders-page-title {
      font-size: 20px !important;
    }

    .orders-page-subtitle {
      font-size: 12px !important;
    }

    .orders-content-wrapper {
      padding: 0 16px !important;
      margin-top: -20px !important;
    }

    .orders-filter-section {
      padding: 12px 14px !important;
      border-radius: 16px !important;
    }

    .orders-card-body {
      padding: 16px !important;
    }

    .orders-ref-value {
      font-size: 15px !important;
    }

    .orders-total-amount {
      font-size: 20px !important;
    }

    /* Detail Page */
    .order-detail-header {
      padding: 12px 16px !important;
    }

    .order-detail-content {
      padding: 14px !important;
    }

    .order-detail-card {
      margin-bottom: 14px !important;
      border-radius: 18px !important;
    }

    .order-detail-card .ant-card-head {
      padding: 14px 16px !important;
      min-height: auto !important;
    }

    .order-detail-card .ant-card-body {
      padding: 14px 16px !important;
    }

    /* Product Grid - 2 columns */
    .product-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 12px !important;
      padding: 16px !important;
    }

    /* Item Cards */
    .order-item-card {
      border-radius: 14px !important;
      margin-bottom: 12px !important;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .order-item-card:active {
      transform: scale(0.98);
    }

    /* Action Buttons - Stack */
    .order-detail-actions {
      flex-direction: column !important;
      gap: 10px !important;
    }

    .order-detail-actions button {
      width: 100% !important;
      height: 48px !important;
      border-radius: 12px !important;
      font-size: 15px !important;
    }

    /* Table Hide */
    .order-detail-table-desktop {
      display: none !important;
    }

    .order-detail-cards-mobile {
      display: block !important;
    }

    /* Floating Action Bar */
    .floating-action-bar {
      display: flex !important;
      bottom: 110px !important;
      padding: 14px 20px !important;
      border-radius: 18px !important;
    }

    /* Modal - Fullscreen */
    .mobile-fullscreen-modal .ant-modal {
      max-width: 100vw !important;
      margin: 0 !important;
      padding: 0 !important;
      top: 0 !important;
    }

    .mobile-fullscreen-modal .ant-modal-content {
      border-radius: 0 !important;
      min-height: 100vh !important;
    }

    .mobile-fullscreen-modal .ant-modal-body {
      padding: 0 !important;
      max-height: calc(100vh - 60px) !important;
      overflow-y: auto !important;
    }
  }

  @media (max-width: 480px) {
    /* List Page Low Res */
    .orders-header {
      padding: 16px 14px 40px !important;
    }

    .orders-header-content-mobile {
      flex-wrap: wrap !important;
      gap: 12px !important;
    }

    .orders-back-button-mobile {
      order: 1 !important;
    }

    .orders-header-icon {
      order: 2 !important;
      width: 44px !important;
      height: 44px !important;
      padding: 10px !important;
      font-size: 20px !important;
    }

    .orders-header-text-mobile {
      order: 3 !important;
      flex: 1 1 100% !important;
    }

    .orders-header-actions-mobile {
      order: 4 !important;
      width: 100% !important;
      justify-content: space-between !important;
    }

    .orders-search-input-mobile {
      flex: 1 !important;
      min-width: 120px !important;
    }

    .orders-content-wrapper {
      padding: 0 12px !important;
    }

    .orders-card-header {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 10px;
    }

    .orders-filter-section {
      flex-direction: column;
      align-items: stretch !important;
    }

    /* Product Grid - smaller gap */
    .product-grid {
      gap: 10px !important;
      padding: 14px !important;
    }
  }

  /* ===== Tablet (768px+) ===== */
  @media (min-width: 768px) {
    .order-detail-header {
      padding: 16px 24px !important;
    }

    .order-detail-content {
      padding: 24px !important;
    }

    .order-detail-card .ant-card-head,
    .order-detail-card .ant-card-body {
      padding: 18px 24px !important;
    }

    .product-grid {
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 16px !important;
    }

    .order-detail-actions {
      flex-direction: row !important;
      flex-wrap: wrap !important;
      gap: 12px !important;
    }

    .order-detail-actions button {
      width: auto !important;
      flex: none !important;
    }

    .floating-action-bar {
      display: none !important;
    }

    /* Modal - Normal */
    .mobile-fullscreen-modal .ant-modal {
      max-width: 600px !important;
      margin: 24px auto !important;
      top: auto !important;
    }

    .mobile-fullscreen-modal .ant-modal-content {
      border-radius: 20px !important;
      min-height: auto !important;
    }

    .mobile-fullscreen-modal .ant-modal-body {
      max-height: calc(100vh - 200px) !important;
      padding: 0 !important;
    }
  }

  /* ===== Desktop (1024px+) ===== */
  @media (min-width: 1024px) {
    .order-detail-content {
      padding: 28px !important;
    }

    .product-grid {
      grid-template-columns: repeat(4, 1fr) !important;
      gap: 18px !important;
    }

    .order-detail-table-desktop {
      display: block !important;
    }

    .order-detail-cards-mobile {
      display: none !important;
    }

    .mobile-fullscreen-modal .ant-modal {
      max-width: 720px !important;
    }
  }

  /* ===== Utilities ===== */
  .hide-on-mobile {
    display: none !important;
  }

  .show-on-mobile-inline {
    display: inline-block !important;
  }

  .bulk-action-btn {
    padding: 0 10px !important;
    min-width: 44px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  @media (min-width: 768px) {
    .hide-on-mobile {
      display: flex !important;
    }
    
    .show-only-mobile,
    .show-on-mobile-inline {
      display: none !important;
    }

    .bulk-action-btn {
      padding: 0 14px !important;
      min-width: auto !important;
    }
  }

  /* ===== Card Hover ===== */
  .orders-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
    border-color: #3B82F6;
  }

  .orders-card:active {
    transform: scale(0.99);
  }

  .product-card-hoverable:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
    border-color: #3B82F6;
  }

  /* ===== Animations ===== */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px) translateX(-50%); }
    to { opacity: 1; transform: translateY(0) translateX(-50%); }
  }

  .fade-in {
    animation: fadeIn 0.35s ease forwards;
  }

  .scale-in {
    animation: scaleIn 0.3s ease forwards;
  }

  /* ===== Button Effects ===== */
  .scale-hover {
    transition: transform 0.2s ease;
  }

  .scale-hover:hover {
    transform: scale(1.02);
  }

  .scale-hover:active {
    transform: scale(0.98);
  }

  /* ===== Unserve Button Hover ===== */
  .unserve-button:hover {
    background-color: #FEF2F2 !important;
    border-color: #EF4444 !important;
    transform: scale(1.02);
  }

  /* ===== Hide Scrollbar ===== */
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }

  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
