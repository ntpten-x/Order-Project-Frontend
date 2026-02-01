import { CSSProperties } from 'react';

// Queue Page Styles - Mobile First Design
export const queueStyles = {
    container: {
        minHeight: '100vh',
        background: '#f5f7fa',
        fontFamily: "'Inter', 'Sarabun', sans-serif",
        paddingBottom: 100,
    } as CSSProperties,

    header: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px 16px 60px',
        position: 'relative' as CSSProperties['position'],
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.2)',
        marginBottom: -32,
        zIndex: 1,
        overflow: 'hidden' as CSSProperties['overflow'],
    } as CSSProperties,

    headerContent: {
        maxWidth: 1400,
        margin: '0 auto',
        position: 'relative' as CSSProperties['position'],
        zIndex: 2,
    } as CSSProperties,

    headerTop: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 20,
        flexWrap: 'wrap' as CSSProperties['flexWrap'],
    } as CSSProperties,

    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        minWidth: 200,
    } as CSSProperties,

    headerIconBox: {
        width: 56,
        height: 56,
        borderRadius: 14,
        background: 'rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
    } as CSSProperties,

    headerTitleBox: {
        flex: 1,
    } as CSSProperties,

    headerSubtitle: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 13,
        display: 'block',
        marginBottom: 4,
    } as CSSProperties,

    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 700,
        margin: 0,
        lineHeight: 1.2,
    } as CSSProperties,

    headerActions: {
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap' as CSSProperties['flexWrap'],
    } as CSSProperties,

    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
        marginBottom: 24,
    } as CSSProperties,

    statCard: {
        background: 'white',
        borderRadius: 16,
        padding: 20,
        textAlign: 'center' as CSSProperties['textAlign'],
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #f0f0f0',
    } as CSSProperties,

    statIcon: {
        fontSize: 32,
        marginBottom: 8,
    } as CSSProperties,

    statLabel: {
        fontSize: 13,
        color: '#8c8c8c',
        marginTop: 4,
    } as CSSProperties,

    queueList: {
        display: 'flex',
        flexDirection: 'column' as CSSProperties['flexDirection'],
        gap: 12,
    } as CSSProperties,

    queueCard: {
        background: 'white',
        borderRadius: 16,
        padding: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #f0f0f0',
        transition: 'all 0.3s ease',
    } as CSSProperties,

    queueCardContent: {
        display: 'flex',
        flexDirection: 'column' as CSSProperties['flexDirection'],
        gap: 12,
    } as CSSProperties,

    queueCardTop: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    } as CSSProperties,

    queuePosition: {
        width: 48,
        height: 48,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 700,
        fontSize: 18,
        flexShrink: 0,
    } as CSSProperties,

    queueInfo: {
        flex: 1,
        minWidth: 0,
    } as CSSProperties,

    queueOrderNo: {
        fontSize: 16,
        fontWeight: 600,
        color: '#1a1a2e',
        marginBottom: 4,
    } as CSSProperties,

    queueTags: {
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap' as CSSProperties['flexWrap'],
        marginBottom: 8,
    } as CSSProperties,

    queueMeta: {
        display: 'flex',
        flexDirection: 'column' as CSSProperties['flexDirection'],
        gap: 4,
        fontSize: 12,
        color: '#8c8c8c',
    } as CSSProperties,

    queueNotes: {
        fontSize: 12,
        color: '#8c8c8c',
        marginTop: 4,
        padding: 8,
        background: '#f8f9fa',
        borderRadius: 8,
    } as CSSProperties,

    queueActions: {
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap' as CSSProperties['flexWrap'],
        marginTop: 8,
    } as CSSProperties,

    emptyCard: {
        background: 'white',
        borderRadius: 16,
        padding: 60,
        textAlign: 'center' as CSSProperties['textAlign'],
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    } as CSSProperties,
};

// Responsive Global Styles
export const queueResponsiveStyles = `
    /* Mobile First - Base Styles */
    .queue-header-mobile {
        padding: 20px 16px 50px !important;
    }

    .queue-header-icon-mobile {
        width: 48px !important;
        height: 48px !important;
        font-size: 20px !important;
    }

    .queue-header-title-mobile {
        font-size: 18px !important;
    }

    .queue-header-subtitle-mobile {
        font-size: 12px !important;
    }

    .queue-stats-grid-mobile {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 10px !important;
    }

    .queue-stat-card-mobile {
        padding: 16px 12px !important;
    }

    .queue-stat-icon-mobile {
        font-size: 28px !important;
    }

    .queue-card-mobile {
        padding: 14px !important;
    }

    .queue-position-mobile {
        width: 44px !important;
        height: 44px !important;
        font-size: 16px !important;
    }

    .queue-order-no-mobile {
        font-size: 15px !important;
    }

    .queue-actions-mobile {
        flex-direction: column !important;
    }

    .queue-actions-mobile button {
        width: 100% !important;
        height: 44px !important;
    }

    /* Tablet (768px+) */
    @media (min-width: 768px) {
        .queue-header-mobile {
            padding: 32px 24px 60px !important;
        }

        .queue-header-icon-mobile {
            width: 64px !important;
            height: 64px !important;
            font-size: 28px !important;
        }

        .queue-header-title-mobile {
            font-size: 24px !important;
        }

        .queue-stats-grid-mobile {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 16px !important;
        }

        .queue-stat-card-mobile {
            padding: 24px 20px !important;
        }

        .queue-stat-icon-mobile {
            font-size: 36px !important;
        }

        .queue-card-mobile {
            padding: 20px !important;
        }

        .queue-card-content-mobile {
            flex-direction: row !important;
            align-items: center !important;
        }

        .queue-actions-mobile {
            flex-direction: row !important;
            margin-top: 0 !important;
            margin-left: auto !important;
        }

        .queue-actions-mobile button {
            width: auto !important;
        }
    }

    /* Desktop (1024px+) */
    @media (min-width: 1024px) {
        .queue-header-mobile {
            padding: 40px 32px 80px !important;
        }

        .queue-stats-grid-mobile {
            gap: 20px !important;
        }
    }

    /* Animations */
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(12px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .queue-card-animate {
        animation: fadeInUp 0.4s ease forwards;
        opacity: 0;
    }

    .queue-card-delay-1 { animation-delay: 0.1s; }
    .queue-card-delay-2 { animation-delay: 0.2s; }
    .queue-card-delay-3 { animation-delay: 0.3s; }
    .queue-card-delay-4 { animation-delay: 0.4s; }

    /* Hover Effects */
    .queue-card-hover:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important;
    }

    .queue-card-hover:active {
        transform: translateY(0);
    }

    /* Touch-friendly */
    @media (max-width: 768px) {
        .queue-card-hover {
            -webkit-tap-highlight-color: rgba(102, 126, 234, 0.1);
        }

        .hide-on-mobile {
            display: none !important;
        }
    }

    @media (min-width: 769px) {
        .hide-on-mobile {
            display: inline !important;
        }
    }
`;
