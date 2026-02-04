type PromotionEligibility = {
  eligible: boolean;
  discountAmount: number;
  message?: string;
};

const removedError = () => new Error("Promotions feature has been removed. Please use discounts instead.");

export const promotionsService = {
  getAll: async (): Promise<unknown[]> => {
    throw removedError();
  },
  getActivePromotions: async (): Promise<unknown[]> => {
    return [];
  },
  getById: async (): Promise<unknown> => {
    throw removedError();
  },
  create: async (): Promise<unknown> => {
    throw removedError();
  },
  update: async (): Promise<unknown> => {
    throw removedError();
  },
  delete: async (): Promise<void> => {
    throw removedError();
  },
  validatePromotion: async (): Promise<PromotionEligibility> => {
    return { eligible: false, discountAmount: 0, message: "Promotions feature has been removed." };
  },
  applyPromotion: async (): Promise<unknown> => {
    throw removedError();
  },
};
