import { createSharedPageStyles, sharedGlobalStyles, createCardStyle, cardInnerStyle } from "../sharedStyles";

const base = createSharedPageStyles("linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)");

export const pageStyles = {
    ...base,
    unitCard: createCardStyle,
    unitCardInner: cardInnerStyle,
};

export const globalStyles = sharedGlobalStyles(".topping-page", ".topping-card");
