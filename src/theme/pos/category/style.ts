import { createSharedPageStyles, sharedGlobalStyles, createCardStyle, cardInnerStyle } from "../sharedStyles";

const base = createSharedPageStyles("linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)");

export const pageStyles = {
    ...base,
    categoryCard: createCardStyle,
    categoryCardInner: cardInnerStyle
};

export const globalStyles = sharedGlobalStyles(".category-page", ".category-card");
