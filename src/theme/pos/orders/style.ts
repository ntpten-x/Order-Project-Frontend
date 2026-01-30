import { CSSProperties } from 'react';

// ============================================
// Order Theme Constants
// ============================================
export const orderColors = {
    // Primary - Modern Blue
    primary: '#3b82f6',
    primaryLight: '#eff6ff',
    primaryDark: '#1d4ed8',
    primaryGradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',

    // Status Colors
    pending: '#f59e0b',
    pendingLight: '#fef3c7',
    cooking: '#3b82f6',
    cookingLight: '#dbeafe',
    served: '#10b981',
    servedLight: '#d1fae5',
    paid: '#13c2c2',
    paidLight: '#e6fffb',
    cancelled: '#ef4444',
    cancelledLight: '#fee2e2',

    // Compatibility Aliases
    success: '#10b981',
    danger: '#ef4444',
    dangerLight: '#fee2e2',
    warning: '#f59e0b',
    priceTotal: '#065f46',

    waitingForPayment: '#faad14',
    waitingForPaymentLight: '#fff7e6',

    // Channel Colors
    dineIn: '#722ed1',
    takeAway: '#fa8c16',
    delivery: '#eb2f96',

    // Base Colors
    text: '#1f2937',
    textSecondary: '#6b7280',
    textLight: '#9ca3af',
    background: '#f8fafc',
    backgroundSecondary: '#f1f5f9',
    white: '#ffffff',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',

    // Card Shadow
    cardShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
    cardShadowHover: '0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05)',
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
        fontSize: 16,
        fontWeight: 600,
        lineHeight: 1.3,
        color: orderColors.text,
    } as CSSProperties,

    cardRef: {
        fontSize: 18,
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
        paddingBottom: 40,
    } as CSSProperties,

    // Hero Header
    header: {
        background: orderColors.primaryGradient,
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
        color: orderColors.textSecondary,
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
        cursor: 'pointer',
    } as CSSProperties,

    orderCardHover: {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    } as CSSProperties,

    // Card Header
    cardHeader: {
        padding: '14px 16px',
        borderBottom: `1px solid ${orderColors.borderLight}`,
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
        gap: 6,
    } as CSSProperties,

    // Items Summary
    itemsSummary: {
        background: orderColors.primaryLight,
        padding: 12,
        borderRadius: 8,
        marginBottom: 14,
        border: `1px solid ${orderColors.primaryDark}20`,
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
        background: 'linear-gradient(135deg, #f6ffed 0%, #e6fffb 100%)',
        padding: '10px 14px',
        borderRadius: 8,
        marginBottom: 14,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: `1px solid ${orderColors.served}30`,
    } as CSSProperties,

    totalLabel: {
        fontSize: 14,
        fontWeight: 500,
        color: orderColors.textSecondary,
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
        color: orderColors.textSecondary,
        fontSize: 12,
        marginBottom: 14,
    } as CSSProperties,

    // Action Button
    actionButton: {
        borderRadius: 8,
        fontWeight: 600,
        height: 40,
        fontSize: 14,
        width: '100%',
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

// ============================================
// Styles for Order Detail Page
// ============================================
export const orderDetailStyles = {
    // Page Container - Matches list style for consistency
    container: {
        minHeight: '100vh',
        background: orderColors.background,
        paddingBottom: 100, // Safe area for bottom nav
    } as CSSProperties,

    // Compact Header
    header: {
        background: orderColors.white,
        padding: '12px 16px',
        borderBottom: `1px solid ${orderColors.border}`,
        position: 'sticky' as const,
        top: 0,
        zIndex: 100,
    } as CSSProperties,

    headerContent: {
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
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
        background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
        color: '#ffffff',
        fontWeight: 800,
        fontSize: 16,
        padding: '4px 14px',
        borderRadius: '10px',
        boxShadow: '0 4px 10px rgba(124, 58, 237, 0.3)',
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        margin: 0,
        height: 'fit-content',
        textShadow: '0 1px 2px rgba(0,0,0,0.1)',
    } as CSSProperties,

    channelBadge: {
        fontWeight: 700,
        fontSize: 12,
        borderRadius: 8,
        padding: '2px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        height: 28,
        border: 'none',
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
        transition: 'all 0.3s ease',
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
        padding: '16px',
    } as CSSProperties,

    // Card Styles
    card: {
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: orderColors.cardShadow,
        border: 'none',
        marginBottom: 16,
        background: orderColors.white,
    } as CSSProperties,

    cardHeader: {
        background: orderColors.white,
        padding: '14px 16px',
        borderBottom: `1px solid ${orderColors.borderLight}`,
    } as CSSProperties,

    // Summary Card
    summaryCard: {
        borderRadius: 16,
        boxShadow: orderColors.cardShadow,
        background: orderColors.white,
        padding: 16,
    } as CSSProperties,

    summaryRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
    } as CSSProperties,

    summaryList: {
        background: '#f8fafc',
        padding: '12px',
        borderRadius: '12px',
        marginBottom: '16px',
        border: '1px solid #e2e8f0',
    } as CSSProperties,

    summaryMainRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        marginTop: '4px',
    } as CSSProperties,

    summaryItemRow: {
        display: 'flex',
        flexDirection: 'row' as const,
        gap: 12,
        padding: '12px 0',
        borderBottom: '1px dashed #e2e8f0',
    } as CSSProperties,

    summaryItemImage: {
        width: 40,
        height: 40,
        borderRadius: 8,
        objectFit: 'cover' as const,
        flexShrink: 0,
        border: '1px solid #f1f5f9',
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
        padding: '32px 20px',
        background: orderColors.backgroundSecondary,
        borderRadius: 12,
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
        background: `linear-gradient(135deg, ${orderColors.servedLight} 0%, #ecfdf5 100%)`,
        padding: '20px',
        borderRadius: 12,
        border: `1px solid ${orderColors.served}20`,
        textAlign: 'center' as const,
    } as CSSProperties,

    // Order Item Card (Mobile)
    itemCard: {
        background: orderColors.white,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        border: `1px solid ${orderColors.border}`,
        transition: 'all 0.2s ease',
    } as CSSProperties,

    itemCardActive: {
        borderLeft: `3px solid ${orderColors.primary}`,
    } as CSSProperties,

    itemCardServed: {
        background: orderColors.backgroundSecondary,
        borderLeft: `3px solid ${orderColors.served}`,
    } as CSSProperties,

    // Action Bar (Floating)
    floatingActions: {
        position: 'fixed' as const,
        bottom: 120,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        padding: '10px 16px',
        borderRadius: '50px',
        boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
        zIndex: 1000,
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        minWidth: 'max-content',
        border: `1px solid ${orderColors.border}`,
        animation: 'slideUp 0.3s ease-out',
    } as CSSProperties,

    floatingActionButton: {
        borderRadius: '40px',
        height: 42,
        padding: '0 20px',
        fontSize: 14,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    } as CSSProperties,

    bulkActionButtonDesktop: {
        padding: '0 12px',
        height: 34,
        fontSize: 13,
        borderRadius: 8,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        transition: 'all 0.2s ease',
    } as CSSProperties,

    actionButtonSecondary: {
        width: 34,
        height: 34,
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
        borderRadius: 12,
        height: 32,
        fontSize: 12,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        border: `1px solid ${orderColors.danger}`,
        color: orderColors.danger,
        backgroundColor: '#fff',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 2px 4px rgba(255, 77, 79, 0.05)',
    } as CSSProperties,

    actionButtonPrimary: {
        height: 34,
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: 8,
        background: orderColors.primary,
        color: orderColors.white,
        border: 'none',
        fontWeight: 600,
        fontSize: 13,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    } as CSSProperties,

    // Product Thumbnails
    productThumb: {
        width: 48,
        height: 48,
        borderRadius: 8,
        objectFit: "cover" as const,
        border: `1px solid ${orderColors.borderLight}`,
    } as CSSProperties,

    productThumbPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 8,
        background: orderColors.backgroundSecondary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: orderColors.textSecondary,
        fontSize: 20
    } as CSSProperties,

    categoryTag: {
        fontSize: 10,
        borderRadius: 4,
        padding: "0 6px",
        margin: "2px 0 0 0",
        fontWeight: 500,
        textTransform: "uppercase" as const
    } as CSSProperties,

    priceTag: {
        fontSize: 13,
        color: orderColors.primary,
        fontWeight: 600
    } as CSSProperties,

    masterCheckboxWrapper: {
        display: 'inline-flex',
        padding: '6px',
        background: orderColors.primaryLight,
        borderRadius: '8px',
        border: `1px solid ${orderColors.primary}40`,
        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)',
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
        gap: 12,
        padding: '16px',
        borderBottom: `1px solid ${orderColors.border}`,
    } as CSSProperties,

    // Quantity control
    quantityControl: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: '16px',
        background: orderColors.primaryLight,
        borderRadius: 16,
    } as CSSProperties,

    quantityButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
    } as CSSProperties,

    quantityDisplay: {
        fontSize: 24,
        fontWeight: 700,
        color: orderColors.primary,
        minWidth: 40,
        textAlign: 'center' as const,
    } as CSSProperties,

    // Price display
    priceCard: {
        background: `linear-gradient(135deg, ${orderColors.servedLight} 0%, #ecfdf5 100%)`,
        padding: '16px 20px',
        borderRadius: 12,
        border: `1px solid ${orderColors.served}30`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    } as CSSProperties,

    priceValue: {
        fontSize: 18,
        fontWeight: 700,
        color: orderColors.success,
    } as CSSProperties,

    // Action buttons
    actionButtons: {
        display: 'flex',
        gap: 12,
        padding: '16px',
        borderTop: `1px solid ${orderColors.border}`,
        background: orderColors.white,
    } as CSSProperties,

    primaryButton: {
        flex: 2,
        height: 40,
        borderRadius: 10,
        fontWeight: 600,
        fontSize: 14,
    } as CSSProperties,

    secondaryButton: {
        flex: 1,
        height: 40,
        borderRadius: 10,
        fontWeight: 500,
        fontSize: 14,
    } as CSSProperties,
};

// ============================================
// AddItemsModal Styles
// ============================================
export const addItemsModalStyles = {
    // Search bar
    searchBar: {
        padding: '12px 16px',
        borderBottom: `1px solid ${orderColors.border}`,
        position: 'sticky' as const,
        top: 0,
        background: orderColors.white,
        zIndex: 10,
    } as CSSProperties,

    searchInput: {
        borderRadius: 12,
        height: 44,
    } as CSSProperties,

    // Product grid
    productGrid: {
        display: 'grid',
        gap: 12,
        padding: 16,
    } as CSSProperties,

    // Product Card
    productCard: {
        borderRadius: 14,
        overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        border: `1px solid ${orderColors.border}`,
        background: orderColors.white,
    } as CSSProperties,

    productCardHover: {
        transform: 'translateY(-2px)',
        boxShadow: orderColors.cardShadowHover,
        borderColor: orderColors.primary,
    } as CSSProperties,

    productImage: {
        width: '100%',
        height: 100,
        objectFit: 'cover' as const,
    } as CSSProperties,

    productPlaceholder: {
        width: '100%',
        height: 100,
        background: `linear-gradient(135deg, ${orderColors.backgroundSecondary} 0%, ${orderColors.border} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: orderColors.textLight,
        fontSize: 12,
    } as CSSProperties,

    productInfo: {
        padding: '10px 12px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    } as CSSProperties,

    productName: {
        fontSize: 13,
        fontWeight: 600,
        marginBottom: 4,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
        color: orderColors.text,
    } as CSSProperties,

    productPrice: {
        fontSize: 14,
        fontWeight: 700,
        color: orderColors.primary,
    } as CSSProperties,

    // Detail section
    detailSection: {
        padding: '16px',
    } as CSSProperties,

    detailImage: {
        width: '100%',
        maxHeight: 200,
        objectFit: 'cover' as const,
        borderRadius: 12,
        boxShadow: orderColors.cardShadow,
    } as CSSProperties,

    // Detail items (extras)
    detailItemRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
        padding: '8px 12px',
        background: orderColors.backgroundSecondary,
        borderRadius: 10,
    } as CSSProperties,
};

// ============================================
// Responsive CSS Styles (List & Detail)
// ============================================
// Combined responsive styles for cleaner import
export const ordersResponsiveStyles = `
  @media (max-width: 768px) {
    /* List Page Responsive */
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

    /* Detail Page Responsive */
    .order-detail-header {
      padding: 12px 16px !important;
    }

    .order-detail-content {
      padding: 12px !important;
    }

    .order-detail-card {
      margin-bottom: 12px !important;
      border-radius: 16px !important;
    }

    .order-detail-card .ant-card-head {
      padding: 12px 14px !important;
      min-height: auto !important;
    }

    .order-detail-card .ant-card-body {
      padding: 12px 14px !important;
    }

    /* Product Grid - Mobile: 2 columns */
    .product-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 10px !important;
    }

    /* Item Cards */
    .order-item-card {
      border-radius: 12px !important;
      margin-bottom: 10px !important;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .order-item-card:active {
      transform: scale(0.98);
    }

    /* Action Buttons - Stack on mobile */
    .order-detail-actions {
      flex-direction: column !important;
      gap: 8px !important;
    }

    .order-detail-actions button {
      width: 100% !important;
      height: 44px !important;
      border-radius: 10px !important;
      font-size: 14px !important;
    }

    /* Table Hide on Mobile */
    .order-detail-table-desktop {
      display: none !important;
    }

    .order-detail-cards-mobile {
      display: block !important;
    }

    /* Floating Action Bar */
    .floating-action-bar {
      display: flex !important;
    }

    /* Modal - Fullscreen on mobile */
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
      max-height: calc(100vh - 55px) !important;
      overflow-y: auto !important;
    }
  }

  @media (max-width: 480px) {
    /* List Page Low Res */
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

  /* ===== Tablet (768px+) ===== */
  @media (min-width: 768px) {
    .order-detail-header {
      padding: 16px 24px !important;
    }

    .order-detail-content {
      padding: 20px !important;
    }

    .order-detail-card .ant-card-head,
    .order-detail-card .ant-card-body {
      padding: 16px 20px !important;
    }

    .product-grid {
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 14px !important;
    }

    .order-detail-actions {
      flex-direction: row !important;
      flex-wrap: wrap !important;
      gap: 10px !important;
    }

    .order-detail-actions button {
      width: auto !important;
      flex: none !important;
    }

    .floating-action-bar {
      display: none !important;
    }

    /* Modal - Normal on tablet+ */
    .mobile-fullscreen-modal .ant-modal {
      max-width: 600px !important;
      margin: 24px auto !important;
      top: auto !important;
    }

    .mobile-fullscreen-modal .ant-modal-content {
      border-radius: 16px !important;
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
      padding: 24px !important;
    }

    .product-grid {
      grid-template-columns: repeat(4, 1fr) !important;
      gap: 16px !important;
    }

    .order-detail-table-desktop {
      display: block !important;
    }

    .order-detail-cards-mobile {
      display: none !important;
    }

    .mobile-fullscreen-modal .ant-modal {
      max-width: 700px !important;
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
    padding: 0 8px !important;
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
      padding: 0 12px !important;
      min-width: auto !important;
    }
  }

  /* ===== Animations ===== */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  .fade-in {
    animation: fadeIn 0.3s ease forwards;
  }
`;
