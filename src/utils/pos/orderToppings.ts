import { toppingService } from "../../services/pos/topping.service";
import { Products } from "../../types/api/pos/products";
import { SalesOrderDetail } from "../../types/api/pos/salesOrderDetail";
import { OrderType } from "../../types/api/pos/salesOrder";
import { Topping } from "../../types/api/pos/topping";

export type OrderItemDetailInput = {
    detail_name: string;
    extra_price: number;
    topping_id?: string;
};

export type OrderItemDetailDraft = {
    id: string;
    detail_name: string;
    extra_price: number;
    topping_id?: string;
    img?: string | null;
    source?: 'topping';
};

const TOPPING_CATALOG_CACHE_TTL_MS = 60_000;

let toppingCatalogCache:
    | {
          fetchedAt: number;
          items: Topping[];
      }
    | null = null;

const createDraftId = (prefix: string): string =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const getToppingDisplayPrice = (topping: Topping, orderType?: OrderType): number =>
    Number(orderType === OrderType.Delivery ? (topping.price_delivery ?? topping.price) : topping.price);


export const createToppingOrderDetailDraft = (topping: Topping, orderType?: OrderType): OrderItemDetailDraft => ({
    id: createDraftId(`topping-${topping.id}`),
    detail_name: topping.display_name,
    extra_price: getToppingDisplayPrice(topping, orderType),
    topping_id: topping.id,
    img: topping.img,
    source: 'topping',
});


export const createOrderDetailDraftFromEntity = (detail: Pick<SalesOrderDetail, "id" | "detail_name" | "extra_price" | "topping_id"> & { img?: string | null }): OrderItemDetailDraft => ({
    id: detail.id || createDraftId(detail.topping_id ? `topping-${detail.topping_id}` : "topping"),
    detail_name: detail.detail_name,
    extra_price: Number(detail.extra_price || 0),
    topping_id: detail.topping_id || undefined,
    img: detail.img,
    source: 'topping',
});

export const toOrderItemDetailInputs = (details: OrderItemDetailDraft[]): OrderItemDetailInput[] => {
    return details
        .map((detail) => ({
            detail_name: String(detail.detail_name || "").trim(),
            extra_price: Number(detail.extra_price || 0),
            topping_id: detail.topping_id || undefined,
        }));
};

export const getEligibleProductToppings = (toppings: Topping[], product?: Products | null): Topping[] => {
    const productToppingGroupIds = [
        ...(product?.topping_group_ids || []),
        ...((product?.topping_groups || []).map((toppingGroup) => toppingGroup.id)),
    ].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);

    if (productToppingGroupIds.length === 0) {
        return [];
    }

    return toppings
        .filter((topping) =>
            (topping.topping_groups || []).some((toppingGroup) => productToppingGroupIds.includes(toppingGroup.id))
        )
        .sort((left, right) => left.display_name.localeCompare(right.display_name, "th"));
};

export const loadActiveOrderToppings = async (): Promise<Topping[]> => {
    const cached = toppingCatalogCache;
    if (cached && Date.now() - cached.fetchedAt < TOPPING_CATALOG_CACHE_TTL_MS) {
        return cached.items;
    }

    const params = new URLSearchParams({
        page: "1",
        limit: "200",
        status: "active",
        sort_created: "old",
    });

    const response = await toppingService.findAllPaginated(undefined, params);
    const items = response.data || [];

    toppingCatalogCache = {
        fetchedAt: Date.now(),
        items,
    };

    return items;
};
