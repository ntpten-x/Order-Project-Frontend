import { OrderType } from "../../types/api/pos/salesOrder";

/**
 * Get navigation path after an order is successfully created based on channel
 * @param orderType - The type of order created
 * @returns The target navigation path
 */
export const getPostCreateOrderNavigationPath = (orderType: string | OrderType): string => {
    switch (orderType) {
        case OrderType.DineIn:
        case 'DineIn':
            return '/pos/channels/dine-in';
        case OrderType.TakeAway:
        case 'TakeAway':
            return '/pos/channels/takeaway';
        case OrderType.Delivery:
        case 'Delivery':
            return '/pos/channels/delivery';
        default:
            return '/pos/orders';
    }
};
