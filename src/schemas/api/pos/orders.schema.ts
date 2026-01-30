import { z } from 'zod';
import { OrderStatus, OrderType } from '@/types/api/pos/salesOrder';

const UserSchema = z.object({
    id: z.string(),
    username: z.string(),
    // Add other user fields as needed, keeping it minimal for relation
}).partial().nullable(); // Allow partial/null for relations

const CategorySchema = z.object({
    id: z.string(),
    display_name: z.string(),
}).partial().nullable();

const ProductSchema = z.object({
    id: z.string(),
    display_name: z.string(),
    img_url: z.string().nullable(),
    price: z.coerce.number(),
    category: CategorySchema.optional(),
}).partial().nullable();

const SalesOrderDetailSchema = z.object({
    id: z.string().optional(),
    detail_name: z.string(),
    extra_price: z.coerce.number(),
}).partial();

const SalesOrderItemSchema = z.object({
    id: z.string(),
    order_id: z.string(),
    product_id: z.string(),
    product_name: z.string().optional(),
    quantity: z.coerce.number(),
    price: z.coerce.number(),
    total_price: z.coerce.number(),
    discount_amount: z.coerce.number().optional().default(0),
    notes: z.string().nullable().optional(),
    status: z.nativeEnum(OrderStatus).optional(),

    // Relations
    product: ProductSchema.optional(),
    details: z.array(SalesOrderDetailSchema).optional(),
});

export const SalesOrderSchema = z.object({
    id: z.string(),
    order_no: z.string(),
    order_type: z.nativeEnum(OrderType), // Use string to be safe
    table_id: z.string().nullable().optional(),
    delivery_id: z.string().nullable().optional(),
    delivery_code: z.string().nullable().optional(),
    sub_total: z.coerce.number(),
    discount_id: z.string().nullable().optional(),
    discount_amount: z.coerce.number(),
    vat: z.coerce.number(),
    total_amount: z.coerce.number(),
    received_amount: z.coerce.number(),
    change_amount: z.coerce.number(),
    status: z.nativeEnum(OrderStatus), // Use string to be safe
    created_by_id: z.string().nullable().optional(),
    create_date: z.string(),
    update_date: z.string(),

    // Relations
    items: z.array(SalesOrderItemSchema).optional(),
    created_by: UserSchema.optional(),
    table: z.any().optional(),
    delivery: z.any().optional(),
    discount: z.any().optional(),
    payments: z.array(z.any()).optional(),
});

export const OrdersResponseSchema = z.object({
    data: z.array(SalesOrderSchema),
    total: z.coerce.number(),
    page: z.coerce.number(),
    last_page: z.coerce.number().optional(), // Make optional just in case
});

const OrderSummaryRelationSchema = z
    .object({
        table_name: z.string().nullable().optional(),
        delivery_name: z.string().nullable().optional(),
    })
    .partial()
    .nullable();

const SalesOrderSummarySchema = z.object({
    id: z.string(),
    order_no: z.string(),
    order_type: z.nativeEnum(OrderType),
    status: z.nativeEnum(OrderStatus),
    create_date: z.string(),
    total_amount: z.coerce.number(),
    delivery_code: z.string().nullable().optional(),
    table_id: z.string().nullable().optional(),
    delivery_id: z.string().nullable().optional(),
    table: OrderSummaryRelationSchema.optional(),
    delivery: OrderSummaryRelationSchema.optional(),
    items_summary: z.record(z.coerce.number()).optional(),
    items_count: z.coerce.number().optional(),
});

export const OrdersSummaryResponseSchema = z.object({
    data: z.array(SalesOrderSummarySchema),
    total: z.coerce.number(),
    page: z.coerce.number(),
    last_page: z.coerce.number().optional(),
});
