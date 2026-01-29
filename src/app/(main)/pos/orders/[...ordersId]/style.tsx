import { CSSProperties } from 'react';
import { orderColors, orderTypography, orderBreakpoints } from '@/theme/pos/orders.theme';

export { orderColors, orderTypography, orderBreakpoints };

// ============================================
// Modern Color Palette - Order Detail Page
// ============================================
// Alias for backward compatibility if needed, or better to use exported orderColors
export const orderDetailColors = orderColors;

// ============================================
// Responsive Breakpoints
// ============================================
export const breakpoints = orderBreakpoints;

// ============================================
// Typography System
// ============================================
export const orderDetailTypography = orderTypography;

// ============================================
// Main Page Styles
// ============================================
export const orderDetailStyles = {
  // Page Container
  container: {
    minHeight: '100vh',
    background: orderDetailColors.background,
    paddingBottom: 100, // Safe area for bottom nav
  } as CSSProperties,

  // Compact Header
  header: {
    background: orderDetailColors.white,
    padding: '12px 16px',
    borderBottom: `1px solid ${orderDetailColors.border}`,
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
    color: orderDetailColors.text,
    flex: 1,
  } as CSSProperties,

  headerSubtitle: {
    fontSize: 12,
    color: orderDetailColors.textSecondary,
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
    boxShadow: orderDetailColors.cardShadow,
    border: 'none',
    marginBottom: 16,
    background: orderDetailColors.white,
  } as CSSProperties,

  cardHeader: {
    background: orderDetailColors.white,
    padding: '14px 16px',
    borderBottom: `1px solid ${orderDetailColors.borderLight}`,
  } as CSSProperties,

  // Summary Card
  summaryCard: {
    borderRadius: 16,
    boxShadow: orderDetailColors.cardShadow,
    background: orderDetailColors.white,
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
    color: orderDetailColors.success, // Already green based on earlier thought? Wait, let me check. 
    // success: '#10b981' in style.tsx.
    marginTop: 2,
    paddingLeft: 0,
  } as CSSProperties,

  // Empty State
  emptyState: {
    textAlign: 'center' as const,
    padding: '32px 20px',
    background: orderDetailColors.backgroundSecondary,
    borderRadius: 12,
  } as CSSProperties,

  // Loading State
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '80vh', // Occupy most of the screen
    width: '100%',
  } as CSSProperties,

  // Complete State Card
  completeCard: {
    background: `linear-gradient(135deg, ${orderDetailColors.servedLight} 0%, #ecfdf5 100%)`,
    padding: '20px',
    borderRadius: 12,
    border: `1px solid ${orderDetailColors.served}20`,
    textAlign: 'center' as const,
  } as CSSProperties,

  // Order Item Card (Mobile)
  itemCard: {
    background: orderDetailColors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    border: `1px solid ${orderDetailColors.border}`,
    transition: 'all 0.2s ease',
  } as CSSProperties,

  itemCardActive: {
    borderLeft: `3px solid ${orderDetailColors.primary}`,
  } as CSSProperties,

  itemCardServed: {
    background: orderDetailColors.backgroundSecondary,
    borderLeft: `3px solid ${orderDetailColors.served}`,
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
    border: `1px solid ${orderDetailColors.border}`,
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
    border: `1px solid ${orderDetailColors.border}`,
    background: orderDetailColors.white,
    color: orderDetailColors.textSecondary,
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
    border: `1px solid ${orderDetailColors.danger}`,
    color: orderDetailColors.danger,
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
    background: orderDetailColors.primary,
    color: orderDetailColors.white,
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
    border: `1px solid ${orderDetailColors.borderLight}`,
  } as CSSProperties,

  productThumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    background: orderDetailColors.backgroundSecondary,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: orderDetailColors.textSecondary,
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
    color: orderDetailColors.primary,
    fontWeight: 600
  } as CSSProperties,

  masterCheckboxWrapper: {
    display: 'inline-flex',
    padding: '6px',
    background: orderDetailColors.primaryLight,
    borderRadius: '8px',
    border: `1px solid ${orderDetailColors.primary}40`,
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
    borderBottom: `1px solid ${orderDetailColors.border}`,
  } as CSSProperties,

  // Quantity control
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: '16px',
    background: orderDetailColors.primaryLight,
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
    color: orderDetailColors.primary,
    minWidth: 40,
    textAlign: 'center' as const,
  } as CSSProperties,

  // Price display
  priceCard: {
    background: `linear-gradient(135deg, ${orderDetailColors.servedLight} 0%, #ecfdf5 100%)`,
    padding: '16px 20px',
    borderRadius: 12,
    border: `1px solid ${orderDetailColors.served}30`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as CSSProperties,

  priceValue: {
    fontSize: 18,
    fontWeight: 700,
    color: orderDetailColors.success,
  } as CSSProperties,

  // Action buttons
  actionButtons: {
    display: 'flex',
    gap: 12,
    padding: '16px',
    borderTop: `1px solid ${orderDetailColors.border}`,
    background: orderDetailColors.white,
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
    borderBottom: `1px solid ${orderDetailColors.border}`,
    position: 'sticky' as const,
    top: 0,
    background: orderDetailColors.white,
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
    border: `1px solid ${orderDetailColors.border}`,
    background: orderDetailColors.white,
  } as CSSProperties,

  productCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: orderDetailColors.cardShadowHover,
    borderColor: orderDetailColors.primary,
  } as CSSProperties,

  productImage: {
    width: '100%',
    height: 100,
    objectFit: 'cover' as const,
  } as CSSProperties,

  productPlaceholder: {
    width: '100%',
    height: 100,
    background: `linear-gradient(135deg, ${orderDetailColors.backgroundSecondary} 0%, ${orderDetailColors.border} 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: orderDetailColors.textLight,
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
    color: orderDetailColors.text,
  } as CSSProperties,

  productPrice: {
    fontSize: 14,
    fontWeight: 700,
    color: orderDetailColors.primary,
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
    boxShadow: orderDetailColors.cardShadow,
  } as CSSProperties,

  // Detail items (extras)
  detailItemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    padding: '8px 12px',
    background: orderDetailColors.backgroundSecondary,
    borderRadius: 10,
  } as CSSProperties,
};

// ============================================
// Responsive CSS Styles
// ============================================
export const orderDetailResponsiveStyles = `
  /* ===== Base Reset ===== */
  .order-detail-page {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  /* ===== Mobile First (Default) ===== */
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

  .scale-in {
    animation: scaleIn 0.25s ease forwards;
  }

  /* ===== Card Hover Effects ===== */
  .product-card-hoverable {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  .product-card-hoverable:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.12) !important;
    border-color: #3b82f6 !important;
  }

  .order-item-card-hoverable:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }

  /* ===== Status Badge Styles ===== */
  .status-badge {
    padding: 4px 10px !important;
    border-radius: 8px !important;
    font-size: 12px !important;
    font-weight: 600 !important;
  }

  /* ===== Touch Optimization ===== */
  @media (hover: none) and (pointer: coarse) {
    .product-card-hoverable:active {
      transform: scale(0.97);
      transition: transform 0.1s ease;
    }

    button, .ant-btn {
      min-height: 44px;
    }
  }

  /* ===== Safe Area for Bottom Nav ===== */
  .order-detail-page {
    padding-bottom: max(80px, env(safe-area-inset-bottom, 80px));
  }

  /* ===== Ant Design Overrides ===== */
  .ant-modal-header {
    border-bottom: 1px solid #e2e8f0 !important;
    padding: 14px 16px !important;
  }

  .ant-modal-title {
    font-size: 16px !important;
    font-weight: 600 !important;
  }

  .ant-card {
    border-radius: 16px !important;
  }

  .ant-tag {
    border-radius: 8px !important;
    font-weight: 500 !important;
  }

  .ant-btn {
    border-radius: 10px !important;
  }

  .ant-input, .ant-input-number {
    border-radius: 10px !important;
  }

  .ant-input-affix-wrapper {
    border-radius: 12px !important;
  }

  /* ===== Empty State ===== */
  .empty-state-icon {
    font-size: 48px;
    color: #10b981;
    margin-bottom: 12px;
  }

  .empty-state-text {
    color: #6b7280;
    font-size: 14px;
  }

  /* ===== Table Row States ===== */
  .row-cancelled {
    background-color: #fff1f0 !important;
  }
  .row-cancelled:hover > td {
    background-color: #fff1f0 !important;
  }

  /* ===== Header Checkbox Styling v3 (High-Distinction) ===== */
  /* Target only the checkbox inside the thead (header) with high specificity */
  .order-items-table .ant-table-thead th.ant-table-selection-column .ant-checkbox-inner {
    border-color: #000000 !important; /* Pure Black for maximum contrast */
    border-width: 3px !important;    /* Heavy border */
    width: 22px !important;          /* Larger size */
    height: 22px !important;
    background-color: #f1f5f9 !important; /* Slight tint to differentiate */
    border-radius: 6px !important;
  }
  
  /* Handle checked state */
  .order-items-table .ant-table-thead th.ant-table-selection-column .ant-checkbox-checked .ant-checkbox-inner {
    background-color: #000000 !important;
    border-color: #000000 !important;
  }

  /* Handle indeterminate state (partial selection) */
  .order-items-table .ant-table-thead th.ant-table-selection-column .ant-checkbox-indeterminate .ant-checkbox-inner::after {
    background-color: #000000 !important;
    height: 4px !important;
  }
  
  /* Add a subtle highlight to the entire header cell for the checkbox */
  .order-items-table .ant-table-thead th.ant-table-selection-column {
    background-color: #f8fafc !important;
    border-right: 1px solid #e2e8f0 !important;
  }

  /* ===== Custom Buttons ===== */
  .unserve-button:hover {
    background-color: #fff1f0 !important;
    border-color: #ff4d4f !important;
    color: #ff4d4f !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 77, 79, 0.15) !important;
  }
  .unserve-button:active {
    transform: translateY(0);
  }

  /* ===== Utilities ===== */
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translate(-50%, 20px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
`;
