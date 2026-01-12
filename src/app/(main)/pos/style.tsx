"use client";

import { CSSProperties } from 'react';

// New color scheme - Soft blue-gray for readability, contrasting green cart
export const colors = {
  primary: '#1890ff',       // Blue for headers
  secondary: '#13c2c2',     // Teal for accents
  success: '#52c41a',       // Green for cart/actions
  background: '#f5f5f5',    // Light gray background
  cardBg: '#ffffff',        // White cards
  text: '#262626',          // Dark text
  textSecondary: '#8c8c8c', // Gray secondary text
};

export const pageStyles = {
  container: {
    minHeight: '100vh',
    background: colors.background,
    fontFamily: "'Inter', 'Sarabun', sans-serif",
  } as CSSProperties,
  
  heroParams: {
    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    padding: '32px 24px 70px',
    position: 'relative' as CSSProperties['position'],
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    boxShadow: '0 8px 24px rgba(24, 144, 255, 0.25)',
    marginBottom: -40,
    zIndex: 1,
    overflow: 'hidden',
  },

  contentWrapper: {
    padding: '0 24px 120px', 
    maxWidth: 1400, 
    margin: '0 auto', 
    width: '100%',
    position: 'relative' as CSSProperties['position'],
    zIndex: 2,
  },

  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    color: '#fff',
  },

  gridConfig: {
    gutter: 16,
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
    xxl: 6,
  },

  productCard: {
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #f0f0f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.3s ease',
    background: colors.cardBg,
  } as CSSProperties,

  productImage: {
    height: 200,
    width: '100%',
    background: '#fafafa',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative' as CSSProperties['position'],
  },

  priceBadge: {
    position: 'absolute' as CSSProperties['position'],
    top: 12,
    right: 12,
    background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
    color: '#fff',
    padding: '6px 14px',
    borderRadius: 20,
    fontWeight: 700,
    fontSize: 14,
    boxShadow: '0 2px 8px rgba(82, 196, 26, 0.35)',
  },

  cartButton: {
    width: '100%',
    height: 42,
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
    border: 'none',
  },

  floatingCartButton: {
    width: 60,
    height: 60,
    background: 'linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%)',
    border: 'none',
    boxShadow: '0 6px 20px rgba(19, 194, 194, 0.4)',
  },
};

export const POSStyles = () => (
  <style jsx global>{`
    .hero-pattern {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px);
      background-size: 24px 24px;
      opacity: 0.6;
      pointer-events: none;
    }
    .decorative-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(8px);
    }
    .circle-1 {
      width: 300px;
      height: 300px;
      top: -100px;
      right: -60px;
    }
    .circle-2 {
      width: 160px;
      height: 160px;
      bottom: -40px;
      left: 10%;
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-card {
      animation: fadeInUp 0.4s ease-out forwards;
      opacity: 0;
    }

    .product-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.1);
    }
  `}</style>
);
