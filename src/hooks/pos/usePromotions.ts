import { message } from "antd";

const removedMessage = "Promotions feature has been removed. Please use discounts instead.";

export function usePromotions() {
  return {
    promotions: [],
    isLoading: false,
    refetch: async () => {},
    validatePromotion: {
      mutateAsync: async () => {
        message.error(removedMessage);
        return { eligible: false, discountAmount: 0, message: removedMessage };
      },
    },
    applyPromotion: {
      mutateAsync: async () => {
        message.error(removedMessage);
      },
    },
  };
}
