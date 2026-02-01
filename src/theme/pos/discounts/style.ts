import { createSharedPageStyles, sharedGlobalStyles, createCardStyle, cardInnerStyle } from "../sharedStyles";

const base = createSharedPageStyles("linear-gradient(135deg, #fa8c16 0%, #d48806 100%)");

export const pageStyles = {
    ...base,
    discountCard: createCardStyle,
    discountCardInner: cardInnerStyle
};

export const globalStyles = sharedGlobalStyles(".discount-page", ".discount-card");
