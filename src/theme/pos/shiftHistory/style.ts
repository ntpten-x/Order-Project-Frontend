import { createSharedPageStyles, sharedGlobalStyles, createCardStyle, cardInnerStyle } from "../sharedStyles";

const base = createSharedPageStyles("linear-gradient(135deg, #0284c7 0%, #0369a1 100%)");

export const pageStyles = {
    ...base,
    shiftCard: createCardStyle,
    shiftCardInner: cardInnerStyle
};

export const globalStyles = sharedGlobalStyles(".shift-history-page", ".shift-history-card");
