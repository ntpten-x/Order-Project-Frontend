import { createSharedPageStyles, sharedGlobalStyles, createCardStyle, cardInnerStyle } from "../sharedStyles";

const base = createSharedPageStyles("linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)");

export const pageStyles = {
    ...base,
    deliveryCard: createCardStyle,
    deliveryCardInner: cardInnerStyle
};

export const globalStyles = sharedGlobalStyles(".delivery-page", ".delivery-card");
