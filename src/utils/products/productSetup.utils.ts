import { Category } from "../../types/api/pos/category";
import { ProductsUnit } from "../../types/api/pos/productsUnit";

export function checkProductSetupState(categories: Category[], units: ProductsUnit[]) {
    const activeCategories = categories.filter((item) => item.is_active);
    const activeUnits = units.filter((item) => item.is_active);

    const hasCategories = activeCategories.length > 0;
    const hasUnits = activeUnits.length > 0;

    return {
        hasCategories,
        hasUnits,
        isReady: hasCategories && hasUnits,
        missingFields: [
            !hasCategories && "หมวดหมู่สินค้า",
            !hasUnits && "หน่วยสินค้า",
        ].filter(Boolean) as string[],
    };
}

export function getSetupMissingMessage(categories: Category[], units: ProductsUnit[]): string {
    const state = checkProductSetupState(categories, units);
    if (state.isReady) return "";

    return `กรุณาเพิ่ม${state.missingFields.join(" และ ")}ที่เปิดใช้งานก่อนเริ่มเพิ่มสินค้า`;
}
