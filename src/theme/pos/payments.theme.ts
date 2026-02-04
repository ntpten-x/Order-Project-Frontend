import { CSSProperties } from 'react';
import { orderColors } from './orders/style';

export const paymentColors = {
    ...orderColors, // Inherit base colors

    // Payment specific overrides or additions if needed
    cash: '#10b981',
    qr: '#1d4ed8',
    creditCard: '#f59e0b',

    totalCardBg: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    summaryBg: '#fafafa',
};

export const paymentPageStyles = {
    // Layout
    container: {
        minHeight: '100vh',
        background: paymentColors.background,
        fontFamily: "var(--font-sans), 'Sarabun', sans-serif",
    } as CSSProperties,

    heroSection: {
        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
        padding: '32px 24px 70px',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        boxShadow: '0 8px 24px rgba(24, 144, 255, 0.25)',
        marginBottom: -40,
        zIndex: 1, // Ensure base level
    } as CSSProperties,

    contentWrapper: {
        maxWidth: 1200,
        margin: '0 auto',
        paddingTop: 16,
        position: 'relative' as const,
        zIndex: 100, // Ensure content is above hero
    } as CSSProperties,

    // Typography
    pageTitle: {
        margin: 0,
        color: '#fff',
        fontSize: 'clamp(20px, 5vw, 28px)',
        fontWeight: 700,
    } as CSSProperties,

    pageSubtitle: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 14,
    } as CSSProperties,

    // Cards
    card: {
        borderRadius: 12,
        border: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    } as CSSProperties,

    // Payment Methods
    methodCard: {
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: '#f0f0f0',
        borderRadius: 12,
        padding: 16,
        textAlign: 'center' as const,
        cursor: 'pointer',
        background: '#fff',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    } as CSSProperties,

    methodCardSelected: {
        borderColor: paymentColors.primary,
        background: '#eff6ff',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
    } as CSSProperties,

    // QR & Input Areas
    inputArea: {
        background: '#f8fafc',
        padding: 20,
        borderRadius: 12,
        border: `1px solid ${paymentColors.border}`,
    } as CSSProperties,

    qrArea: {
        textAlign: 'center' as const,
        background: '#fff',
        padding: 24,
        borderRadius: 16,
        border: `1px dashed ${paymentColors.primary}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    } as CSSProperties,

    // Summary Box
    summaryBox: {
        marginTop: 'auto',
        background: paymentColors.backgroundSecondary,
        padding: 16,
        borderRadius: 12,
    } as CSSProperties,
};

// Responsive Global Styles for Payment Pages
export const paymentResponsiveStyles = `
    /* Mobile First - Base Styles (up to 480px) */
    .payment-hero-mobile {
        padding: 24px 16px 60px !important;
        border-bottom-left-radius: 20px !important;
        border-bottom-right-radius: 20px !important;
    }

    .payment-title-mobile {
        font-size: 20px !important;
    }

    .payment-subtitle-mobile {
        font-size: 12px !important;
    }

    .payment-content-mobile {
        padding: 40px 12px 80px !important;
    }

    .payment-card-mobile {
        margin-bottom: 16px !important;
        border-radius: 16px !important;
    }

    .payment-method-card-mobile {
        padding: 14px !important;
        min-height: 100px !important;
    }

    .payment-button-mobile {
        height: 48px !important;
        font-size: 16px !important;
        border-radius: 12px !important;
    }

    .payment-input-mobile {
        height: 48px !important;
        font-size: 16px !important;
    }

    /* Small Mobile (481px - 767px) */
    @media (min-width: 481px) {
        .payment-hero-mobile {
            padding: 28px 20px 60px !important;
        }

        .payment-title-mobile {
            font-size: 24px !important;
        }

        .payment-content-mobile {
            padding: 48px 16px 80px !important;
        }
    }

    /* Tablet (768px+) */
    @media (min-width: 768px) {
        .payment-hero-mobile {
            padding: 32px 24px 70px !important;
            border-bottom-left-radius: 24px !important;
            border-bottom-right-radius: 24px !important;
        }

        .payment-title-mobile {
            font-size: 28px !important;
        }

        .payment-subtitle-mobile {
            font-size: 14px !important;
        }

        .payment-content-mobile {
            padding: 48px 24px 80px !important;
        }

        .payment-method-card-mobile {
            padding: 20px !important;
        }
    }

    /* Desktop (1024px+) */
    @media (min-width: 1024px) {
        .payment-content-mobile {
            padding: 48px 32px 80px !important;
        }
    }

    /* Touch-friendly */
    @media (max-width: 768px) {
        .payment-method-card-mobile {
            -webkit-tap-highlight-color: rgba(24, 144, 255, 0.1);
        }

        .payment-method-card-mobile:active {
            transform: scale(0.98);
        }
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

    .payment-card-animate {
        animation: fadeInUp 0.4s ease forwards;
        opacity: 0;
    }

    .payment-card-delay-1 { animation-delay: 0.1s; }
    .payment-card-delay-2 { animation-delay: 0.2s; }
    .payment-card-delay-3 { animation-delay: 0.3s; }
`;
