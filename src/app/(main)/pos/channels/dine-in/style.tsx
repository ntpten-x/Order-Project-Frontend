"use client";

import { CSSProperties } from 'react';
import { tableColors } from '@/theme/pos/dine-in.theme';

export { tableColors };

export const dineInStyles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #f0f2f5 0%, #ffffff 100%)',
    fontFamily: "'Inter', 'Sarabun', sans-serif",
    paddingBottom: 100,
  } as CSSProperties,

  header: {
    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    padding: '24px 16px',
    position: 'relative' as CSSProperties['position'],
    overflow: 'hidden',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    boxShadow: '0 8px 32px rgba(24, 144, 255, 0.2)',
    marginBottom: 24,
  },

  headerContent: {
    maxWidth: 1400,
    margin: '0 auto',
    position: 'relative' as CSSProperties['position'],
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap' as CSSProperties['flexWrap'],
  },

  backButton: {
    color: '#fff',
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 10,
    padding: '6px 12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  } as CSSProperties,

  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  headerIcon: {
    fontSize: 28,
    color: '#fff',
  },

  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    lineHeight: 1.2,
  } as CSSProperties,

  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: 400,
  } as CSSProperties,

  statsBar: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    background: 'rgba(255,255,255,0.15)',
    padding: '8px 14px',
    borderRadius: 10,
    backdropFilter: 'blur(10px)',
    flexShrink: 0,
  } as CSSProperties,

  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },

  statDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  } as CSSProperties,

  statText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap' as CSSProperties['whiteSpace'],
  } as CSSProperties,

  contentContainer: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '0 16px 24px',
  },

  tableCard: {
    borderRadius: 16,
    border: 'none',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    cursor: 'pointer',
    position: 'relative' as CSSProperties['position'],
  } as CSSProperties,

  tableCardInner: {
    padding: '24px 16px',
    textAlign: 'center' as CSSProperties['textAlign'],
    position: 'relative' as CSSProperties['position'],
    zIndex: 2,
  },

  tableIcon: {
    fontSize: 48,
    marginBottom: 12,
    display: 'block',
  },

  tableName: {
    fontSize: 42,
    fontWeight: 800,
    marginBottom: 0,
    color: '#1f1f1f',
    lineHeight: 1,
    letterSpacing: '-1px',
    display: 'block',
  } as CSSProperties,

  statusBadge: {
    padding: '4px 12px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    display: 'inline-block',
    marginTop: 12,
  } as CSSProperties,

  orderStatusTag: {
    marginTop: 8,
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 500,
    display: 'inline-block',
  } as CSSProperties,

  cardGradientOverlay: {
    position: 'absolute' as CSSProperties['position'],
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
    pointerEvents: 'none' as CSSProperties['pointerEvents'],
  },

  emptyState: {
    background: '#fff',
    borderRadius: 16,
    padding: 60,
    textAlign: 'center' as CSSProperties['textAlign'],
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  },

  loadingContainer: {
    background: '#fff',
    borderRadius: 16,
    padding: 60,
    textAlign: 'center' as CSSProperties['textAlign'],
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  },
};

export const DineInStyles = () => (
  <style jsx global>{`
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

    .table-card-animate {
      animation: slideInUp 0.4s ease-out forwards;
      opacity: 0;
    }

    .table-card-delay-1 { animation-delay: 0.05s; }
    .table-card-delay-2 { animation-delay: 0.1s; }
    .table-card-delay-3 { animation-delay: 0.15s; }
    .table-card-delay-4 { animation-delay: 0.2s; }
    .table-card-delay-5 { animation-delay: 0.25s; }
    .table-card-delay-6 { animation-delay: 0.3s; }

    @keyframes pulse-soft {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }

    .pulse-soft {
      animation: pulse-soft 2s ease-in-out infinite;
    }

    /* Mobile Responsive Styles */
    @media (max-width: 768px) {
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
