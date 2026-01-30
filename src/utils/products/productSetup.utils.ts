import { Category } from "@/types/api/pos/category";
import { ProductsUnit } from "@/types/api/pos/productsUnit";

/**
 * Checks if the necessary metadata (categories and units) exists for product management.
 */
export function checkProductSetupState(categories: Category[], units: ProductsUnit[]) {
    const hasCategories = categories.length > 0;
    const hasUnits = units.length > 0;

    return {
        hasCategories,
        hasUnits,
        isReady: hasCategories && hasUnits,
        missingFields: [
            !hasCategories && "หมวดหมู่สินค้า",
            !hasUnits && "หน่วยสินค้า"
        ].filter(Boolean) as string[]
    };
}

/**
 * Returns a user-friendly message describing what setup is missing.
 */
export function getSetupMissingMessage(categories: Category[], units: ProductsUnit[]): string {
    const state = checkProductSetupState(categories, units);
    if (state.isReady) return "";

    return `กรุณาเพิ่ม${state.missingFields.join("และ")}ให้เรียบร้อยก่อนใช้งาน`;
}
