import { createSharedPageStyles, sharedGlobalStyles, createCardStyle, cardInnerStyle } from "../sharedStyles";

const base = createSharedPageStyles("linear-gradient(135deg, #1890ff 0%, #096dd9 100%)");

export const pageStyles = {
    ...base,
    productCard: createCardStyle,
    productCardInner: cardInnerStyle
};

export const globalStyles = sharedGlobalStyles(".products-page", ".product-card");
