export const API_PREFIX = '/api';

export const API_ROUTES = {
    AUTH: {
        LOGIN: '/auth/login',
        ME: '/auth/me',
        CSRF: '/csrf',
    },
    POS: {
        PRODUCTS: '/pos/products',
        ORDERS: '/pos/orders',
        TABLES: '/pos/tables',
        DISCOUNTS: '/pos/discounts',
        DELIVERY: '/pos/delivery',
        PAYMENT_METHODS: '/pos/paymentMethod',
        PAYMENTS: '/pos/payments',
        CATEGORY: '/pos/category',
        SHIFTS: {
            BASE: '/pos/shifts',
            CURRENT: '/pos/shifts/current',
            OPEN: '/pos/shifts/open',
            CLOSE: '/pos/shifts/close',
        },
        DASHBOARD: {
            SALES: '/pos/dashboard/sales',
            TOP_ITEMS: '/pos/dashboard/top-items',
        },
        CHANNELS: {
            STATS: '/pos/orders/stats',
        },
        SHOP_PROFILE: '/pos/shopProfile',
        SALES_ORDER_ITEMS: '/pos/salesOrderItem',
        SALES_ORDER_DETAILS: '/pos/salesOrderDetail',
        PRODUCTS_UNIT: '/pos/productsUnit',
        PAYMENT_DETAILS: '/pos/paymentDetails',
    },
};
