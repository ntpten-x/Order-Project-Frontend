import { createSharedPageStyles, sharedGlobalStyles, createCardStyle, cardInnerStyle } from "../sharedStyles";

const base = createSharedPageStyles("linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)");

export const pageStyles = {
    ...base,
    tableCard: createCardStyle,
    tableCardInner: cardInnerStyle
};

export const globalStyles = sharedGlobalStyles(".tables-page", ".table-card");
