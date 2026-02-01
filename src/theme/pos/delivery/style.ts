import { createSharedPageStyles, sharedGlobalStyles, createCardStyle, cardInnerStyle } from "../sharedStyles";

const base = createSharedPageStyles("linear-gradient(135deg, #13c2c2 0%, #08979c 100%)");

export const pageStyles = {
    ...base,
    deliveryCard: createCardStyle,
    deliveryCardInner: cardInnerStyle
};

export const globalStyles = sharedGlobalStyles(".delivery-page", ".delivery-card");
