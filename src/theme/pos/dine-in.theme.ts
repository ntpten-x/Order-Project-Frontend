"use client";

import { CSSProperties } from 'react';

// Color palette for dine-in tables
export const tableColors = {
    available: {
        primary: '#52c41a',
        light: '#f6ffed',
        border: '#b7eb8f',
        gradient: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
    },
    occupied: {
        primary: '#fa8c16',
        light: '#fff7e6',
        border: '#ffd591',
        gradient: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
    },
    inactive: {
        primary: '#8c8c8c',
        light: '#fafafa',
        border: '#d9d9d9',
        gradient: 'linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%)',
    },
    waitingForPayment: {
        primary: '#1890ff',
        light: '#e6f7ff',
        border: '#91d5ff',
        gradient: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
    },
};

export const dineInPageStyles = {
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
