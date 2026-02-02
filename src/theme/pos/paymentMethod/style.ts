import { createSharedPageStyles, sharedGlobalStyles, createCardStyle, cardInnerStyle } from "../sharedStyles";

const base = createSharedPageStyles("linear-gradient(135deg, #10b981 0%, #059669 100%)");

export const pageStyles = {
    ...base,
    paymentMethodCard: createCardStyle,
    paymentMethodCardInner: cardInnerStyle
};

export const globalStyles = sharedGlobalStyles(".payment-method-page", ".payment-method-card");
