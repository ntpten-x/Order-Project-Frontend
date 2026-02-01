import { CSSProperties } from 'react';
import { paymentColors, paymentPageStyles } from '../payments.theme';

// Items Page Styles - Mobile First Design
export const itemsStyles = {
    ...paymentPageStyles,

    // Enhanced Mobile Styles
    container: {
        ...paymentPageStyles.container,
        paddingBottom: 100,
    } as CSSProperties,

    heroSection: {
        ...paymentPageStyles.heroSection,
        padding: '24px 16px 60px',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        marginBottom: -32,
    } as CSSProperties,

    contentWrapper: {
        ...paymentPageStyles.contentWrapper,
        padding: '48px 16px 80px',
    } as CSSProperties,

    pageTitle: {
        ...paymentPageStyles.pageTitle,
        fontSize: 22,
        marginBottom: 4,
    } as CSSProperties,

    pageSubtitle: {
        ...paymentPageStyles.pageSubtitle,
        fontSize: 13,
    } as CSSProperties,

    card: {
        ...paymentPageStyles.card,
        borderRadius: 16,
        marginBottom: 16,
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
        fontSize: 13,
        padding: '4px 8px',
        marginBottom: 6,
        borderRadius: 6,
    } as CSSProperties,

    cardOrderInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    } as CSSProperties,

    cardOrderNo: {
        fontSize: 12,
        color: paymentColors.textSecondary,
    } as CSSProperties,

    cardTotal: {
        fontSize: 20,
        fontWeight: 700,
        color: paymentColors.primary,
        whiteSpace: 'nowrap' as CSSProperties['whiteSpace'],
    } as CSSProperties,

    itemsList: {
        flex: 1,
        marginBottom: 12,
    } as CSSProperties,

    itemRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 12,
        alignItems: 'center',
        gap: 12,
    } as CSSProperties,

    itemLeft: {
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flex: 1,
        minWidth: 0,
    } as CSSProperties,

    itemImage: {
        width: 40,
        height: 40,
        borderRadius: 8,
        border: `1px solid ${paymentColors.borderLight}`,
        flexShrink: 0,
    } as CSSProperties,

    itemInfo: {
        minWidth: 0,
        flex: 1,
    } as CSSProperties,

    itemNameRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    } as CSSProperties,

    itemQuantityTag: {
        margin: 0,
        padding: '0 4px',
        fontSize: 11,
    } as CSSProperties,

    itemName: {
        fontSize: 14,
        fontWeight: 600,
    } as CSSProperties,

    itemPrice: {
        fontSize: 12,
        color: paymentColors.textSecondary,
        display: 'block',
        marginTop: 1,
    } as CSSProperties,

    itemNotes: {
        fontSize: 11,
        color: paymentColors.textLight,
        fontStyle: 'italic',
        display: 'block',
        marginTop: 2,
    } as CSSProperties,

    itemTotal: {
        fontWeight: 600,
        marginLeft: 8,
        whiteSpace: 'nowrap' as CSSProperties['whiteSpace'],
    } as CSSProperties,

    paymentButton: {
        background: paymentColors.success,
        borderColor: paymentColors.success,
        borderRadius: 10,
        height: 44,
        fontWeight: 600,
        fontSize: 15,
    } as CSSProperties,
};

// Responsive Global Styles for Items Pages
export const itemsResponsiveStyles = `
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
        margin-bottom: 12px !important;
        border-radius: 16px !important;
    }

    .items-card-header-mobile {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 8px !important;
    }

    .items-card-total-mobile {
        font-size: 18px !important;
        width: 100% !important;
        text-align: right !important;
    }

    .items-item-row-mobile {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 8px !important;
    }

    .items-item-left-mobile {
        width: 100% !important;
    }

    .items-item-total-mobile {
        width: 100% !important;
        text-align: right !important;
        margin-left: 0 !important;
        margin-top: 4px !important;
    }

    .items-payment-button-mobile {
        height: 48px !important;
        font-size: 16px !important;
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
        }
    }

    /* Desktop (1024px+) */
    @media (min-width: 1024px) {
        .items-content-mobile {
            padding: 48px 32px 80px !important;
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

    .items-card-animate {
        animation: fadeInUp 0.4s ease forwards;
        opacity: 0;
    }

    .items-card-delay-1 { animation-delay: 0.1s; }
    .items-card-delay-2 { animation-delay: 0.2s; }
    .items-card-delay-3 { animation-delay: 0.3s; }

    /* Touch-friendly */
    @media (max-width: 768px) {
        .items-card-mobile {
            -webkit-tap-highlight-color: rgba(24, 144, 255, 0.1);
        }

        .items-card-mobile:active {
            transform: scale(0.98);
        }
    }
`;
