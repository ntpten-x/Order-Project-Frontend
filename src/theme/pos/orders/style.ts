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
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.2,
    margin: 0,
    color: orderColors.text,
  } as CSSProperties,

  sectionTitle: {
    fontSize: 20,
    fontWeight: 600,
    lineHeight: 1.4,
    color: orderColors.text,
  } as CSSProperties,

  cardTitle: {
    fontSize: 17,
    fontWeight: 600,
    lineHeight: 1.3,
    color: orderColors.text,
  } as CSSProperties,

  cardRef: {
    fontSize: 19,
    fontWeight: 700,
    lineHeight: 1.2,
    color: orderColors.text,
  } as CSSProperties,

  label: {
    fontSize: 15,
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

  // Compact Header - Enhanced glass effect
  header: {
    background: `linear-gradient(180deg, ${orderColors.white} 0%, rgba(255, 255, 255, 0.98) 100%)`,
    backdropFilter: 'blur(20px) saturate(180%)',
    padding: '14px 20px',
    borderBottom: `1px solid ${orderColors.border}`,
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s ease',
  } as CSSProperties,

  headerContent: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  } as CSSProperties,

  headerBackButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: `linear-gradient(135deg, ${orderColors.backgroundSecondary} 0%, ${orderColors.white} 100%)`,
    border: `1px solid ${orderColors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: orderColors.text,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  } as CSSProperties,

  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    color: orderColors.text,
    flex: 1,
    lineHeight: 1.3,
  } as CSSProperties,

  headerSubtitle: {
    fontSize: 12,
    color: orderColors.textSecondary,
  } as CSSProperties,

  tableNameBadge: {
    background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: 13,
    padding: '5px 12px',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    margin: 0,
    height: 'fit-content',
    lineHeight: 1.3,
  } as CSSProperties,

  channelBadge: {
    fontWeight: 500,
    fontSize: 12,
    borderRadius: 8,
    padding: '4px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    height: 26,
    border: 'none',
    lineHeight: 1.3,
  } as CSSProperties,

  headerMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap' as const,
  } as CSSProperties,

  headerMetaSeparator: {
    height: 12,
    width: 1,
    background: orderColors.border,
    margin: '0 2px',
  } as CSSProperties,

  // Content Container - Enhanced spacing
  contentWrapper: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '20px 16px',
  } as CSSProperties,

  // Card Styles - Modern design with enhanced depth
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.08)',
    border: `1px solid ${orderColors.border}`,
    marginBottom: 16,
    background: orderColors.white,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative' as const,
  } as CSSProperties,

  cardHeader: {
    background: orderColors.white,
    padding: '16px 20px',
    borderBottom: `1px solid ${orderColors.borderLight}`,
  } as CSSProperties,

  // Summary Card - Enhanced design
  summaryCard: {
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.08)',
    background: `linear-gradient(180deg, ${orderColors.white} 0%, ${orderColors.backgroundSecondary} 100%)`,
    padding: 20,
    border: `1px solid ${orderColors.border}`,
    position: 'sticky' as const,
    top: 80,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  } as CSSProperties,

  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
  } as CSSProperties,

  summaryList: {
    background: `linear-gradient(135deg, ${orderColors.white} 0%, ${orderColors.backgroundSecondary} 100%)`,
    padding: '16px 18px',
    borderRadius: 12,
    marginBottom: '16px',
    border: `1px solid ${orderColors.border}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.2s ease',
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
    borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
    transition: 'all 0.2s ease',
  } as CSSProperties,

  summaryItemRowLast: {
    borderBottom: 'none',
  } as CSSProperties,

  summaryItemImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    objectFit: 'cover' as const,
    flexShrink: 0,
    border: `2px solid ${orderColors.borderLight}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.2s ease',
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

  // Order Item Card (Mobile) - Enhanced design
  itemCard: {
    background: orderColors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    border: `1px solid ${orderColors.border}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)',
    position: 'relative' as const,
  } as CSSProperties,

  itemCardActive: {
    borderLeft: `4px solid ${orderColors.primary}`,
    background: `linear-gradient(90deg, ${orderColors.primaryLight}05 0%, ${orderColors.white} 8%)`,
    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)',
  } as CSSProperties,

  itemCardServed: {
    background: `linear-gradient(90deg, ${orderColors.servedLight}08 0%, ${orderColors.backgroundSecondary} 8%)`,
    borderLeft: `4px solid ${orderColors.served}`,
    boxShadow: '0 2px 12px rgba(16, 185, 129, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)',
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
    padding: '0 12px',
    height: 32,
    fontSize: 12,
    borderRadius: 8,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s ease',
  } as CSSProperties,

  actionButtonSecondary: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    border: `1px solid ${orderColors.border}`,
    background: orderColors.white,
    color: orderColors.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    padding: 0,
  } as CSSProperties,

  unserveButton: {
    borderRadius: 8,
    height: 32,
    fontSize: 12,
    fontWeight: 500,
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
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    background: `linear-gradient(135deg, ${orderColors.primary} 0%, ${orderColors.primaryDark} 100%)`,
    color: orderColors.white,
    border: 'none',
    fontWeight: 500,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: `0 2px 8px ${orderColors.primary}25`,
  } as CSSProperties,

  // Product Thumbnails - Enhanced design
  productThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    objectFit: "cover" as const,
    border: `2px solid ${orderColors.borderLight}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.2s ease',
  } as CSSProperties,

  productThumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    background: `linear-gradient(135deg, ${orderColors.backgroundSecondary} 0%, ${orderColors.borderLight} 100%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: orderColors.textLight,
    fontSize: 20,
    opacity: 0.6,
    border: `2px solid ${orderColors.borderLight}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  } as CSSProperties,

  categoryTag: {
    fontSize: 11,
    borderRadius: 6,
    padding: "3px 10px",
    margin: "2px 0 0 0",
    fontWeight: 600,
    border: 'none',
  } as CSSProperties,

  priceTag: {
    fontSize: 16,
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
    padding: '16px 20px',
    borderBottom: `1px solid ${orderColors.borderLight}`,
    background: orderColors.white,
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
  } as CSSProperties,

  // Quantity control
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: '20px',
    background: orderColors.primaryLight,
    borderRadius: 16,
    border: `1px solid ${orderColors.primary}20`,
  } as CSSProperties,

  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    fontWeight: 600,
    transition: 'all 0.2s ease',
  } as CSSProperties,

  quantityDisplay: {
    fontSize: 32,
    fontWeight: 700,
    color: orderColors.primary,
    minWidth: 60,
    textAlign: 'center' as const,
    lineHeight: 1,
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
    gap: 12,
    padding: '16px 20px',
    borderTop: `1px solid ${orderColors.borderLight}`,
    background: orderColors.white,
    position: 'sticky' as const,
    bottom: 0,
    zIndex: 10,
  } as CSSProperties,

  primaryButton: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    fontWeight: 600,
    fontSize: 16,
    background: `linear-gradient(135deg, ${orderColors.primary} 0%, ${orderColors.primaryDark} 100%)`,
    border: 'none',
    boxShadow: `0 6px 16px ${orderColors.primary}30`,
    transition: 'all 0.2s ease',
  } as CSSProperties,

  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    fontWeight: 500,
    fontSize: 15,
    border: `1px solid ${orderColors.border}`,
    background: orderColors.white,
    transition: 'all 0.2s ease',
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
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
    boxShadow: orderColors.cardShadow,
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
    padding: '14px 12px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    minHeight: 70,
    justifyContent: 'center',
  } as CSSProperties,

  productName: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    color: orderColors.text,
    width: '100%',
    lineHeight: 1.4,
  } as CSSProperties,

  productPrice: {
    fontSize: 16,
    fontWeight: 700,
    color: orderColors.primary,
    lineHeight: 1.2,
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
    padding: '12px 14px',
    background: orderColors.backgroundSecondary,
    borderRadius: 12,
    border: `1px solid ${orderColors.border}`,
    transition: 'all 0.2s ease',
  } as CSSProperties,

  detailItemRowHover: {
    background: orderColors.primaryLight,
    borderColor: orderColors.primary,
  } as CSSProperties,
};

// ============================================
// Responsive CSS Styles (List & Detail)
// ============================================
export const ordersResponsiveStyles = `
  /* ===== Global Animations ===== */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
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

  .fade-in {
    animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .scale-in {
    animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .scale-hover {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .scale-hover:hover {
    transform: scale(1.05);
  }

  .scale-hover:active {
    transform: scale(0.98);
  }

  /* Enhanced card hover effects */
  .order-detail-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .order-detail-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.1) !important;
    transform: translateY(-2px);
  }

  /* Smooth transitions for item cards */
  .order-item-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .order-item-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.1) !important;
  }

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
      padding: 10px 12px !important;
    }

    .order-detail-header .header-content {
      gap: 10px !important;
    }

    .order-detail-header .header-back-button {
      width: 36px !important;
      height: 36px !important;
    }

    .order-detail-header .header-title {
      font-size: 15px !important;
    }

    .order-detail-content {
      padding: 12px !important;
    }

    .order-detail-card {
      margin-bottom: 10px !important;
      border-radius: 12px !important;
    }

    .order-detail-card .ant-card-head {
      padding: 12px 14px !important;
      min-height: auto !important;
      border-bottom: 1px solid #E2E8F0 !important;
    }

    .order-detail-card .ant-card-head-title {
      font-size: 17px !important;
      font-weight: 600 !important;
      padding: 0 !important;
      width: 100% !important;
    }

    .order-detail-card .ant-card-body {
      padding: 12px 14px !important;
    }

    /* Card Header Layout */
    .card-header-wrapper {
      display: flex !important;
      flex-direction: column !important;
      gap: 10px !important;
      width: 100% !important;
    }

    .card-header-left {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      flex: 1 !important;
      min-width: 0 !important;
    }

    .card-header-right {
      display: flex !important;
      align-items: center !important;
      justify-content: flex-end !important;
      gap: 8px !important;
      flex-wrap: wrap !important;
      flex-shrink: 0 !important;
    }

    /* Bulk Actions Container */
    .bulk-actions-container {
      display: flex !important;
      gap: 6px !important;
      align-items: center !important;
      flex-wrap: wrap !important;
    }

    /* Header Actions Container - แสดงเสมอ */
    .header-actions-container {
      display: flex !important;
      gap: 6px !important;
      align-items: center !important;
      flex-shrink: 0 !important;
    }

    .section-title-text {
      font-size: 17px !important;
      line-height: 1.4 !important;
      font-weight: 600 !important;
    }

    /* Bulk Actions */
    .bulk-action-btn {
      height: 34px !important;
      font-size: 13px !important;
      border-radius: 8px !important;
      padding: 0 12px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 5px !important;
      white-space: nowrap !important;
      min-width: fit-content !important;
      font-weight: 500 !important;
    }

    .bulk-action-btn .anticon {
      font-size: 13px !important;
      flex-shrink: 0 !important;
    }

    .bulk-action-btn span {
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .header-action-btn {
      height: 34px !important;
      min-width: 34px !important;
      border-radius: 8px !important;
      font-size: 13px !important;
      padding: 0 12px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
      transition: all 0.2s ease !important;
      font-weight: 500 !important;
    }

    .header-action-btn.ant-btn-icon-only {
      width: 34px !important;
      padding: 0 !important;
    }

    .header-action-btn:hover {
      transform: translateY(-1px) !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
    }

    .header-action-btn:active {
      transform: translateY(0) !important;
    }

    .header-action-btn span {
      white-space: nowrap !important;
    }

    .order-detail-card .ant-card-head-title {
      font-size: 16px !important;
      font-weight: 600 !important;
    }

    .summary-card {
      padding: 16px !important;
      border-radius: 16px !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.08) !important;
    }

    .summary-card .ant-card-body {
      padding: 16px !important;
    }

    .summary-card .ant-card-head {
      padding: 12px 14px !important;
      border-bottom: 1px solid #E2E8F0 !important;
    }

    .summary-card .ant-card-head-title {
      font-size: 15px !important;
      font-weight: 600 !important;
    }

    /* Better button spacing on mobile */
    .summary-card .ant-btn {
      margin-top: 12px !important;
      height: 44px !important;
      font-size: 14px !important;
      border-radius: 10px !important;
    }

    .summary-card .ant-btn-lg {
      height: 44px !important;
      font-size: 14px !important;
    }

    /* Better spacing in summary */
    .summary-list {
      padding: 10px 12px !important;
      margin-bottom: 10px !important;
    }

    .summary-item-row {
      padding: 10px 0 !important;
    }

    .summary-item-image {
      width: 40px !important;
      height: 40px !important;
    }

    /* Queue button on mobile */
    .queue-action-button {
      height: 36px !important;
      font-size: 13px !important;
      padding: 0 12px !important;
    }

    /* Product Grid - 2 columns */
    .product-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 12px !important;
      padding: 16px !important;
    }

    .product-card-hoverable {
      min-height: 180px !important;
    }

    .product-card-hoverable .product-info {
      padding: 12px 10px !important;
      min-height: 65px !important;
    }

    .product-card-hoverable .product-name {
      font-size: 13px !important;
    }

    .product-card-hoverable .product-price {
      font-size: 15px !important;
    }

    /* Item Cards */
    .order-item-card {
      border-radius: 14px !important;
      margin-bottom: 12px !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.08) !important;
      padding: 16px !important;
    }

    .order-item-card:active {
      transform: scale(0.98) !important;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08) !important;
    }

    .order-item-card:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.12) !important;
      transform: translateY(-2px) !important;
    }

    /* Better spacing for mobile cards */
    .order-item-card > div:first-child {
      margin-bottom: 10px !important;
    }

    .order-item-card .ant-checkbox-wrapper {
      padding: 4px !important;
    }

    .order-item-card .ant-checkbox-wrapper span:last-child {
      font-size: 16px !important;
      line-height: 1.5 !important;
      font-weight: 600 !important;
    }

    /* Better text sizing on mobile */
    .order-item-card .ant-typography {
      font-size: 14px !important;
      line-height: 1.5 !important;
    }

    .order-item-card .ant-typography strong {
      font-size: 16px !important;
    }

    .order-item-card .ant-tag {
      font-size: 10px !important;
      padding: 3px 8px !important;
      line-height: 1.3 !important;
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
      -webkit-overflow-scrolling: touch !important;
    }

    /* Better spacing for mobile */
    .modal-header {
      padding: 14px 16px !important;
    }

    .detail-section {
      padding: 16px !important;
    }

    .detail-section > div {
      gap: 16px !important;
    }

    /* Product info on mobile */
    .product-info-section {
      gap: 12px !important;
    }

    .product-info-section img {
      width: 80px !important;
      height: 80px !important;
    }
  }

  @media (max-width: 480px) {
    /* List Page Low Res */
    .orders-header {
      padding: 16px 14px 40px !important;
    }

    /* Card Header on Small Screens */
    .card-header-wrapper {
      gap: 8px !important;
    }

    .card-header-left {
      gap: 8px !important;
    }

    .section-title-text {
      font-size: 16px !important;
      font-weight: 600 !important;
    }

    .bulk-actions-container {
      gap: 4px !important;
    }

    .bulk-action-btn {
      height: 32px !important;
      font-size: 12px !important;
      padding: 0 10px !important;
      gap: 4px !important;
    }

    .bulk-action-btn .anticon {
      font-size: 12px !important;
    }

    .header-actions-container {
      gap: 4px !important;
    }

    .header-action-btn {
      height: 32px !important;
      min-width: 32px !important;
      font-size: 12px !important;
      padding: 0 10px !important;
    }

    .header-action-btn.ant-btn-icon-only {
      width: 32px !important;
    }

    .header-action-btn {
      height: 30px !important;
      min-width: 30px !important;
      font-size: 11px !important;
      padding: 0 8px !important;
    }

    .header-action-btn.ant-btn-icon-only {
      width: 30px !important;
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

    .product-card-hoverable {
      min-height: 170px !important;
    }

    .product-card-hoverable .product-info {
      padding: 10px 8px !important;
      min-height: 60px !important;
    }

    .product-card-hoverable .product-name {
      font-size: 12px !important;
    }

    .product-card-hoverable .product-price {
      font-size: 14px !important;
    }

    .modal-header {
      padding: 14px 16px !important;
    }

    .quantity-control {
      padding: 16px !important;
      gap: 16px !important;
    }

    .quantity-button {
      width: 44px !important;
      height: 44px !important;
      font-size: 18px !important;
    }

    .quantity-display {
      font-size: 28px !important;
      min-width: 50px !important;
    }

    .action-buttons {
      padding: 14px 16px !important;
      gap: 10px !important;
    }

    .primary-button,
    .secondary-button {
      height: 48px !important;
      font-size: 15px !important;
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

    /* Card Header Desktop */
    .card-header-wrapper {
      flex-direction: row !important;
      justify-content: space-between !important;
      align-items: center !important;
    }

    .card-header-right {
      flex-wrap: nowrap !important;
      gap: 10px !important;
    }

    .bulk-actions-container {
      flex-wrap: nowrap !important;
      gap: 8px !important;
    }

    .bulk-action-btn {
      height: 38px !important;
      font-size: 14px !important;
      padding: 0 16px !important;
      white-space: nowrap !important;
      font-weight: 500 !important;
    }

    .bulk-action-btn .anticon {
      font-size: 14px !important;
    }

    .header-actions-container {
      gap: 8px !important;
    }

    .header-action-btn {
      height: 38px !important;
      min-width: 38px !important;
      font-size: 14px !important;
      padding: 0 16px !important;
      font-weight: 500 !important;
    }

    .header-action-btn.ant-btn-icon-only {
      width: 38px !important;
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

  .product-card-hoverable:active {
    transform: scale(0.98);
  }

  .detail-item-row:hover {
    background: #EFF6FF !important;
    border-color: #3B82F6 !important;
  }

  .primary-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4) !important;
  }

  .primary-button:active {
    transform: translateY(0);
  }

  .secondary-button:hover {
    background: #F8FAFC !important;
    border-color: #3B82F6 !important;
  }

  .quantity-button:hover {
    transform: scale(1.05);
  }

  .quantity-button:active {
    transform: scale(0.95);
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

  /* ===== Touch-Friendly Interactions ===== */
  @media (hover: none) and (pointer: coarse) {
    .scale-hover:active {
      transform: scale(0.95);
      opacity: 0.8;
    }

    .product-card-hoverable:active {
      transform: scale(0.97);
    }

    .order-item-card:active {
      transform: scale(0.97);
    }

    button:active {
      transform: scale(0.96);
    }
  }

  /* ===== Improved Touch Targets ===== */
  @media (max-width: 768px) {
    button,
    .ant-btn {
      min-height: 44px !important;
      min-width: 44px !important;
    }

    .ant-input,
    .ant-input-number {
      min-height: 44px !important;
    }

    .ant-checkbox-wrapper {
      padding: 8px !important;
    }
  }

  /* ===== Smooth Scrolling ===== */
  .order-detail-content,
  .mobile-fullscreen-modal .ant-modal-body {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }

  /* ===== Better Focus States ===== */
  .ant-input:focus,
  .ant-input-number:focus,
  .ant-input-number-focused {
    border-color: #3B82F6 !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
  }

  /* ===== Loading States ===== */
  .ant-btn-loading {
    pointer-events: none;
    opacity: 0.7;
  }

  /* ===== Empty State Improvements ===== */
  .empty-state-icon {
    font-size: 48px !important;
    color: #94A3B8 !important;
    margin-bottom: 16px !important;
  }

  .empty-state-text {
    font-size: 15px !important;
    color: #64748B !important;
  }
`;
