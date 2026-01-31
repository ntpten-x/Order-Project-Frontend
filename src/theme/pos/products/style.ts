import { createSharedPageStyles, sharedGlobalStyles } from "../sharedStyles";

const base = createSharedPageStyles("linear-gradient(135deg, #1890ff 0%, #096dd9 100%)");

export const pageStyles = {
    ...base,
    productCard: (isActive: boolean) => ({
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
    productCardInner: {
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 14
    }
};

export const globalStyles = sharedGlobalStyles(".products-page", ".product-card");
