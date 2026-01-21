import { Products } from "@/types/api/pos/products";

/**
 * Format price to Thai Baht
 */
export function formatPrice(price: number): string {
    return `฿${price.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Format item count for display
 */
export function formatItemCount(count: number): string {
    if (count === 0) return "ไม่มีรายการ";
    if (count === 1) return "1 รายการ";
    return `${count} รายการ`;
}

/**
 * Get product image URL or return null for fallback handling
 */
export function getProductImageUrl(product: Products): string | null {
    return product.img_url || null;
}

/**
 * Get product category name with fallback
 */
export function getProductCategoryName(product: Products): string {
    return product.category?.display_name || "ไม่มีหมวดหมู่";
}

/**
 * Get product unit name with fallback
 */
export function getProductUnitName(product: Products): string {
    return product.unit?.display_name || "ชิ้น";
}

/**
 * Check if product has valid image
 */
export function hasProductImage(product: Products): boolean {
    return !!product.img_url && product.img_url.length > 0;
}

/**
 * Get product description with fallback
 */
export function getProductDescription(product: Products): string {
    return product.description || "ไม่มีรายละเอียดสินค้า";
}

/**
 * Calculate total price for quantity
 */
export function calculateItemTotal(price: number, quantity: number): number {
    return Number(price) * quantity;
}
