"use client";

import { CSSProperties } from 'react';

// Color palette for channels
export const channelColors = {
  dineIn: {
    primary: '#1890ff',
    light: '#e6f7ff',
    border: '#91d5ff',
    gradient: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
  },
  takeaway: {
    primary: '#52c41a',
    light: '#f6ffed',
    border: '#b7eb8f',
    gradient: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
  },
  delivery: {
    primary: '#722ed1',
    light: '#f9f0ff',
    border: '#d3adf7',
    gradient: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
  },
};

export const channelPageStyles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #f0f2f5 0%, #ffffff 100%)',
    fontFamily: "'Inter', 'Sarabun', sans-serif",
  } as CSSProperties,

  header: {
    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    padding: '48px 24px',
    textAlign: 'center' as CSSProperties['textAlign'],
    position: 'relative' as CSSProperties['position'],
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    boxShadow: '0 8px 32px rgba(24, 144, 255, 0.2)',
  },

  headerContent: {
    maxWidth: 800,
    margin: '0 auto',
    position: 'relative' as CSSProperties['position'],
    zIndex: 10,
  },

  headerIcon: {
    fontSize: 56,
    color: '#fff',
    marginBottom: 16,
    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
  },

  headerTitle: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 700,
    margin: 0,
    marginBottom: 8,
    textShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as CSSProperties,

  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 18,
    fontWeight: 400,
  } as CSSProperties,

  cardsContainer: {
    maxWidth: 1200,
    margin: '-40px auto 0',
    padding: '0 24px 80px',
    position: 'relative' as CSSProperties['position'],
    zIndex: 20,
  },

  channelCard: {
    height: '100%',
    borderRadius: 24,
    border: 'none',
    background: '#fff',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    cursor: 'pointer',
  } as CSSProperties,

  cardInner: {
    padding: '48px 32px',
    textAlign: 'center' as CSSProperties['textAlign'],
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as CSSProperties['flexDirection'],
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as CSSProperties['position'],
  },

  iconWrapper: {
    width: 140,
    height: 140,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 32px',
    position: 'relative' as CSSProperties['position'],
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  channelIcon: {
    fontSize: 64,
    position: 'relative' as CSSProperties['position'],
    zIndex: 2,
  },

  cardTitle: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8,
    color: '#262626',
  } as CSSProperties,

  cardSubtitle: {
    fontSize: 16,
    color: '#8c8c8c',
    fontWeight: 400,
  } as CSSProperties,

  statsBadge: {
    marginTop: 20,
    padding: '8px 16px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.3s ease',
  } as CSSProperties,

  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    display: 'inline-block',
  } as CSSProperties,

  loadingSkeleton: {
    width: 100,
    height: 32,
    borderRadius: 12,
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    marginTop: 20,
  } as CSSProperties,

  decorativeGlow: {
    position: 'absolute' as CSSProperties['position'],
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    opacity: 0.2,
    filter: 'blur(20px)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export const ChannelStyles = () => (
  <style jsx global>{`
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

    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    .header-icon-animate {
      animation: float 3s ease-in-out infinite;
    }

    .fade-in-up {
      animation: fadeInUp 0.6s ease-out forwards;
    }

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

    .card-delay-1 {
      animation-delay: 0.1s;
      opacity: 0;
    }

    .card-delay-2 {
      animation-delay: 0.2s;
      opacity: 0;
    }

    .card-delay-3 {
      animation-delay: 0.3s;
      opacity: 0;
    }

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

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.6;
        transform: scale(1.1);
      }
    }

    .pulse-animation {
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
  `}</style>
);
