"use client";

import { CSSProperties } from 'react';

// Color Palette for POS Ordering Interface
export const posColors = {
  // Primary Colors
  primary: '#1890ff',
  primaryLight: '#e6f7ff',
  primaryBorder: '#91d5ff',
  
  // Success (Cart & Actions)
  success: '#52c41a',
  successLight: '#f6ffed',
  successBorder: '#b7eb8f',
  
  // Warning (Notes & Alerts)
  warning: '#fa8c16',
  warningLight: '#fff7e6',
  warningBorder: '#ffd591',
  
  // Text Colors
  text: '#262626',
  textSecondary: '#8c8c8c',
  textLight: '#bfbfbf',
  
  // Background Colors
  background: '#f0f2f5',
  white: '#ffffff',
  card: '#ffffff',
  
  // Border Colors
  border: '#d9d9d9',
  borderLight: '#f0f0f0',
};

// Typography
export const posTypography = {
  heroTitle: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.2,
  } as CSSProperties,
  
  heroSubtitle: {
    fontSize: 14,
    fontWeight: 400,
    opacity: 0.9,
  } as CSSProperties,
  
  productName: {
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 1.3,
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

// Main Container Styles
export const posLayoutStyles = {
  container: {
    minHeight: '100vh',
    background: posColors.background,
    display: 'flex',
    flexDirection: 'column' as CSSProperties['flexDirection'],
    paddingBottom: 100, // Space for mobile nav + cart bar
  } as CSSProperties,

  // Sticky Header
  header: {
    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    padding: '16px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    position: 'sticky' as CSSProperties['position'],
    top: 0,
    zIndex: 100,
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
    gap: 12,
    flex: 1,
    minWidth: 0, // Allow text truncation
  },

  headerInfo: {
    flex: 1,
    minWidth: 0,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    lineHeight: 1.2,
  } as CSSProperties,

  headerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 2,
  } as CSSProperties,

  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  // Category Filter Bar
  categoryBar: {
    background: '#fff',
    padding: '12px 20px',
    borderBottom: '1px solid #f0f0f0',
    position: 'sticky' as CSSProperties['position'],
    top: 64, // Below header
    zIndex: 99,
    overflowX: 'auto' as CSSProperties['overflowX'],
    whiteSpace: 'nowrap' as CSSProperties['whiteSpace'],
  },

  categoryScroll: {
    maxWidth: 1400,
    margin: '0 auto',
    display: 'flex',
    gap: 8,
  },

  // Content Area
  content: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '20px',
    flex: 1,
    width: '100%',
  },

  // Product Grid
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 16,
  } as CSSProperties,

  // Product Card
  productCard: {
    background: posColors.white,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    border: '1px solid #f0f0f0',
  } as CSSProperties,

  productImage: {
    width: '100%',
    height: 180,
    position: 'relative' as CSSProperties['position'],
    overflow: 'hidden',
    background: '#f5f5f5',
  },

  productInfo: {
    padding: 14,
  },

  productName: {
    ...posTypography.productName,
    color: posColors.text,
    marginBottom: 4,
    display: 'block',
  } as CSSProperties,

  productCategory: {
    fontSize: 11,
    color: posColors.textSecondary,
    marginBottom: 8,
  } as CSSProperties,

  productFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },

  productPrice: {
    ...posTypography.productPrice,
    color: posColors.primary,
  } as CSSProperties,

  addButton: {
    background: posColors.success,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  } as CSSProperties,

  // Pagination
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 24,
    padding: '20px 0',
  },



  // Floating Cart Button (Desktop)
  floatingCartButton: {
    width: 60,
    height: 60,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    boxShadow: '0 6px 20px rgba(24, 144, 255, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #fff',
  } as CSSProperties,

  // Loading State
  loadingContainer: {
    textAlign: 'center' as CSSProperties['textAlign'],
    padding: 60,
    background: '#fff',
    borderRadius: 12,
  },

  // Empty State
  emptyContainer: {
    textAlign: 'center' as CSSProperties['textAlign'],
    padding: 60,
    background: '#fff',
    borderRadius: 12,
  },
};

// Cart Drawer Styles
export const posCartStyles = {
  cartHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  cartItem: {
    padding: '14px 0',
    borderBottom: '1px solid #f0f0f0',
  },

  cartItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    objectFit: 'cover' as CSSProperties['objectFit'],
    background: '#f5f5f5',
  } as CSSProperties,

  cartItemInfo: {
    flex: 1,
  },

  cartItemName: {
    ...posTypography.cartItemName,
    color: posColors.text,
    marginBottom: 2,
  } as CSSProperties,

  cartItemPrice: {
    fontSize: 12,
    color: posColors.textSecondary,
  } as CSSProperties,

  cartItemNote: {
    marginTop: 4,
    background: posColors.warningLight,
    padding: '2px 6px',
    borderRadius: 4,
    border: `1px dashed ${posColors.warningBorder}`,
    display: 'inline-block',
    fontSize: 11,
  } as CSSProperties,

  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#f5f5f5',
    padding: '2px 8px',
    borderRadius: 20,
  },

  checkoutSummary: {
    background: '#fafafa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
};

// Global Styles Component
export const POSSharedStyles = () => (
  <style jsx global>{`
    /* Product Card Hover Effects */
    .pos-product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      border-color: ${posColors.primaryBorder};
    }

    .pos-product-card:active {
      transform: translateY(-2px);
    }

    /* Add Button Hover */
    .pos-add-button:hover {
      background: #73d13d;
      transform: scale(1.05);
    }

    .pos-add-button:active {
      transform: scale(0.98);
    }

    /* Fade In Animation */
    @keyframes pos-fade-in {
      from {
        opacity: 0;
        transform: translateY(20px);
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

    /* Category Bar Scrollbar */
    .pos-category-bar::-webkit-scrollbar {
      height: 4px;
    }

    .pos-category-bar::-webkit-scrollbar-track {
      background: #f0f0f0;
    }

    .pos-category-bar::-webkit-scrollbar-thumb {
      background: #d9d9d9;
      border-radius: 4px;
    }

    /* Mobile Responsive Styles */
    @media (max-width: 768px) {
      .pos-header-mobile {
        padding: 12px 16px !important;
      }

      .pos-header-title-mobile {
        font-size: 16px !important;
      }

      .pos-header-subtitle-mobile {
        font-size: 12px !important;
      }

      .pos-category-bar-mobile {
        padding: 10px 16px !important;
        top: 56px !important;
      }

      .pos-content-mobile {
        padding: 16px !important;
      }

      .pos-product-grid-mobile {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 12px !important;
      }

      .pos-product-image-mobile {
        height: 140px !important;
      }

      .pos-product-info-mobile {
        padding: 12px !important;
      }

      .pos-product-name-mobile {
        font-size: 14px !important;
      }

      .pos-product-price-mobile {
        font-size: 16px !important;
      }

      .pos-add-button-mobile {
        padding: 6px 12px !important;
        font-size: 12px !important;
      }


    }

    /* Floating button container positioning - Outside media query to apply to all devices */
    .pos-floating-btn-container {
      position: fixed !important;
      bottom: 32px !important;
      right: 32px !important;
      left: auto !important;
      z-index: 1000 !important;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @media (max-width: 768px) {
      .pos-floating-btn-container {
        bottom: 100px !important; /* Above the bottom navigation bar */
        right: 20px !important;
        left: auto !important;
      }
    }

    @media (max-width: 480px) {
      .pos-product-grid-mobile {
        gap: 10px !important;
      }

    }

    /* Desktop - wider product grid */
    @media (min-width: 1400px) {
      .pos-product-grid {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)) !important;
      }
    }
  `}</style>
);
