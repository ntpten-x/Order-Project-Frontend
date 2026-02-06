"use client";

import { CSSProperties } from 'react';

export const pageStyles = {
  container: {
    minHeight: '100vh',
    background: '#f8f9fc',
    fontFamily: "var(--font-sans), 'Sarabun', sans-serif",
  } as CSSProperties,
  
  heroParams: {
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    padding: '40px 24px 80px',
    position: 'relative' as CSSProperties['position'],
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    boxShadow: '0 10px 30px -10px rgba(79, 70, 229, 0.3)',
    marginBottom: -40,
    zIndex: 1,
    overflow: 'hidden',
  },

  contentWrapper: {
    padding: '0 24px 120px', 
    maxWidth: 1200, 
    margin: '0 auto', 
    width: '100%',
    position: 'relative' as CSSProperties['position'],
    zIndex: 2,
  },

  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    color: '#fff', // White text on Hero
  },

  gridConfig: {
    gutter: [24, 24] as [number, number],
    xs: 1,
    sm: 1,
    md: 2,
    lg: 3,
    xl: 3,
    xxl: 4,
  }
};

export const DashboardStyles = () => (
  <style jsx global>{`
    .hero-pattern {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px);
      background-size: 20px 20px;
      opacity: 0.5;
      pointer-events: none;
    }
    .decorative-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
    }
    .circle-1 {
      width: 300px;
      height: 300px;
      top: -100px;
      right: -50px;
    }
    .circle-2 {
      width: 150px;
      height: 150px;
      bottom: -30px;
      left: 10%;
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-card {
      animation: fadeInUp 0.6s ease-out forwards;
      opacity: 0;
    }
  `}</style>
);
