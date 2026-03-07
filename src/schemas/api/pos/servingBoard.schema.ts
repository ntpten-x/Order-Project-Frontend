import { z } from "zod";
import { OrderType } from "../../../types/api/pos/salesOrder";
import { ServingStatus } from "../../../types/api/pos/servingBoard";

export const ServingBoardItemSchema = z.object({
    id: z.string(),
    product_id: z.string(),
    display_name: z.string(),
    product_image_url: z.string().nullable(),
    quantity: z.coerce.number(),
    notes: z.string().nullable(),
    serving_status: z.nativeEnum(ServingStatus),
    details: z.array(z.object({
        detail_name: z.string(),
        extra_price: z.coerce.number()
    })).default([]),
});

export const ServingBoardGroupSchema = z.object({
    id: z.string(),
    order_id: z.string(),
    order_no: z.string(),
    order_type: z.nativeEnum(OrderType),
    order_status: z.string(),
    source_title: z.string(),
    source_subtitle: z.string().nullable(),
    batch_created_at: z.string(),
    pending_count: z.coerce.number(),
    served_count: z.coerce.number(),
    total_items: z.coerce.number(),
    items: z.array(ServingBoardItemSchema),
});

export const ServingBoardResponseSchema = z.array(ServingBoardGroupSchema);
