
import { CSSProperties } from 'react';
import { posColors } from '../index';

// ============ STYLES ============

export const pageStyles = {
    container: {
        minHeight: '100vh',
        background: posColors.background,
        fontFamily: "'Inter', 'Sarabun', sans-serif",
    } as CSSProperties,

    heroParams: {
        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
        padding: '32px 24px 70px',
        position: 'relative' as const,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        boxShadow: '0 8px 24px rgba(24, 144, 255, 0.25)',
        marginBottom: -40,
        zIndex: 1,
        overflow: 'hidden',
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
        padding: '0 24px',
        position: 'relative' as const,
        zIndex: 20
    } as CSSProperties,

    card: {
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
    } as CSSProperties,

    activeAccountCard: {
        background: '#f0f5ff',
        border: '1px solid #adc6ff',
        borderRadius: 12,
        padding: '20px',
        marginBottom: 32
    } as CSSProperties,

    addButton: {
        borderRadius: 12,
        height: 52,
        fontSize: 16,
        fontWeight: 600,
        background: '#fff',
        border: `1px dashed ${posColors.primary}`,
        color: posColors.primary
    } as CSSProperties,

    dividerTitle: {
        fontSize: 16,
        fontWeight: 600
    } as CSSProperties
};
