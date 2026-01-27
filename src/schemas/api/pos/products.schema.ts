import { z } from 'zod';

export const ProductSchema = z.object({
    id: z.string(),
    product_name: z.string(),
    display_name: z.string(),
    description: z.string().optional().or(z.string()), // Accept empty string or undefined as leniently as possible
    price: z.number().or(z.string().transform(val => Number(val))), // Handle potential string numbers
    category_id: z.string(),
    unit_id: z.string(),
    img_url: z.string().nullable().optional(),
    create_date: z.string().or(z.date()).transform(val => new Date(val)),
    update_date: z.string().or(z.date()).transform(val => new Date(val)),
    is_active: z.boolean().optional().default(true),
    // Relations (optional for basic list)
    category: z.any().optional(),
    unit: z.any().optional(),
});

export const ProductsResponseSchema = z.object({
    data: z.array(ProductSchema),
    total: z.number(),
    page: z.number(),
    last_page: z.number(),
});
