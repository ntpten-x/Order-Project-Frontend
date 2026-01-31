
import { createSharedPageStyles, sharedGlobalStyles } from "../sharedStyles";

const base = createSharedPageStyles("linear-gradient(135deg, #722ed1 0%, #531dab 100%)");

export const pageStyles = {
    ...base,
    tableCard: (isActive: boolean) => ({
        marginBottom: 12,
        borderRadius: 20,
        border: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        background: isActive
            ? 'white'
            : 'linear-gradient(to right, #fafafa, white)',
        opacity: isActive ? 1 : 0.7
    }),
    tableCardInner: {
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 14
    }
};

export const globalStyles = sharedGlobalStyles(".tables-page", ".table-card");
