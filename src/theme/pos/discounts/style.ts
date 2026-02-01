import { createSharedPageStyles, sharedGlobalStyles, createCardStyle, cardInnerStyle } from "../sharedStyles";

const base = createSharedPageStyles("linear-gradient(135deg, #F59E0B 0%, #D97706 100%)");

export const pageStyles = {
    ...base,
    discountCard: createCardStyle,
    discountCardInner: cardInnerStyle
};

export const globalStyles = sharedGlobalStyles(".discount-page", ".discount-card");
