import { createSharedPageStyles, sharedGlobalStyles, createCardStyle, cardInnerStyle } from "../sharedStyles";
import { posColors } from '../index';

const base = createSharedPageStyles("linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)");


export const pageStyles = {
  ...base,
  productCard: createCardStyle,
  productCardInner: cardInnerStyle
};

export const globalStyles = `
  ${sharedGlobalStyles(".products-page", ".product-card")}

  @media (max-width: 576px) {
    .products-header-content {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 16px !important;
    }
    
    .products-header-left {
      width: 100%;
    }

    .products-header-actions {
      width: 100%;
      display: flex;
      gap: 8px;
    }

    .products-search-input {
      width: 100% !important;
      flex: 1;
    }

    .products-add-btn-text {
      display: none;
    }
    
    .ant-empty-description {
        padding: 0 20px;
    }

    .product-card-inner {
        padding: 12px !important;
        gap: 10px !important;
    }
  }
`;
