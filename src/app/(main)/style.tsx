"use client";

import { CSSProperties } from 'react';

// Main Page Styles - Mobile First Design
export const pageStyles = {
  container: {
    minHeight: '100vh',
    background: '#f5f7fa',
    fontFamily: "'Inter', 'Sarabun', sans-serif",
    paddingBottom: 40,
  } as CSSProperties,
  
  heroSection: {
    background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
    padding: '32px 20px 60px',
    position: 'relative' as CSSProperties['position'],
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    boxShadow: '0 4px 20px rgba(79, 70, 229, 0.15)',
    marginBottom: -32,
    zIndex: 1,
    overflow: 'hidden' as CSSProperties['overflow'],
  } as CSSProperties,

  heroContent: {
    position: 'relative' as CSSProperties['position'],
    zIndex: 2,
    textAlign: 'center' as CSSProperties['textAlign'],
  } as CSSProperties,

  heroTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 700,
    lineHeight: 1.3,
    marginBottom: 8,
    marginTop: 0,
  } as CSSProperties,

  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 1.5,
    marginBottom: 0,
  } as CSSProperties,

  contentWrapper: {
    padding: '48px 16px 80px',
    maxWidth: 1200,
    margin: '0 auto',
    width: '100%',
    position: 'relative' as CSSProperties['position'],
    zIndex: 2,
  } as CSSProperties,

  modulesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 16,
    width: '100%',
  } as CSSProperties,

  moduleCard: {
    background: '#ffffff',
    borderRadius: 16,
    border: '1px solid #e5e7eb',
    padding: 20,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    flexDirection: 'column' as CSSProperties['flexDirection'],
    alignItems: 'center',
    textAlign: 'center' as CSSProperties['textAlign'],
    minHeight: 200,
    justifyContent: 'center',
  } as CSSProperties,

  moduleCardDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  } as CSSProperties,

  moduleIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 16,
    background: '#f8f9fc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    transition: 'all 0.3s ease',
  } as CSSProperties,

  moduleTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#111827',
    marginBottom: 8,
    marginTop: 0,
    lineHeight: 1.4,
  } as CSSProperties,

  moduleDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 1.5,
    marginBottom: 16,
  } as CSSProperties,

  moduleAction: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: 600,
    marginTop: 'auto',
  } as CSSProperties,

  // Responsive breakpoints
  gridConfig: {
    gutter: [16, 20, 24],
    xs: 1,
    sm: 1,
    md: 2,
    lg: 2,
    xl: 2,
    xxl: 4,
  },
};

// Global Styles Component with Responsive Design
export const DashboardStyles = () => (
  <style jsx global>{`
    /* Hero Section Decorative Elements */
    .hero-pattern {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
      background-size: 24px 24px;
      opacity: 0.6;
      pointer-events: none;
    }
    
    .decorative-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(8px);
      pointer-events: none;
    }
    
    .circle-1 {
      width: 200px;
      height: 200px;
      top: -80px;
      right: -60px;
    }
    
    .circle-2 {
      width: 120px;
      height: 120px;
      bottom: -40px;
      left: 5%;
    }

    /* Animations */
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

    .animate-card {
      animation: fadeInUp 0.5s ease-out forwards;
      opacity: 0;
    }

    .animate-card-delay-1 { animation-delay: 0.1s; }
    .animate-card-delay-2 { animation-delay: 0.2s; }
    .animate-card-delay-3 { animation-delay: 0.3s; }
    .animate-card-delay-4 { animation-delay: 0.4s; }

    /* Module Card Hover Effects */
    .module-card-hover:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      border-color: #d1d5db;
    }

    .module-card-hover:hover .module-icon-wrapper {
      transform: scale(1.05);
      background: #f0f4ff;
    }

    .module-card-hover:active {
      transform: translateY(-2px);
    }

    /* Mobile First - Base Styles (up to 480px) */
    .landing-hero-title {
      font-size: 22px !important;
      line-height: 1.3 !important;
    }

    .landing-hero-subtitle {
      font-size: 13px !important;
      line-height: 1.5 !important;
    }

    .landing-module-card {
      padding: 18px 16px !important;
      min-height: 180px !important;
    }

    .landing-module-icon {
      width: 64px !important;
      height: 64px !important;
      font-size: 32px !important;
    }

    .landing-module-title {
      font-size: 16px !important;
      margin-bottom: 6px !important;
    }

    .landing-module-description {
      font-size: 13px !important;
      line-height: 1.4 !important;
    }

    /* Small Mobile (481px - 767px) */
    @media (min-width: 481px) {
      .landing-hero-title {
        font-size: 26px !important;
      }

      .landing-hero-subtitle {
        font-size: 14px !important;
      }

      .landing-module-card {
        padding: 20px !important;
        min-height: 200px !important;
      }

      .landing-module-icon {
        width: 72px !important;
        height: 72px !important;
        font-size: 36px !important;
      }

      .landing-module-title {
        font-size: 18px !important;
      }

      .landing-module-description {
        font-size: 14px !important;
      }
    }

    /* Tablet (768px - 1023px) */
    @media (min-width: 768px) {
      .landing-hero-section {
        padding: 48px 32px 80px !important;
        border-bottom-left-radius: 32px !important;
        border-bottom-right-radius: 32px !important;
        margin-bottom: -40px !important;
      }

      .landing-hero-title {
        font-size: 32px !important;
        margin-bottom: 12px !important;
      }

      .landing-hero-subtitle {
        font-size: 16px !important;
      }

      .landing-content-wrapper {
        padding: 56px 24px 100px !important;
      }

      .landing-modules-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 20px !important;
      }

      .landing-module-card {
        padding: 28px 24px !important;
        min-height: 220px !important;
      }

      .landing-module-icon {
        width: 80px !important;
        height: 80px !important;
        font-size: 40px !important;
        margin-bottom: 20px !important;
      }

      .landing-module-title {
        font-size: 20px !important;
        margin-bottom: 10px !important;
      }

      .landing-module-description {
        font-size: 15px !important;
      }

      .circle-1 {
        width: 280px !important;
        height: 280px !important;
        top: -120px !important;
        right: -80px !important;
      }

      .circle-2 {
        width: 160px !important;
        height: 160px !important;
        bottom: -50px !important;
        left: 8% !important;
      }
    }

    /* Desktop (1024px - 1279px) */
    @media (min-width: 1024px) {
      .landing-hero-section {
        padding: 56px 40px 100px !important;
      }

      .landing-hero-title {
        font-size: 36px !important;
      }

      .landing-hero-subtitle {
        font-size: 18px !important;
      }

      .landing-content-wrapper {
        padding: 64px 32px 120px !important;
      }

      .landing-modules-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 24px !important;
        max-width: 900px !important;
        margin: 0 auto !important;
      }

      .landing-module-card {
        padding: 32px 28px !important;
        min-height: 240px !important;
      }
    }

    /* Large Desktop (1280px+) */
    @media (min-width: 1280px) {
      .landing-modules-grid {
        grid-template-columns: repeat(4, 1fr) !important;
        max-width: 1200px !important;
      }

      .landing-module-card {
        padding: 32px 24px !important;
        min-height: 260px !important;
      }
    }

    /* Touch-friendly interactions for mobile */
    @media (max-width: 768px) {
      .module-card-hover {
        -webkit-tap-highlight-color: rgba(79, 70, 229, 0.1);
      }

      .module-card-hover:active {
        transform: scale(0.98);
        background: #f9fafb;
      }
    }

    /* Smooth scrolling */
    html {
      scroll-behavior: smooth;
    }

    /* Prevent text selection on tap for better UX */
    .module-card-hover {
      -webkit-user-select: none;
      user-select: none;
    }
  `}</style>
);
