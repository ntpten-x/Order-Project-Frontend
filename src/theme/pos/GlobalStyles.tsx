"use client";

import React from 'react';

/**
 * POS Global Styles
 * Modern Minimal Design - subtle animations, comprehensive responsive system
 */
export const POSGlobalStyles = () => (
  <style jsx global>{`
    /* ===========================================
       CSS Variables - Design Tokens
       =========================================== */
    :root {
      --pos-primary: #6366F1;
      --pos-primary-light: #EEF2FF;
      --pos-success: #10B981;
      --pos-success-light: #ECFDF5;
      --pos-warning: #F59E0B;
      --pos-warning-light: #FFFBEB;
      --pos-error: #EF4444;
      --pos-error-light: #FEF2F2;
      
      --pos-bg: #F8FAFC;
      --pos-card: #FFFFFF;
      --pos-border: #E2E8F0;
      
      --pos-text-primary: #1E293B;
      --pos-text-secondary: #64748B;
      --pos-text-muted: #94A3B8;
      
      --pos-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
      --pos-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06);
      --pos-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.08);
      
      --pos-radius-sm: 8px;
      --pos-radius-md: 12px;
      --pos-radius-lg: 16px;
      --pos-radius-xl: 20px;
      
      --pos-transition: 0.2s ease;
      --pos-transition-slow: 0.3s ease;
    }
    
    /* Force Select Dropdown Z-Index */
    :global(.ant-select-dropdown) {
      z-index: 10000 !important;
      pointer-events: auto !important;
    }

    /* ===========================================
       Animations - Subtle & Clean
       =========================================== */
    
    /* Fade In Up - Page elements */
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
    .fade-in-up {
      animation: fadeInUp 0.35s ease-out forwards;
    }

    /* Slide In Up - Cards & modals */
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .slide-in-up {
      animation: slideInUp 0.3s ease-out forwards;
    }
    
    /* Scale In - Buttons & icons */
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
    .scale-in {
      animation: scaleIn 0.25s ease-out forwards;
    }

    /* Pulse - Notifications & badges */
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    .pulse-animation {
      animation: pulse 2s ease-in-out infinite;
    }

    /* Pulse Dot - Live indicators */
    @keyframes pulseDot {
      0%, 100% { opacity: 1; box-shadow: 0 0 0 0 currentColor; }
      50% { opacity: 0.8; box-shadow: 0 0 0 4px transparent; }
    }
    .pulse-dot {
      animation: pulseDot 2s ease-in-out infinite;
    }

    /* Float - Decorative elements */
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
    }
    .float-animation {
      animation: float 3s ease-in-out infinite;
    }

    /* Shimmer - Loading states */
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .shimmer {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    /* ===========================================
       Card Animations & Hover Effects
       =========================================== */
    
    /* Channel Cards - slightly elevated on hover */
    .channel-card-hover {
      transition: transform var(--pos-transition), box-shadow var(--pos-transition);
    }
    .channel-card-hover:hover {
      transform: translateY(-6px);
      box-shadow: var(--pos-shadow-lg);
    }
    .channel-card-hover:active {
      transform: translateY(-2px);
    }
    .channel-card-hover:hover .icon-wrapper {
      transform: scale(1.05);
    }
    
    /* Table Cards */
    .table-card-animate {
      animation: slideInUp 0.3s ease-out forwards;
      opacity: 0;
    }
    .table-card-hover {
      transition: transform var(--pos-transition), box-shadow var(--pos-transition);
    }
    .table-card-hover:hover {
      transform: translateY(-4px);
      box-shadow: var(--pos-shadow-md);
    }
    .table-card-hover:active {
      transform: translateY(-2px);
    }

    /* Generic Card Hover */
    .card-hover {
      transition: transform var(--pos-transition), box-shadow var(--pos-transition);
    }
    .card-hover:hover {
      transform: translateY(-2px);
      box-shadow: var(--pos-shadow-md);
    }
    .card-hover:active {
      transform: scale(0.99);
    }

    /* Button Hover */
    .btn-hover {
      transition: transform var(--pos-transition), box-shadow var(--pos-transition);
    }
    .btn-hover:hover {
      transform: translateY(-1px);
    }
    .btn-hover:active {
      transform: translateY(0);
    }

    /* ===========================================
       Animation Delays - Staggered Entry
       =========================================== */
    .delay-1 { animation-delay: 0.05s; opacity: 0; }
    .delay-2 { animation-delay: 0.1s; opacity: 0; }
    .delay-3 { animation-delay: 0.15s; opacity: 0; }
    .delay-4 { animation-delay: 0.2s; opacity: 0; }
    .delay-5 { animation-delay: 0.25s; opacity: 0; }
    .delay-6 { animation-delay: 0.3s; opacity: 0; }

    /* Legacy support */
    .card-delay-1 { animation-delay: 0.05s; opacity: 0; }
    .card-delay-2 { animation-delay: 0.1s; opacity: 0; }
    .card-delay-3 { animation-delay: 0.15s; opacity: 0; }
    .table-card-delay-1 { animation-delay: 0.03s; }
    .table-card-delay-2 { animation-delay: 0.06s; }
    .table-card-delay-3 { animation-delay: 0.09s; }
    .table-card-delay-4 { animation-delay: 0.12s; }
    .table-card-delay-5 { animation-delay: 0.15s; }
    .table-card-delay-6 { animation-delay: 0.18s; }

    /* ===========================================
       Header Decorative Elements
       =========================================== */
    .header-pattern {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px);
      background-size: 24px 24px;
      opacity: 0.5;
      pointer-events: none;
    }
    
    .header-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
    }
    .circle-1 {
      width: 200px;
      height: 200px;
      top: -100px;
      right: -60px;
    }
    .circle-2 {
      width: 120px;
      height: 120px;
      bottom: -60px;
      left: -30px;
    }

    /* Header icon animation - subtle float */
    .header-icon-animate {
      animation: float 4s ease-in-out infinite;
    }

    /* ===========================================
       Utility Classes
       =========================================== */
    .text-gradient {
      background: linear-gradient(135deg, var(--pos-primary) 0%, #8B5CF6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .glass-effect {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }

    /* Custom Scrollbar */
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #CBD5E1;
      border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #94A3B8;
    }

    /* ===========================================
       Responsive Breakpoints
       =========================================== */
    
    /* Tablet and below (768px) */
    @media (max-width: 768px) {
      /* Channels */
      .channels-header-mobile {
        padding: 32px 16px 48px !important;
        border-bottom-left-radius: 20px !important;
        border-bottom-right-radius: 20px !important;
      }
      .channels-header-icon-mobile { font-size: 36px !important; }
      .channels-header-title-mobile { font-size: 22px !important; }
      .channels-header-subtitle-mobile { font-size: 13px !important; }
      .channels-cards-container-mobile {
        margin-top: -32px !important;
        padding: 0 16px 100px !important;
      }
      .channels-card-inner-mobile { padding: 24px 16px !important; }
      .channels-icon-wrapper-mobile {
        width: 80px !important;
        height: 80px !important;
        margin-bottom: 16px !important;
      }
      .channels-channel-icon-mobile { font-size: 36px !important; }
      .channels-card-title-mobile { font-size: 18px !important; }
      .channels-card-subtitle-mobile { font-size: 12px !important; }
      .channels-stats-badge-mobile {
        padding: 6px 12px !important;
        font-size: 12px !important;
        margin-top: 12px !important;
      }
      
      /* Dine In */
      .dine-in-header-mobile {
        padding: 16px !important;
        margin-bottom: 16px !important;
      }
      .dine-in-header-content-mobile {
        flex-wrap: wrap !important;
        gap: 12px !important;
      }
      .dine-in-back-button-mobile {
        padding: 6px 10px !important;
        font-size: 14px !important;
      }
      .dine-in-title-section-mobile {
        flex: 1 1 100% !important;
        order: 2 !important;
      }
      .dine-in-stats-bar-mobile {
        order: 3 !important;
        width: 100% !important;
        justify-content: space-around !important;
        margin-top: 8px !important;
      }
      .dine-in-header-icon-mobile { font-size: 22px !important; }
      .dine-in-header-title-mobile { font-size: 16px !important; }
      .dine-in-table-card-mobile { margin-bottom: 0 !important; }
      .dine-in-table-icon-mobile { font-size: 36px !important; }
      .dine-in-table-name-mobile { font-size: 28px !important; }

      /* Orders */
      .orders-header-content-mobile {
        flex-wrap: wrap !important;
        gap: 12px !important;
      }
      .orders-back-button-mobile { font-size: 16px !important; }
      .orders-header-text-mobile { 
        flex: 1 1 100% !important;
        order: 2 !important;
      }
      .orders-header-actions-mobile {
        order: 3 !important;
        width: 100% !important;
        justify-content: flex-end !important;
      }
      .orders-search-input-mobile { width: 100% !important; }
      .orders-refresh-button-mobile { flex-shrink: 0 !important; }
      .hide-on-mobile { display: none !important; }

      /* Generic Page Layout */
      .page-header-mobile { padding: 16px !important; }
      .page-content-mobile { padding: 0 12px 80px !important; }
      .page-title-mobile { font-size: 18px !important; }
      .page-subtitle-mobile { font-size: 13px !important; }
    }

    /* Mobile Small (480px) */
    @media (max-width: 480px) {
      .channels-header-mobile { padding: 24px 12px 40px !important; }
      .channels-header-title-mobile { font-size: 20px !important; }
      .channels-card-inner-mobile { padding: 20px 12px !important; }
      .channels-icon-wrapper-mobile { width: 64px !important; height: 64px !important; }
      .channels-channel-icon-mobile { font-size: 28px !important; }

      .dine-in-header-mobile {
        border-radius: 0 0 16px 16px !important;
      }
      .dine-in-content-mobile {
        padding: 0 8px 16px !important;
      }
      .dine-in-stat-text-mobile {
        font-size: 11px !important;
      }

      .page-header-mobile { padding: 12px !important; }
      .page-content-mobile { padding: 0 8px 72px !important; }
      .page-title-mobile { font-size: 16px !important; }
    }

    /* Desktop (1024px+) */
    @media (min-width: 1024px) {
      .desktop-grid-3 {
        grid-template-columns: repeat(3, 1fr) !important;
      }
      .desktop-grid-4 {
        grid-template-columns: repeat(4, 1fr) !important;
      }
    }

    /* ===========================================
       Safe Area for Bottom Navigation
       =========================================== */
    .safe-bottom {
      padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
    }
    .safe-bottom-sm {
      padding-bottom: calc(100px + env(safe-area-inset-bottom, 0px));
    }
  `}</style>
);
