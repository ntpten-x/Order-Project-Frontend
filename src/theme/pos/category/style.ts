import { createSharedPageStyles, sharedGlobalStyles, createCardStyle, cardInnerStyle } from "../sharedStyles";

const base = createSharedPageStyles("linear-gradient(135deg, #722ed1 0%, #531dab 100%)");

export const pageStyles = {
    ...base,
    categoryCard: createCardStyle,
    categoryCardInner: cardInnerStyle
};

export const globalStyles = sharedGlobalStyles(".category-page", ".category-card");
