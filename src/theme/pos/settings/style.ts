
import { CSSProperties } from 'react';
import { posColors } from '../index';

// ============ SETTINGS STYLES - Soft Modern Clarity ============

export const pageStyles = {
    container: {
        minHeight: '100vh',
        background: posColors.background,
        fontFamily: "var(--font-sans), 'Sarabun', sans-serif",
        paddingBottom: 60,
    } as CSSProperties,

    heroParams: {
        background: `linear-gradient(145deg, ${posColors.primary} 0%, ${posColors.primaryDark} 100%)`,
        padding: '20px 20px 60px',
        position: 'relative' as const,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        boxShadow: '0 8px 24px rgba(99, 102, 241, 0.2)',
        zIndex: 1,
        overflow: 'hidden',
    } as CSSProperties,

    heroDecoCircle1: {
        position: 'absolute' as const,
        top: -60,
        right: -60,
        width: 160,
        height: 160,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
    } as CSSProperties,

    heroDecoCircle2: {
        position: 'absolute' as const,
        bottom: -40,
        left: -40,
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
    } as CSSProperties,

    headerContent: {
        maxWidth: 1000,
        margin: '0 auto',
        position: 'relative' as const,
        zIndex: 10,
    } as CSSProperties,

    headerRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
    } as CSSProperties,

    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        background: 'rgba(255,255,255,0.2)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.3)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    } as CSSProperties,

    headerIconBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.2)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    } as CSSProperties,

    sectionTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        color: '#fff',
    } as CSSProperties,

    contentWrapper: {
        maxWidth: 700,
        margin: '-40px auto 30px',
        padding: '0 20px',
        position: 'relative' as const,
        zIndex: 20
    } as CSSProperties,

    card: {
        borderRadius: 20,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        border: 'none',
    } as CSSProperties,

    activeAccountCard: {
        background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
        border: '1px solid #a7f3d0',
        borderRadius: 16,
        padding: '20px',
        marginBottom: 24
    } as CSSProperties,

    addButton: {
        borderRadius: 14,
        height: 52,
        fontSize: 16,
        fontWeight: 600,
        background: '#fff',
        border: `2px dashed ${posColors.primary}`,
        color: posColors.primary,
        transition: 'all 0.2s ease',
    } as CSSProperties,

    dividerTitle: {
        fontSize: 16,
        fontWeight: 600
    } as CSSProperties,

    accountSelector: {
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: '14px 18px',
        cursor: 'pointer',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 56,
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    } as CSSProperties,

    accountSelectorHover: {
        borderColor: posColors.primary,
        boxShadow: `0 0 0 3px ${posColors.primaryLight}`,
    } as CSSProperties,

    modalAccountItem: {
        padding: '16px',
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        cursor: 'pointer',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease',
    } as CSSProperties,

    modalAccountItemActive: {
        border: '2px solid #10b981',
        background: '#ecfdf5',
    } as CSSProperties,

    accountIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    } as CSSProperties,
};

// Responsive CSS
export const settingsResponsiveStyles = `
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

    .settings-card-animate {
        animation: fadeInUp 0.4s ease forwards;
        opacity: 0;
    }

    /* Mobile-first */
    .settings-header-mobile {
        padding: 16px 16px 50px !important;
    }

    .settings-content-mobile {
        padding: 0 16px !important;
        margin-top: -35px !important;
    }

    @media (max-width: 576px) {
        .settings-header-mobile .header-icon-box {
            width: 48px !important;
            height: 48px !important;
        }

        .settings-header-mobile .header-title {
            font-size: 20px !important;
        }

        .settings-modal .ant-modal {
            max-width: calc(100vw - 32px) !important;
            margin: 16px auto !important;
        }

        .settings-modal .ant-modal-content {
            border-radius: 20px;
        }
    }

    @media (min-width: 768px) {
        .settings-header-mobile {
            padding: 24px 24px 60px !important;
        }

        .settings-content-mobile {
            padding: 0 24px !important;
        }
    }

    /* Touch-friendly */
    .settings-touch-btn {
        -webkit-tap-highlight-color: rgba(99, 102, 241, 0.1);
        touch-action: manipulation;
        min-height: 44px;
    }
`;
