
import { createSharedPageStyles, sharedGlobalStyles } from "@/theme/pos/sharedStyles";

const base = createSharedPageStyles("linear-gradient(135deg, #13c2c2 0%, #08979c 100%)");

export const pageStyles = {
    ...base,
    deliveryCard: (isActive: boolean) => ({
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
    deliveryCardInner: {
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 14
    }
};

export const globalStyles = sharedGlobalStyles(".delivery-page", ".delivery-card");
