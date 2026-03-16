import { z } from 'zod';

const CategoryRelationSchema = z
    .object({
        id: z.string().optional(),
        display_name: z.string().optional().nullable(),
    })
    .partial()
    .nullable();

const UnitRelationSchema = z
    .object({
        id: z.string().optional(),
        display_name: z.string().optional().nullable(),
    })
    .partial()
    .nullable();

const ToppingGroupRelationSchema = z
    .object({
        id: z.string().optional(),
        display_name: z.string().optional().nullable(),
    })
    .partial()
    .nullable();

export const ProductSchema = z.object({
    id: z.string(),
    display_name: z.string(),
    description: z.string().optional().nullable(),
    price: z.coerce.number().finite(),
    price_delivery: z.coerce.number().finite().optional(),
    category_id: z.string(),
    unit_id: z.string(),
    img_url: z.string().nullable().optional(),
    create_date: z.coerce.date(),
    update_date: z.coerce.date(),
    is_active: z.boolean().optional().default(true),
    category: CategoryRelationSchema.optional(),
    unit: UnitRelationSchema.optional(),
    topping_groups: z.array(ToppingGroupRelationSchema).optional(),
}).transform((value) => ({
    ...value,
    price_delivery: value.price_delivery ?? value.price,
    topping_groups: (value.topping_groups || []).filter(Boolean),
    topping_group_ids: (value.topping_groups || [])
        .map((toppingGroup) => toppingGroup?.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
}));

export const ProductsResponseSchema = z.object({
    data: z.array(ProductSchema),
    total: z.number(),
    page: z.number(),
    last_page: z.number(),
});
