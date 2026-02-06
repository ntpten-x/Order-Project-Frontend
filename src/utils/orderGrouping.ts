export type OrderItemDetail = { detail_name: string; extra_price: number };

export type OrderItemLike = {
  quantity: number | string;
  total_price?: number | string;
  details?: OrderItemDetail[];
  notes?: string;
  status?: unknown;
  product?: { id?: string } | null;
  product_id?: string;
};

export type GroupedOrderItem<T extends OrderItemLike> = T & {
  id: string;
  quantity: number;
  total_price: number;
  originalItems: T[];
};

export const groupOrderItems = <T extends OrderItemLike>(items: T[]): GroupedOrderItem<T>[] => {
  if (!items?.length) return [];

  const groups = new Map<string, GroupedOrderItem<T>>();

  for (const item of items) {
    const detailsKey = item.details?.length
      ? JSON.stringify(
          [...item.details].sort((a, b) => a.detail_name.localeCompare(b.detail_name)),
        )
      : "[]";

    const noteKey = (item.notes ?? "").trim();
    const statusKey = String(item.status ?? "");
    const productId = item.product?.id ?? item.product_id ?? "unknown";

    const key = `${productId}|${detailsKey}|${noteKey}|${statusKey}`;

    const existing = groups.get(key);
    if (existing) {
      existing.quantity += Number(item.quantity);
      existing.total_price += Number(item.total_price ?? 0);
      existing.originalItems.push(item);
      continue;
    }

    const grouped: GroupedOrderItem<T> = {
      ...(item as T),
      id: String((item as { id?: unknown })?.id ?? key),
      quantity: Number(item.quantity),
      total_price: Number(item.total_price ?? 0),
      originalItems: [item],
    };

    groups.set(key, grouped);
  }

  return Array.from(groups.values());
};
