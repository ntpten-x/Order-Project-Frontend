import { CSSProperties } from 'react';

export const orderColors = {
    // Primary - Modern Blue
    primary: '#3b82f6',
    primaryLight: '#eff6ff',
    primaryDark: '#1d4ed8',
    primaryGradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',

    // Status Colors
    pending: '#f59e0b',
    pendingLight: '#fef3c7',
    cooking: '#3b82f6',
    cookingLight: '#dbeafe',
    served: '#10b981',
    servedLight: '#d1fae5',
    paid: '#13c2c2',
    paidLight: '#e6fffb',
    cancelled: '#ef4444',
    cancelledLight: '#fee2e2',

    // Compatibility Aliases
    success: '#10b981',
    danger: '#ef4444',
    dangerLight: '#fee2e2',
    warning: '#f59e0b',
    priceTotal: '#065f46',

    waitingForPayment: '#faad14',
    waitingForPaymentLight: '#fff7e6',

    // Channel Colors
    dineIn: '#722ed1',
    takeAway: '#fa8c16',
    delivery: '#eb2f96',

    // Base Colors
    text: '#1f2937',
    textSecondary: '#6b7280',
    textLight: '#9ca3af',
    background: '#f8fafc',
    backgroundSecondary: '#f1f5f9',
    white: '#ffffff',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',

    // Card Shadow
    cardShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
    cardShadowHover: '0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05)',
};

export const orderTypography = {
    pageTitle: {
        fontSize: 28,
        fontWeight: 700,
        lineHeight: 1.2,
        margin: 0,
        color: orderColors.text,
    } as CSSProperties,

    sectionTitle: {
        fontSize: 20,
        fontWeight: 600,
        lineHeight: 1.4,
        color: orderColors.text,
    } as CSSProperties,

    cardTitle: {
        fontSize: 16,
        fontWeight: 600,
        lineHeight: 1.3,
        color: orderColors.text,
    } as CSSProperties,

    cardRef: {
        fontSize: 18,
        fontWeight: 700,
        lineHeight: 1.2,
        color: orderColors.text,
    } as CSSProperties,

    label: {
        fontSize: 13,
        fontWeight: 500,
        color: orderColors.textSecondary,
    } as CSSProperties,
};

export const orderBreakpoints = {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
    wide: 1200,
};
