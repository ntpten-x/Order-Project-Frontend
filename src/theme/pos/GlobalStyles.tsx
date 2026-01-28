"use client";

import React from 'react';

export const POSGlobalStyles = () => (
  <style jsx global>{`
    /* Animation: Fade In Up */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .fade-in-up {
      animation: fadeInUp 0.4s ease-out forwards;
    }

    /* Animation: Slide In Up (Generic) */
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .slide-in-up {
      animation: slideInUp 0.4s ease-out forwards;
    }
    
    /* Table Card specific usage of slideInUp */
    .table-card-animate {
      animation: slideInUp 0.4s ease-out forwards;
      opacity: 0;
    }

    /* Animation: Pulse */
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.8; }
    }
    .pulse-animation {
      animation: pulse 2s ease-in-out infinite;
    }

    /* Animation: Pulse Soft */
    @keyframes pulse-soft {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .pulse-soft {
      animation: pulse-soft 2s ease-in-out infinite;
    }

    /* Animation: Float */
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    .header-icon-animate {
      animation: float 3s ease-in-out infinite;
    }

    /* Animation: Shimmer */
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* Hover Effects */
    .hover-scale {
      transition: transform 0.2s;
    }
    .hover-scale:hover {
      transform: translateY(-4px);
    }
    
    .channel-card-hover:hover {
      transform: translateY(-12px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }
    .channel-card-hover:hover .icon-wrapper {
      transform: scale(1.1) rotate(5deg);
    }
    .channel-card-hover:hover .decorative-glow {
      opacity: 0.4;
      transform: translate(-50%, -50%) scale(1.2);
    }
    .channel-card-hover:active {
      transform: translateY(-8px);
    }
    
    .dine-in-table-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }
    .dine-in-table-card:active {
      transform: translateY(-4px);
    }

    .back-button-hover:hover {
      background: rgba(255, 255, 255, 0.25) !important;
    }

    /* Delays */
    .card-delay-1 { animation-delay: 0.1s; opacity: 0; }
    .card-delay-2 { animation-delay: 0.2s; opacity: 0; }
    .card-delay-3 { animation-delay: 0.3s; opacity: 0; }

    .table-card-delay-1 { animation-delay: 0.05s; }
    .table-card-delay-2 { animation-delay: 0.1s; }
    .table-card-delay-3 { animation-delay: 0.15s; }
    .table-card-delay-4 { animation-delay: 0.2s; }
    .table-card-delay-5 { animation-delay: 0.25s; }
    .table-card-delay-6 { animation-delay: 0.3s; }

    /* Decorative Backgrounds */
    .header-pattern {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: radial-gradient(rgba(255, 255, 255, 0.15) 2px, transparent 2px);
      background-size: 30px 30px;
      opacity: 0.4;
      pointer-events: none;
    }
    .header-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
    }
    .circle-1 {
      width: 300px;
      height: 300px;
      top: -150px;
      right: -100px;
    }
    .circle-2 {
      width: 200px;
      height: 200px;
      bottom: -100px;
      left: -50px;
    }

    /* Mobile Responsive Styles - Channels */
    @media (max-width: 768px) {
      .channels-header-mobile {
        padding: 40px 16px 60px !important;
        border-bottom-left-radius: 24px !important;
        border-bottom-right-radius: 24px !important;
      }
      .channels-header-icon-mobile { font-size: 40px !important; }
      .channels-header-title-mobile { font-size: 24px !important; }
      .channels-header-subtitle-mobile { font-size: 14px !important; }
      .channels-cards-container-mobile {
        margin-top: -40px !important;
        padding: 0 16px 120px !important;
      }
      .channels-card-inner-mobile { padding: 32px 20px !important; }
      .channels-icon-wrapper-mobile {
        width: 100px !important;
        height: 100px !important;
        margin-bottom: 20px !important;
      }
      .channels-channel-icon-mobile { font-size: 44px !important; }
      .channels-card-title-mobile { font-size: 20px !important; }
      .channels-card-subtitle-mobile { font-size: 13px !important; }
      .channels-stats-badge-mobile {
        padding: 6px 12px !important;
        font-size: 13px !important;
        margin-top: 16px !important;
      }
      
      /* Dine In Mobile */
      .dine-in-header-mobile {
        padding: 20px 16px !important;
        margin-bottom: 20px !important;
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
      .dine-in-header-icon-mobile {
        font-size: 24px !important;
      }
      .dine-in-header-title-mobile {
        font-size: 18px !important;
      }
      .dine-in-table-card-mobile {
        margin-bottom: 0 !important;
      }
      .dine-in-table-icon-mobile {
        font-size: 40px !important;
      }
      .dine-in-table-name-mobile {
        font-size: 32px !important;
      }
    }

    @media (max-width: 480px) {
      .channels-header-mobile { padding: 32px 16px 50px !important; }
      .channels-header-title-mobile { font-size: 22px !important; }
      .channels-card-inner-mobile { padding: 24px 16px !important; }
      .channels-icon-wrapper-mobile { width: 80px !important; height: 80px !important; }
      .channels-channel-icon-mobile { font-size: 36px !important; }

      /* Dine In Mobile */
      .dine-in-header-mobile {
        border-radius: 0 0 16px 16px !important;
      }
      .dine-in-content-mobile {
        padding: 0 12px 20px !important;
      }
      .dine-in-stat-text-mobile {
        font-size: 12px !important;
      }
    }
  `}</style>
);
