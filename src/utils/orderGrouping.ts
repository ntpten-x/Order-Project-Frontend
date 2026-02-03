export interface OrderItem {
    id: string; // Keep the ID of the *first* item in the group, or a generated group ID
    product?: any;
    quantity: number;
    details?: { detail_name: string; extra_price: number }[];
    notes?: string;
    status?: string | any;
    price?: number | string;
    total_price?: number | string;
    originalItems?: any[]; // To keep track of the original items in this group
    [key: string]: any;
}

export const groupOrderItems = (items: any[]): any[] => {
    if (!items || items.length === 0) return [];

    const groups: { [key: string]: any } = {};

    items.forEach(item => {
        // Create a unique key based on product ID, details, and notes
        // We sort details to ensure order doesn't matter
        const detailsKey = item.details
            ? JSON.stringify(item.details.sort((a: any, b: any) => a.detail_name.localeCompare(b.detail_name)))
            : '[]';

        const noteKey = item.notes ? item.notes.trim() : '';
        const statusKey = item.status || '';
        const productId = item.product?.id || item.product_id || 'unknown';

        const key = `${productId}|${detailsKey}|${noteKey}|${statusKey}`;

        if (groups[key]) {
            // Group exists, update quantity and total price
            groups[key].quantity += Number(item.quantity);
            groups[key].total_price = Number(groups[key].total_price) + Number(item.total_price);
            groups[key].originalItems.push(item);
        } else {
            // Create new group
            groups[key] = {
                ...item,
                quantity: Number(item.quantity),
                total_price: Number(item.total_price),
                originalItems: [item]
            };
        }
    });

    return Object.values(groups);
};
