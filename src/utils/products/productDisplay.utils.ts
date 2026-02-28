import { Products } from "../../types/api/pos/products";
import { isSupportedImageSource } from "../image/source";

/**
 * Format price to Thai Baht.
 */
export function formatPrice(price: number): string {
    return `เธฟ${price.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Get product category name with fallback.
 */
export function getProductCategoryName(product: Products): string {
    return product.category?.display_name || "เนเธกเนเธกเธตเธซเธกเธงเธ”เธซเธกเธนเน";
}

/**
 * Check if product has a supported image source.
 */
export function hasProductImage(product: Products): boolean {
    return isSupportedImageSource(product.img_url);
}
