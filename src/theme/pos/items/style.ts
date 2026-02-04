import { CSSProperties } from 'react';
import { orderColors } from '../orders/style';

// Items Colors - Soft Modern Clarity Theme
export const itemsColors = {
    // Inherit from orderColors (already Soft Modern Clarity themed)
    ...orderColors,

    // Items-specific accents
    headerGradient: 'linear-gradient(145deg, #3B82F6 0%, #60A5FA 50%, #93C5FD 100%)',
    headerShadow: '0 8px 24px rgba(59, 130, 246, 0.2)',

    // Payment button
    paymentButton: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    paymentButtonShadow: '0 6px 16px rgba(16, 185, 129, 0.3)',

    // Card accents
    cardHoverShadow: '0 8px 28px rgba(0, 0, 0, 0.1)',
    cardActiveShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
};

// Items Page Styles - Soft Modern Clarity Theme
export const itemsStyles = {
    container: {
        minHeight: '100vh',
        background: itemsColors.background,
        fontFamily: "var(--font-sans), 'Sarabun', sans-serif",
        paddingBottom: 100,
    } as CSSProperties,

    heroSection: {
        background: itemsColors.headerGradient,
        padding: '24px 16px 60px',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        boxShadow: itemsColors.headerShadow,
        marginBottom: -32,
    } as CSSProperties,

    contentWrapper: {
        maxWidth: 1200,
        margin: '0 auto',
        padding: '48px 16px 80px',
        position: 'relative' as const,
    } as CSSProperties,

    // Typography
    pageTitle: {
        margin: 0,
        color: '#fff',
        fontSize: 22,
        fontWeight: 700,
        marginBottom: 4,
    } as CSSProperties,

    pageSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
    } as CSSProperties,

    // Cards - Modern styling
    card: {
        borderRadius: 20,
        border: `1px solid ${itemsColors.border}`,
        boxShadow: itemsColors.cardShadow,
        marginBottom: 16,
        background: itemsColors.white,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
    } as CSSProperties,

    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        flexWrap: 'wrap' as CSSProperties['flexWrap'],
        gap: 12,
    } as CSSProperties,

    cardHeaderLeft: {
        flex: 1,
        minWidth: 200,
    } as CSSProperties,

    cardTimeTag: {
        fontSize: 12,
        padding: '4px 10px',
        marginBottom: 8,
        borderRadius: 8,
        fontWeight: 500,
        background: itemsColors.primaryLight,
        color: itemsColors.primary,
        border: 'none',
    } as CSSProperties,

    cardOrderInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 6,
    } as CSSProperties,

    cardOrderNo: {
        fontSize: 12,
        color: itemsColors.textSecondary,
    } as CSSProperties,

    cardTotal: {
        fontSize: 22,
        fontWeight: 700,
        color: itemsColors.primary,
        whiteSpace: 'nowrap' as CSSProperties['whiteSpace'],
    } as CSSProperties,

    // Items list
    itemsList: {
        flex: 1,
        marginBottom: 12,
    } as CSSProperties,

    itemRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 14,
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: `1px solid ${itemsColors.borderLight}`,
    } as CSSProperties,

    itemLeft: {
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flex: 1,
        minWidth: 0,
    } as CSSProperties,

    itemImage: {
        width: 44,
        height: 44,
        borderRadius: 10,
        border: `1px solid ${itemsColors.borderLight}`,
        flexShrink: 0,
        objectFit: 'cover' as const,
    } as CSSProperties,

    itemImagePlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 10,
        background: itemsColors.backgroundSecondary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    } as CSSProperties,

    itemInfo: {
        minWidth: 0,
        flex: 1,
    } as CSSProperties,

    itemNameRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    } as CSSProperties,

    itemQuantityTag: {
        margin: 0,
        padding: '2px 6px',
        fontSize: 11,
        fontWeight: 600,
        borderRadius: 6,
        background: itemsColors.primaryLight,
        color: itemsColors.primary,
        border: 'none',
    } as CSSProperties,

    itemName: {
        fontSize: 15,
        fontWeight: 600,
        color: itemsColors.text,
    } as CSSProperties,

    itemPrice: {
        fontSize: 13,
        color: itemsColors.textSecondary,
        display: 'block',
        marginTop: 2,
    } as CSSProperties,

    itemNotes: {
        fontSize: 11,
        color: itemsColors.warning,
        fontStyle: 'italic',
        display: 'block',
        marginTop: 3,
    } as CSSProperties,

    itemTotal: {
        fontWeight: 600,
        fontSize: 15,
        color: itemsColors.text,
        marginLeft: 8,
        whiteSpace: 'nowrap' as CSSProperties['whiteSpace'],
    } as CSSProperties,

    // Payment Button
    paymentButton: {
        background: itemsColors.paymentButton,
        border: 'none',
        borderRadius: 14,
        height: 48,
        fontWeight: 600,
        fontSize: 16,
        boxShadow: itemsColors.paymentButtonShadow,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    } as CSSProperties,

    // Back Button (glass effect)
    backButton: {
        height: 44,
        width: 44,
        borderRadius: 14,
        background: 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
    } as CSSProperties,

    // Summary Box
    summaryBox: {
        background: itemsColors.backgroundSecondary,
        padding: 20,
        borderRadius: 16,
        marginTop: 'auto',
    } as CSSProperties,

    // Empty State
    emptyCard: {
        borderRadius: 20,
        border: 'none',
        boxShadow: itemsColors.cardShadow,
        padding: 40,
    } as CSSProperties,
};

// Payment Page Specific Styles
export const itemsPaymentStyles = {
    ...itemsStyles,

    methodCard: {
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: itemsColors.border,
        borderRadius: 16,
        padding: 18,
        textAlign: 'center' as const,
        cursor: 'pointer',
        background: itemsColors.white,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 110,
    } as CSSProperties,

    methodCardSelected: {
        borderColor: itemsColors.primary,
        background: itemsColors.primaryLight,
        transform: 'translateY(-2px)',
        boxShadow: `0 6px 16px ${itemsColors.primary}25`,
    } as CSSProperties,

    inputArea: {
        background: itemsColors.backgroundSecondary,
        padding: 20,
        borderRadius: 16,
        border: `1px solid ${itemsColors.borderLight}`,
    } as CSSProperties,

    qrArea: {
        textAlign: 'center' as const,
        background: itemsColors.white,
        padding: 28,
        borderRadius: 20,
        border: `2px dashed ${itemsColors.primary}`,
        boxShadow: itemsColors.cardShadow,
    } as CSSProperties,

    confirmButton: {
        height: 56,
        borderRadius: 16,
        fontWeight: 700,
        fontSize: 18,
        background: `linear-gradient(135deg, ${itemsColors.primary} 0%, ${itemsColors.primaryDark} 100%)`,
        border: 'none',
        boxShadow: `0 8px 20px ${itemsColors.primary}30`,
    } as CSSProperties,
};

// Delivery Page Specific Styles
export const itemsDeliveryStyles = {
    ...itemsStyles,

    heroSection: {
        ...itemsStyles.heroSection,
        background: 'linear-gradient(145deg, #EC4899 0%, #DB2777 50%, #BE185D 100%)',
        boxShadow: '0 8px 24px rgba(236, 72, 153, 0.25)',
    } as CSSProperties,

    handoverButton: {
        height: 64,
        fontSize: 18,
        borderRadius: 18,
        background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
        border: 'none',
        fontWeight: 700,
        boxShadow: '0 8px 16px rgba(236, 72, 153, 0.3)',
    } as CSSProperties,

    deliveryInfoCard: {
        background: itemsColors.backgroundSecondary,
        borderRadius: 18,
        border: `1px dashed ${itemsColors.border}`,
        padding: 18,
    } as CSSProperties,

    statusIcon: {
        width: 88,
        height: 88,
        borderRadius: '50%',
        background: 'linear-gradient(145deg, #FDF2F8 0%, #FCE7F3 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
        boxShadow: '0 4px 16px rgba(236, 72, 153, 0.15)',
    } as CSSProperties,
};

// Responsive Global Styles for Items Pages
export const itemsResponsiveStyles = `
    /* Base Animations */
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

    @keyframes shimmer {
        0% { background-position: -200px 0; }
        100% { background-position: 200px 0; }
    }

    .items-card-animate {
        animation: fadeInUp 0.4s ease forwards;
        opacity: 0;
    }

    .items-card-delay-1 { animation-delay: 0.1s; }
    .items-card-delay-2 { animation-delay: 0.2s; }
    .items-card-delay-3 { animation-delay: 0.3s; }

    .scale-hover {
        transition: transform 0.2s ease !important;
    }

    .scale-hover:hover {
        transform: scale(1.02) !important;
    }

    .scale-hover:active {
        transform: scale(0.98) !important;
    }

    /* Mobile First - Base Styles (up to 480px) */
    .items-hero-mobile {
        padding: 20px 16px 50px !important;
        border-bottom-left-radius: 20px !important;
        border-bottom-right-radius: 20px !important;
    }

    .items-title-mobile {
        font-size: 20px !important;
        margin-bottom: 4px !important;
    }

    .items-subtitle-mobile {
        font-size: 12px !important;
    }

    .items-content-mobile {
        padding: 40px 12px 80px !important;
    }

    .items-card-mobile {
        margin-bottom: 14px !important;
        border-radius: 18px !important;
    }

    .items-card-header-mobile {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 10px !important;
    }

    .items-card-total-mobile {
        font-size: 20px !important;
        width: 100% !important;
        text-align: right !important;
    }

    .items-item-row-mobile {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 8px !important;
        padding: 12px 0 !important;
    }

    .items-item-left-mobile {
        width: 100% !important;
    }

    .items-item-total-mobile {
        width: 100% !important;
        text-align: right !important;
        margin-left: 0 !important;
        margin-top: 4px !important;
        font-size: 16px !important;
    }

    .items-payment-button-mobile {
        height: 52px !important;
        font-size: 17px !important;
        border-radius: 14px !important;
    }

    .items-back-button-mobile {
        height: 40px !important;
        width: 40px !important;
        border-radius: 12px !important;
    }

    /* Small Mobile (481px - 767px) */
    @media (min-width: 481px) {
        .items-hero-mobile {
            padding: 24px 20px 60px !important;
        }

        .items-title-mobile {
            font-size: 22px !important;
        }

        .items-content-mobile {
            padding: 48px 16px 80px !important;
        }

        .items-card-header-mobile {
            flex-direction: row !important;
            align-items: flex-start !important;
        }

        .items-card-total-mobile {
            width: auto !important;
        }

        .items-item-row-mobile {
            flex-direction: row !important;
            align-items: center !important;
        }

        .items-item-total-mobile {
            width: auto !important;
            margin-left: 8px !important;
            margin-top: 0 !important;
        }
    }

    /* Tablet (768px+) */
    @media (min-width: 768px) {
        .items-hero-mobile {
            padding: 32px 24px 70px !important;
            border-bottom-left-radius: 24px !important;
            border-bottom-right-radius: 24px !important;
        }

        .items-title-mobile {
            font-size: 28px !important;
        }

        .items-subtitle-mobile {
            font-size: 14px !important;
        }

        .items-content-mobile {
            padding: 48px 24px 80px !important;
        }

        .items-card-mobile {
            margin-bottom: 16px !important;
            border-radius: 20px !important;
        }

        .items-payment-button-mobile {
            height: 48px !important;
        }
    }

    /* Desktop (1024px+) */
    @media (min-width: 1024px) {
        .items-content-mobile {
            padding: 48px 32px 80px !important;
        }

        .items-card-mobile:hover {
            transform: translateY(-4px) !important;
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1) !important;
        }
    }

    /* Touch-friendly */
    @media (max-width: 768px) {
        .items-card-mobile {
            -webkit-tap-highlight-color: rgba(59, 130, 246, 0.1);
        }

        .items-card-mobile:active {
            transform: scale(0.98);
        }

        .items-method-card-mobile {
            min-height: 100px !important;
            padding: 16px !important;
        }

        .items-method-card-mobile:active {
            transform: scale(0.96) !important;
        }
    }

    /* Hide scrollbar but allow scrolling */
    .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }

    .hide-scrollbar::-webkit-scrollbar {
        display: none;
    }
`;
