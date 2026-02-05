"use client";

import { CSSProperties } from 'react';

// ============================================
// Color Palette - Soft Modern Clarity
// ============================================
export const posColors = {
  // Primary Colors - Softer blues
  primary: 'var(--color-primary)',
  primaryDark: 'var(--color-primary-hover)',
  primaryLight: 'var(--color-primary-light)',
  primaryBorder: 'var(--color-primary-border)',
  
  // Success (Cart & Actions) - Softer greens
  success: '#10B981',
  successLight: '#ECFDF5',
  successBorder: '#A7F3D0',
  
  // Warning (Notes & Alerts) - Warm oranges
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  warningBorder: '#FDE68A',
  
  // Text Colors - Slate tones
  text: '#1E293B',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  
  // Background Colors
  background: '#F8FAFC',
  white: '#FFFFFF',
  card: '#FFFFFF',
  
  // Border Colors
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  
  // Channel Colors
  dineIn: '#3B82F6',
  takeaway: '#10B981',
  delivery: '#8B5CF6',
};

// ============================================
// Typography
// ============================================
export const posTypography = {
  heroTitle: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.2,
  } as CSSProperties,
  
  heroSubtitle: {
    fontSize: 14,
    fontWeight: 500,
    opacity: 0.9,
  } as CSSProperties,
  
  productName: {
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 1.4,
  } as CSSProperties,
  
  productPrice: {
    fontSize: 18,
    fontWeight: 700,
  } as CSSProperties,
  
  cartItemName: {
    fontSize: 14,
    fontWeight: 600,
  } as CSSProperties,
};

// ============================================
// Main Layout Styles
// ============================================
export const posLayoutStyles = {
  container: {
    minHeight: '100vh',
    background: posColors.background,
    display: 'flex',
    flexDirection: 'column' as CSSProperties['flexDirection'],
    paddingBottom: 100,
  } as CSSProperties,

  // Header - Softer gradient
  header: {
    background: 'linear-gradient(145deg, var(--color-primary-hover) 0%, var(--color-primary) 55%, var(--color-primary-soft) 100%)',
    padding: '20px 24px',
    boxShadow: '0 4px 20px rgb(var(--color-primary-rgb) / 0.18)',
    position: 'sticky' as CSSProperties['position'],
    top: 0,
    zIndex: 100,
    borderRadius: '0 0 24px 24px',
  },

  headerContent: {
    maxWidth: 1400,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 0,
  },

  headerBackButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderRadius: 14,
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as CSSProperties,

  headerIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,

  headerInfo: {
    flex: 1,
    minWidth: 0,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    lineHeight: 1.2,
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  } as CSSProperties,

  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 4,
    fontWeight: 500,
  } as CSSProperties,

  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  // Category Filter Bar - Glass effect
  categoryBar: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: '14px 24px',
    borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
    position: 'sticky' as CSSProperties['position'],
    top: 84,
    zIndex: 99,
    overflow: 'hidden' as CSSProperties['overflow'],
  },

  categoryScroll: {
    display: 'flex',
    gap: 10,
    overflowX: 'auto' as CSSProperties['overflowX'],
    paddingBottom: 2,
  } as CSSProperties,

  // Content Area
  content: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '24px',
    flex: 1,
    width: '100%',
  },

  // Product Grid
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 20,
  } as CSSProperties,

  // Product Card - Modern with soft shadows
  productCard: {
    background: posColors.white,
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    position: 'relative' as CSSProperties['position'],
  } as CSSProperties,

  productImage: {
    width: '100%',
    height: 160,
    position: 'relative' as CSSProperties['position'],
    overflow: 'hidden',
    background: `linear-gradient(135deg, ${posColors.primaryLight} 0%, #DBEAFE 100%)`,
  },

  productInfo: {
    padding: 16,
  },

  productName: {
    ...posTypography.productName,
    color: posColors.text,
    marginBottom: 6,
    display: 'block',
  } as CSSProperties,

  productCategory: {
    fontSize: 11,
    color: posColors.textSecondary,
    marginBottom: 10,
  } as CSSProperties,

  productFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTop: '1px solid #F1F5F9',
  },

  productPrice: {
    ...posTypography.productPrice,
    color: posColors.primary,
  } as CSSProperties,

  addButton: {
    background: `linear-gradient(135deg, ${posColors.success} 0%, #059669 100%)`,
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: `0 4px 12px ${posColors.success}40`,
  } as CSSProperties,

  // Pagination
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 32,
    padding: '24px 0',
  },

  // Floating Cart Button
  floatingCartButton: {
    width: 64,
    height: 64,
    borderRadius: 20,
    background: `linear-gradient(145deg, ${posColors.primary} 0%, ${posColors.primaryDark} 100%)`,
    boxShadow: '0 8px 24px rgb(var(--color-primary-rgb) / 0.32)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid #fff',
  } as CSSProperties,

  // Loading State
  loadingContainer: {
    textAlign: 'center' as CSSProperties['textAlign'],
    padding: 80,
    background: '#fff',
    borderRadius: 24,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
  },

  // Empty State
  emptyContainer: {
    textAlign: 'center' as CSSProperties['textAlign'],
    padding: 80,
    background: '#fff',
    borderRadius: 24,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
  },
};

// ============================================
// Cart Drawer Styles
// ============================================
export const posCartStyles = {
  cartHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  cartItem: {
    padding: '16px 0',
    borderBottom: '1px solid #F1F5F9',
  },

  cartItemImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    objectFit: 'cover' as CSSProperties['objectFit'],
    background: '#F8FAFC',
    border: '1px solid #E2E8F0',
  } as CSSProperties,

  cartItemInfo: {
    flex: 1,
  },

  cartItemName: {
    ...posTypography.cartItemName,
    color: posColors.text,
    marginBottom: 4,
  } as CSSProperties,

  cartItemPrice: {
    fontSize: 13,
    color: posColors.textSecondary,
  } as CSSProperties,

  cartItemNote: {
    marginTop: 6,
    background: posColors.warningLight,
    padding: '4px 10px',
    borderRadius: 8,
    border: `1px solid ${posColors.warningBorder}`,
    display: 'inline-block',
    fontSize: 12,
  } as CSSProperties,

  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#F8FAFC',
    padding: '6px 12px',
    borderRadius: 12,
    border: '1px solid #E2E8F0',
  },

  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as CSSProperties,

  checkoutSummary: {
    background: '#F8FAFC',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    border: '1px solid #E2E8F0',
  },
};

// ============================================
// Global Styles Component
// ============================================
export const POSSharedStyles = () => (
  <style jsx global>{`
    /* Product Card Hover Effects */
    .pos-product-card {
      transform: translateY(0);
    }
    
    .pos-product-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
      border-color: ${posColors.primaryBorder};
    }

    .pos-product-card:active {
      transform: translateY(-2px) scale(0.99);
    }

    /* Add Button Hover */
    .pos-add-button:hover {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.5);
    }

    .pos-add-button:active {
      transform: scale(0.98);
    }

    /* Fade In Animation */
    @keyframes pos-fade-in {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .pos-fade-in {
      animation: pos-fade-in 0.4s ease-out forwards;
    }

    /* Staggered Animation Delays */
    .pos-delay-1 { animation-delay: 0.05s; opacity: 0; }
    .pos-delay-2 { animation-delay: 0.1s; opacity: 0; }
    .pos-delay-3 { animation-delay: 0.15s; opacity: 0; }
    .pos-delay-4 { animation-delay: 0.2s; opacity: 0; }

    /* Category Scroll Row Scrollbar */
    .pos-category-scroll-row::-webkit-scrollbar,
    .pos-category-bar::-webkit-scrollbar {
      height: 4px;
    }

    .pos-category-scroll-row::-webkit-scrollbar-track,
    .pos-category-bar::-webkit-scrollbar-track {
      background: transparent;
    }

    .pos-category-scroll-row::-webkit-scrollbar-thumb,
    .pos-category-bar::-webkit-scrollbar-thumb {
      background: #CBD5E1;
      border-radius: 4px;
    }

    /* Category Button Styles */
    .pos-category-btn {
      border-radius: 12px !important;
      font-weight: 600 !important;
      height: 42px !important;
      padding: 0 20px !important;
      border: 1.5px solid #E2E8F0 !important;
      transition: all 0.2s ease !important;
    }
    
    .pos-category-btn:hover {
      border-color: ${posColors.primary} !important;
      color: ${posColors.primary} !important;
    }

    /* Cart - Touch Targets (Mobile First) */
    .pos-cart-icon-btn {
      padding: 0 !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      line-height: 1 !important;
      min-width: 32px !important;
      width: 32px !important;
      height: 32px !important;
    }

    .pos-cart-qty-btn {
      width: 32px !important;
      height: 32px !important;
    }

    .pos-cart-action-btn {
      width: 36px !important;
      height: 36px !important;
    }

    /* Header Back Button */
    .pos-header-back:hover {
      background: rgba(255, 255, 255, 0.3) !important;
      transform: translateX(-2px);
    }

    /* Floating Button Container */
    .pos-floating-btn-container {
      position: fixed !important;
      bottom: 32px !important;
      right: 32px !important;
      z-index: 1000 !important;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    /* Pulse Animation for Cart */
    @keyframes pos-pulse {
      0%, 100% { box-shadow: 0 8px 24px rgb(var(--color-primary-rgb) / 0.32); }
      50% { box-shadow: 0 12px 32px rgb(var(--color-primary-rgb) / 0.45); }
    }
    
    .pos-cart-pulse {
      animation: pos-pulse 2s ease-in-out infinite;
    }

    /* ============================================
       Mobile Responsive Styles
       ============================================ */
    @media (max-width: 768px) {
      .pos-cart-qty-btn,
      .pos-cart-action-btn {
        width: 44px !important;
        height: 44px !important;
      }

      .pos-cart-item-controls {
        gap: 8px !important;
        flex-wrap: wrap !important;
      }

      .pos-cart-action-row {
        flex: 1 1 auto;
        justify-content: flex-end !important;
      }

      .pos-header-mobile {
        padding: 16px 16px 20px !important;
        border-radius: 0 0 20px 20px !important;
      }

      .pos-header-title-mobile {
        font-size: 18px !important;
      }

      .pos-header-subtitle-mobile {
        font-size: 12px !important;
      }

      .pos-category-bar-mobile {
        padding: 12px 16px !important;
        top: 76px !important;
      }

      .pos-content-mobile {
        padding: 16px !important;
      }

      .pos-product-grid-mobile {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 14px !important;
      }

      .pos-product-image-mobile {
        height: 130px !important;
      }

      .pos-product-info-mobile {
        padding: 12px !important;
      }

      .pos-product-name-mobile {
        font-size: 13px !important;
        line-height: 1.3 !important;
      }

      .pos-product-price-mobile {
        font-size: 15px !important;
      }

      .pos-add-button-mobile {
        padding: 8px 12px !important;
        font-size: 11px !important;
        border-radius: 10px !important;
      }

      .pos-floating-btn-container {
        bottom: 100px !important;
        right: 20px !important;
      }

      /* Touch-friendly targets */
      .pos-product-card {
        min-height: 220px;
      }

      .pos-category-btn {
        height: 38px !important;
        padding: 0 16px !important;
        font-size: 13px !important;
      }
    }

    @media (max-width: 480px) {
      .pos-cart-item-controls {
        flex-direction: column !important;
        align-items: stretch !important;
      }

      .pos-cart-qty-control {
        justify-content: space-between !important;
      }

      .pos-cart-action-row {
        justify-content: flex-end !important;
      }

      .pos-product-grid-mobile {
        gap: 10px !important;
      }

      .pos-product-image-mobile {
        height: 110px !important;
      }

      .pos-product-info-mobile {
        padding: 10px !important;
      }

      .pos-product-footer-mobile {
        flex-direction: column !important;
        gap: 10px !important;
        align-items: stretch !important;
      }

      .pos-add-button-mobile {
        width: 100% !important;
        justify-content: center !important;
      }
    }

    /* Desktop - wider grid */
    @media (min-width: 1200px) {
      .pos-product-grid {
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)) !important;
        gap: 24px !important;
      }
    }

    @media (min-width: 1600px) {
      .pos-product-grid {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)) !important;
      }
    }

    /* Touch device adjustments */
    @media (hover: none) {
      .pos-product-card:active {
        transform: scale(0.98) !important;
      }
      
      .pos-product-card:hover {
        transform: none !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04) !important;
      }
    }
  `}</style>
);
