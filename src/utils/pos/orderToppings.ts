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
    source: "topping" | "custom";
    detail_name: string;
    extra_price: number;
    topping_id?: string;
    img?: string | null;
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

export const createCustomOrderDetailDraft = (): OrderItemDetailDraft => ({
    id: createDraftId("custom"),
    source: "custom",
    detail_name: "",
    extra_price: 0,
});

export const createToppingOrderDetailDraft = (topping: Topping, orderType?: OrderType): OrderItemDetailDraft => ({
    id: createDraftId(`topping-${topping.id}`),
    source: "topping",
    detail_name: topping.display_name,
    extra_price: getToppingDisplayPrice(topping, orderType),
    topping_id: topping.id,
    img: topping.img,
});

export const createOrderDetailDraftFromEntity = (detail: Pick<SalesOrderDetail, "id" | "detail_name" | "extra_price" | "topping_id"> & { img?: string | null }): OrderItemDetailDraft => ({
    id: detail.id || createDraftId(detail.topping_id ? `topping-${detail.topping_id}` : "custom"),
    source: detail.topping_id ? "topping" : "custom",
    detail_name: detail.detail_name,
    extra_price: Number(detail.extra_price || 0),
    topping_id: detail.topping_id || undefined,
    img: detail.img,
});

export const toOrderItemDetailInputs = (details: OrderItemDetailDraft[]): OrderItemDetailInput[] =>
    details
        .map((detail) => {
            const detailName = String(detail.detail_name || "").trim();
            const extraPrice = Number(detail.extra_price || 0);
            const toppingId = detail.topping_id?.trim();

            if (toppingId) {
                return {
                    detail_name: detailName || "",
                    extra_price: extraPrice,
                    topping_id: toppingId,
                };
            }

            if (!detailName) {
                return null;
            }

            return {
                detail_name: detailName,
                extra_price: extraPrice,
            };
        })
        .filter((detail): detail is OrderItemDetailInput => detail !== null);

export const getEligibleProductToppings = (toppings: Topping[], product?: Products | null): Topping[] => {
    const productCategoryId = product?.category_id || product?.category?.id;
    if (!productCategoryId) {
        return [];
    }

    return toppings
        .filter((topping) =>
            (topping.categories || []).some((category) => category.id === productCategoryId)
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
