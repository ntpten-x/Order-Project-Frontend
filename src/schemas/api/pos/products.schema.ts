import { z } from 'zod';

const CategoryRelationSchema = z
    .object({
        id: z.string().optional(),
        category_name: z.string().optional().nullable(),
        display_name: z.string().optional().nullable(),
    })
    .partial()
    .nullable();

const UnitRelationSchema = z
    .object({
        id: z.string().optional(),
        unit_name: z.string().optional().nullable(),
        display_name: z.string().optional().nullable(),
    })
    .partial()
    .nullable();

export const ProductSchema = z.object({
    id: z.string(),
    product_name: z.string(),
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
    // Relations (optional for basic list)
    category: CategoryRelationSchema.optional(),
    unit: UnitRelationSchema.optional(),
}).transform((value) => ({
    ...value,
    price_delivery: value.price_delivery ?? value.price,
}));

export const ProductsResponseSchema = z.object({
    data: z.array(ProductSchema),
    total: z.number(),
    page: z.number(),
    last_page: z.number(),
});
